# start-all.ps1
# Starts all three servers for the OBE Platform integration flow.
# Run this script from the project root: .\start-all.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   OBE Platform - Starting All Servers" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# --- Server 1: AI Syllabus Generator (port 8001) ---
Write-Host "[1/3] Starting AI Syllabus Generator on http://localhost:8001 ..." -ForegroundColor Green
$syllabusDir = Join-Path $root "AI-Syllabus-Generator-main"
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$syllabusDir'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" `
  -WindowStyle Normal

# Wait a moment before starting the next
Start-Sleep -Seconds 2

# --- Server 2: Mapping Sequencer (port 8002) ---
Write-Host "[2/3] Starting Mapping Sequencer on http://localhost:8002 ..." -ForegroundColor Yellow
$mapperDir = Join-Path $root "MAPPING_SEQUENCER"
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$mapperDir'; python -m uvicorn api.main:app --host 0.0.0.0 --port 8002 --reload" `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# --- Server 3: Next.js OBE Platform (port 3000) ---
Write-Host "[3/3] Starting Next.js OBE Platform on http://localhost:3000 ..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "Set-Location '$root'; npm run dev" `
  -WindowStyle Normal

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   All servers launched!" -ForegroundColor Cyan
Write-Host "   AI Syllabus Generator : http://localhost:8001" -ForegroundColor Green
Write-Host "   Mapping Sequencer     : http://localhost:8002" -ForegroundColor Yellow
Write-Host "   OBE Platform (Next.js): http://localhost:3000" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
