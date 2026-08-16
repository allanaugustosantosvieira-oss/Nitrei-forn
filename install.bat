@echo off
echo Instalando dependencias do bot...
npm install
if %errorlevel% equ 0 (
    echo Dependencias instaladas com sucesso!
) else (
    echo Erro ao instalar dependencias.
)
pause
