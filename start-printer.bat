@echo off
REM Script para iniciar o servidor de impressão da AutoColor
REM Este arquivo deve ser colocado na pasta de inicialização do Windows para rodar automaticamente

REM Define o titulo da janela
title AutoColor - Servidor de Impressao

REM Muda para o diretório onde o projeto está instalado
REM IMPORTANTE: Altere o caminho abaixo para o local onde você instalou o projeto
cd /d "C:\Usuarios\[SEU_USUARIO]\AutoColor-System"

REM Inicia o servidor de impressão
echo.
echo ============================================
echo Iniciando Servidor de Impressao AutoColor...
echo ============================================
echo.

node print-server.cjs

REM Se o servidor parar por algum motivo, aguarda antes de fechar a janela
echo.
echo ============================================
echo Servidor parou. Janela sera fechada em 5 segundos...
echo ============================================
echo.
timeout /t 5 /nobreak
