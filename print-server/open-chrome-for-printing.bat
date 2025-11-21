@echo off
echo Starting Chrome with local network access enabled...
echo.
echo This allows the Cloudflare website to connect to your local print server.
echo.

start chrome.exe --disable-web-security --user-data-dir="%TEMP%\chrome-print-temp" --allow-insecure-localhost https://coco-loko-acaiteria.pages.dev

echo.
echo Chrome opened with print server access enabled.
echo Use this window for printing orders.
echo.
pause
