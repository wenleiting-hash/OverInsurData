# -*- coding: utf-8 -*-
"""
OverInsur 部署第二步：上传 SQL 脚本 -> 建表 + seed 数据 -> 验证
通过 paramiko SSH 非交互式执行。
执行顺序：
  1. 01-init-auth-schema.sql
  2. 02-init-ovwr-schema.sql
  3. 03-init-carrier-schema.sql
  4. 04-init-finance-schema.sql
  5. 05-init-cooperation-schema.sql
  6. seed-initial-data.sql  (packages/domain-models/scripts/)
  7. ovwr-seed-permissions.sql
  8. 06-seed-admin.sql
"""
import os
import sys
import time
import paramiko

HOST = "220.154.128.28"
PORT = 50222
USER = "root"
PASSWORD = "a221447s..."

# 本地 SQL 文件根
LOCAL_ROOT = r"e:\WorkProject\OverInsurData\insurance-platform"
REMOTE_SQL_DIR = "/opt/overinsur/deploy/sql"

# (本地相对路径, 远程文件名, 是否容许 NOTICE/重复键)
SQL_FILES = [
    (r"seed-data\01-init-auth-schema.sql",        "01-init-auth-schema.sql",        False),
    (r"seed-data\02-init-ovwr-schema.sql",        "02-init-ovwr-schema.sql",         False),
    (r"seed-data\03-init-carrier-schema.sql",      "03-init-carrier-schema.sql",      False),
    (r"seed-data\04-init-finance-schema.sql",     "04-init-finance-schema.sql",      False),
    (r"seed-data\05-init-cooperation-schema.sql",  "05-init-cooperation-schema.sql",  False),
    (r"packages\domain-models\scripts\seed-initial-data.sql", "seed-initial-data.sql",   True),
    (r"seed-data\ovwr-seed-permissions.sql",       "ovwr-seed-permissions.sql",       True),
    (r"seed-data\06-seed-admin.sql",               "06-seed-admin.sql",              False),
]

FULL_LOG = []


def log(msg):
    line = str(msg)
    print(line, flush=True)
    FULL_LOG.append(line)


def run_cmd(client, label, cmd, timeout=300, allow_nonzero=False):
    """执行一条 SSH 命令，打印 stdout/stderr/exitcode。返回 (ok, out, err, rc)。"""
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


def scan_psql_errors(out, err, allow_conflict=False):
    """扫描 psql 输出中的真错误。ON CONFLICT 产生的 NOTICE 不算错。"""
    issues = []
    blob = (out or "") + "\n" + (err or "")
    for line in blob.splitlines():
        s = line.strip()
        if not s:
            continue
        upper = s.upper()
        # psql 错误以 "ERROR:" 开头
        if upper.startswith("ERROR:"):
            if allow_conflict and ("DUPLICATE KEY" in upper or "ON CONFLICT" in upper
                                    or "ALREADY EXISTS" in upper):
                # 视为可接受的冲突
                continue
            issues.append(s)
        elif upper.startswith("FATAL:") or upper.startswith("PANIC:"):
            issues.append(s)
    return issues


def upload_sftp(client, local_path, remote_path):
    """用 SFTP 上传单个文件，带进度打印。"""
    sftp = client.open_sftp()
    try:
        local_size = os.path.getsize(local_path)
        log(f"[UPLOAD] {local_path} ({local_size} bytes) -> {remote_path}")
        sftp.put(local_path, remote_path)
        # 校验远端大小
        try:
            remote_stat = sftp.stat(remote_path)
            if remote_stat.st_size != local_size:
                log(f"[ERROR] 远端大小不一致: local={local_size} remote={remote_stat.st_size}")
                return False
            log(f"[OK] 上传成功, 远端大小 {remote_stat.st_size} bytes")
        except Exception as e:
            log(f"[WARN] 无法 stat 远端文件: {e}")
        return True
    except Exception as e:
        log(f"[ERROR] 上传失败 {local_path}: {e}")
        return False
    finally:
        sftp.close()


def main():
    log("=" * 78)
    log("OverInsur 部署 - 第二步 (SQL 建表 + seed)")
    log(f"目标服务器: {USER}@{HOST}:{PORT}")
    log(f"本地 SQL 根: {LOCAL_ROOT}")
    log(f"远端 SQL 目录: {REMOTE_SQL_DIR}")
    log("=" * 78)

    # 0) 预检：本地文件全部存在
    log("\n[PREFLIGHT] 检查本地 SQL 文件")
    missing = []
    for rel, name, _ in SQL_FILES:
        p = os.path.join(LOCAL_ROOT, rel)
        if not os.path.isfile(p):
            missing.append(p)
        else:
            log(f"[OK] {p} ({os.path.getsize(p)} bytes)")
    if missing:
        for m in missing:
            log(f"[ERROR] 缺失: {m}")
        return 2

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
        return 3
    log("[OK] SSH 连接成功")

    try:
        # 2) 环境探活 + 确认容器在运行
        ok, _, _, _ = run_cmd(
            client,
            "环境探活 + 容器状态",
            "whoami; hostname; echo '---'; "
            "docker ps --filter name=overinsur-pg --format "
            "'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
        )
        if not ok:
            return 4

        # 3) 确保远端 SQL 目录存在
        ok, _, _, _ = run_cmd(
            client,
            f"创建远端目录 {REMOTE_SQL_DIR}",
            f"mkdir -p {REMOTE_SQL_DIR} && ls -ld {REMOTE_SQL_DIR}",
        )
        if not ok:
            return 5

        # 4) 读取 DB_PASSWORD（仅用于校验 .env 存在；psql 走容器内 trust）
        ok, out, _, _ = run_cmd(
            client,
            "读取 DB_PASSWORD (masked) 自 /opt/overinsur/.env",
            "if [ -f /opt/overinsur/.env ]; then "
            "  echo '.env exists'; "
            "  PW=$(grep '^DB_PASSWORD=' /opt/overinsur/.env | cut -d= -f2-); "
            "  echo \"DB_PASSWORD length: ${#PW}\"; "
            "  echo 'DB_PASSWORD prefix: '${PW:0:4}'****'; "
            "else echo '.env NOT FOUND'; fi",
        )
        if not ok:
            return 6

        # 5) 上传 8 个 SQL 文件
        log("\n[UPLOAD] 开始 SFTP 上传 SQL 文件")
        uploaded = 0
        for rel, name, _ in SQL_FILES:
            local_path = os.path.join(LOCAL_ROOT, rel)
            remote_path = f"{REMOTE_SQL_DIR}/{name}"
            # 用单独的 SFTP 句柄，避免长连接复用问题
            if not upload_sftp(client, local_path, remote_path):
                return 7
            uploaded += 1
        log(f"[OK] 已上传 {uploaded}/{len(SQL_FILES)} 个文件")

        # 6) 列出远端 SQL 目录
        run_cmd(
            client,
            f"列出远端 {REMOTE_SQL_DIR}",
            f"ls -la {REMOTE_SQL_DIR}",
        )

        # 7) 按顺序执行 SQL
        log("\n[EXEC] 按顺序执行 SQL")
        exec_results = []
        for idx, (rel, name, allow_conflict) in enumerate(SQL_FILES, 1):
            remote_path = f"{REMOTE_SQL_DIR}/{name}"
            # 用 cat 管道喂给 docker exec -i psql
            cmd = (
                f"cat {remote_path} | docker exec -i overinsur-pg "
                f"psql -U overinsur -d overinsur_db -v ON_ERROR_STOP=1"
            )
            ok, out, err, rc = run_cmd(
                client,
                f"[{idx}/{len(SQL_FILES)}] 执行 {name}",
                cmd,
                timeout=600,
                allow_nonzero=False,
            )
            # 扫描输出中的 ERROR 行
            issues = scan_psql_errors(out, err, allow_conflict=allow_conflict)
            if issues:
                log(f"[ISSUES] {name} 发现 {len(issues)} 条错误:")
                for s in issues[:20]:
                    log("  " + s)
                if allow_conflict:
                    log("[INFO] 该文件标记为可容许冲突，但仍有 ERROR，请人工核对")
                exec_results.append((name, False, rc, len(issues)))
                if not ok:
                    return 8
            else:
                log(f"[OK] {name} 无 ERROR")
                exec_results.append((name, True, rc, 0))

        # 8) 执行汇总
        log("\n" + "=" * 78)
        log("[EXEC SUMMARY]")
        for name, ok_flag, rc, err_cnt in exec_results:
            tag = "OK " if ok_flag else "ERR"
            log(f"  [{tag}] {name}  exit={rc}  errors={err_cnt}")
        log("=" * 78)

        # 9) 验证
        log("\n[VERIFY] 执行验证查询")

        # 9.1 列出所有表
        run_cmd(
            client,
            "列出所有表 \\dt",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c '\\dt'",
            allow_nonzero=True,
        )

        # 9.2 表数量统计（按 schema 分别统计）
        run_cmd(
            client,
            "按 schema 统计表数量",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
            "SELECT schemaname, COUNT(*) AS table_count "
            "FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') "
            "GROUP BY schemaname ORDER BY schemaname;\"",
            allow_nonzero=True,
        )

        # 9.3 admin 用户
        run_cmd(
            client,
            "查询 admin 用户",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
            "SELECT username, email, status FROM auth_user WHERE username='admin';\"",
            allow_nonzero=True,
        )

        # 9.4 super_admin 角色
        run_cmd(
            client,
            "查询 super_admin 角色",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
            "SELECT role_key, role_name_zh FROM auth_role WHERE role_key='super_admin';\"",
            allow_nonzero=True,
        )

        # 9.5 权限点数
        run_cmd(
            client,
            "统计权限点数 ovwr_auth_permission",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
            "SELECT COUNT(*) AS perm_count FROM ovwr_auth_permission;\"",
            allow_nonzero=True,
        )

        # 9.6 i18n 词条数
        run_cmd(
            client,
            "统计 i18n 词条数 ovwr_auth_i18n_translation",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
            "SELECT COUNT(*) AS i18n_count FROM ovwr_auth_i18n_translation;\"",
            allow_nonzero=True,
        )

        # 9.7 各 schema 下表清单（便于核对）
        run_cmd(
            client,
            "各 schema 下表清单",
            "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
            "SELECT table_schema, table_name FROM information_schema.tables "
            "WHERE table_schema NOT IN ('pg_catalog','information_schema') "
            "ORDER BY table_schema, table_name;\"",
            allow_nonzero=True,
        )

        log("\n" + "=" * 78)
        log("[DONE] 第二步全部命令执行完成")
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
