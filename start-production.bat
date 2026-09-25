@echo off
title SoftCom Hospital Agramont - Servidor de Produccion
color 0A

echo ==============================================================================
echo        HOSPITAL AGRAMONT - INICIANDO SOFTCOM EN MODO PRODUCCION
echo ==============================================================================
echo.
echo Iniciando Backend API en puerto 4000...
start "SoftCom - Backend API (Puerto 4000)" cmd /k "cd /d %~dp0backend && node dist/server.js"

echo Iniciando Frontend Web en puerto 3000...
start "SoftCom - Frontend Web (Puerto 3000)" cmd /k "cd /d %~dp0frontend && npx.cmd serve -s dist -l 3000"

echo.
echo ==============================================================================
echo  SoftCom Hospital Agramont esta en linea.
echo.
echo  Acceso Web: http://localhost:3000
echo  Acceso API: http://localhost:4000/api
echo ==============================================================================
echo.
timeout /t 3 >nul
start http://localhost:3000
