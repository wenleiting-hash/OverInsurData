# Fix Duplicate Roles Table - Pure SQL Execution Script
# Database: ai-saas-postgres-dev (端口 5432)

$dockerContainer = "ai-saas-postgres-dev"
$database = "ai_saas"
$user = "postgres"

Write-Host "⚡ Checking duplicate tables..." -ForegroundColor Cyan

# Check if ovwr.roles exists
$result1 = docker exec $dockerContainer psql -U $user -d $database -t -A -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'ovwr');"
if ($result1.Trim() -eq "t") {
    Write-Host "📍 ovwr.roles exists: TRUE" -ForegroundColor Yellow
    $ovwrExists = $true
} else {
    Write-Host "📍 ovwr.roles exists: FALSE" -ForegroundColor Gray
    $ovwrExists = $false
}

# Check auth.auth_role
$result2 = docker exec $dockerContainer psql -U $user -d $database -t -A -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auth_role' AND table_schema = 'auth');"
if ($result2.Trim() -eq "t") {
    Write-Host "📍 auth.auth_role exists: TRUE" -ForegroundColor Green
} else {
    Write-Host "📍 auth.auth_role exists: FALSE" -ForegroundColor Red
}

# Count rows in ovwr.roles (if exists)
if ($ovwrExists) {
    $count1 = docker exec $dockerContainer psql -U $user -d $database -t -A -c "SELECT COUNT(*) FROM ovwr.roles;"
    Write-Host "📊 ovwr.roles row count: $count1" -ForegroundColor Yellow
    
    # Drop tables
    Write-Host "`n⚠️  Dropping ovwr.roles and ovwr.permission_templates..." -ForegroundColor Yellow
    docker exec $dockerContainer psql -U $user -d $database -c "DROP TABLE IF EXISTS ovwr.roles CASCADE;" | Out-Null
    docker exec $dockerContainer psql -U $user -d $database -c "DROP TABLE IF EXISTS ovwr.permission_templates CASCADE;" | Out-Null
    Write-Host "✅ Successfully dropped duplicate tables" -ForegroundColor Green
} else {
    Write-Host "`nℹ️  ovwr.roles already does not exist, skipping drop" -ForegroundColor Gray
}

# Verify deletion
$result3 = docker exec $dockerContainer psql -U $user -d $database -t -A -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'ovwr');"
if ($result3.Trim() -eq "f") {
    Write-Host "`n🔍 Verification: ovwr.roles no longer exists" -ForegroundColor Green
} else {
    Write-Host "`n❌ Verification FAILED: ovwr.roles still exists!" -ForegroundColor Red
}

# Show active role tables
Write-Host "`n📋 Active role-related tables:" -ForegroundColor Cyan
docker exec $dockerContainer psql -U $user -d $database -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('auth', 'ovwr') AND tablename LIKE '%role%' ORDER BY schemaname, tablename;" | Out-Null

Write-Host "`n✅ Fix completed!" -ForegroundColor Green
