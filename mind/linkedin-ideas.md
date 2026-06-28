# Ideias para LinkedIn — AutoColor System

Ideias de publicações geradas automaticamente a partir das implementações do projeto.

---



## Ideia — 28/06/2026

**Título:** Como automatizei 100% da documentação do meu projeto com um hook do git e Claude AI

**O problema:** Documentação fica desatualizada porque atualizar manualmente após cada commit é chato e fácil de esquecer. Semanas depois, você não lembra por que tomou aquela decisão arquitetural, e o CHANGELOG está vazio ou genérico demais para ser útil.

**Como resolvi:** Criei um script Python que roda automaticamente via hook `post-commit` do git. Ele lê o diff do commit, manda para o Claude Haiku com um prompt que exige resposta em JSON estruturado, e atualiza cinco arquivos de documentação: CHANGELOG, log de aprendizados, decisões de arquitetura, rascunhos para LinkedIn e um mapa do projeto sempre atualizado.

**O aprendizado:** Pedir ao modelo uma saída JSON com flags booleanas (`should_update_changelog: true/false`) foi o detalhe que tornou tudo confiável. O modelo decide se o commit tem conteúdo relevante para cada seção — evitando entradas vazias ou repetitivas — e o código só escreve quando o flag está ativo. Separar *decisão* (modelo) de *execução* (código Python) é muito mais robusto do que tentar parsear texto livre.

**Dica para outros devs:** Limite o diff enviado ao modelo (usei 12.000 chars) e leia apenas o final dos arquivos existentes como contexto. Isso mantém o custo por commit abaixo de US$ 0,001 usando Haiku, tornando o sistema viável para uso diário sem preocupação com gastos.



## Ideia — 28/06/2026

**Título:** Como usar o Claude num script Python sem gerenciar API key

**O problema:** Meu hook `post-commit` chamava a API do Claude via SDK Python. Funcionava, mas exigia `ANTHROPIC_API_KEY` no ambiente — variável que o hook git não herda automaticamente, que precisa de billing separado e vira mais um segredo para rotacionar.

**Como resolvi:** Troquei o SDK pela chamada direta ao binário `claude` via `subprocess.run`. O Claude Code já mantém autenticação ativa na máquina, então o CLI não precisa de chave nenhuma:

```python
result = subprocess.run(
    [claude_bin, "-p", prompt, "--output-format", "text"],
    capture_output=True, text=True, timeout=120,
)
```

**O aprendizado:** Hooks git herdam um PATH reduzido — `~/.nvm` e `~/.local/bin` ficam de fora. A solução foi uma função `find_claude()` que tenta `shutil.which()` primeiro e cai em candidatos fixos se não encontrar.

**Dica para outros devs:** Se você já usa o Claude Code no seu fluxo de trabalho, o CLI pode substituir chamadas diretas à API em automações locais — sem segredo extra, sem pip install, sem billing separado.



## Ideia — 28/06/2026

**Título:** O hook que se bloqueava sozinho — e como debugar loops em automações git

**O problema:** Criei um hook `post-commit` que gera documentação automaticamente a cada commit. Ele roda um script Python, que faz um novo commit para salvar os arquivos gerados. Para evitar loop infinito, adicionei um guard: "se o commit incluir `mind/generate-docs.py`, cancela."

O problema: `mind/generate-docs.py` **vive no repositório**. Em qualquer commit que tocasse esse arquivo — inclusive o commit inicial de setup — o hook se autobloqueava e nunca rodava.

**Como resolvi:** Troquei a lógica do guard. Em vez de verificar quais arquivos foram modificados, o hook agora lê a **mensagem do commit** (`git log -1 --format=%s`). Se a mensagem contiver `[skip ci]` ou `auto-update documentation`, o hook para. Esses marcadores só aparecem nos commits gerados automaticamente pelo próprio AutoDocs — nunca nos commits humanos.

**O aprendizado:** Em automações recursivas, o identificador do ciclo deve ser algo que **você controla ativamente**, não um efeito colateral. A mensagem do commit é definida intencionalmente; a lista de arquivos é um acidente de contexto.

**Dica para outros devs:** Se você tem um hook git que gera commits, nunca use a presença do script em `--name-only` como guard de recursão. Use uma flag explícita na mensagem ou uma variável de ambiente exportada pelo processo pai.



## Ideia — 28/06/2026

**Título:** Meu app React fazia 5 queries ao banco para mostrar a mesma lista. Veja como resolvi sem Redux nem React Query.

**O problema:** No AutoColor System (PDV que estou construindo), percebi que cada tela buscava a lista de produtos do Supabase por conta própria. O Header buscava para mostrar alertas de estoque. O PDV buscava para o carrinho. O formulário de produto buscava para preencher os dropdowns de categoria. A tabela de produtos buscava para listar. O histórico de vendas buscava para o autocomplete. Cinco componentes. Uma mesma tabela. Cinco queries a cada navegação.

**Como resolvi:** Criei um `ProductsContext` simples — uma única query ao Supabase no momento em que o usuário autentica, com uma subscription realtime para manter os dados frescos. Todos os componentes consomem `useProducts()` em vez de ir ao banco. Os dados derivados (categorias, marcas, produtos com estoque crítico) são calculados uma vez dentro do contexto e ficam disponíveis para qualquer consumidor.

**O aprendizado:** Context API não é só para tema e autenticação. Para dados que mudam pouco e são usados em muitos lugares, um contexto com realtime é uma cache eficiente sem nenhuma dependência extra. O ponto chave é expor também um `refetch()` manual — o realtime cobre mudanças externas, mas para mutações que o próprio usuário fez, você quer atualização imediata antes do evento chegar.

No histórico de vendas, o problema era diferente: N+1 clássico. Para cada venda exibida, uma query buscava o usuário e o cliente responsável. Com 50 vendas no histórico, eram 51 queries. Substituí por 3 queries paralelas com `Promise.all` — uma para vendas com itens, uma para todos os usuários referenciados, uma para todos os clientes — e montei os dados em memória.

**Dica para outros devs:** Antes de adicionar React Query ou Zustand, pergunte: quantas vezes esse dado muda por sessão? Se a resposta for "pouco", um Context com realtime resolve com zero dependências. Reserve bibliotecas de estado/cache para quando a complexidade justificar.
