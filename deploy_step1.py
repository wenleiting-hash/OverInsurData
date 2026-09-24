# -*- coding: utf-8 -*-
"""
OverInsur 部署第一步：创建目录结构 + 生成密码 + docker-compose + 启动 PG 容器
通过 paramiko SSH 非交互式执行
"""
import paramiko
import sys
import time

HOST = "220.154.128.28"
PORT = 50222
USER = "root"
PASSWORD = "a221447s..."

# 完整执行日志收集
FULL_LOG = []


def log(msg):
    line = str(msg)
    print(line, flush=True)
    FULL_LOG.append(line)


def run_cmd(client, label, cmd, timeout=180, allow_nonzero=False):
    """执行一条 SSH 命令，打印 stdin/stdout/stderr/exitcode"""
    log("\n" + "=" * 78)
    log(f"[STEP] {label}")
    log("-" * 78)
    log(f"[CMD]\n{cmd}")
    log("-" * 78)

    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=False)
    out_bytes = stdout.read()
    err_bytes = stderr.read()
    exit_code = stdout.channel.recv_exit_status()

    out = out_bytes.decode("utf-8", errors="replace")
    err = err_bytes.decode("utf-8", errors="replace")

    if out:
        log("[STDOUT]")
        log(out)
    else:
        log("[STDOUT] (empty)")

    if err:
        log("[STDERR]")
        log(err)

    log(f"[EXIT CODE] {exit_code}")

    if exit_code != 0 and not allow_nonzero:
        log(f"[ERROR] 命令执行失败 (exit={exit_code})，停止后续步骤")
        return False, out, err, exit_code

    log(f"[OK] 命令执行成功" if exit_code == 0 else f"[WARN] 退出码 {exit_code}（已允许非零）")
    return True, out, err, exit_code


def main():
    log("=" * 78)
    log("OverInsur 部署 - 第一步")
    log(f"目标服务器: {USER}@{HOST}:{PORT}")
    log("=" * 78)

    # 1) 建立 SSH 连接
    log("\n[CONNECT] 正在连接 SSH ...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            hostname=HOST,
            port=PORT,
            username=USER,
            password=PASSWORD,
            timeout=30,
            allow_agent=False,
            look_for_keys=False,
        )
    except Exception as e:
        log(f"[ERROR] SSH 连接失败: {e}")
        return 2

    log("[OK] SSH 连接成功")

    try:
        # 2) 基本环境探活
        ok, out, err, rc = run_cmd(
            client,
            "环境探活 (whoami / hostname / uname)",
            "whoami; hostname; uname -a; date",
        )
        if not ok:
            return 3

        # 3) 检查 openssl / docker / docker compose 是否就绪
        ok, out, err, rc = run_cmd(
            client,
            "依赖检查 (openssl / docker / docker compose)",
            "openssl version; echo '---'; docker --version; echo '---'; "
            "docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || "
            "echo 'NO_DOCKER_COMPOSE'",
        )
        if not ok:
            return 4

        # 4) 创建目录结构
        ok, out, err, rc = run_cmd(
            client,
            "创建目录结构 /opt/overinsur/{data/uploads,backup,deploy/web,deploy/sql,nginx}",
            "mkdir -p /opt/overinsur/data/uploads /opt/overinsur/backup "
            "/opt/overinsur/deploy/web /opt/overinsur/deploy/sql /opt/overinsur/nginx "
            "&& ls -la /opt/overinsur && echo '---' && find /opt/overinsur -maxdepth 3 -type d",
        )
        if not ok:
            return 5

        # 5) 生成强密码并写入 .env
        #    用单条 bash -c 保证变量在同一 shell 内可用
        env_cmd = r"""bash -c '
set -e
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
INTEGRATION_MASTER_KEY=$(openssl rand -base64 32)

cat > /opt/overinsur/.env << EOF
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
INTEGRATION_MASTER_KEY=${INTEGRATION_MASTER_KEY}
CORS_ORIGINS=http://220.154.128.28:8601
WORKOS_MOCK=1
EOF

chmod 600 /opt/overinsur/.env

echo "=== .env written (secrets masked) ==="
echo "DB_PASSWORD length: $(awk -F= "/^DB_PASSWORD=/{print length($2)}" /opt/overinsur/.env)"
echo "JWT_SECRET length: $(awk -F= "/^JWT_SECRET=/{print length($2)}" /opt/overinsur/.env)"
echo "JWT_REFRESH_SECRET length: $(awk -F= "/^JWT_REFRESH_SECRET=/{print length($2)}" /opt/overinsur/.env)"
echo "INTEGRATION_MASTER_KEY length: $(awk -F= "/^INTEGRATION_MASTER_KEY=/{print length($2)}" /opt/overinsur/.env)"
echo "CORS_ORIGINS: $(grep ^CORS_ORIGINS /opt/overinsur/.env)"
echo "WORKOS_MOCK: $(grep ^WORKOS_MOCK /opt/overinsur/.env)"
echo "--- ls -la /opt/overinsur/.env ---"
ls -la /opt/overinsur/.env
'
"""
        ok, out, err, rc = run_cmd(
            client,
            "生成强密码并写入 .env (chmod 600)",
            env_cmd,
        )
        if not ok:
            return 6

        # 6) 创建 docker-compose.yml（使用 'DCEOF' 防止变量展开）
        compose_cmd = r"""cat > /opt/overinsur/docker-compose.yml << 'DCEOF'
version: "3.8"

services:
  overinsur-pg:
    image: postgres:16
    container_name: overinsur-pg
    restart: unless-stopped
    environment:
      POSTGRES_DB: overinsur_db
      POSTGRES_USER: overinsur
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "127.0.0.1:5460:5432"
    volumes:
      - overinsur-pg-data:/var/lib/postgresql/data
      - /opt/overinsur/backup:/backup
    mem_limit: 512m
    networks:
      - overinsur-net

networks:
  overinsur-net:
    driver: bridge

volumes:
  overinsur-pg-data:
DCEOF
echo "=== docker-compose.yml written ==="
echo "--- ls -la ---"
ls -la /opt/overinsur/docker-compose.yml
echo "--- content ---"
cat /opt/overinsur/docker-compose.yml
"""
        ok, out, err, rc = run_cmd(
            client,
            "创建 docker-compose.yml",
            compose_cmd,
        )
        if not ok:
            return 7

        # 7) 启动 PG 容器（用 --env-file 读取 .env 中的 DB_PASSWORD）
        ok, out, err, rc = run_cmd(
            client,
            "启动 PG 容器: docker compose --env-file ... up -d overinsur-pg",
            "cd /opt/overinsur && "
            "docker compose --env-file /opt/overinsur/.env up -d overinsur-pg",
            timeout=300,
        )
        if not ok:
            return 8

        # 8) 等待 PG 就绪并验证 pg_isready
        ok, out, err, rc = run_cmd(
            client,
            "等待 5 秒后验证 pg_isready",
            "sleep 5 && docker exec overinsur-pg pg_isready -U overinsur -d overinsur_db",
            timeout=60,
        )
        if not ok:
            # 容器可能还在启动，再多等一会并检查日志
            log("[WARN] pg_isready 首次未通过，尝试检查容器状态与日志")
            run_cmd(
                client,
                "检查容器状态 docker ps -a",
                "docker ps -a --filter name=overinsur-pg",
                allow_nonzero=True,
            )
            run_cmd(
                client,
                "查看容器最近日志 docker logs",
                "docker logs --tail 50 overinsur-pg 2>&1",
                allow_nonzero=True,
            )
            # 再次尝试 pg_isready
            ok2, _, _, _ = run_cmd(
                client,
                "再次等待 10 秒后重试 pg_isready",
                "sleep 10 && docker exec overinsur-pg pg_isready -U overinsur -d overinsur_db",
                timeout=60,
                allow_nonzero=True,
            )
            if not ok2:
                log("[ERROR] PG 始终未就绪，停止")
                return 9

        # 9) 验证容器运行
        ok, out, err, rc = run_cmd(
            client,
            "验证容器运行: docker ps | grep overinsur",
            "docker ps --filter name=overinsur-pg --format "
            "'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
            allow_nonzero=True,
        )

        # 10) 额外验证：本地端口 5460 监听
        run_cmd(
            client,
            "验证端口监听: ss -ltnp | grep 5460",
            "ss -ltnp 2>/dev/null | grep 5460 || netstat -ltnp 2>/dev/null | grep 5460",
            allow_nonzero=True,
        )

        # 11) 验证可通过 psql 连接（不显示密码）
        run_cmd(
            client,
            "验证可连接数据库 (SELECT 1)",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c 'SELECT 1 AS ok;'",
            allow_nonzero=True,
        )

        log("\n" + "=" * 78)
        log("[DONE] 第一步全部命令执行完成")
        log("=" * 78)
        return 0

    finally:
        try:
            client.close()
            log("\n[INFO] SSH 连接已关闭")
        except Exception:
            pass


if __name__ == "__main__":
    rc = main()
    print("\n[FINAL EXIT CODE]", rc)
    sys.exit(rc)
