-- =====================================================
-- User Authentication Tables - OverInsur Data Platform
-- Date: 2026-09-07
-- Purpose: Support user registration, login, and JWT authentication
-- =====================================================

-- Table: ovwr_auth_user
-- Description: Core user master table storing all registered users
CREATE TABLE IF NOT EXISTS public.ovwr_auth_user (
    ovwr_user_id VARCHAR(32) PRIMARY KEY,
    ovwr_username VARCHAR(64) UNIQUE NOT NULL,
    ovwr_email VARCHAR(128) UNIQUE NOT NULL,
    ovwr_password_hash VARCHAR(255) NOT NULL,
    ovwr_first_name VARCHAR(64),
    ovwr_last_name VARCHAR(64),
    ovwr_phone VARCHAR(32),
    ovwr_avatar_url VARCHAR(255),
    ovwr_status VARCHAR(1) DEFAULT '1' CHECK (ovwr_status IN ('0', '1')), -- '0'=inactive, '1'=active
    ovwr_failed_login_attempts INTEGER DEFAULT 0,
    ovwr_locked_until TIMESTAMP WITH TIME ZONE,
    ovwr_email_verified BOOLEAN DEFAULT FALSE,
    ovwr_password_changed_at TIMESTAMP WITH TIME ZONE,
    ovwr_last_login_at TIMESTAMP WITH TIME ZONE,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_metadata JSONB
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ovwr_user_email ON public.ovwr_auth_user(ovwr_email);
CREATE INDEX IF NOT EXISTS idx_ovwr_user_status ON public.ovwr_auth_user(ovwr_status);
CREATE INDEX IF NOT EXISTS idx_ovwr_user_username ON public.ovwr_auth_user(ovwr_username);

-- Table: ovwr_auth_refresh_token
-- Description: Stores refresh tokens for JWT token rotation pattern
CREATE TABLE IF NOT EXISTS public.ovwr_auth_refresh_token (
    ovwr_refresh_token_id VARCHAR(32) PRIMARY KEY,
    ovwr_user_id VARCHAR(32) NOT NULL,
    ovwr_token_hash VARCHAR(255) NOT NULL,
    ovwr_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ovwr_issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_ip_address VARCHAR(45),
    ovwr_user_agent VARCHAR(255),
    ovwr_is_revoked BOOLEAN DEFAULT FALSE,
    ovwr_created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_refresh_user 
        FOREIGN KEY (ovwr_user_id) 
        REFERENCES ovwr_auth_user(ovwr_user_id) 
        ON DELETE CASCADE
);

-- Create indexes for refresh token lookup
CREATE INDEX IF NOT EXISTS idx_ovwr_rt_user ON public.ovwr_auth_refresh_token(ovwr_user_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_rt_hash ON public.ovwr_auth_refresh_token(ovwr_token_hash);
CREATE INDEX IF NOT EXISTS idx_ovwr_rt_expires ON public.ovwr_auth_refresh_token(ovwr_expires_at);

-- Function to update ovwr_updated_at timestamp
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ovwr_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_ovwr_user_updated_at ON public.ovwr_auth_user;
CREATE TRIGGER update_ovwr_user_updated_at
    BEFORE UPDATE ON public.ovwr_auth_user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ovwr_rt_updated_at ON public.ovwr_auth_refresh_token;
CREATE TRIGGER update_ovwr_rt_updated_at
    BEFORE UPDATE ON public.ovwr_auth_refresh_token
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data Insertion
-- =====================================================

-- Insert admin user (password: Admin@123456, hashed with bcrypt)
INSERT INTO public.ovwr_auth_user (
    ovwr_user_id, ovwr_username, ovwr_email, ovwr_password_hash,
    ovwr_first_name, ovwr_last_name, ovwr_status, ovwr_email_verified
) VALUES (
    'user-admin-001', 'admin', 'admin@overinsur.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt hash of "Admin@123456"
    'System', 'Administrator', '1', TRUE
) ON CONFLICT (ovwr_user_id) DO NOTHING;

-- Insert test user (password: TestUser@123, hashed with bcrypt)
INSERT INTO public.ovwr_auth_user (
    ovwr_user_id, ovwr_username, ovwr_email, ovwr_password_hash,
    ovwr_first_name, ovwr_last_name, ovwr_status, ovwr_email_verified
) VALUES (
    'user-test-001', 'testuser', 'test@overinsur.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyuIjZAgcfl7p92ldGxad68LJZdL17lhYz', -- bcrypt hash of "TestUser@123"
    'Test', 'User', '1', TRUE
) ON CONFLICT (ovwr_user_id) DO NOTHING;

-- =====================================================
-- Verify Creation
-- =====================================================
SELECT 'ovwr_auth_user created successfully' as status;
SELECT COUNT(*) as total_users FROM public.ovwr_auth_user;

SELECT 'ovwr_auth_refresh_token created successfully' as status;
SELECT COUNT(*) as total_tokens FROM public.ovwr_auth_refresh_token;
