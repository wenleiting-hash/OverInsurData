#!/usr/bin/env python3
"""SSH deploy helper for OverInsurData backend + frontend to Tianyi cloud."""
import sys
import os
import time
import paramiko

HOST = "220.154.128.28"
PORT = 50222
USER = "root"
PASSWORD = "a221447s..."  # confirmed working via connection test

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_SRC_TARBALL = os.path.join(PROJECT_ROOT, "deploy-src.tar.gz")
LOCAL_COMPOSE = os.path.join(PROJECT_ROOT, "seed-data", "docker-compose.prod.yml")
LOCAL_NGINX_CONF = os.path.join(PROJECT_ROOT, "seed-data", "overinsur.conf")
LOCAL_DIST_TARBALL = os.path.join(PROJECT_ROOT, "dist.tar.gz")

REMOTE_TARBALL = "/opt/overinsur/src.tar.gz"
REMOTE_SRC_DIR = "/opt/overinsur/src"
REMOTE_COMPOSE = "/opt/overinsur/docker-compose.yml"
REMOTE_DIST_TARBALL = "/opt/overinsur/dist.tar.gz"
REMOTE_WEB_DIR = "/opt/overinsur/deploy/web"
REMOTE_NGINX_CONF = "/etc/nginx/conf.d/overinsur.conf"


def get_ssh(password=None):
    """Establish SSH connection."""
    pwd = password or PASSWORD
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        port=PORT,
        username=USER,
        password=pwd,
        timeout=30,
        banner_timeout=30,
        auth_timeout=30,
        look_for_keys=False,
        allow_agent=False,
    )
    return client


def run(client, cmd, timeout=600, quiet=False):
    """Execute command, stream stdout/stderr live, return (exit_code, combined_output)."""
    if not quiet:
        print(f"\n$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=False)
    output_chunks = []
    err_chunks = []
    # Read stdout in chunks for live streaming
    chan = stdout.channel
    chan.settimeout(timeout)
    while not chan.exit_status_ready():
        if chan.recv_ready():
            data = chan.recv(65536).decode("utf-8", errors="replace")
            if data:
                if not quiet:
                    sys.stdout.write(data)
                    sys.stdout.flush()
                output_chunks.append(data)
        if chan.recv_stderr_ready():
            data = chan.recv_stderr(65536).decode("utf-8", errors="replace")
            if data:
                if not quiet:
                    sys.stdout.write(data)
                    sys.stdout.flush()
                err_chunks.append(data)
        time.sleep(0.05)
    # Drain remaining
    while chan.recv_ready():
        data = chan.recv(65536).decode("utf-8", errors="replace")
        if data:
            if not quiet:
                sys.stdout.write(data)
                sys.stdout.flush()
            output_chunks.append(data)
    while chan.recv_stderr_ready():
        data = chan.recv_stderr(65536).decode("utf-8", errors="replace")
        if data:
            if not quiet:
                sys.stdout.write(data)
                sys.stdout.flush()
            err_chunks.append(data)
    exit_code = chan.recv_exit_status()
    combined = "".join(output_chunks) + "".join(err_chunks)
    if not quiet:
        print(f"[exit_code={exit_code}]")
    return exit_code, combined


def upload_sftp(client, local_path, remote_path):
    """Upload a file via SFTP, print progress."""
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"local file not found: {local_path}")
    size = os.path.getsize(local_path)
    print(f"\n[upload] {local_path} ({size} bytes) -> {remote_path}")
    sftp = client.open_sftp()
    try:
        # Remove remote file if exists (avoid permission issues)
        try:
            sftp.remove(remote_path)
        except IOError:
            pass
        # Ensure remote dir exists
        remote_dir = os.path.dirname(remote_path).replace("\\", "/")
        parts = [p for p in remote_dir.split("/") if p]
        cur = ""
        for p in parts:
            cur = cur + "/" + p
            try:
                sftp.stat(cur)
            except IOError:
                try:
                    sftp.mkdir(cur)
                except IOError:
                    pass
        last_pct = [-1]
        def _cb(transferred, total):
            pct = int(transferred * 100 / total) if total else 0
            if pct % 10 == 0 and pct != last_pct[0]:
                last_pct[0] = pct
                print(f"  ...{pct}% ({transferred}/{total})")
        sftp.put(local_path, remote_path, callback=_cb)
        # Verify
        st = sftp.stat(remote_path)
        print(f"  [ok] remote size = {st.st_size}")
        if st.st_size != size:
            raise IOError(f"size mismatch: local={size} remote={st.st_size}")
    finally:
        sftp.close()


def upload_text(client, text, remote_path):
    """Upload text content via SFTP."""
    sftp = client.open_sftp()
    try:
        try:
            sftp.remove(remote_path)
        except IOError:
            pass
        with sftp.open(remote_path, "w") as f:
            f.write(text)
        st = sftp.stat(remote_path)
        print(f"  [ok] wrote {st.st_size} bytes to {remote_path}")
    finally:
        sftp.close()


if __name__ == "__main__":
    # Quick connection test
    print(f"=== SSH connection test to {USER}@{HOST}:{PORT} ===")
    pwd_attempts = [PASSWORD, "a221447s..."]
    last_err = None
    for pwd in pwd_attempts:
        try:
            c = get_ssh(pwd)
            run(c, "whoami && hostname && uname -a", timeout=10)
            run(c, "docker ps --format 'table {{.Names}}\t{{.Status}}'", timeout=15)
            run(c, "ls -la /opt/overinsur/", timeout=10)
            print("\n[ok] connection successful with password (will use this for all steps)")
            c.close()
            sys.exit(0)
        except paramiko.AuthenticationException as e:
            last_err = e
            print(f"[auth-fail] password attempt '{pwd[:3]}***' failed: {e}")
            continue
        except Exception as e:
            last_err = e
            print(f"[error] {e}")
            sys.exit(2)
    print(f"\n[fail] all password attempts failed. last error: {last_err}")
    sys.exit(1)
