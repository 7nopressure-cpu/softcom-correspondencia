@echo off
title SoftCom Local Starter
echo =======================================================
echo     INICIANDO SISTEMA DE CORRESPONDENCIA SOFTCOM
echo =======================================================
echo Base de Datos: SQLite (dev.db autogenerada)
echo.
echo Iniciando API Backend en puerto 4000...
start cmd /k "cd backend && echo === LOGS BACKEND === && npm run dev"
echo.
echo Iniciando Frontend React en puerto 3000...
start cmd /k "cd frontend && echo === LOGS FRONTEND === && npm run dev"
echo.
echo =======================================================
echo Servidores en ejecucion:
echo - Frontend Web App: http://localhost:3000
echo - Backend API REST: http://localhost:4000
echo =======================================================
echo.
pause
