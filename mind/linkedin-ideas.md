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
