@echo off
setlocal
color 0E

echo.
echo  =====================================================
echo    Sports Intelligence Platform  --  SHUTDOWN
echo  =====================================================
echo.

echo  Stopping all containers...
echo.
docker-compose -f "%~dp0docker-compose.yml" down
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo  [ERROR] docker-compose down failed. Check the output above.
    echo.
    pause
    exit /b 1
)

color 0A
echo.
echo  =====================================================
echo   Platform stopped. All containers have been shut down.
echo  =====================================================
echo.
endlocal
