# Sistema de Autenticação - AutoColor

## 🔐 Configuração do Usuário Admin

### Opção 1: Usando o Script Automático (Recomendado)

```bash
./create-admin.sh
```

Este script criará automaticamente o usuário admin com as credenciais padrão.

### Opção 2: Criação Manual via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Navegue até **Authentication** > **Users**
3. Clique em **Add User** > **Create new user**
4. Preencha:
   - **Email**: `admin@autocolor.com`
   - **Password**: `Admin@123` (ou sua senha preferida)
5. Marque a opção **Auto Confirm User**

### Opção 3: Via API REST

```bash
curl -X POST 'YOUR_SUPABASE_URL/auth/v1/signup' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@autocolor.com",
    "password": "Admin@123"
  }'
```

## 🔑 Credenciais Padrão

- **Email**: `admin@autocolor.com`
- **Senha**: `Admin@123`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

## 🚀 Como Usar

1. Execute o sistema: `npm run dev`
2. Acesse `http://localhost:5173`
3. Você será redirecionado para `/login`
4. Use as credenciais acima para entrar
5. Após o login, você terá acesso ao sistema

## 📁 Arquivos Criados

- `src/components/Login.tsx` - Página de login
- `src/contexts/AuthContext.tsx` - Contexto de autenticação
- `src/AppRoutes.tsx` - Rotas protegidas
- `src/components/Sidebar.tsx` - Sidebar com botão de sair
- `migrations/008_create_admin_user.sql` - Instruções SQL
- `create-admin.sh` - Script de criação automática

## 🔒 Funcionalidades

- ✅ Login com email e senha
- ✅ Proteção de rotas (redireciona para login se não autenticado)
- ✅ Botão "Sair" no rodapé do Sidebar
- ✅ Persistência de sessão (mantém login após recarregar)
- ✅ Feedback visual de erros no login
- ✅ Loading states

## 🛠️ Tecnologias

- React Router (navegação e rotas protegidas)
- Supabase Auth (autenticação)
- Context API (gerenciamento de estado)
- Tailwind CSS (estilização)
