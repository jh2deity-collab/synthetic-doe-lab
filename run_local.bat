@echo off
echo Starting Synthetic DOE Lab...
echo.

REM 1. Start Backend (allow external access with 0.0.0.0)
echo [1/2] Starting Backend Server (Port 8000)...
start "Synthetic DOE Lab - Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM 2. Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM 3. Start Frontend
echo [2/2] Starting Frontend Server (Port 3000)...
start "Synthetic DOE Lab - Frontend" cmd /k "cd frontend && npm run dev -- -H 0.0.0.0"

echo.
echo ========================================================
echo  Serve is initializing...
echo.
echo  - Local Access:  http://localhost:3000
echo  - Remote Access: http://<YOUR_IP_ADDRESS>:3000
echo.
echo  *Backend is listening on 0.0.0.0:8000 (External Access OK)*
echo ========================================================
pause
