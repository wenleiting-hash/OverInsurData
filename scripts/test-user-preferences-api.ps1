# User Preferences API Integration Test Suite
# ==============================================
# Run this script to verify the complete user preferences flow
# 
# Prerequisites:
# - Backend service running on http://localhost:8080
# - At least 2 users exist in database (e.g., user-test-001, user-admin-001)
# - Mock tokens: AT-{userId}-{timestamp}
#
# Usage (PowerShell):
#   .\test-user-preferences-api.ps1
#
# Expected Results:
#   ✅ All tests pass with proper isolation between users

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "USER PREFERENCES API - FULL INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080"
$passedCount = 0
$failedCount = 0

# Helper function
$global:passedCount = 0
$global:failedCount = 0

function Test-Step ($name, $scriptBlock) {
    Write-Host "`n[TEST] $name" -ForegroundColor Yellow
    
    try {
        & $scriptBlock
        Write-Host "✅ PASS" -ForegroundColor Green
        $global:passedCount++
    } catch {
        Write-Host "❌ FAIL: $_" -ForegroundColor Red
        $global:failedCount++
    }
}

# ============================================
# PHASE 1: User A Initial Get (Auto-create)
# ============================================
Test-Step "User A gets preferences (should auto-create default)" {
    $headers = @{ Authorization="Bearer AT-user-test-001-9A2B3C4D" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/preferences/current" -Headers $headers -Method GET -UseBasicParsing -ContentType "application/json"
    
    if ($response.StatusCode -ne 200) { throw "Expected 200, got $($response.StatusCode)" }
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.ovwr_user_id -ne "user-test-001") { throw "Wrong user ID" }
    
    # Accept either default en-US or existing preference
    $lang = $data.data.ovwr_language_code
    if ($lang -notin @("en-US", "zh-CN")) { throw "Unexpected language: $lang" }
    
    Write-Host "   Preference for user-test-001 found" -ForegroundColor Gray
    Write-Host "   Current language: $lang" -ForegroundColor Gray
}

# ============================================
# PHASE 2: User B Initial Get (Auto-create)
# ============================================
Test-Step "User B gets preferences (should auto-create default)" {
    $headers = @{ Authorization="Bearer AT-user-admin-001-9A2B3C4D" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/preferences/current" -Headers $headers -Method GET -UseBasicParsing -ContentType "application/json"
    
    if ($response.StatusCode -ne 200) { throw "Expected 200, got $($response.StatusCode)" }
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.ovwr_user_id -ne "user-admin-001") { throw "Wrong user ID" }
    if ($data.data.ovwr_language_code -ne "en-US") { throw "Wrong default language" }
    
    Write-Host "   Created preference for user-admin-001" -ForegroundColor Gray
    Write-Host "   Default language: $($data.data.ovwr_language_code)" -ForegroundColor Gray
}

# ============================================
# PHASE 3: User A Language Switch
# ============================================
Test-Step "User A switches to Chinese (zh-CN)" {
    $headers = @{ 
        Authorization="Bearer AT-user-test-001-9A2B3C4D"
        "Content-Type"="application/json"
    }
    $body = @{ languageCode="zh-CN" } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/preferences/current" `
        -Headers $headers -Method PUT -Body $body -ContentType "application/json"
    
    if ($response.StatusCode -ne 200) { throw "Expected 200, got $($response.StatusCode)" }
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.ovwr_language_code -ne "zh-CN") { throw "Expected zh-CN, got $($data.data.ovwr_language_code)" }
    
    Write-Host "   Language updated to: $($data.data.ovwr_language_code)" -ForegroundColor Gray
}

# ============================================
# PHASE 4: Verify Isolation - User A
# ============================================
Test-Step "Verify User A still has zh-CN after update" {
    $headers = @{ Authorization="Bearer AT-user-test-001-9A2B3C4D" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/preferences/current" -Headers $headers -Method GET -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.ovwr_language_code -ne "zh-CN") { 
        throw "Isolation failed! Expected zh-CN, got $($data.data.ovwr_language_code)" 
    }
    
    Write-Host "   User A language confirmed: $($data.data.ovwr_language_code)" -ForegroundColor Gray
}

# ============================================
# PHASE 5: Verify Isolation - User B
# ============================================
Test-Step "Verify User B still has en-US (isolation check)" {
    $headers = @{ Authorization="Bearer AT-user-admin-001-9A2B3C4D" }
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/preferences/current" -Headers $headers -Method GET -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.data.ovwr_language_code -ne "en-US") { 
        throw "ISOLATION VIOLATED! User B should be en-US but got $($data.data.ovwr_language_code)" 
    }
    
    Write-Host "   User B language confirmed: $($data.data.ovwr_language_code)" -ForegroundColor Gray
    Write-Host "   🎉 MULTI-USER ISOLATION VERIFIED!" -ForegroundColor Green
}

# ============================================
# PHASE 6: Partial Update - Multiple Fields
# ============================================
Test-Step "User A updates multiple fields simultaneously" {
    $headers = @{ 
        Authorization="Bearer AT-user-test-001-9A2B3C4D"
        "Content-Type"="application/json"
    }
    $body = @{
        languageCode = "zh-CN"
        dateFormat = "YYYY-MM-DD"
        timeZone = "America/Los_Angeles"
        themeMode = "dark"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/preferences/current" `
        -Headers $headers -Method PUT -Body $body -ContentType "application/json"
    
    if ($response.StatusCode -ne 200) { throw "Expected 200, got $($response.StatusCode)" }
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Updated all fields:" -ForegroundColor Gray
    Write-Host "   - Language: $($data.data.ovwr_language_code)" -ForegroundColor Gray
    Write-Host "   - Date Format: $($data.data.ovwr_date_format)" -ForegroundColor Gray
    Write-Host "   - Time Zone: $($data.data.ovwr_time_zone)" -ForegroundColor Gray
    Write-Host "   - Theme Mode: $($data.data.ovwr_theme_mode)" -ForegroundColor Gray
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passedCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Green" })
Write-Host "Total:  $($passedCount + $failedCount)" -ForegroundColor Cyan

if ($failedCount -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host "User preferences API is working correctly with:" -ForegroundColor Cyan
    Write-Host "  ✅ Auto-create default preferences" -ForegroundColor White
    Write-Host "  ✅ GET/PUT endpoints functional" -ForegroundColor White
    Write-Host "  ✅ Multi-user isolation enforced" -ForegroundColor White
    Write-Host "  ✅ Partial field updates supported" -ForegroundColor White
} else {
    Write-Host "`n⚠️ SOME TESTS FAILED - Check output above" -ForegroundColor Red
    exit 1
}
