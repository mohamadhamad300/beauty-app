@echo off
set JAVA_HOME=G:\javawin10\java17
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d G:\elixir\proj3_makup\beauty-app\android
echo Building APK...
call gradlew.bat assembleRelease
if %errorlevel% equ 0 (
    echo BUILD SUCCESS
) else (
    echo BUILD FAILED - check error logs
)
pause
