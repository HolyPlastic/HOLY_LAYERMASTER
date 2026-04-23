@echo off
REM Portable launcher for Claude with Terminal Beacon + plugin system
REM Points to the beacon which auto-discovers plugins from sibling folders
REM Can be copied to any repo root — only the BEACON_DIR path matters

REM Derive the project name from this .bat file's parent folder
set "_SELFDIR=%~dp0"
set "_SELFDIR=%_SELFDIR:~0,-1%"
for %%I in ("%_SELFDIR%") do set CLAUDE_PROJECT_NAME=%%~nxI

set BEACON_DIR=C:\Users\Ben\NEXUS\_GRID\PLUGINS\AGENT ARMOURY\CLAUDE CLI\CLI_Terminal Beacon
start powershell.exe -NoExit -ExecutionPolicy Bypass -File "%BEACON_DIR%\Launch-Claude.ps1"
