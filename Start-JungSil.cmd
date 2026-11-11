@echo off
cd /d "%~dp0"
if not exist ".next\BUILD_ID" (
  echo No production build. Run npm.cmd run build first.
  pause
  exit /b 1
)
echo Open http://localhost:3000 and keep this window open.
call npm.cmd start
pause
