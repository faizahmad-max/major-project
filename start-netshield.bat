@echo off
title NetShield AI - Full Stack Launcher
echo ========================================================
echo  NetShield AI - Real-Time IDS ^& Anomaly Detection System
echo ========================================================
echo.

set PATH=C:\Program Files\nodejs;C:\Users\conne\.local\bin;%PATH%
set PYTHONPATH=ml-service

echo [1/3] Starting Python ML Engine on port 5001...
start "NetShield AI - Python ML Engine" cmd /k "cd ml-service && .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 5001"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Node.js Backend on port 5000...
start "NetShield AI - Node Backend" cmd /k "cd server && "C:\Program Files\nodejs\node.exe" src/index.js"

timeout /t 1 /nobreak >nul

echo [3/3] Starting React Vite Dashboard on port 5173...
start "NetShield AI - Vite Dashboard" cmd /k "cd client && "C:\Program Files\nodejs\npm.cmd" run dev"

echo.
echo ========================================================
echo  NetShield AI is running!
echo  Open your browser at: http://localhost:5173
echo ========================================================
echo.
pause

