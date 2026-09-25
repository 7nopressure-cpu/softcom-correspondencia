@echo off
title [3] Configurar Servicio de Windows - SoftCom Hospital Agramont
color 0E

echo ==============================================================================
echo        HOSPITAL AGRAMONT - REGISTRAR COMO SERVICIO DE WINDOWS
echo ==============================================================================
echo.
echo Este script configurara SoftCom para que se inicie automaticamente
echo al encender Windows Server, ejecutandose en segundo plano sin necesidad
echo de que un usuario inicie sesion en el escritorio.
echo.

cd /d "%~dp0"

echo [1/3] Instalando administrador de procesos PM2...
call npm.cmd install -g pm2 pm2-windows-service pm2-windows-startup --loglevel=error >nul 2>&1

echo [2/3] Registrando SoftCom Hospital Agramont en PM2...
call pm2 start ecosystem.config.js
call pm2 save

echo [3/3] Registrando servicio en Windows Server...
call pm2-startup install >nul 2>&1

echo.
echo ==============================================================================
echo  SoftCom Hospital Agramont registrado como SERVICIO DE WINDOWS con exito.
echo.
echo  Comandos de administracion desde la consola de Windows Server:
echo    - Ver estado: pm2 status
echo    - Ver logs:   pm2 logs
echo    - Reiniciar:  pm2 restart all
echo    - Detener:    pm2 stop all
echo ==============================================================================
echo.
pause
