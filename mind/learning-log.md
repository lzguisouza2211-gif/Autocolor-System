# Learning Log — AutoColor System

Registro de aprendizados técnicos adquiridos durante o desenvolvimento.

---



## 28/06/2026

**Aprendizados:**
- **Prompt com saída JSON estruturada elimina parsing frágil:** ao exigir que o modelo retorne um objeto JSON com chaves exatas e flags booleanas (`should_update_*`), o script evita regex, heurísticas e ambiguidades — o modelo decide *se* há conteúdo relevante, e o código só executa a escrita quando o flag está `true`. Separar decisão (modelo) de execução (código) torna o sistema muito mais robusto.
- **Ler apenas o tail do arquivo economiza tokens sem perder contexto útil:** carregar os últimos 2.500 caracteres do `project-map.md` é suficiente para o modelo entender o estado atual do projeto e produzir um mapa atualizado coerente, sem desperdiçar tokens com histórico antigo.
- **`!.env.example` no `.gitignore` é um padrão de negação que muitos ignoram:** quando há um glob amplo como `*.env` ou `.env`, adicionar `!.env.example` explicitamente faz o git rastrear apenas o template seguro, sem risco de commitar credenciais reais — padrão simples que evita vazamento acidental.
