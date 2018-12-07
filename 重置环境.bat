@echo off
taskkill /F /IM iexplore.exe /T
del /f /s /q "%LOCALAPPDATA%\Microsoft\Windows\Temporary Internet Files\*.*"
RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 2
RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 8
RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 16
RunDll32.exe InetCpl.cpl,ClearMyTracksByProcess 32
start iexplore.exe http://10.19.195.41/ngcrm/bsf/index.action
@echo on