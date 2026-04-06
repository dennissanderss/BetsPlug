@echo off
echo Opening Sports Intelligence Platform...
echo.
echo Checking if platform is running...
docker ps 2>nul | findstr "sportbetting-frontend" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Platform is not running. Starting it first...
    call "%~dp0start.bat"
) else (
    echo Platform is already running!
)
echo.
echo Opening http://localhost:3000 ...
explorer "http://localhost:3000"
echo.
echo Done! If the browser didn't open, manually go to:
echo   http://localhost:3000
echo.
pause
