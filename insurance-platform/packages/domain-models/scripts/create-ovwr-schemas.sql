-- =====================================================
-- OverInsur (ovwr) Schema Creation Script
-- Database: ai-saas-postgres-dev (端口 5432)
-- 策略：在 public schema 下使用 ovwr_ 前缀区分表名
-- 用户：postgres / postgres
-- =====================================================

-- 注意：我们不在 new database 而是在现有的 ai_saas 数据库中创建带前缀的表
-- 这样可以避免权限问题并且保持所有数据在同一实例中

-- ============================================================================
-- Part 1: i18n_db Domain Tables (在多语言管理域)
-- ============================================================================

-- 1. ovwr_auth_i18n_translation (翻译词条主表)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_i18n_translation (
    ovwr_translation_id VARCHAR(32) PRIMARY KEY,
    ovwr_namespace VARCHAR(64) NOT NULL,
    ovwr_key VARCHAR(256) NOT NULL,
    ovwr_en_us VARCHAR(512) NOT NULL,
    ovwr_zh_cn VARCHAR(512),
    ovwr_type VARCHAR(32) CHECK (ovwr_type IN ('label', 'button', 'placeholder', 'toast', 'confirm', 'validate', 'error-page')),
    ovwr_module VARCHAR(32),
    ovwr_section VARCHAR(64),
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')),
    ovwr_modified INTEGER DEFAULT 0,
    ovwr_metadata JSONB,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT uk_ovwr_namespace_key UNIQUE (ovwr_namespace, ovwr_key)
);

-- Indexes for ovwr_auth_i18n_translation
CREATE INDEX IF NOT EXISTS idx_ovwr_i18n_namespace ON public.ovwr_auth_i18n_translation(ovwr_namespace);
CREATE INDEX IF NOT EXISTS idx_ovwr_i18n_status ON public.ovwr_auth_i18n_translation(ovwr_status);
CREATE INDEX IF NOT EXISTS idx_ovwr_i18n_type ON public.ovwr_auth_i18n_translation(ovwr_type);
CREATE INDEX IF NOT EXISTS idx_ovwr_i18n_search ON public.ovwr_auth_i18n_translation USING GIN (ovwr_metadata jsonb_path_ops);

-- 2. ovwr_auth_i18n_version (翻译版本控制表)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_i18n_version (
    ovwr_version_id VARCHAR(32) PRIMARY KEY,
    ovwr_version_name VARCHAR(128) NOT NULL,
    ovwr_version_code VARCHAR(32) NOT NULL,
    ovwr_description TEXT,
    ovwr_source_namespace VARCHAR(64),
    ovwr_target_language VARCHAR(10) NOT NULL CHECK (ovwr_target_language IN ('en-US', 'zh-CN')),
    ovwr_base_version_id VARCHAR(32),
    ovwr_status VARCHAR(1) DEFAULT '0' CHECK (ovwr_status IN ('0', '1', '2')), -- 0:草稿，1:审核中，2:已发布
    ovwr_publish_notes TEXT,
    ovwr_total_translations INTEGER DEFAULT 0,
    ovwr_modified_count INTEGER DEFAULT 0,
    ovwr_created_by VARCHAR(64),
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ovwr_iversion_status ON public.ovwr_auth_i18n_version(ovwr_status);
CREATE INDEX IF NOT EXISTS idx_ovwr_iversion_language ON public.ovwr_auth_i18n_version(ovwr_target_language);
CREATE INDEX IF NOT EXISTS idx_ovwr_iversion_code ON public.ovwr_auth_i18n_version(ovwr_version_code);

-- 3. ovwr_auth_i18n_review_queue (翻译审核队列表)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_i18n_review_queue (
    ovwr_review_id VARCHAR(32) PRIMARY KEY,
    ovwr_version_id VARCHAR(32) NOT NULL,
    ovwr_translation_id VARCHAR(32) NOT NULL,
    ovwr_reviewer_id VARCHAR(64),
    ovwr_reviewer_name VARCHAR(128),
    ovwr_review_status VARCHAR(1) DEFAULT '0' CHECK (ovwr_review_status IN ('0', '1', '2')), -- 0:待审核，1:通过，2:驳回
    ovwr_review_notes TEXT,
    ovwr_reviewed_at TIMESTAMP WITH TIME ZONE,
    ovwr_proposed_translation TEXT,
    ovwr_original_translation TEXT,
    ovwr_conflict_reason TEXT,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ovwr_irqueue_version ON public.ovwr_auth_i18n_review_queue(ovwr_version_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_irqueue_status ON public.ovwr_auth_i18n_review_queue(ovwr_review_status);
CREATE INDEX IF NOT EXISTS idx_ovwr_irqueue_translation ON public.ovwr_auth_i18n_review_queue(ovwr_translation_id);

-- 4. ovwr_dict_term (保险术语库表)
CREATE TABLE IF NOT EXISTS public.ovwr_dict_term (
    ovwr_term_id VARCHAR(32) PRIMARY KEY,
    ovwr_term_en VARCHAR(256) NOT NULL,
    ovwr_term_zh VARCHAR(256) NOT NULL,
    ovwr_term_category VARCHAR(128) NOT NULL, -- insurance/finance/compliance/legal
    ovwr_term_definition TEXT,
    ovwr_usage_examples TEXT[],
    ovwr_related_terms VARCHAR(256)[],
    ovwr_priority INTEGER DEFAULT 0,
    ovwr_usage_count INTEGER DEFAULT 0,
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')),
    ovwr_created_by VARCHAR(64),
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ovwr_dt_category ON public.ovwr_dict_term(ovwr_term_category);
CREATE INDEX IF NOT EXISTS idx_ovwr_dt_status ON public.ovwr_dict_term(ovwr_status);
CREATE INDEX IF NOT EXISTS idx_ovwr_dt_search ON public.ovwr_dict_term USING GIN (to_tsvector('english', ovwr_term_en));

-- ============================================================================
-- Part 2: auth_db Domain Tables (权限管理域)
-- ============================================================================

-- 5. ovwr_auth_permission (功能权限点表 - RBAC 核心)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_permission (
    ovwr_permission_id VARCHAR(32) PRIMARY KEY,
    ovwr_permission_code VARCHAR(64) UNIQUE NOT NULL,
    ovwr_permission_name VARCHAR(128) NOT NULL,
    ovwr_module VARCHAR(32) NOT NULL,
    ovwr_action VARCHAR(32) NOT NULL CHECK (ovwr_action IN ('create', 'read', 'update', 'delete', 'import', 'export', 'approve', 'audit')),
    ovwr_resource_type VARCHAR(32) CHECK (ovwr_resource_type IN ('page', 'api', 'menu', 'button', 'data')),
    ovwr_parent_permission_id VARCHAR(32),
    ovwr_sort_order INTEGER DEFAULT 0,
    ovwr_icon VARCHAR(64),
    ovwr_path VARCHAR(256),
    ovwr_metadata JSONB,
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')),
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ovwr_ap_code ON public.ovwr_auth_permission(ovwr_permission_code);
CREATE INDEX IF NOT EXISTS idx_ovwr_ap_module ON public.ovwr_auth_permission(ovwr_module);
CREATE INDEX IF NOT EXISTS idx_ovwr_ap_parent ON public.ovwr_auth_permission(ovwr_parent_permission_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_ap_status ON public.ovwr_auth_permission(ovwr_status);

-- 6. ovwr_auth_user_role (用户角色关联表)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_user_role (
    ovwr_user_role_id VARCHAR(32) PRIMARY KEY,
    ovwr_user_id VARCHAR(64) NOT NULL,
    ovwr_role_id VARCHAR(32) NOT NULL,
    ovwr_assigned_by VARCHAR(64),
    ovwr_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_expires_at TIMESTAMP WITH TIME ZONE,
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')),
    
    CONSTRAINT uk_ovwr_user_role UNIQUE (ovwr_user_id, ovwr_role_id)
);

CREATE INDEX IF NOT EXISTS idx_ovwr_urole_user ON public.ovwr_auth_user_role(ovwr_user_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_urole_role ON public.ovwr_auth_user_role(ovwr_role_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_urole_status ON public.ovwr_auth_user_role(ovwr_status);

-- 7. ovwr_auth_role_permission (角色权限关联表)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_role_permission (
    ovwr_role_permission_id VARCHAR(32) PRIMARY KEY,
    ovwr_role_id VARCHAR(32) NOT NULL,
    ovwr_permission_id VARCHAR(32) NOT NULL,
    ovwr_granted_by VARCHAR(64),
    ovwr_granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')),
    
    CONSTRAINT uk_ovwr_role_permission UNIQUE (ovwr_role_id, ovwr_permission_id)
);

CREATE INDEX IF NOT EXISTS idx_ovwr_rperm_role ON public.ovwr_auth_role_permission(ovwr_role_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_rperm_perm ON public.ovwr_auth_role_permission(ovwr_permission_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_rperm_status ON public.ovwr_auth_role_permission(ovwr_status);

-- 8. ovwr_auth_permission_template (权限模板表)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_permission_template (
    ovwr_template_id VARCHAR(32) PRIMARY KEY,
    ovwr_template_name VARCHAR(128) NOT NULL,
    ovwr_template_code VARCHAR(64) UNIQUE NOT NULL,
    ovwr_description TEXT,
    ovwr_scope VARCHAR(32) CHECK (ovwr_scope IN ('system', 'department', 'project', 'custom')),
    ovwr_is_default BOOLEAN DEFAULT FALSE,
    ovwr_usage_count INTEGER DEFAULT 0,
    ovwr_metadata JSONB,
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')),
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ovwr_ptemplate_code ON public.ovwr_auth_permission_template(ovwr_template_code);
CREATE INDEX IF NOT EXISTS idx_ovwr_ptemplate_scope ON public.ovwr_auth_permission_template(ovwr_scope);
CREATE INDEX IF NOT EXISTS idx_ovwr_ptemplate_default ON public.ovwr_auth_permission_template(ovwr_is_default);

-- 9. ovwr_auth_operation_log (操作审计日志表)
CREATE TABLE IF NOT EXISTS public.ovwr_auth_operation_log (
    ovwr_log_id VARCHAR(32) PRIMARY KEY,
    ovwr_user_id VARCHAR(64) NOT NULL,
    ovwr_user_name VARCHAR(128),
    ovwr_action VARCHAR(128) NOT NULL,
    ovwr_resource_type VARCHAR(64),
    ovwr_resource_id VARCHAR(256),
    ovwr_request_method VARCHAR(10),
    ovwr_request_url VARCHAR(512),
    ovwr_request_params JSONB,
    ovwr_response_code INTEGER,
    ovwr_response_time INTEGER, -- milliseconds
    ovwr_ip_address VARCHAR(64),
    ovwr_user_agent TEXT,
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')),
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_ovwr_aolog_user ON public.ovwr_auth_operation_log(ovwr_user_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_aolog_action ON public.ovwr_auth_operation_log(ovwr_action);
CREATE INDEX IF NOT EXISTS idx_ovwr_aolog_created ON public.ovwr_auth_operation_log(ovwr_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ovwr_aolog_resource ON public.ovwr_auth_operation_log(ovwr_resource_type, ovwr_resource_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_aolog_ip ON public.ovwr_auth_operation_log(ovwr_ip_address);

-- ============================================================================
-- Part 3: Grant Permissions (授予权限)
-- ============================================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Note: Add specific row-level security policies here if needed
-- Example:
-- ALTER TABLE public.ovwr_auth_operation_log ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ovwr_analytics_access ON public.ovwr_auth_operation_log
--     FOR ANALYTICS TO postgres USING (true);

-- ============================================================================
-- Summary
-- ============================================================================
-- Total tables created: 9
-- - i18n_db domain: 4 tables (ovwr_auth_i18n_translation, ovwr_auth_i18n_version, ovwr_auth_i18n_review_queue, ovwr_dict_term)
-- - auth_db domain: 5 tables (ovwr_auth_permission, ovwr_auth_user_role, ovwr_auth_role_permission, ovwr_auth_permission_template, ovwr_auth_operation_log)
-- 
-- All tables use 'ovwr_' prefix to distinguish from existing projects
-- Located in: public schema of ai_saas database
-- Connection: postgresql://postgres:postgres@localhost:5432/ai_saas