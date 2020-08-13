@echo off
cd /d "%~dp0"
:loop
node server.js
goto loop