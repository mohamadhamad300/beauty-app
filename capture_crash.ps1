# Capture crash log for Beauty App
$logFile = "$env:USERPROFILE\Desktop\crash_log.txt"
$adb = "G:\androidsdk\platform-tools\adb.exe"

Write-Host "Clearing old logs..."
& $adb logcat -c

Write-Host "Waiting for crash... reproduce the error on your phone now."
Write-Host "Log will be saved to: $logFile"
Write-Host ""

# Capture continuously until a crash is found
$found = $false
while (-not $found) {
    $line = & $adb logcat -v time -t 500 -s "AndroidRuntime:V" 2>$null | Select-String "helloworld|beautyapp|FATAL"
    if ($line) {
        $line | Out-File -FilePath $logFile -Encoding utf8
        # Get more context
        & $adb logcat -v time -d -s "AndroidRuntime:V" *:S 2>$null | Select-String "helloworld|beautyapp" -Context 20,10 | Out-File -FilePath $logFile -Encoding utf8 -Append
        Write-Host "Crash captured! Check: $logFile"
        $found = $true
    }
    Start-Sleep -Milliseconds 500
}
Read-Host "Press Enter to exit"
