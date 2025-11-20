@echo off
REM Coco Loko Print Server - Windows Service Installer
REM This script installs the print server as a Windows service

echo.
echo ========================================
echo   Coco Loko Print Server
echo   Windows Service Installer
echo ========================================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: This script requires administrator privileges!
    echo.
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Running with administrator privileges...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo Then run this script again.
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
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo Installing Windows service...
echo This may take a few moments...
echo.

REM Install the service
node install-service.js

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo The print server is now installed as a Windows service.
echo It will start automatically when Windows starts.
echo.
echo To manage the service:
echo   1. Press Win+R
echo   2. Type: services.msc
echo   3. Find "Coco Loko Print Server"
echo   4. Right-click to Stop, Start, or Restart
echo.
echo To uninstall the service:
echo   Run: uninstall-windows-service.bat
echo.
pause
