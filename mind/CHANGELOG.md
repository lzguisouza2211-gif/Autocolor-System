# Changelog — AutoColor System

Registro cronológico de todas as implementações, correções e melhorias do projeto.

---



## 28/06/2026

**Commit:** feat: sistema AutoDocs de documentação automática via Claude AI

**Implementações:**
- Criado `mind/generate-docs.py`: script Python executado pelo hook `post-commit` do git que analisa cada commit e atualiza automaticamente cinco arquivos de documentação (`CHANGELOG.md`, `learning-log.md`, `architecture.md`, `linkedin-ideas.md`, `project-map.md`) via API do Claude (Haiku por padrão)
- O script coleta hash, mensagem e diff do commit, limita o diff a 12.000 caracteres para controlar custo de tokens, e envia tudo ao modelo com um prompt estruturado que retorna JSON determinístico
- Cada seção possui um flag `should_update_*` para evitar atualizações desnecessárias quando não há conteúdo relevante
- Removido `.env` do rastreamento git; adicionado `.env.example` como template seguro com as variáveis necessárias
- `.gitignore` atualizado com regra `!.env.example` para permitir o template mesmo com o glob `*.env`

**Arquivos:**
- `mind/generate-docs.py` (novo)
- `mind/CHANGELOG.md` (novo)
- `mind/learning-log.md` (novo)
- `mind/architecture.md` (novo)
- `mind/linkedin-ideas.md` (novo)
- `mind/project-map.md` (novo)
- `.env` (removido do git)
- `.env.example` (novo)
- `.gitignore` (atualizado)



## 28/06/2026

**Commit:** fix: migra AutoDocs do SDK Python para o claude CLI (sem API key separada)

**Implementações:**
- Substituição do SDK `anthropic` (Python) pelo binário `claude` CLI invocado via `subprocess.run`
- Função `find_claude()` implementada para localizar o binário em múltiplos caminhos: `shutil.which()`, NVM (`~/.nvm/versions/node/v20.20.0/bin/claude`), `~/.local/bin` e `/usr/local/bin`
- Função `call_claude()` encapsula a chamada ao CLI com flags `-p` e `--output-format text`, com timeout de 120 s
- Eliminação da variável de ambiente `ANTHROPIC_API_KEY` e da constante `AUTODOCS_MODEL` — autenticação delegada ao Claude Code
- Remoção da dependência pip `anthropic`; adição de `shutil` (stdlib)
- Ajustes de estilo: alinhamento do dicionário `FILES`, reformatação de `append_to_file`, remoção de linhas em branco redundantes

**Arquivos:**
- `mind/generate-docs.py` — lógica principal refatorada
- `mind/CHANGELOG.md` — atualizado pelo próprio sistema
- `mind/architecture.md` — decisão arquitetural registrada
- `mind/learning-log.md` — aprendizados registrados
- `mind/linkedin-ideas.md` — rascunho de post gerado
- `mind/project-map.md` — mapa do projeto atualizado



## 28/06/2026

**Commit:** fix: corrige guard de recursão e adiciona setup do AutoDocs

**Implementações:**
- Corrigido bug onde o hook `post-commit` se autobloqueava: o guard de recursão detectava `mind/generate-docs.py` na lista de arquivos alterados e cancelava sua própria execução. Solução: guard passou a inspecionar a **mensagem do commit** (procurando por `[skip ci]` ou `auto-update documentation`) em vez de verificar arquivos
- Adicionado `mind/post-commit.sh` como cópia versionada do hook git, garantindo que o script não se perca ao clonar o repositório
- Adicionado `mind/setup-autodocs.sh` com script de instalação automática do hook: copia `post-commit.sh` para `.git/hooks/post-commit` e define permissão de execução

**Arquivos:**
- `mind/post-commit.sh` — backup versionado do hook git
- `mind/setup-autodocs.sh` — script de setup para reinstalação do hook



## 28/06/2026

**Commit:** `b5bb5d0` — perf: cache global de produtos e correção de N+1 no histórico de vendas

**Implementações:**
- Criado `ProductsContext` (`src/contexts/ProductsContext.tsx`) com uma única query ao Supabase para buscar produtos, categorias, marcas e produtos com estoque crítico — query executada uma vez na autenticação e compartilhada via realtime entre todos os componentes consumidores
- `ProductsProvider` adicionado em `AppRoutes.tsx` envolvendo toda a árvore da aplicação, logo abaixo do `AuthProvider`
- `Header.tsx`: removida query própria ao Supabase e subscription realtime redundante; passa a consumir `lowStockProducts` e `loading` via `useProducts()`
- `PDV.tsx`: removida query local de produtos; passa a consumir `products` e `loading` via `useProducts()`
- `ProductForm.tsx`: removida query local para obter categorias e marcas únicas; passa a consumir `categories` e `brands` via `useProducts()`
- `ProductsTable.tsx`: removida função `fetchProducts` e estado local; passa a consumir `products`, `loading` e `refetch` via `useProducts()`
- `SalesHistory.tsx`: removida lista local de produtos; passa a consumir `products` via `useProducts()`. Substituídas N+1 queries (uma por venda) por 3 queries fixas em paralelo para buscar usuários e clientes de todas as vendas de uma só vez
- Adicionados tipos `UserRow` e `CustomerRow` em `SalesHistory.tsx`; criado tipo `EditedItem` para substituir `any[]` nos itens editados

**Arquivos alterados:**
- `src/AppRoutes.tsx`
- `src/components/Header.tsx`
- `src/components/PDV.tsx`
- `src/components/ProductForm.tsx`
- `src/components/ProductsTable.tsx`
- `src/components/SalesHistory.tsx`
- `src/contexts/ProductsContext.tsx` *(novo)*
