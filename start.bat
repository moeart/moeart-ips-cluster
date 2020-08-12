@echo off
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
echo "MoeART IPS Serveice is running in background ..."

:loop
node server.js 2>&1 > %~dp0\log\%dt%.log
goto loop