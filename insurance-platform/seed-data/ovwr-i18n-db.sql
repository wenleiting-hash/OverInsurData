-- =====================================================
-- OverInsur (ovwr_) Database Schema - i18n_db
-- =====================================================
-- IMPORTANT: All tables use 'ovwr_' prefix to distinguish from existing projects
-- Database: i18n_db on ai-saas-postgres container (port 5432)
-- Date: 2026-09-03
-- =====================================================

-- Create i18n translation table
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
    ovwr_modified INTEGER DEFAULT 0,
    ovwr_reviewed_by VARCHAR(32),
    ovwr_reviewed_at TIMESTAMP WITH TIME ZONE,
    ovwr_metadata JSONB,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for translation table
CREATE INDEX ovwr_idx_translation_namespace_key ON ovwr_auth_i18n_translation(ovwr_namespace, ovwr_key);
CREATE INDEX ovwr_idx_translation_namespace ON ovwr_auth_i18n_translation(ovwr_namespace);
CREATE INDEX ovwr_idx_translation_status ON ovwr_auth_i18n_translation(ovwr_status);

-- Create version control table
CREATE TABLE ovwr_auth_i18n_version (
    ovwr_version_id VARCHAR(32) PRIMARY KEY,
    ovwr_version_number VARCHAR(16) NOT NULL,
    ovwr_namespace VARCHAR(64),
    ovwr_change_log TEXT,
    ovwr_translated_count INTEGER DEFAULT 0,
    ovwr_updated_count INTEGER DEFAULT 0,
    ovwr_published_by VARCHAR(32),
    ovwr_published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_rollback_to VARCHAR(32),
    ovwr_rollback_reason TEXT,
    ovwr_is_active INTEGER DEFAULT 1,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for version table
CREATE INDEX ovwr_idx_version_number ON ovwr_auth_i18n_version(ovwr_version_number);
CREATE INDEX ovwr_idx_version_is_active ON ovwr_auth_i18n_version(ovwr_is_active);

-- Create review queue table
CREATE TABLE ovwr_auth_i18n_review_queue (
    ovwr_queue_id VARCHAR(32) PRIMARY KEY,
    ovwr_translation_id VARCHAR(32) NOT NULL REFERENCES ovwr_auth_i18n_translation(ovwr_translation_id),
    ovwr_submitted_by VARCHAR(32) NOT NULL,
    ovwr_submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_priority VARCHAR(20) DEFAULT 'MEDIUM',
    ovwr_assigned_to VARCHAR(32),
    ovwr_reviewed_at TIMESTAMP WITH TIME ZONE,
    ovwr_review_decision VARCHAR(20),
    ovwr_reviewer_comment TEXT,
    ovwr_status VARCHAR(20) DEFAULT 'PENDING',
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for review queue
CREATE INDEX ovwr_idx_review_priority ON ovwr_auth_i18n_review_queue(ovwr_priority);
CREATE INDEX ovwr_idx_review_status ON ovwr_auth_i18n_review_queue(ovwr_status);

-- Create dictionary term table
CREATE TABLE ovwr_dict_term (
    ovwr_term_id VARCHAR(32) PRIMARY KEY,
    ovwr_term VARCHAR(128) NOT NULL,
    ovwr_definition TEXT NOT NULL,
    ovwr_category VARCHAR(20),
    ovwr_usage_example VARCHAR(256),
    ovwr_en_equivalent VARCHAR(128),
    ovwr_zh_equivalent VARCHAR(128) NOT NULL,
    ovwr_frequency_of_use INTEGER DEFAULT 0,
    ovwr_verified_by VARCHAR(32),
    ovwr_verified_at TIMESTAMP WITH TIME ZONE,
    ovwr_status VARCHAR(1) DEFAULT '1',
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for dictionary term
CREATE INDEX ovwr_idx_term_en_zh ON ovwr_dict_term(ovwr_term, ovwr_en_equivalent);
