@echo off
setlocal

rem ---------------------------------------------------------------------------
rem  Forwards to the LIGHT build's launcher in -Stop mode, so it closes the
rem  windows that the (forwarded) start script opened. See Start-MultiScreen.bat
rem  for why this dark checkout forwards instead of launching its own build.
rem ---------------------------------------------------------------------------

if "%MICROFMT_LIGHT_DIR%"=="" set "MICROFMT_LIGHT_DIR=D:\vscode_code\microbiota-light"
set "LIGHT_PS1=%MICROFMT_LIGHT_DIR%\tools\multiscreen\Start-MicroFMT-MultiScreen.ps1"

if not exist "%LIGHT_PS1%" (
  echo.
  echo   [x] Light build launcher not found:
  echo       %LIGHT_PS1%
  echo.
  echo   Set MICROFMT_LIGHT_DIR to the light checkout and run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Closing all simulated screen windows ...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%LIGHT_PS1%" -Stop
set RC=%ERRORLEVEL%

echo.
echo   Exit code: %RC%
echo.
pause
