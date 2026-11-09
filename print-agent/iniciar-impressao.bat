@echo off
setlocal
cd /d "%~dp0"
start "" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0impressao-automatica.ps1"
exit /b 0
