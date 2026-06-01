# Infinity Gym - Migration 007 Runner
# Exécute la migration RFID sur Supabase

$ErrorActionPreference = "Stop"
$ProjectRef = "vakoyofojhsefkffjhox"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Infinity Gym - Migration 007 (RFID Access)  ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Copier le SQL dans le presse-papiers
$SqlPath = Join-Path $PSScriptRoot "..\supabase\migrations\007_rfid_access.sql"
$SqlContent = Get-Content $SqlPath -Raw
$SqlContent | Set-Clipboard
Write-Host "✅ SQL copié dans le presse-papiers !" -ForegroundColor Green
Write-Host ""

# 2. Ouvrir le SQL Editor Supabase
$Url = "https://supabase.com/dashboard/project/$ProjectRef/sql/new"
Write-Host "🌐 Ouverture du SQL Editor Supabase..." -ForegroundColor Yellow
Start-Process $Url

Write-Host ""
Write-Host "📋 Instructions :" -ForegroundColor Cyan
Write-Host "  1. La page Supabase SQL Editor s'ouvre dans votre navigateur" -ForegroundColor White
Write-Host "  2. Collez le SQL (Ctrl+V)" -ForegroundColor White
Write-Host "  3. Cliquez sur 'Run' ou Ctrl+Enter" -ForegroundColor White
Write-Host "  4. Vérifiez qu'il n'y a pas d'erreurs" -ForegroundColor White
Write-Host ""
Write-Host "📦 Ce que la migration ajoute :" -ForegroundColor Cyan
Write-Host "  - blocked_cards (table blacklist badges)" 
Write-Host "  - access_restrictions (limites horaires)" 
Write-Host "  - Colonnes rfid_uid/method/status sur access_logs" 
Write-Host "  - rfid_uid sur turnstile_members" 
Write-Host "  - Fonctions check_rfid_access / log_rfid_access" 
Write-Host "  - Indexes, RLS, Realtime activés" 
Write-Host ""
Write-Host "✅ Après exécution :" -ForegroundColor Green
Write-Host "  - API /api/rfid/check fonctionnelle" -ForegroundColor Green
Write-Host "  - RFID_API_KEY déjà ajoutée à .env.local" -ForegroundColor Green
Write-Host "  - ESP32 peut se connecter" -ForegroundColor Green
Write-Host ""
