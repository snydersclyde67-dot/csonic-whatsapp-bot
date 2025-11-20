@echo off
echo ========================================
echo   CSonic Server Starter
echo ========================================
echo.
cd /d "%~dp0"
echo Starting CSonic server on port 3000...
echo.
echo Keep this window open!
echo.
echo Dashboard will be available at:
echo http://localhost:3000/dashboard
echo.
npm start
pause


