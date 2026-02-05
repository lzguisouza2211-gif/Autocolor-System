# 🚀 Configurar Inicialização Automática no Windows

O arquivo `start-printer.bat` agora **reinicia automaticamente** se o servidor cair. Siga os passos abaixo para que ele inicie automaticamente ao ligar o Windows.

---

## 📋 Pré-requisitos

1. ✅ Node.js instalado (`node --version`)
2. ✅ Dependências instaladas (`npm install node-thermal-printer`)
3. ✅ Editar o arquivo `start-printer.bat` com o caminho correto

---

## 🔧 Passo 1: Editar o Caminho no Arquivo

Abra `start-printer.bat` e **altere esta linha**:

```batch
cd /d "C:\Usuarios\[SEU_USUARIO]\AutoColor-System"
```

Para o caminho real do seu projeto. Exemplo:
```batch
cd /d "C:\Users\Luis-Guilherme\Documents\PROJETOS\AutoColor-System"
```

> **Dica:** Abra a pasta do projeto no Explorer, clique na barra de endereço e copie o caminho completo.

---

## 🎯 Opção 1: Inicialização Automática via Pasta de Inicialização (Mais Fácil)

### Windows 10/11

1. Pressione `Win + R` e digite:
   ```
   shell:startup
   ```

2. Uma pasta vai abrir. **Cole o arquivo `start-printer.bat` nela**

3. Pronto! Na próxima vez que ligar o Windows, o servidor iniciará automaticamente

### ✅ Verificar se funcionou

- Reinicie o Windows
- Procure por uma janela preta com o título "AutoColor - Servidor de Impressão"
- O servidor deve estar rodando na porta 4000

---

## 🎯 Opção 2: Criar Atalho na Pasta de Inicialização

Se preferir não copiar o arquivo original:

1. Abra a pasta de inicialização (`Win + R` → `shell:startup`)

2. Clique com **botão direito** → **Novo** → **Atalho**

3. Escreva:
   ```
   C:\caminho\para\seu\projeto\start-printer.bat
   ```

4. Nomeie como `AutoColor Printer` e pronto!

---

## 🎯 Opção 3: Criar Tarefa Agendada (Mais Avançado)

Se a Opção 1 não funcionar:

1. Pressione `Win + R` e digite:
   ```
   taskschd.msc
   ```

2. **Clique em "Criar Tarefa Básica"** à direita

3. **Nome:** `AutoColor Printer Server`
   **Descrição:** `Inicia servidor de impressão automaticamente`

4. **Próximo** → **Disparador** → Selecione **"Ao iniciar o computador"**

5. **Próximo** → **Ação** → **Iniciar um programa**

6. **Programa/script:**
   ```
   C:\caminho\para\seu\projeto\start-printer.bat
   ```

7. **Próximo** → **Concluir**

---

## ⚙️ O Que Mudou no Arquivo

O novo `start-printer.bat` agora:

✅ **Verifica se Node.js está instalado**
```batch
where node >nul 2>nul
```

✅ **Reinicia automaticamente se o servidor cair**
```batch
:loop
node print-server.cjs
goto loop
```

✅ **Aguarda 10 segundos antes de reiniciar** (para não sobrecarregar)

✅ **Mostra timestamp de cada inicialização**

---

## 🧪 Testar Sem Reiniciar

Para testar se tudo está funcionando:

1. Execute manualmente o arquivo `start-printer.bat`
2. Você verá a janela abrir com:
   ```
   ============================================
   Iniciando Servidor de Impressao AutoColor...
   ```

3. O servidor iniciará na porta 4000

4. Se fechar o servidor, ele reiniciará automaticamente em 10 segundos

---

## 🛑 Para Desabilitar a Inicialização Automática

1. Pressione `Win + R` → `shell:startup`
2. **Remova o arquivo/atalho do `start-printer.bat`**

Ou pela Tarefa Agendada:
1. `Win + R` → `taskschd.msc`
2. Procure por "AutoColor Printer Server"
3. **Clique com botão direito** → **Desabilitar**

---

## ⚠️ Troubleshooting

### A janela abre mas fecha rapidinho
- Verifique o caminho do projeto no arquivo `.bat`
- Node.js pode não estar no PATH do Windows
- Reinstale o Node.js e marque a opção "Add to PATH"

### Servidor não inicia
- Abra a janela manualmente e veja a mensagem de erro
- Confirme que `npm install node-thermal-printer` foi executado

### Quer rodar em background (sem janela)
Use PowerShell como admin:
```powershell
$action = New-ScheduledTaskAction -Execute "node.exe" -Argument "print-server.cjs" -WorkingDirectory "C:\caminho\do\projeto"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "AutoColorPrinter" -Description "Servidor de impressão AutoColor"
```

---

## ✅ Resumo

| Opção | Dificuldade | Como |
|-------|-----------|------|
| **Pasta Startup** | Fácil ⭐ | Copiar arquivo em `shell:startup` |
| **Atalho Startup** | Fácil ⭐ | Criar atalho em `shell:startup` |
| **Tarefa Agendada** | Média ⭐⭐ | Windows Task Scheduler |
| **PowerShell** | Avançado ⭐⭐⭐ | Script automation |

**Recomendação:** Use a **Opção 1** (Pasta Startup) - é a mais simples e funciona 99% das vezes! 🎯
