@echo off
REM Coco Loko Print Server - Windows Service Uninstaller

echo.
echo ========================================
echo   Coco Loko Print Server
echo   Windows Service Uninstaller
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

echo Uninstalling Windows service...
echo This may take a few moments...
echo.

REM Uninstall the service
node uninstall-service.js

echo.
echo ========================================
echo   Uninstallation Complete!
echo ========================================
echo.
echo The print server service has been removed.
echo It will no longer start automatically with Windows.
echo.
pause
