@echo off
chcp 65001 > nul
title PUBLICAR JOEKAT FINACE A GITHUB (NUBE 24/7)
echo ====================================================================
echo      PUBLICADOR AUTOMÁTICO DE JOEKAT FINACE A GITHUB
echo ====================================================================
echo.
echo 1. Verificando repositorio...
cd /d "c:\Users\PC\Desktop\joekat-finace"

echo 2. Configurando enlace remoto con GitHub...
"C:\Users\PC\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe" remote remove origin 2>nul
"C:\Users\PC\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe" remote add origin https://github.com/joelcolon2012-lang/joekat-finace.git
"C:\Users\PC\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe" branch -M main

echo 3. Subiendo código a GitHub (main)...
"C:\Users\PC\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo   ¡ÉXITO TOTAL! Código subido a GitHub correctamente.
    echo   Ahora abre Render.com y selecciona el repositorio "joekat-finace".
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo   AVISO: Si el repositorio "joekat-finace" no existe aún en GitHub:
    echo   1. Entra a https://github.com/new
    echo   2. Crea el repositorio con el nombre: joekat-finace (público)
    echo   3. Vuelve a hacer doble clic en este archivo PUBLICAR_A_GITHUB.bat
    echo ====================================================================
)
echo.
pause
