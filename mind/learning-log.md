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
