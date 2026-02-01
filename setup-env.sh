#!/bin/bash

# Script para configurar variáveis de ambiente locais
# Este script cria um arquivo .env de exemplo para desenvolvimento

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo "✓ Arquivo $ENV_FILE já existe"
    exit 0
fi

echo "Criando arquivo $ENV_FILE para desenvolvimento local..."

cat > "$ENV_FILE" << 'EOF'
# ⚠️ IMPORTANTE: Este arquivo NÃO deve ser commitado no Git
# Ele contém credenciais sensíveis específicas do seu ambiente local

# Supabase Configuration
# Obtenha esses valores em: https://app.supabase.com → Seu Projeto → Settings → API
VITE_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
VITE_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
EOF

echo "✓ Arquivo $ENV_FILE criado com sucesso!"
echo ""
echo "Próximos passos:"
echo "1. Abra o arquivo $ENV_FILE"
echo "2. Substitua YOUR_SUPABASE_URL_HERE pela sua URL do Supabase"
echo "3. Substitua YOUR_SUPABASE_ANON_KEY_HERE pela sua chave anônima"
echo ""
echo "Para obter essas credenciais:"
echo "  - Acesse: https://app.supabase.com"
echo "  - Selecione seu projeto"
echo "  - Vá para: Settings → API"
echo "  - Copie 'Project URL' e 'anon public key'"
