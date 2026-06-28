# Learning Log — AutoColor System

Registro de aprendizados técnicos adquiridos durante o desenvolvimento.

---



## 28/06/2026

**Aprendizados:**
- **Prompt com saída JSON estruturada elimina parsing frágil:** ao exigir que o modelo retorne um objeto JSON com chaves exatas e flags booleanas (`should_update_*`), o script evita regex, heurísticas e ambiguidades — o modelo decide *se* há conteúdo relevante, e o código só executa a escrita quando o flag está `true`. Separar decisão (modelo) de execução (código) torna o sistema muito mais robusto.
- **Ler apenas o tail do arquivo economiza tokens sem perder contexto útil:** carregar os últimos 2.500 caracteres do `project-map.md` é suficiente para o modelo entender o estado atual do projeto e produzir um mapa atualizado coerente, sem desperdiçar tokens com histórico antigo.
- **`!.env.example` no `.gitignore` é um padrão de negação que muitos ignoram:** quando há um glob amplo como `*.env` ou `.env`, adicionar `!.env.example` explicitamente faz o git rastrear apenas o template seguro, sem risco de commitar credenciais reais — padrão simples que evita vazamento acidental.



## 28/06/2026

**Aprendizados:**
- Hooks git herdam um PATH reduzido — NVM e `~/.local/bin` frequentemente ficam de fora, fazendo `shutil.which()` retornar `None` mesmo com o binário instalado; uma lista de candidatos fixos é um fallback pragmático e sem dependências externas
- O `claude` CLI pode substituir chamadas diretas à API em scripts locais: `subprocess.run([claude_bin, '-p', prompt, '--output-format', 'text'])` é suficiente para obter uma resposta do modelo sem nenhuma chave de API — a autenticação é resolvida internamente pelo Claude Code
- Remover o `AUTODOCS_MODEL` explícito e deixar o CLI escolher o modelo padrão simplifica a manutenção, mas transfere controle de custo/versão para a configuração do Claude Code do usuário — trade-off a revisar se o custo importar



## 28/06/2026

**Aprendizados:**
- **Guard de recursão em hooks git: arquivo vs. mensagem.** Verificar a *lista de arquivos* modificados para detectar recursão é frágil quando o próprio script reside no repositório. Se o script (ex: `mind/generate-docs.py`) for parte do commit, o guard ativa e bloqueia o fluxo. A abordagem correta é inspecionar a **mensagem do commit**: ela é definida antes do hook rodar e nunca muda durante a execução, tornando-a um identificador determinístico e sem colisões acidentais.
- **Hooks git não são versionados.** O diretório `.git/` é ignorado pelo git. Qualquer hook configurado manualmente se perde em um `git clone` ou ao reconfigurar o repositório. Manter uma cópia do hook em `mind/` junto com um script `setup-autodocs.sh` resolve esse problema de forma idiomática: o setup faz parte do onboarding do projeto.



## 28/06/2026

**Aprendizados:**

- **O problema N+1 em React não é óbvio:** Cada componente buscando dados independentemente parece inocente isolado, mas ao navegar entre telas o usuário dispara múltiplas queries ao banco sem perceber. O custo só fica visível quando você conta quantas chamadas de rede acontecem por clique.

- **Context API como cache de dados é diferente de Context API para estado global de UI:** Usar Context para compartilhar dados do servidor (produtos, usuários) resolve o N+1 sem Redux, sem React Query, sem camada extra — basta uma query com subscription realtime que todos os consumidores recebem automaticamente.

- **`refetch` explícito vs. realtime automático:** Para mutações locais (salvar, excluir produto), o realtime do Supabase já refresca o contexto — mas expor um `refetch` manual é necessário para forçar uma re-busca imediata na UI antes que o evento de realtime chegue. As duas abordagens coexistem sem conflito.

- **Queries paralelas com `Promise.all` no SalesHistory:** Substituir N queries sequenciais por 3 paralelas (`users`, `customers`, vendas com itens) reduz o tempo de carregamento do histórico de O(N) para O(1) em relação ao número de vendas — independente do tamanho do histórico.

- **Derivar dados do contexto em vez de duplicá-los:** `lowStockProducts`, `categories` e `brands` não precisam de estado próprio em cada componente — são derivações da lista de produtos já carregada no contexto. Menos estado = menos bugs de sincronização.



## 28/06/2026

**Aprendizados:**
- Artefatos gerados automaticamente (documentação, logs, relatórios) raramente devem ser versionados junto com o código-fonte — eles poluem o histórico, dificultam code review e criam ruído nos diffs
- O AutoDocs foi projetado para gerar commits automáticos, o que criava um ciclo de ruído no `git log`: commits reais se misturavam com commits de documentação. Gitignoring o diretório de saída resolve o problema na raiz, sem precisar de guards complexos
- A decisão de gitignore não invalida o sistema — ele continua funcionando localmente. A documentação é útil para quem desenvolve, não precisa estar no repositório central
