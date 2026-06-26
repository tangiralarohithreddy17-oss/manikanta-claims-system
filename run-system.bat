@echo off
title Manikanta Enterprises Claims System Launcher
echo ========================================================
echo   Starting Manikanta Enterprises Claims System Services
echo ========================================================
echo.

:: Start Express Backend
echo [1/2] Starting Express API Server...
start "Express Backend Server" /min cmd /c "cd backend && npm start"
ping 127.0.0.1 -n 3 > nul

:: Start Vite Frontend
echo [2/2] Starting React Vite Dev Server...
start "" "http://localhost:5173"
cd frontend && npm run dev
