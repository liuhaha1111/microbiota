@echo off
setlocal
cd /d "%~dp0"

echo.
echo   ==================================================
echo     MicroFMT  multi-screen launcher
echo   ==================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-MicroFMT-MultiScreen.ps1" %*
set RC=%ERRORLEVEL%

echo.
echo   --------------------------------------------------
echo   Exit code: %RC%
echo.
echo   If this script opened a dev server window, keep
echo   that window running while you demo.
echo   --------------------------------------------------
echo.

pause
