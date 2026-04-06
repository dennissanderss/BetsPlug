@echo off
setlocal EnableDelayedExpansion
color 0A

echo.
echo  =====================================================
echo    ____                 _        _____       _
echo   / __/__  ___  _____  (_)___   /  _/___    / /____ ___
echo  _\ \/ _ \/ _ \/ __/ / / __/  _/ // _ \   / __/ -_) _ \
echo /___/ .__/\___/_/   /_/_/    /___/_//_/  _\__/\__/_//_/
echo     /_/
echo.
echo    S P O R T S   I N T E L L I G E N C E   P L A T F O R M
echo  =====================================================
echo.

:: -------------------------------------------------------
:: 1. Check Docker is running
:: -------------------------------------------------------
echo [1/7] Checking Docker status...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Docker is not running or not installed.
    echo          Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)
echo        Docker is running. OK
echo.

:: -------------------------------------------------------
:: 2. Copy .env.example to .env if .env does not exist
:: -------------------------------------------------------
echo [2/7] Checking environment configuration...
if not exist "%~dp0.env" (
    if exist "%~dp0.env.example" (
        copy "%~dp0.env.example" "%~dp0.env" >nul
        echo        .env created from .env.example
    ) else (
        color 0E
        echo        WARNING: .env.example not found.
        color 0A
    )
) else (
    echo        .env already exists. OK
)
echo.

:: -------------------------------------------------------
:: 3. Build and start all containers
:: -------------------------------------------------------
echo [3/7] Building and starting containers (first time takes a few minutes)...
echo.
docker-compose -f "%~dp0docker-compose.yml" up --build -d
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo  [ERROR] docker-compose up failed. Check the output above.
    echo.
    pause
    exit /b 1
)
echo.
echo        Containers started.
echo.

:: -------------------------------------------------------
:: 4. Wait for database to be healthy
:: -------------------------------------------------------
echo [4/7] Waiting for database...
set MAX_WAIT=90
set WAITED=0

:WAIT_DB
docker-compose -f "%~dp0docker-compose.yml" ps db 2>nul | findstr /i "healthy" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo        Database is healthy. OK
    goto DB_READY
)
if %WAITED% geq %MAX_WAIT% (
    color 0C
    echo  [ERROR] Database did not start within %MAX_WAIT%s.
    pause
    exit /b 1
)
set /a WAITED+=5
echo        Waiting... (%WAITED%s / %MAX_WAIT%s)
timeout /t 5 /nobreak >nul
goto WAIT_DB

:DB_READY
echo.

:: -------------------------------------------------------
:: 5. Run database migrations
:: -------------------------------------------------------
echo [5/7] Running database migrations...
docker-compose -f "%~dp0docker-compose.yml" exec -T backend alembic upgrade head
if %ERRORLEVEL% neq 0 (
    echo        First run - generating initial migration...
    docker-compose -f "%~dp0docker-compose.yml" exec -T backend alembic revision --autogenerate -m "initial schema"
    docker-compose -f "%~dp0docker-compose.yml" exec -T backend alembic upgrade head
)
echo        Migrations complete. OK
echo.

:: -------------------------------------------------------
:: 6. Seed database
:: -------------------------------------------------------
echo [6/7] Seeding database with sports data...
docker-compose -f "%~dp0docker-compose.yml" exec -T backend python -m seed.seed_data
if %ERRORLEVEL% neq 0 (
    color 0E
    echo        WARNING: Seed had issues (data may already exist). Continuing...
    color 0A
) else (
    echo        Seed complete. OK
)
echo.

:: -------------------------------------------------------
:: 7. Open browser
:: -------------------------------------------------------
echo [7/7] Platform is ready!
echo.
color 0B
echo  =====================================================
echo.
echo   Frontend    :  http://localhost:3000
echo   API Docs    :  http://localhost:8000/docs
echo.
echo   Login       :  admin@sip.local / admin123
echo.
echo  =====================================================
echo.
color 0A

echo  Opening browser...
start "" "http://localhost:3000"

echo.
echo  To stop:  stop.bat
echo  Logs:     docker-compose logs -f
echo.
pause
endlocal
