@echo off
title SoftCom - SnowPoint Healthcare (Servidor de Produccion)
color 0A

echo ==============================================================================
echo        SNOWPOINT HEALTHCARE - CONSULTORA EN SALUD - SOFTCOM
echo                      SERVIDOR EN PRODUCCION
echo ==============================================================================
echo.
echo Iniciando servidor de SoftCom en el puerto 4000...
echo.

cd /d "%~dp0backend"
start http://localhost:4000
node dist/server.js
