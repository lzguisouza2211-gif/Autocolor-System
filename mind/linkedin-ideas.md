# Ideias para LinkedIn — AutoColor System

Ideias de publicações geradas automaticamente a partir das implementações do projeto.

---



## Ideia — 28/06/2026

**Título:** Como automatizei 100% da documentação do meu projeto com um hook do git e Claude AI

**O problema:** Documentação fica desatualizada porque atualizar manualmente após cada commit é chato e fácil de esquecer. Semanas depois, você não lembra por que tomou aquela decisão arquitetural, e o CHANGELOG está vazio ou genérico demais para ser útil.

**Como resolvi:** Criei um script Python que roda automaticamente via hook `post-commit` do git. Ele lê o diff do commit, manda para o Claude Haiku com um prompt que exige resposta em JSON estruturado, e atualiza cinco arquivos de documentação: CHANGELOG, log de aprendizados, decisões de arquitetura, rascunhos para LinkedIn e um mapa do projeto sempre atualizado.

**O aprendizado:** Pedir ao modelo uma saída JSON com flags booleanas (`should_update_changelog: true/false`) foi o detalhe que tornou tudo confiável. O modelo decide se o commit tem conteúdo relevante para cada seção — evitando entradas vazias ou repetitivas — e o código só escreve quando o flag está ativo. Separar *decisão* (modelo) de *execução* (código Python) é muito mais robusto do que tentar parsear texto livre.

**Dica para outros devs:** Limite o diff enviado ao modelo (usei 12.000 chars) e leia apenas o final dos arquivos existentes como contexto. Isso mantém o custo por commit abaixo de US$ 0,001 usando Haiku, tornando o sistema viável para uso diário sem preocupação com gastos.
