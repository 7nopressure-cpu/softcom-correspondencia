@echo off
setlocal enabledelayedexpansion
title [1] Instalador SoftCom - SnowPoint Healthcare (Windows Server)
color 0B

echo ==============================================================================
echo        SNOWPOINT HEALTHCARE - CONSULTORA EN SALUD - SOFTCOM
echo               INSTALADOR PARA MICROSOFT WINDOWS SERVER
echo ==============================================================================
echo.

:: 1. Verificar Node.js
echo [Paso 1/4] Verificando Node.js en Windows Server...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Node.js no esta instalado en este servidor.
    echo Por favor descargue e instale Node.js LTS desde: https://nodejs.org/
    echo Luego vuelva a ejecutar este instalador.
    echo.
    pause
    exit /b 1
)
node -v
echo [OK] Node.js detectado.
echo.

:: 2. Habilitar Puertos en Firewall de Windows
echo [Paso 2/4] Habilitando puertos en Firewall de Windows (4000 y 3000)...
netsh advfirewall firewall add rule name="SoftCom SnowPoint Healthcare - Server" dir=in action=allow protocol=TCP localport=4000 >nul 2>&1
netsh advfirewall firewall add rule name="SoftCom SnowPoint Healthcare - Web" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
echo [OK] Puertos de red configurados.
echo.

:: 3. Instalar y Compilar Backend y Base de Datos
echo [Paso 3/4] Instalando dependencias y compilando Backend...
cd /d "%~dp0backend"
call npm.cmd install --loglevel=error
call npx.cmd prisma generate --schema=src/prisma/schema.prisma
call npx.cmd prisma db push --schema=src/prisma/schema.prisma
call npx.cmd ts-node src/prisma/seed.ts
call npx.cmd tsc
echo [OK] Backend compilado y base de datos de SnowPoint Healthcare inicializada (dev.db).
echo.

:: 4. Instalar y Compilar Frontend
echo [Paso 4/4] Compilando Frontend (React + Vite + Tailwind)...
cd /d "%~dp0frontend"
call npm.cmd install --loglevel=error
call npm.cmd run build
echo [OK] Frontend compilado con exito.
echo.

cd /d "%~dp0"
echo ==============================================================================
echo          INSTALACION COMPLETADA CON EXITO - SNOWPOINT HEALTHCARE
echo ==============================================================================
echo.
echo Siguientes pasos:
echo   1. Para iniciar el servidor: Haz doble clic en "2-INICIAR-SOFTCOM.bat"
echo   2. Para servicio automatico: Haz clic derecho en "3-CONFIGURAR-SERVICIO-WINDOWS.bat"
echo.
echo URL de acceso: http://localhost:4000 (o la IP de este servidor: http://[IP]:4000)
echo.
echo Credenciales de administrador (Contrasena: SnowPoint2026!):
echo   - Usuario: admin
echo   - Rol:     Administrador General
echo ==============================================================================
echo.
pause
