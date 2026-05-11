@echo off
REM ============================================
REM Script para iniciar o servidor de impressão da AutoColor
REM Com reinicialização automática se cair
REM ============================================

REM Define o titulo da janela
title AutoColor - Servidor de Impressao (Rodando...)

REM Muda para o diretório onde ESTE .bat está (portátil para qualquer máquina)
cd /d "%~dp0"

REM Garante que o servidor existe na mesma pasta do .bat
if not exist "print-server.cjs" (
    echo.
    echo ============================================
    echo ERRO: Arquivo print-server.cjs nao encontrado!
    echo Coloque este .bat na pasta raiz do projeto.
    echo ============================================
    echo.
    pause
    exit /b 1
)

REM Verifica se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo ERRO: Node.js nao encontrado!
    echo ============================================
    echo Instale o Node.js em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Loop infinito para manter o servidor rodando
:loop
echo.
echo ============================================
echo Iniciando Servidor de Impressao AutoColor...
echo Data/Hora: %date% %time%
echo ============================================
echo.

REM Inicia o servidor de impressão
node print-server.cjs

REM Se chegou aqui, o servidor caiu
echo.
echo ============================================
echo ! SERVIDOR PAROU INESPERADAMENTE !
echo Reiniciando em 10 segundos...
echo ============================================
echo.

REM Aguarda 10 segundos antes de reiniciar
timeout /t 10 /nobreak

REM Volta ao loop para reiniciar
goto loop
