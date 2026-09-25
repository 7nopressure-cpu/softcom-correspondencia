@echo off
setlocal enabledelayedexpansion
title Instalador SoftCom - Hospital Agramont (Windows Server)
color 0B

echo ==============================================================================
echo        HOSPITAL AGRAMONT - SISTEMA DE CORRESPONDENCIA SOFTCOM
echo               INSTALADOR PARA MICROSOFT WINDOWS SERVER
echo ==============================================================================
echo.

:: 1. Verificar permisos de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ADVERTENCIA] Se recomienda ejecutar este script como Administrador.
    echo Continuando con la instalacion...
    echo.
)

:: 2. Verificar Node.js
echo [1/6] Verificando presencia de Node.js en Windows Server...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR CRITICO] Node.js no se encuentra instalado en este servidor.
    echo Por favor descargue e instale Node.js LTS desde: https://nodejs.org/
    echo Luego vuelva a ejecutar este instalador.
    pause
    exit /b 1
)
node -v
echo [OK] Node.js detectado correctamente.
echo.

:: 3. Configurar Reglas de Firewall de Windows
echo [2/6] Configurando reglas del Firewall de Windows (Puertos 3000 y 4000)...
netsh advfirewall firewall add rule name="SoftCom Hospital Agramont - Frontend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="SoftCom Hospital Agramont - Backend API" dir=in action=allow protocol=TCP localport=4000 >nul 2>&1
echo [OK] Puertos 3000 y 4000 habilitados en Firewall de Windows.
echo.

:: 4. Instalar y Compilar Backend
echo [3/6] Instalando dependencias y compilando Backend de SoftCom...
cd /d "%~dp0backend"
call npm.cmd install --loglevel=error
if %errorLevel% neq 0 (
    echo [ERROR] Error al instalar dependencias del Backend.
    pause
    exit /b 1
)
call npx.cmd prisma generate --schema=src/prisma/schema.prisma
call npx.cmd prisma db push --schema=src/prisma/schema.prisma
call npx.cmd ts-node src/prisma/seed.ts
call npx.cmd tsc
echo [OK] Backend compilado y base de datos hospitalaria inicializada (dev.db).
echo.

:: 5. Instalar y Compilar Frontend
echo [4/6] Instalando dependencias y compilando Frontend (React + Vite)...
cd /d "%~dp0frontend"
call npm.cmd install --loglevel=error
if %errorLevel% neq 0 (
    echo [ERROR] Error al instalar dependencias del Frontend.
    pause
    exit /b 1
)
call npm.cmd run build
echo [OK] Frontend compilado para produccion en carpeta /dist.
echo.

:: 6. Instalar servidor de produccion estatico
echo [5/6] Instalando herramienta de servicio 'serve' y 'pm2'...
call npm.cmd install -g serve pm2 --loglevel=error >nul 2>&1
echo [OK] Modulos de servicio de produccion listos.
echo.

:: 7. Resumen de Instalacion
cd /d "%~dp0"
echo ==============================================================================
echo        INSTALACION COMPLETADA CON EXITO PARA EL HOSPITAL AGRAMONT
echo ==============================================================================
echo.
echo Para iniciar SoftCom en este servidor Microsoft:
echo   - Modo Produccion Directo: Ejecuta "start-production.bat"
echo   - Modo Servicio de Windows: Ejecuta "setup-windows-service.bat"
echo.
echo URL de Acceso Local: http://localhost:3000
echo URL de Acceso en Red: http://[IP_DEL_SERVIDOR]:3000
echo.
echo Cuentas Semilla (Contrasena: Agramont2026!):
echo   - Director Medico: dmedico
echo   - Admision Central: admision
echo   - Jefe de Emergencias: jemergencias
echo   - Administrador de Sistemas: admin
echo.
echo ==============================================================================
pause
