# OverInsur Database Setup Script - ovwr_ prefix tables
# Date: 2026-09-03

$container = "ai-saas-postgres-dev"
$user = "postgres"

Write-Host "=== Creating i18n_db database ===" 
docker exec $container psql -U $user -c "CREATE DATABASE i18n_db;" -d postgres

Write-Host "=== Creating auth_db database ==="
docker exec $container psql -U $user -c "CREATE DATABASE auth_db;" -d postgres

Write-Host "`n=== Executing i18n-db.sql ==="
i18nSQL = @'
-- i18n Translation Table
CREATE TABLE ovwr_auth_i18n_translation (
    ovwr_translation_id VARCHAR(32) PRIMARY KEY,
    ovwr_namespace VARCHAR(64) NOT NULL,
    ovwr_key VARCHAR(256) NOT NULL,
    ovwr_en_us VARCHAR(512) NOT NULL,
    ovwr_zh_cn VARCHAR(512),
    ovwr_type VARCHAR(20),
    ovwr_module VARCHAR(32),
    ovwr_section VARCHAR(64),
    ovwr_status VARCHAR(1) DEFAULT '1',
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX ovwr_idx_translation ON ovwr_auth_i18n_translation(ovwr_namespace, ovwr_key);

-- Version Table  
CREATE TABLE ovwr_auth_i18n_version (
    ovwr_version_id VARCHAR(32) PRIMARY KEY,
    ovwr_version_number VARCHAR(16) NOT NULL,
    ovwr_change_log TEXT,
    ovwr_published_by VARCHAR(32),
    ovwr_published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_is_active INTEGER DEFAULT 1,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX ovwr_idx_version ON ovwr_auth_i18n_version(ovwr_version_number);
'@

docker exec -i $container psql -U $user -d i18n_db -c $i18nSQL

Write-Host "`n=== Executing auth-db.sql ==="
authSQL = @'
-- Permission Table
CREATE TABLE ovwr_auth_permission (
    ovwr_permission_id VARCHAR(32) PRIMARY KEY,
    ovwr_permission_code VARCHAR(64) UNIQUE NOT NULL,
    ovwr_permission_name VARCHAR(128) NOT NULL,
    ovwr_module VARCHAR(32) NOT NULL,
    ovwr_action VARCHAR(20) NOT NULL,
    ovwr_description TEXT,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Permission Template Table
CREATE TABLE ovwr_auth_permission_template (
    ovwr_template_id VARCHAR(32) PRIMARY KEY,
    ovwr_template_name VARCHAR(128) NOT NULL,
    ovwr_version VARCHAR(16) NOT NULL,
    ovwr_format VARCHAR(8) NOT NULL,
    ovwr_content JSONB NOT NULL,
    ovwr_description TEXT,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(ovwr_template_name, ovwr_version)
);
'@

docker exec -i $container psql -U $user -d auth_db -c $authSQL

Write-Host "`n=== Database setup complete! ==="
