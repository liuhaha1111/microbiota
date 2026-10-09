@echo off
setlocal
cd /d "%~dp0"

echo.
echo   Closing all simulated screen windows ...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-MicroFMT-MultiScreen.ps1" -Stop
set RC=%ERRORLEVEL%

echo.
echo   Exit code: %RC%
echo.
pause
