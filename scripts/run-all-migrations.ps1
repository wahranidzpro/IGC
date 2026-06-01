# Infinity Gym - Run all pending SQL migrations
param()

$ErrorActionPreference = "Stop"
$ProjectRef = "vakoyofojhsefkffjhox"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Infinity Gym - Execute pending migrations" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$MigrationsPath = Join-Path $PSScriptRoot "..\supabase\migrations"
$Files = @(
    "007_rfid_access.sql",
    "008_club_info.sql",
    "009_personnel.sql"
)

$AllSql = @()
foreach ($File in $Files) {
    $Path = Join-Path $MigrationsPath $File
    if (Test-Path $Path) {
        $Content = Get-Content $Path -Raw
        $AllSql += "-- ================================================"
        $AllSql += "-- MIGRATION: $File"
        $AllSql += "-- ================================================"
        $AllSql += ""
        $AllSql += $Content.Trim()
        $AllSql += "`r`n`r`n"
        Write-Host "  [OK] $File" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $File" -ForegroundColor Yellow
    }
}

$Combined = $AllSql -join "`r`n"
$Combined | Set-Clipboard
Write-Host ""
Write-Host "[OK] SQL copied to clipboard - 3 migrations" -ForegroundColor Green
Write-Host ""

$Url = "https://supabase.com/dashboard/project/$ProjectRef/sql/new"
Write-Host "Opening Supabase SQL Editor..." -ForegroundColor Yellow
Start-Process $Url

Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "  1. Supabase SQL Editor opens in browser" -ForegroundColor White
Write-Host "  2. Paste (Ctrl+V)" -ForegroundColor White
Write-Host "  3. Run (Ctrl+Enter)" -ForegroundColor White
Write-Host "  4. Check for errors" -ForegroundColor White
Write-Host ""
Write-Host "Migrations included:" -ForegroundColor Cyan
Write-Host "  007 - RFID Access Control" -ForegroundColor Gray
Write-Host "  008 - Club Info sync" -ForegroundColor Gray
Write-Host "  009 - Personnel management" -ForegroundColor Gray
Write-Host ""
Write-Host "After execution:" -ForegroundColor Green
Write-Host "  - RFID check API works" -ForegroundColor Green
Write-Host "  - Club settings cloud sync works" -ForegroundColor Green
Write-Host "  - Personnel module cloud sync works" -ForegroundColor Green
Write-Host "  - Realtime active for all 3 new tables" -ForegroundColor Green
Write-Host ""
