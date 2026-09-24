# -*- coding: utf-8 -*-
"""
OverInsur 部署第二步 (续)：修复 seed-initial-data.sql Part 2 后，重新上传并执行
files 6 (seed-initial-data) -> 7 (ovwr-seed-permissions) -> 8 (06-seed-admin) -> 验证。
"""
import os
import sys
import paramiko

HOST = "220.154.128.28"
PORT = 50222
USER = "root"
PASSWORD = "a221447s..."

LOCAL_ROOT = r"e:\WorkProject\OverInsurData\insurance-platform"
REMOTE_SQL_DIR = "/opt/overinsur/deploy/sql"

# 只需重跑这三个文件（5 个 schema init 文件已成功，不重跑）
RESUME_FILES = [
    (r"packages\domain-models\scripts\seed-initial-data.sql", "seed-initial-data.sql",     True),
    (r"seed-data\ovwr-seed-permissions.sql",                  "ovwr-seed-permissions.sql", True),
    (r"seed-data\06-seed-admin.sql",                          "06-seed-admin.sql",        False),
]

FULL_LOG = []


def log(msg):
    line = str(msg)
    print(line, flush=True)
    FULL_LOG.append(line)


def run_cmd(client, label, cmd, timeout=300, allow_nonzero=False):
    log("\n" + "=" * 78)
    log(f"[STEP] {label}")
    log("-" * 78)
    log(f"[CMD]\n{cmd}")
    log("-" * 78)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=False)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    rc = stdout.channel.recv_exit_status()
    if out:
        log("[STDOUT]")
        log(out)
    else:
        log("[STDOUT] (empty)")
    if err:
        log("[STDERR]")
        log(err)
    log(f"[EXIT CODE] {rc}")
    if rc != 0 and not allow_nonzero:
        log(f"[ERROR] 命令执行失败 (exit={rc})，停止")
        return False, out, err, rc
    log(f"[OK] 成功" if rc == 0 else f"[WARN] 退出码 {rc}（已允许非零）")
    return True, out, err, rc


def scan_psql_errors(out, err, allow_conflict=False):
    issues = []
    blob = (out or "") + "\n" + (err or "")
    for line in blob.splitlines():
        s = line.strip()
        if not s:
            continue
        upper = s.upper()
        if upper.startswith("ERROR:"):
            if allow_conflict and ("DUPLICATE KEY" in upper or "ON CONFLICT" in upper
                                    or "ALREADY EXISTS" in upper):
                continue
            issues.append(s)
        elif upper.startswith("FATAL:") or upper.startswith("PANIC:"):
            issues.append(s)
    return issues


def upload_sftp(client, local_path, remote_path):
    sftp = client.open_sftp()
    try:
        local_size = os.path.getsize(local_path)
        log(f"[UPLOAD] {local_path} ({local_size} bytes) -> {remote_path}")
        sftp.put(local_path, remote_path)
        try:
            rs = sftp.stat(remote_path)
            if rs.st_size != local_size:
                log(f"[ERROR] 远端大小不一致 local={local_size} remote={rs.st_size}")
                return False
            log(f"[OK] 上传成功, 远端大小 {rs.st_size} bytes")
        except Exception as e:
            log(f"[WARN] stat 失败: {e}")
        return True
    except Exception as e:
        log(f"[ERROR] 上传失败 {local_path}: {e}")
        return False
    finally:
        sftp.close()


def main():
    log("=" * 78)
    log("OverInsur 部署 - 第二步(续) 修复 seed Part 2 后重跑 files 6/7/8 + 验证")
    log(f"目标: {USER}@{HOST}:{PORT}")
    log("=" * 78)

    # 预检本地文件
    for rel, name, _ in RESUME_FILES:
        p = os.path.join(LOCAL_ROOT, rel)
        if not os.path.isfile(p):
            log(f"[ERROR] 缺失: {p}")
            return 2
        log(f"[OK] {p} ({os.path.getsize(p)} bytes)")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=HOST, port=PORT, username=USER, password=PASSWORD,
                       timeout=30, allow_agent=False, look_for_keys=False)
    except Exception as e:
        log(f"[ERROR] SSH 连接失败: {e}")
        return 3
    log("[OK] SSH 连接成功")

    try:
        # 环境探活
        run_cmd(client, "容器状态",
                "docker ps --filter name=overinsur-pg --format "
                "'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")

        # 重新上传这三个文件
        log("\n[UPLOAD] 重新上传 files 6/7/8")
        for rel, name, _ in RESUME_FILES:
            if not upload_sftp(client, os.path.join(LOCAL_ROOT, rel),
                               f"{REMOTE_SQL_DIR}/{name}"):
                return 4

        run_cmd(client, f"列出 {REMOTE_SQL_DIR}", f"ls -la {REMOTE_SQL_DIR}")

        # 按顺序执行
        results = []
        for idx, (rel, name, allow_conflict) in enumerate(RESUME_FILES, 1):
            cmd = (f"cat {REMOTE_SQL_DIR}/{name} | docker exec -i overinsur-pg "
                   f"psql -U overinsur -d overinsur_db -v ON_ERROR_STOP=1")
            ok, out, err, rc = run_cmd(client, f"[{idx}/{len(RESUME_FILES)}] 执行 {name}",
                                       cmd, timeout=600)
            issues = scan_psql_errors(out, err, allow_conflict=allow_conflict)
            if issues:
                log(f"[ISSUES] {name} 发现 {len(issues)} 条错误:")
                for s in issues[:20]:
                    log("  " + s)
                results.append((name, False, rc, len(issues)))
                if not ok:
                    return 5
            else:
                log(f"[OK] {name} 无 ERROR")
                results.append((name, True, rc, 0))

        log("\n" + "=" * 78)
        log("[EXEC SUMMARY]")
        for name, okf, rc, ec in results:
            tag = "OK " if okf else "ERR"
            log(f"  [{tag}] {name}  exit={rc}  errors={ec}")
        log("=" * 78)

        # 验证
        log("\n[VERIFY]")
        run_cmd(client, "按 schema 统计表数量",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT table_schema, COUNT(*) AS tbl_count FROM information_schema.tables "
                "WHERE table_schema NOT IN ('pg_catalog','information_schema') "
                "GROUP BY table_schema ORDER BY table_schema;\"",
                allow_nonzero=True)

        run_cmd(client, "各表清单",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT table_schema, table_name FROM information_schema.tables "
                "WHERE table_schema NOT IN ('pg_catalog','information_schema') "
                "ORDER BY table_schema, table_name;\"",
                allow_nonzero=True)

        run_cmd(client, "admin 用户",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT username, email, status FROM auth_user WHERE username='admin';\"",
                allow_nonzero=True)

        run_cmd(client, "super_admin 角色",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT role_key, role_name_zh, role_code FROM auth_role WHERE role_key='super_admin';\"",
                allow_nonzero=True)

        run_cmd(client, "admin <-> super_admin 关联",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT u.username, r.role_key FROM auth_user u "
                "JOIN auth_user_role ur ON ur.user_id = u.id "
                "JOIN auth_role r ON r.role_id = ur.role_id "
                "WHERE u.username='admin';\"",
                allow_nonzero=True)

        run_cmd(client, "权限点总数 ovwr_auth_permission",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT COUNT(*) AS perm_count FROM ovwr_auth_permission;\"",
                allow_nonzero=True)

        run_cmd(client, "权限模板数 ovwr_auth_permission_template",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT ovwr_template_id, ovwr_template_name, ovwr_version, ovwr_format "
                "FROM ovwr_auth_permission_template ORDER BY ovwr_template_id;\"",
                allow_nonzero=True)

        run_cmd(client, "i18n 词条数 ovwr_auth_i18n_translation",
                "docker exec overinsur-pg psql -U overinsur -d overinsur_db -c \""
                "SELECT COUNT(*) AS i18n_count FROM ovwr_auth_i18n_translation;\"",
                allow_nonzero=True)

        log("\n" + "=" * 78)
        log("[DONE] 第二步(续) 完成")
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
