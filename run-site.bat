@echo off
setlocal
cd /d "%~dp0"

if not exist "index.html" (
  echo Could not find index.html in:
  echo %~dp0
  pause
  exit /b 1
)

start "" "%~dp0index.html"
