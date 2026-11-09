@echo off
setlocal
cd /d "%~dp0"
set "DATA_DIR=%ProgramData%\BomJardimPrint"
set "ACL_MARKER=%DATA_DIR%\urlacl-installed.txt"

rem Garante permissao administrativa para reiniciar somente o agente da porta 17891.
net session >nul 2>&1
if errorlevel 1 (
  echo Solicitando permissao de administrador...
  powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b 0
)

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

rem Encerra somente o processo que estiver escutando na porta exclusiva do agente local.
echo Verificando agente anterior...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 17891 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop; Start-Sleep -Seconds 2 }"
if errorlevel 1 (
  echo ERRO: nao foi possivel reiniciar o agente da impressora.
  echo Nenhuma configuracao da impressao manual foi alterada.
  pause
  exit /b 1
)

if not exist "%ACL_MARKER%" (
  netsh http add urlacl url=http://127.0.0.1:17891/ user=%USERDOMAIN%\%USERNAME%
  if errorlevel 1 (
    echo ERRO: nao foi possivel configurar a permissao local da impressora.
    pause
    exit /b 1
  )
  echo installed>"%ACL_MARKER%"
)

echo.
echo Iniciando agente automatico da Elgin i8...
echo Esta janela deve permanecer aberta enquanto a impressao automatica estiver ativa.
echo Se houver erro, deixe a mensagem visivel e envie uma foto.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0impressao-automatica.ps1"
echo.
echo O agente automatico foi encerrado.
pause
