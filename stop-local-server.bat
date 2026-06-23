@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo [MoRanJiangHu] Local dev server stopper
echo Repository: %CD%
echo.

if "%MORAN_DRY_RUN%"=="1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\local-dev-server-stop.ps1" -DryRun
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\local-dev-server-stop.ps1"
)

set "EXIT_CODE=%ERRORLEVEL%"
echo.

if not "%MORAN_DRY_RUN%"=="1" pause
exit /b %EXIT_CODE%
