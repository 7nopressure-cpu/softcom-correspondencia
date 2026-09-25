@echo off
title Configurar Servicio de Windows - SoftCom Hospital Agramont
color 0E

echo ==============================================================================
echo        HOSPITAL AGRAMONT - CONFIGURAR SOFTCOM COMO SERVICIO DE WINDOWS
echo ==============================================================================
echo.
echo Este script configurara SoftCom para que se inicie automaticamente
echo al encender Windows Server, ejecutandose en segundo plano sin necesidad
echo de que un usuario inicie sesion.
echo.

cd /d "%~dp0"

echo [1/3] Verificando PM2...
call npm.cmd install -g pm2 pm2-windows-service pm2-windows-startup --loglevel=error >nul 2>&1

echo [2/3] Registrando aplicaciones de SoftCom en PM2...
call pm2 start ecosystem.config.js
call pm2 save

echo [3/3] Registrando inicio automatico en Windows Server...
call pm2-startup install >nul 2>&1

echo.
echo ==============================================================================
echo  SoftCom Hospital Agramont ha sido registrado como SERVICIO DE WINDOWS.
echo.
echo  Comandos de administracion:
echo    - Ver estado: pm2 status
echo    - Ver logs:   pm2 logs
echo    - Reiniciar:  pm2 restart all
echo    - Detener:    pm2 stop all
echo ==============================================================================
echo.
pause
