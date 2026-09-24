#!/usr/bin/env python3
"""Re-deploy: upload updated Dockerfile, re-extract src (lightweight), rebuild, start, verify."""
import sys
import os
import time
import traceback

from deploy_ssh import (
    get_ssh, run, upload_sftp,
    HOST, PORT, USER, PASSWORD,
    LOCAL_SRC_TARBALL,
    REMOTE_TARBALL, REMOTE_SRC_DIR, REMOTE_COMPOSE,
)

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_DOCKERFILE = os.path.join(PROJECT_ROOT, "apps", "carrier-service", "Dockerfile")
REMOTE_DOCKERFILE = "/opt/overinsur/src/apps/carrier-service/Dockerfile"


def main():
    print(f"\n{'=' * 60}\n=== Re-deploy: upload updated Dockerfile + rebuild ===\n{'=' * 60}")
    client = get_ssh()
    print(f"[ok] connected to {USER}@{HOST}:{PORT}")

    # Upload updated Dockerfile
    print("\n--- uploading updated Dockerfile ---")
    upload_sftp(client, LOCAL_DOCKERFILE, REMOTE_DOCKERFILE)
    # Show resulting Dockerfile
    run(client, f"echo '--- {REMOTE_DOCKERFILE} ---' && cat {REMOTE_DOCKERFILE}")

    print(f"\n{'=' * 60}\n=== Rebuild carrier-api image ===\n{'=' * 60}")
    print("This may take several minutes (pnpm install + tsc build of domain-models + carrier-service)...")
    t0 = time.time()
    # Force --no-cache to avoid stale layers? Actually keep cache to reuse pnpm install layer
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
    print("Waiting 8s for container to initialize...")
    time.sleep(8)
    run(client, "docker ps --filter name=carrier-api --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", timeout=15)
    run(client, "curl -sS -o /tmp/api.out -w 'HTTP %{http_code} time=%{time_total}s\\n' http://127.0.0.1:8610/api ; echo '--- body (first 500 chars) ---'; head -c 500 /tmp/api.out; echo", timeout=20)
    run(client, "docker logs carrier-api --tail 50 2>&1", timeout=15)
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
