# App Memoria

Ultima atualizacao de deploy: 2026-04-09

Aplicativo de treino cognitivo com trilhas de:

- Memoria
- Atencao
- Comparacao
- Orientacao espacial
- Trilha exclusiva por publico

## O que foi reforcado nesta versao

- textos e instrucoes mais guiados dentro dos jogos
- faseamento mais gradual e pedagogico
- interface mais clara para iniciar, executar e corrigir as rodadas
- camada de repositorio pronta para trocar `localStorage` por backend online
- rota de status em `/api/status` para apoiar a futura integracao de API real

## Rodar localmente

```bash
npm install
npm run dev
```

Se quiser preparar o app para backend remoto no futuro, copie o arquivo `.env.example` e ajuste:

```bash
NEXT_PUBLIC_APP_DATA_MODE=local
NEXT_PUBLIC_API_BASE_URL=/api
```

## Build de producao

```bash
npm run build
npm start
```

## Publicar na Vercel

### Opcao 1: pelo site da Vercel

1. Suba este projeto para um repositorio no GitHub.
2. Entre em https://vercel.com/new
3. Importe o repositorio.
4. Mantenha as configuracoes padrao para Next.js.
5. Clique em Deploy.

### Opcao 2: pela CLI da Vercel

```bash
npm install -g vercel
vercel
```

Depois, para publicar em producao:

```bash
vercel --prod
```

## Subir para o GitHub

Se o Git ainda nao estiver instalado no computador:

1. Instale o Git.
2. Abra esta pasta em um terminal.
3. Rode:

```bash
git init
git add .
git commit -m "Versao inicial do app memoria"
```

Depois crie um repositorio vazio no GitHub e conecte com:

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

## Publicacao mais rapida possivel

Ordem recomendada:

1. Instalar Git
2. Subir o projeto para o GitHub
3. Importar o repositorio na Vercel
4. Publicar

Depois disso, o app ja fica acessivel por link publico na internet.

## Observacao importante

Esta versao MVP usa `localStorage`.

Isso significa:

- cada usuario salva os dados apenas no proprio navegador
- login, progresso e perfil nao ficam compartilhados entre dispositivos
- a publicacao online funciona, mas ainda sem backend real

Para uma versao publica mais completa no futuro, o ideal e integrar um backend como Supabase ou Firebase.

## Preparacao para backend real

O projeto agora ja possui uma camada de dados preparada para dois modos:

- `local`: usa `localStorage`, ideal para MVP e testes
- `remote`: pronto para consumir um backend real de autenticacao, perfil e progresso

Arquivo principal dessa preparacao:

- `lib/app-repository.ts`

Rotas esperadas no modo remoto:

- `POST /auth/login`
- `POST /auth/register`
- `PATCH /users/:email`
- `POST /users/:email/points`
- `GET /progress/:email`
- `PUT /progress/:email`

Isso permite migrar depois para Supabase, Firebase ou API propria sem reescrever as telas do app.
