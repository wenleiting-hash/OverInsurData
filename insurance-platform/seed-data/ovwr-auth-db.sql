-- =====================================================
-- OverInsur (ovwr_) Database Schema - auth_db
-- =====================================================
-- IMPORTANT: All tables use 'ovwr_' prefix to distinguish from existing projects
-- Database: auth_db on ai-saas-postgres container (port 5432)
-- Date: 2026-09-03
-- =====================================================

-- Create permission table
CREATE TABLE ovwr_auth_permission (
    ovwr_permission_id VARCHAR(32) PRIMARY KEY,
    ovwr_permission_code VARCHAR(64) UNIQUE NOT NULL,
    ovwr_permission_name VARCHAR(128) NOT NULL,
    ovwr_module VARCHAR(32) NOT NULL,
    ovwr_action VARCHAR(20) NOT NULL,
    ovwr_resource_type VARCHAR(20),
    ovwr_parent_permission_id VARCHAR(32),
    ovwr_sort_order INTEGER DEFAULT 0,
    ovwr_icon VARCHAR(64),
    ovwr_description TEXT,
    ovwr_status VARCHAR(1) DEFAULT '1',
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for permission table
CREATE INDEX ovwr_idx_permission_code ON ovwr_auth_permission(ovwr_permission_code);
CREATE INDEX ovwr_idx_permission_module ON ovwr_auth_permission(ovwr_module);
CREATE INDEX ovwr_idx_permission_parent ON ovwr_auth_permission(ovwr_parent_permission_id);

-- Create role table (MISSING - ADDED)
CREATE TABLE ovwr_auth_role (
    ovwr_role_id VARCHAR(32) PRIMARY KEY,
    ovwr_role_name VARCHAR(128) NOT NULL,
    ovwr_role_code VARCHAR(64) UNIQUE NOT NULL,
    ovwr_description TEXT,
    ovwr_type VARCHAR(20) DEFAULT 'SYSTEM',
    ovwr_sort_order INTEGER DEFAULT 0,
    ovwr_status VARCHAR(1) DEFAULT '1',
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for role table
CREATE INDEX ovwr_idx_role_code ON ovwr_auth_role(ovwr_role_code);
CREATE INDEX ovwr_idx_role_status ON ovwr_auth_role(ovwr_status);

-- Create user-role association table
CREATE TABLE ovwr_auth_user_role (
    ovwr_role_id VARCHAR(32) NOT NULL,
    ovwr_user_id VARCHAR(32) NOT NULL,
    ovwr_source_type VARCHAR(20),
    ovwr_applied_template_id VARCHAR(32),
    ovwr_granted_by VARCHAR(32),
    ovwr_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_expires_at TIMESTAMP WITH TIME ZONE,
    ovwr_status VARCHAR(20) DEFAULT 'ACTIVE',
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (ovwr_user_id, ovwr_role_id)
);

-- Create indexes for user-role table
CREATE INDEX ovwr_idx_user_role ON ovwr_auth_user_role(ovwr_user_id, ovwr_role_id);
CREATE INDEX ovwr_idx_user_role_user ON ovwr_auth_user_role(ovwr_user_id);

-- Create role-permission association table
CREATE TABLE ovwr_auth_role_permission (
    ovwr_role_id VARCHAR(32) NOT NULL REFERENCES ovwr_auth_user_role(ovwr_role_id),
    ovwr_permission_id VARCHAR(32) NOT NULL REFERENCES ovwr_auth_permission(ovwr_permission_id),
    ovwr_inherited_from VARCHAR(32),
    ovwr_source_type VARCHAR(20),
    ovwr_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (ovwr_role_id, ovwr_permission_id)
);

-- Create indexes for role-permission table
CREATE INDEX ovwr_idx_role_permission ON ovwr_auth_role_permission(ovwr_role_id, ovwr_permission_id);
CREATE INDEX ovwr_idx_role_permission_permission ON ovwr_auth_role_permission(ovwr_permission_id);

-- Create permission template table
CREATE TABLE ovwr_auth_permission_template (
    ovwr_template_id VARCHAR(32) PRIMARY KEY,
    ovwr_template_name VARCHAR(128) NOT NULL,
    ovwr_version VARCHAR(16) NOT NULL,
    ovwr_format VARCHAR(8) NOT NULL,
    ovwr_content JSONB NOT NULL,
    ovwr_description TEXT,
    ovwr_role_count INTEGER DEFAULT 0,
    ovwr_permission_count INTEGER DEFAULT 0,
    ovwr_created_by VARCHAR(32),
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_last_used_at TIMESTAMP WITH TIME ZONE,
    ovwr_usage_count INTEGER DEFAULT 0,
    ovwr_metadata JSONB,
    UNIQUE(ovwr_template_name, ovwr_version)
);

-- Create index for permission template
CREATE INDEX ovwr_idx_template_name_version ON ovwr_auth_permission_template(ovwr_template_name, ovwr_version);
CREATE INDEX ovwr_idx_template_usage ON ovwr_auth_permission_template(ovwr_usage_count);

-- Create operation log table
CREATE TABLE ovwr_auth_operation_log (
    ovwr_log_id VARCHAR(32) PRIMARY KEY,
    ovwr_user_id VARCHAR(32),
    ovwr_username VARCHAR(64),
    ovwr_action VARCHAR(128) NOT NULL,
    ovwr_module VARCHAR(32),
    ovwr_permission_code VARCHAR(64),
    ovwr_ip VARCHAR(64),
    ovwr_user_agent TEXT,
    ovwr_request_id VARCHAR(64),
    ovwr_duration INTEGER,
    ovwr_status VARCHAR(1),
    ovwr_error_message TEXT,
    ovwr_extra_data JSONB,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for operation log
CREATE INDEX ovwr_idx_log_created_at ON ovwr_auth_operation_log(ovwr_created_at);
CREATE INDEX ovwr_idx_log_user_id ON ovwr_auth_operation_log(ovwr_user_id);
CREATE INDEX ovwr_idx_log_action ON ovwr_auth_operation_log(ovwr_action);
CREATE INDEX ovwr_idx_log_module ON ovwr_auth_operation_log(ovwr_module);

-- =====================================================
-- Seed Data
-- =====================================================

-- Insert default roles
INSERT INTO ovwr_auth_role (ovwr_role_id, ovwr_role_name, ovwr_role_code, ovwr_description, ovwr_type, ovwr_sort_order, ovwr_status) VALUES
    ('role-admin', '系统管理员', 'ADMIN', '拥有系统全部权限', 'SYSTEM', 1, '1'),
    ('role-user', '普通用户', 'USER', '基础用户权限', 'SYSTEM', 2, '1'),
    ('role-manager', '渠道经理', 'MANAGER', '渠道管理权限', 'BUSINESS', 3, '1');
