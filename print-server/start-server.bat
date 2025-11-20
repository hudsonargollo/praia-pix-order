@echo off
REM Coco Loko Print Server - Windows Startup Script
REM This script starts the print server manually

echo.
echo ========================================
echo   Coco Loko Print Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    echo.
)

echo Starting print server...
echo.
echo The server will run at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the server
node server.js

pause
