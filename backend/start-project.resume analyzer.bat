@echo off
title AI Resume Analyzer

echo Starting Backend...
start "AI Resume Backend" cmd /k "cd /d C:\Users\Ansh Katiyar\ai-resume-analyzer\backend && call venv\Scripts\activate && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "AI Resume Frontend" cmd /k "cd /d C:\Users\Ansh Katiyar\ai-resume-analyzer && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo =====================================
echo   AI Resume Analyzer Started!
echo =====================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo.

start http://localhost:5173

pause