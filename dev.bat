@echo off
cd /d "%~dp0"
echo === Beauty App Dev Helper ===
echo.
if "%1"=="start" goto start
if "%1"=="kill" goto kill
if "%1"=="restart" goto restart
if "%1"=="check" goto check

echo Commands:
echo   dev start     Start Expo server
echo   dev kill      Kill node.exe
echo   dev restart   Kill + start
echo   dev check     Check if running
goto end

:start
echo Starting Expo...
start "Expo" cmd /k "npx expo start --clear"
echo QR code in new window
echo Scan with Expo Go on your phone
goto end

:kill
echo Killing node processes...
taskkill /f /im node.exe >nul 2>&1
echo Port 8081 is free
goto end

:restart
call :kill
timeout /t 3 /nobreak >nul
call :start
goto end

:check
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel%==0 (
    echo Server is running
) else (
    echo Server is NOT running
)
goto end

:end
echo.
