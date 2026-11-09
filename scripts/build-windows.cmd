@echo off
setlocal
rem Windows build helper for Infiniti TV Home; avoids npm.ps1 execution-policy errors.
cd /d "%~dp0\.."
if not exist "app\appinfo.json" (
  echo ERROR: app\appinfo.json not found.
  exit /b 1
)
where node.exe >nul 2>&1
if errorlevel 1 (
  echo ERROR: Install Node.js 20 or later first.
  exit /b 1
)
where npx.cmd >nul 2>&1
if errorlevel 1 (
  echo ERROR: npx.cmd not found. Reinstall Node.js with npm.
  exit /b 1
)
echo [1/3] Checking webOS 3 compatibility...
node.exe scripts\check-webos3.js
if errorlevel 1 exit /b 1
if not exist build mkdir build
echo [2/3] Packaging with webOS CLI...
call npx.cmd --yes --package @webos-tools/cli ares-package app -o build
if errorlevel 1 exit /b 1
echo [3/3] Built IPK files:
dir /b build\com.infinitimoney.tvhome_*.ipk
if errorlevel 1 (
  echo ERROR: IPK not found after packaging.
  exit /b 1
)
echo Done. Do not remap Home until the app has been tested on your TV.
