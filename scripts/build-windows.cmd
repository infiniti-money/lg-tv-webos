@echo off
setlocal EnableExtensions EnableDelayedExpansion
rem Infiniti TV Home 1.5.x for webOS 3.4.0. Produces stable IPK + SHA-256.
rem Use Windows CMD (avoids npm.ps1 execution-policy errors).
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
echo [1/4] Checking Chromium 38 / Node 0.12 compatibility...
node.exe scripts\check-webos3.js
node.exe scripts\check-branding.js
if errorlevel 1 exit /b 1
if errorlevel 1 exit /b 1
echo [2/4] Running offline tests...
for %%F in (scripts\test-homewatch.js scripts\test-keymap.js scripts\test-lunar.js scripts\test-forecast.js scripts\test-customize.js scripts\test-app-structure.js scripts\test-settings-ui.js scripts\test-tv-layout.js) do (
  node.exe "%%F"
  if errorlevel 1 exit /b 1
)
node.exe scripts\test-ai-worker.mjs
if errorlevel 1 exit /b 1
node.exe scripts\test-assistant.js
if errorlevel 1 exit /b 1
if not exist build mkdir build
rem Remove stale versioned packages so the output never silently reuses an older IPK.
del /q "build\com.infinitimoney.tvhome_*.ipk" >nul 2>&1
del /q "build\infiniti-tv-home.ipk" >nul 2>&1
echo [3/4] Packaging .ipk with LG webOS CLI without minification...
call npx.cmd --yes --package @webos-tools/cli@3.2.6 ares-package --no-minify app -o build
if errorlevel 1 exit /b 1
set "IPK="
for %%F in (build\com.infinitimoney.tvhome_*.ipk) do (
  if exist "%%~fF" set "IPK=%%~fF"
)
if not defined IPK (
  echo ERROR: Packaged IPK not found in build folder.
  exit /b 1
)
copy /y "!IPK!" "build\infiniti-tv-home.ipk" >nul
if errorlevel 1 exit /b 1
echo [4/4] Creating SHA-256 integrity file...
powershell.exe -NoProfile -NonInteractive -Command "$h=(Get-FileHash -Algorithm SHA256 'build\infiniti-tv-home.ipk').Hash.ToLower(); [IO.File]::WriteAllText('build\infiniti-tv-home.ipk.sha256', $h+'  infiniti-tv-home.ipk'+[Environment]::NewLine,[Text.Encoding]::ASCII)"
if errorlevel 1 (
  echo ERROR: Failed to generate SHA-256 file.
  exit /b 1
)
echo.
echo Output: build\infiniti-tv-home.ipk
echo         build\infiniti-tv-home.ipk.sha256
echo The rooted Home key is NOT modified by packaging.
echo Test on TV before using Home replacement.
exit /b 0
