#!/usr/bin/env python3
"""Deploy backend: upload src.tar.gz, extract, upload docker-compose, build, start, verify."""
import sys
import os
import time
import traceback

from deploy_ssh import (
    get_ssh, run, upload_sftp, upload_text,
    HOST, PORT, USER, PASSWORD,
    LOCAL_SRC_TARBALL, LOCAL_COMPOSE,
    REMOTE_TARBALL, REMOTE_SRC_DIR, REMOTE_COMPOSE,
)


def main():
    print(f"\n{'=' * 60}\n=== STEP 1: Upload backend source tarball ===\n{'=' * 60}")
    client = get_ssh()
    print(f"[ok] connected to {USER}@{HOST}:{PORT}")

    # Pre-check server state
    print("\n--- pre-check: .env keys (names only) ---")
    run(client, "grep -E '^[A-Z_]+=' /opt/overinsur/.env | sed 's/=.*$/=<set>/' | sort", timeout=10)
    run(client, "docker ps --filter name=overinsur-pg --format '{{.Names}} {{.Status}}'", timeout=10)
    run(client, "docker exec overinsur-pg pg_isready -U overinsur -d overinsur_db 2>&1 | head -3", timeout=10)

    # Upload tarball
    upload_sftp(client, LOCAL_SRC_TARBALL, REMOTE_TARBALL)

    print(f"\n{'=' * 60}\n=== STEP 2: Extract source on server ===\n{'=' * 60}")
    run(client, f"mkdir -p {REMOTE_SRC_DIR}")
    # Clean stale src to avoid stale files mixing in
    run(client, f"rm -rf {REMOTE_SRC_DIR}/* {REMOTE_SRC_DIR}/.[!.]* 2>/dev/null; true")
    run(client, f"cd {REMOTE_SRC_DIR} && tar -xzf {REMOTE_TARBALL} && echo '--- extracted files (top) ---' && ls -la {REMOTE_SRC_DIR}/")
    # Verify key files
    run(client, f"test -f {REMOTE_SRC_DIR}/package.json && test -f {REMOTE_SRC_DIR}/pnpm-workspace.yaml && test -f {REMOTE_SRC_DIR}/pnpm-lock.yaml && echo '[ok] root files present'")
    run(client, f"test -f {REMOTE_SRC_DIR}/apps/carrier-service/Dockerfile && echo '[ok] Dockerfile present'")
    run(client, f"test -f {REMOTE_SRC_DIR}/packages/domain-models/package.json && echo '[ok] domain-models package.json present'")
    run(client, f"test -f {REMOTE_SRC_DIR}/apps/carrier-service/package.json && echo '[ok] carrier-service package.json present'")

    print(f"\n{'=' * 60}\n=== STEP 3: Upload docker-compose.prod.yml ===\n{'=' * 60}")
    # Back up existing first
    run(client, f"cp {REMOTE_COMPOSE} {REMOTE_COMPOSE}.bak.$(date +%s) 2>/dev/null || true")
    upload_sftp(client, LOCAL_COMPOSE, REMOTE_COMPOSE)
    # Show resulting compose
    run(client, f"echo '--- {REMOTE_COMPOSE} ---' && cat {REMOTE_COMPOSE}")
    # Validate compose syntax (without envs to avoid load errors)
    run(client, "docker compose -f /opt/overinsur/docker-compose.yml config --quiet 2>&1 | tail -5; true", timeout=20)

    print(f"\n{'=' * 60}\n=== STEP 4: Build carrier-api image ===\n{'=' * 60}")
    print("This may take several minutes (pnpm install + tsc build)...")
    t0 = time.time()
    # Use --env-file so ${DB_PASSWORD} etc. resolve; build only carrier-api
    exit_code, _ = run(
        client,
        "cd /opt/overinsur && docker compose --env-file /opt/overinsur/.env build carrier-api 2>&1",
        timeout=900,
    )
    dt = time.time() - t0
    print(f"\n[build] elapsed = {dt:.1f}s, exit_code = {exit_code}")
    if exit_code != 0:
        print("[FAIL] build failed; not starting container")
        client.close()
        sys.exit(1)

    print(f"\n{'=' * 60}\n=== STEP 5: Start carrier-api container ===\n{'=' * 60}")
    # Stop existing if any
    run(client, "docker rm -f carrier-api 2>/dev/null || true", timeout=15)
    exit_code, _ = run(
        client,
        "cd /opt/overinsur && docker compose --env-file /opt/overinsur/.env up -d carrier-api 2>&1",
        timeout=120,
    )
    if exit_code != 0:
        print("[FAIL] up -d failed")
        client.close()
        sys.exit(1)

    print(f"\n{'=' * 60}\n=== STEP 6: Verify backend ===\n{'=' * 60}")
    # Wait for container to settle
    print("Waiting 8s for container to initialize...")
    time.sleep(8)
    run(client, "docker ps --filter name=carrier-api --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", timeout=15)
    run(client, "curl -sS -o /tmp/api.out -w 'HTTP %{http_code} time=%{time_total}s\\n' http://127.0.0.1:8610/api ; echo '--- body (first 300 chars) ---'; head -c 300 /tmp/api.out; echo", timeout=20)
    run(client, "docker logs carrier-api --tail 40 2>&1", timeout=15)

    # Final sanity check on PG connectivity from inside carrier-api container (best-effort)
    run(client, "docker exec carrier-api sh -c 'wget -qO- http://localhost:8080/api 2>/dev/null | head -c 200; echo' || true", timeout=15)

    client.close()
    print("\n[done] backend deployment complete.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"\n[ERROR] {e}")
        traceback.print_exc()
        sys.exit(2)
