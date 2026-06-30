@echo off
title Refreshing Database Data...
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0refresh-data.ps1"
start "" "database_data.md"
