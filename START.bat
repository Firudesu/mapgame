@echo off
echo ========================================
echo   WebGL Sandbox Multiplayer Game
echo ========================================
echo.
echo Starting game server...
echo.

REM Check if Node.js is available
where node >nul 2>&1
if %errorlevel% == 0 (
    echo Opening game in browser...
    timeout /t 2 /nobreak >nul
    start http://localhost:8000/play.html
    echo.
    echo Server running at http://localhost:8000
    echo Press Ctrl+C to stop
    echo.
    node simple-server.js
) else (
    echo ERROR: Node.js not found!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
)

