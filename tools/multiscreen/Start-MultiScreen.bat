@echo off
setlocal

rem ---------------------------------------------------------------------------
rem  This checkout (microbiota) is the DARK build.
rem
rem  The platform is now run from the LIGHT build, which lives in a sibling
rem  checkout and is pushed to this same repository as the "light" branch.
rem  Rather than keeping two launchers in sync, this wrapper forwards to the
rem  light checkout's launcher, so clicking either .bat opens the light build.
rem
rem  Override the light checkout location with:
rem      set MICROFMT_LIGHT_DIR=D:\path\to\microbiota-light
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
echo   ==================================================
echo     MicroFMT  multi-screen launcher
echo     forwarding to the LIGHT build
echo   ==================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%LIGHT_PS1%" %*
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
