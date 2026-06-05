@echo off
echo Capturing crash log for Beauty App...
echo.
echo Step 1: Reproduce the crash on your phone now (open app, press Grant Permission)
echo Step 2: Press any key after the crash happens
pause >nul
echo.
echo Getting logs...
G:\androidsdk\platform-tools\adb.exe logcat -b crash -v time -d > "%USERPROFILE%\Desktop\crash_log.txt"
G:\androidsdk\platform-tools\adb.exe logcat -v time -d -s AndroidRuntime:V *:S >> "%USERPROFILE%\Desktop\crash_log.txt"
echo.
echo Done! Check Desktop\crash_log.txt
pause
