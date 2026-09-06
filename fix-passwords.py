import pg8000
import sys

try:
    conn = pg8000.connect(
        host='localhost',
        port=5433,
        user='overinsur',
        password='overinsur123',
        database='overinsur_db'
    )
    cursor = conn.cursor()
    
    # Delete all users first
    cursor.execute("DELETE FROM auth_user")
    print(f"Deleted {cursor.rowcount} rows from auth_user")
    
    # Insert new users with correct passwords
    users = [
        ('user-admin-001', 'admin', '$2b$10$gmYyOUTkVTrqYLejwFOM0.5hroZKR0tuzz8nSGEslQsRVhLNTHuXS', 'Administrator', 'admin@overinsur.com', '1'),
        ('user-li-001', 'li.xiaoyan', '$2a$10$LQv3c.YmZNPPTLXjyKJOTu.6tjNB0y7dHJ8B.vJqW.5ZqYxNzGKmO', '李小红', 'li.xiaoyan@overinsur.com', '1'),
        ('user-zhang-001', 'zhang.wei', '$2a$10$LQv3c.YmZNPPTLXjyKJOTu.6tjNB0y7dHJ8B.vJqW.5ZqYxNzGKmO', '张伟', 'zhang.wei@overinsur.com', '1'),
    ]
    
    for user in users:
        cursor.execute("""
            INSERT INTO auth_user (user_id, username, password_hash, real_name, email, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, user)
        print(f"Inserted user: {user[1]}")
    
    conn.commit()
    
    # Verify
    cursor.execute("SELECT user_id, username, LEFT(password_hash, 30) as hash_preview FROM auth_user")
    print("\nAll users:")
    for row in cursor.fetchall():
        print(f"  {row[0]} | {row[1]} | {row[2]}...")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
finally:
    conn.close()
    print("\nConnection closed")
