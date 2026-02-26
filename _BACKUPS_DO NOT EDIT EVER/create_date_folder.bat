@echo off
setlocal enabledelayedexpansion

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format dd-MM"') do set base=%%i

set "base=%base% "
set "foldername=%base%"

set count=1
:check
if exist "%foldername%" (
    set "foldername=%base%(%count%)"
    set /a count+=1
    goto check
)

mkdir "%foldername%"
