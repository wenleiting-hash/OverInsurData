#!/usr/bin/env python3
"""Upload updated package.json + pnpm-lock.yaml, rebuild, restart, verify."""
import sys
import os
import time
import traceback

from deploy_ssh import get_ssh, run, upload_sftp, HOST, PORT, USER, PASSWORD

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_PKG = os.path.join(PROJECT_ROOT, "apps", "carrier-service", "package.json")
LOCAL_LOCK = os.path.join(PROJECT_ROOT, "pnpm-lock.yaml")

REMOTE_PKG = "/opt/overinsur/src/apps/carrier-service/package.json"
REMOTE_LOCK = "/opt/overinsur/src/pnpm-lock.yaml"


def main():
    print(f"\n{'=' * 60}\n=== Upload updated package.json + pnpm-lock.yaml, rebuild ===\n{'=' * 60}")
    client = get_ssh()
    print(f"[ok] connected to {USER}@{HOST}:{PORT}")

    # Upload updated package.json for carrier-service
    print("\n--- uploading updated apps/carrier-service/package.json ---")
    upload_sftp(client, LOCAL_PKG, REMOTE_PKG)
    run(client, f"echo '--- {REMOTE_PKG} (deps + devDeps) ---' && grep -A 20 'dependencies' {REMOTE_PKG} | head -40")

    # Upload updated pnpm-lock.yaml (root)
    print("\n--- uploading updated pnpm-lock.yaml ---")
    upload_sftp(client, LOCAL_LOCK, REMOTE_LOCK)
    # Show the relevant diff: @nestjs/swagger should now be in dependencies (no dev flag in packages section)
    run(client, "echo '--- lockfile: importer section for carrier-service deps ---' && sed -n '34,60p' /opt/overinsur/src/pnpm-lock.yaml")
    run(client, "echo '--- lockfile: @nestjs/swagger package def (no dev flag expected) ---' && grep -A 14 \"/@nestjs/swagger@7.4.2\" /opt/overinsur/src/pnpm-lock.yaml | head -20")
    # Verify swagger no longer marked dev
    run(client, "grep -B1 -A1 \"swagger-ui-dist@5.17.14\" /opt/overinsur/src/pnpm-lock.yaml")
    run(client, "grep -B1 -A1 \"@microsoft/tsdoc@0.15.1\" /opt/overinsur/src/pnpm-lock.yaml")
    run(client, "grep -B1 -A1 \"@nestjs/mapped-types@2.0.5\" /opt/overinsur/src/pnpm-lock.yaml | head -20")

    print(f"\n{'=' * 60}\n=== Rebuild carrier-api image (no-cache to bypass stale layers) ===\n{'=' * 60}")
    print("This may take several minutes...")
    t0 = time.time()
    # Use --no-cache to ensure the COPY package.json layer is invalidated (since we just changed it)
    exit_code, _ = run(
        client,
        "cd /opt/overinsur && docker compose --env-file /opt/overinsur/.env build --no-cache carrier-api 2>&1",
        timeout=900,
    )
    dt = time.time() - t0
    print(f"\n[build] elapsed = {dt:.1f}s, exit_code = {exit_code}")
    if exit_code != 0:
        print("[FAIL] build failed; not starting container")
        client.close()
        sys.exit(1)

    print(f"\n{'=' * 60}\n=== Start carrier-api container ===\n{'=' * 60}")
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

    print(f"\n{'=' * 60}\n=== Verify backend ===\n{'=' * 60}")
    print("Waiting 10s for container to initialize...")
    time.sleep(10)
    run(client, "docker ps --filter name=carrier-api --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", timeout=15)
    run(client, "curl -sS -o /tmp/api.out -w 'HTTP %{http_code} time=%{time_total}s\\n' http://127.0.0.1:8610/api ; echo '--- body (first 500 chars) ---'; head -c 500 /tmp/api.out; echo", timeout=20)
    run(client, "docker logs carrier-api --tail 40 2>&1", timeout=15)
    run(client, "docker exec carrier-api sh -c 'wget -qO- http://localhost:8080/api 2>/dev/null | head -c 300; echo' || true", timeout=15)

    client.close()
    print("\n[done] backend re-deployment complete.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"\n[ERROR] {e}")
        traceback.print_exc()
        sys.exit(2)
