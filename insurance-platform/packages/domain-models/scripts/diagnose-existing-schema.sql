-- =========================================
-- 诊断查询：分析现有数据库架构
-- =========================================

-- Step 1: List all existing schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
ORDER BY schema_name;

-- Step 2: List all tables in each schema
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name;

-- Step 3: Check if any overlap exists with our planned tables
-- (Run this after creating your own tables)
