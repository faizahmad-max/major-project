# NetShield AI - Unified Service Launcher
$env:PATH = "C:\Program Files\nodejs;C:\Users\conne\.local\bin;" + $env:PATH
$env:PYTHONPATH = "ml-service"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " NetShield AI — Real-Time IDS & Anomaly Detection System" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Python FastAPI ML Service
Write-Host "[1/2] Launching Python ML Engine on port 5001..." -ForegroundColor Yellow
$mlJob = Start-Process -FilePath "ml-service\.venv\Scripts\python.exe" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001" -PassThru

Start-Sleep -Seconds 2

# 2. Start Node.js Express Backend & UI Host
Write-Host "[2/2] Launching Node.js Backend & Dashboard on port 5000..." -ForegroundColor Yellow
$serverJob = Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "server\src\index.js" -PassThru

Write-Host ""
Write-Host ">> NetShield AI is LIVE!" -ForegroundColor Green
Write-Host ">> Open your browser at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ">> Press Ctrl+C in this console or close the windows to stop." -ForegroundColor Gray

# Wait on processes
$mlJob.WaitForExit()

