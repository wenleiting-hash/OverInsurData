#!/usr/bin/env python3
"""Deploy frontend: upload dist tarball, extract, upload nginx conf, reload nginx, verify."""
import sys
import os
import time
import traceback

from deploy_ssh import (
    get_ssh, run, upload_sftp,
    HOST, PORT, USER, PASSWORD,
    LOCAL_DIST_TARBALL, LOCAL_NGINX_CONF,
    REMOTE_DIST_TARBALL, REMOTE_WEB_DIR, REMOTE_NGINX_CONF,
)

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_DIST = os.path.join(PROJECT_ROOT, "dist.tar.gz")
LOCAL_NGINX = os.path.join(PROJECT_ROOT, "seed-data", "overinsur.conf")


def main():
    print(f"\n{'=' * 60}\n=== STEP 7: Upload frontend dist tarball ===\n{'=' * 60}")
    client = get_ssh()
    print(f"[ok] connected to {USER}@{HOST}:{PORT}")

    # Check if nginx is installed
    run(client, "nginx -v 2>&1; which nginx; ls /etc/nginx/conf.d/ 2>&1", timeout=10)

    # Upload dist tarball
    print("\n--- uploading dist.tar.gz ---")
    upload_sftp(client, LOCAL_DIST, REMOTE_DIST_TARBALL)

    print(f"\n{'=' * 60}\n=== STEP 8: Extract dist on server ===\n{'=' * 60}")
    run(client, f"mkdir -p {REMOTE_WEB_DIR}")
    # Clean stale web dir to avoid leftover files
    run(client, f"rm -rf {REMOTE_WEB_DIR}/* {REMOTE_WEB_DIR}/.[!.]* 2>/dev/null; true")
    run(client, f"cd {REMOTE_WEB_DIR} && tar -xzf {REMOTE_DIST_TARBALL} && echo '--- extracted files (top) ---' && ls -la {REMOTE_WEB_DIR}/ | head -20")
    # Verify index.html present
    run(client, f"test -f {REMOTE_WEB_DIR}/index.html && echo '[ok] index.html present'")
    # Show file count and total size
    run(client, f"echo '--- file count ---' && find {REMOTE_WEB_DIR} -type f | wc -l && echo '--- total size ---' && du -sh {REMOTE_WEB_DIR}/")

    print(f"\n{'=' * 60}\n=== STEP 9: Upload nginx config ===\n{'=' * 60}")
    # Backup existing conf if any
    run(client, f"test -f {REMOTE_NGINX_CONF} && cp {REMOTE_NGINX_CONF} {REMOTE_NGINX_CONF}.bak.$(date +%s) 2>/dev/null || true")
    upload_sftp(client, LOCAL_NGINX, REMOTE_NGINX_CONF)
    run(client, f"echo '--- {REMOTE_NGINX_CONF} ---' && cat {REMOTE_NGINX_CONF}")

    print(f"\n{'=' * 60}\n=== STEP 10: Test nginx config ===\n{'=' * 60}")
    exit_code, _ = run(client, "nginx -t 2>&1", timeout=20)
    if exit_code != 0:
        print("[FAIL] nginx -t failed; not reloading")
        client.close()
        sys.exit(1)

    print(f"\n{'=' * 60}\n=== STEP 11: Reload nginx ===\n{'=' * 60}")
    exit_code, _ = run(client, "nginx -s reload 2>&1", timeout=20)
    if exit_code != 0:
        # Try restarting nginx service if reload fails
        print("[warn] reload returned non-zero, trying systemctl restart nginx...")
        run(client, "systemctl restart nginx 2>&1 || service nginx restart 2>&1 || (pkill nginx && nginx)", timeout=20)

    print(f"\n{'=' * 60}\n=== STEP 12: Verify frontend + API proxy ===\n{'=' * 60}")
    time.sleep(2)
    # Check port 8601 listening
    run(client, "ss -ltnp | grep 8601 || echo '[warn] port 8601 not listening'", timeout=10)
    # Curl the frontend
    run(client, "curl -sS -o /tmp/web.out -w 'HTTP %{http_code} time=%{time_total}s\\n' http://localhost:8601/ ; echo '--- body (first 300 chars) ---'; head -c 300 /tmp/web.out; echo", timeout=20)
    # Curl the API proxy through nginx
    run(client, "curl -sS -o /tmp/api_proxy.out -w 'HTTP %{http_code} time=%{time_total}s\\n' http://localhost:8601/api/ ; echo '--- body (first 300 chars) ---'; head -c 300 /tmp/api_proxy.out; echo", timeout=20)
    # Also test SPA fallback (a route that doesn't exist as a file)
    run(client, "curl -sS -o /tmp/spa.out -w 'HTTP %{http_code} time=%{time_total}s\\n' http://localhost:8601/some/spa/route ; echo '--- body (first 200 chars) ---'; head -c 200 /tmp/spa.out; echo", timeout=20)

    # Final state summary
    print(f"\n{'=' * 60}\n=== Final state summary ===\n{'=' * 60}")
    run(client, "docker ps --filter name=overinsur --filter name=carrier-api --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", timeout=15)
    run(client, "ls -la /opt/overinsur/ && echo '---' && ls /opt/overinsur/deploy/web/ | head", timeout=10)
    run(client, "nginx -T 2>&1 | grep -A 20 'server_name _;' | head -25", timeout=10)

    client.close()
    print("\n[done] frontend + nginx deployment complete.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"\n[ERROR] {e}")
        traceback.print_exc()
        sys.exit(2)
