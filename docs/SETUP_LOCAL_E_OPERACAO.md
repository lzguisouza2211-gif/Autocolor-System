# Setup Local e Operação

## Pré-requisitos

- Node.js 18+
- Projeto Supabase configurado
- Variáveis de ambiente válidas para frontend

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Arquivo `.env`:

```bash
VITE_PUBLIC_SUPABASE_URL=...
VITE_PUBLIC_SUPABASE_ANON_KEY=...
```

Script auxiliar:

```bash
./setup-env.sh
```

## Comandos principais

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Rodar servidor de impressão local

```bash
node print-server.cjs
```

## Fluxo de desenvolvimento recomendado

1. Subir frontend (`npm run dev`).
2. Validar login e role no Supabase (`users`).
3. Subir servidor de impressão local quando testar notinhas.
4. Para Linux, validar arquivos `recibo-teste-*.txt` gerados.

## Deploy frontend (Vercel)

- Build command: `npm run build`
- Install command: `npm install --legacy-peer-deps`
- Rewrite SPA: `/(.*) -> /index.html`

## Observações operacionais

- Não há script npm para impressão; execução é manual via `node print-server.cjs`.
- `print-server.ts` não está integrado ao fluxo de execução atual.
