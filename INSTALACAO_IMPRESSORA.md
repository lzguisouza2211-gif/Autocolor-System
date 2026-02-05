# 🖨️ Instalação do Servidor de Impressão - node-thermal-printer

## ✅ Refatoração Concluída

O arquivo `print-server.cjs` foi totalmente refatorado para usar a biblioteca moderna **node-thermal-printer**, removendo completamente a dependência da biblioteca antiga `printer` que causava erros no Windows.

---

## 📦 Instalação das Dependências

### 1. Remover bibliotecas antigas (opcional mas recomendado)
```bash
npm uninstall printer escpos escpos-usb
```

### 2. Instalar node-thermal-printer
```bash
npm install node-thermal-printer
```

### 3. Instalar dependências do servidor (se ainda não estiverem instaladas)
```bash
npm install express cors
```

---

## ⚙️ Configuração

### Configurar o nome da impressora

Por padrão, o servidor está configurado para usar a impressora `Bematech MP-4200 HS`.

**Opção 1: Via variável de ambiente (recomendado)**
```bash
set PRINTER_NAME=Nome_Da_Sua_Impressora
node print-server.cjs
```

**Opção 2: Editar diretamente no código**
Abra [print-server.cjs](print-server.cjs) e modifique a linha:
```javascript
const PRINTER_NAME = process.env.PRINTER_NAME || 'Bematech MP-4200 HS';
```

### Como descobrir o nome da impressora no Windows

Execute no PowerShell:
```powershell
Get-Printer | Select-Object Name
```

Ou no Prompt de Comando:
```cmd
wmic printer get name
```

---

## 🚀 Como Executar

### Iniciar o servidor
```bash
node print-server.cjs
```

O servidor iniciará na porta **4000** e exibirá:
```
============================================
🖨️  Servidor de Impressão AutoColor
============================================
📡 Porta: 4000
📍 Plataforma: win32
🖨️  Impressora: Bematech MP-4200 HS
🔧 Modo: PRODUÇÃO (Windows - node-thermal-printer)
✅ Sistema pronto!
============================================
```

---

## 🧪 Testar a Impressão

### Via cURL
```bash
curl -X POST http://localhost:4000/api/print ^
  -H "Content-Type: application/json" ^
  -d "{\"items\":[{\"name\":\"Produto Teste\",\"qty\":2,\"price\":10.50}],\"total\":21.00,\"payment\":\"Dinheiro\",\"company\":{\"name\":\"AutoColor\"}}"
```

### Via JavaScript/Fetch
```javascript
fetch('http://localhost:4000/api/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { name: 'Produto Teste', qty: 2, price: 10.50 }
    ],
    total: 21.00,
    payment: 'Dinheiro',
    company: { name: 'AutoColor' }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 🔧 Solução de Problemas

### Erro: "Impressora não encontrada"
- Verifique se a impressora está ligada e conectada via USB
- Confirme o nome exato da impressora usando os comandos acima
- Tente usar a impressora padrão do sistema (remova o parâmetro PRINTER_NAME)

### Erro: "Module not found: node-thermal-printer"
```bash
npm install node-thermal-printer
```

### A impressão não sai mas não dá erro
- Verifique se a impressora tem papel
- Teste imprimir um documento de texto normal pelo Windows
- Verifique se o driver da impressora está atualizado

### Ajustar o tipo de impressora
Edite no código a linha do `PrinterTypes`:
```javascript
type: PrinterTypes.EPSON,  // Opções: EPSON, STAR, TANCA
```

---

## 📝 Mudanças Implementadas

### Removido
- ❌ Biblioteca `printer` (causava ERR_DLOPEN_FAILED)
- ❌ Comandos PowerShell via `execSync`
- ❌ Criação de arquivos temporários

### Adicionado
- ✅ Biblioteca `node-thermal-printer` (moderna e estável)
- ✅ Suporte nativo para impressoras térmicas USB
- ✅ Formatação avançada (negrito, tamanhos, alinhamento)
- ✅ Suporte a corte automático de papel
- ✅ Melhor tratamento de erros
- ✅ Configuração via variável de ambiente

---

## 🎯 Requisitos Atendidos

- ✅ Servidor na porta 4000
- ✅ Impressora USB do Windows
- ✅ Impressão de textos simples (pedidos/comprovantes)
- ✅ Biblioteca `printer` totalmente removida
- ✅ Código completo atualizado
- ✅ Estável no Windows 10/11

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique se todas as dependências estão instaladas
2. Confirme que a impressora está configurada corretamente no Windows
3. Teste com a impressora padrão do sistema primeiro
4. Verifique os logs do console para mensagens de erro detalhadas
