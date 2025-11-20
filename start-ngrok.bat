@echo off
echo ========================================
echo   CSonic ngrok Starter
echo ========================================
echo.
echo IMPORTANT: Make sure CSonic server is running first!
echo (Run start-server.bat in another window)
echo.
echo.
echo Enter the full path to ngrok.exe
echo Example: C:\Users\Clyde Snyders\Downloads\ngrok.exe
echo.
set /p NGROK_PATH="Path to ngrok.exe: "
echo.
echo Starting ngrok tunnel...
echo.
echo COPY THE HTTPS URL FROM THE WINDOW BELOW!
echo It will look like: https://abc123.ngrok.io
echo.
echo Press any key to start ngrok...
pause >nul
"%NGROK_PATH%" http 3000
pause


