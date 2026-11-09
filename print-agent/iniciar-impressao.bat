@echo off
setlocal
cd /d "%~dp0"
set "DATA_DIR=%ProgramData%\BomJardimPrint"
set "ACL_MARKER=%DATA_DIR%\urlacl-installed.txt"

rem Se o agente ja estiver ativo, nao abre outra instancia.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 17891 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 exit /b 0

if not exist "%ACL_MARKER%" (
  net session >nul 2>&1
  if errorlevel 1 (
    powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b 0
  )
  if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
  netsh http add urlacl url=http://127.0.0.1:17891/ user=%USERDOMAIN%\%USERNAME% >nul 2>&1
  echo installed>"%ACL_MARKER%"
)

rem Inicia uma unica instancia do agente local de impressao.
start "" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0impressao-automatica.ps1"
exit /b 0
