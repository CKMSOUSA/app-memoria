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

Se quiser preparar o app para operar online com Supabase, copie o arquivo `.env.example` e ajuste:

```bash
NEXT_PUBLIC_APP_DATA_MODE=remote
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADMIN_CONFIRM_CODE=SEU_CODIGO_ADMIN
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_SERVER_CODE=
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

Esta versao ja usa uma base hibrida.

Isso significa:

- sem Supabase configurado, o app funciona localmente no navegador
- com Supabase configurado, login, perfil, progresso, historico e ajuda passam a sincronizar online
- ainda existe fallback local para evitar perda de usabilidade em caso de indisponibilidade parcial

Para uma versao publica mais completa no futuro, o ideal e integrar um backend como Supabase ou Firebase.

## Perfis de acesso

O app agora diferencia dois perfis:

- `aluno`: foco no treino, relatorios pessoais e ajuda
- `admin`: acesso adicional a area administrativa e acompanhamento de usuarios

A conta de teste padrao vem como `admin`.

Para abrir a area administrativa, alem de login e perfil `admin`, o app agora pede um codigo extra de confirmacao.
Esse codigo pode ser alterado em:

- `NEXT_PUBLIC_ADMIN_CONFIRM_CODE`

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

## Integracao inicial com Supabase

O projeto agora ja consegue usar o Supabase para:

- cadastro
- login
- recuperacao de acesso
- sincronizacao inicial do perfil do usuario
- sincronizacao online do progresso das trilhas quando a tabela estiver criada

Arquivos principais:

- `lib/supabase-auth.ts`
- `lib/supabase-profile.ts`
- `lib/supabase-progress.ts`
- `lib/supabase-history.ts`
- `lib/supabase-help.ts`
- `supabase/user_profiles.sql`
- `supabase/user_progress.sql`
- `supabase/session_history.sql`
- `supabase/help_requests.sql`

Antes de ativar a migracao completa, rode os SQLs abaixo no painel do Supabase:

- `supabase/user_profiles.sql`
- `supabase/user_progress.sql`
- `supabase/session_history.sql`
- `supabase/help_requests.sql`

Se a tabela `help_requests` ja existir no projeto, rode novamente `supabase/help_requests.sql` para adicionar a coluna `admin_reply`, usada no retorno do admin ao usuario.

Esse script cria a tabela `user_profiles` com:

- nome
- email
- avatar
- idade
- role
- premium
- pontos
- criado_em

E a tabela `user_progress` com:

- modo da trilha
- challenge_id
- tentativas
- melhor score
- ultimo score
- melhor tempo
- concluido
- ultima variacao usada

E a tabela `session_history` com:

- modo da sessao
- fase jogada
- score
- tempo da rodada
- se concluiu a meta
- data da sessao

E a tabela `help_requests` com:

- nome do usuario
- email
- assunto
- mensagem
- data de envio
- status do atendimento

Com Supabase configurado, o app passa a operar em modo online por padrao, mas mantendo fallback local quando necessario.

Ele ja sincroniza:

- perfil do usuario
- progresso das trilhas
- historico de sessoes
- pedidos de ajuda do proprio usuario

quando as tabelas existirem no projeto do Supabase.

Observacao:

- a leitura administrativa global de ajuda ainda depende de uma rota de servidor com permissao elevada
- pela interface atual com Supabase publico, cada usuario sincroniza com seguranca as proprias duvidas

## Painel administrativo online

O projeto agora ja possui uma rota administrativa de servidor em:

- `app/api/admin/overview/route.ts`

Essa rota foi preparada para:

- listar usuarios online
- ler progresso de todos os usuarios
- ler historico de sessoes
- ler pedidos de ajuda

Para isso funcionar na Vercel ou em producao, configure tambem:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SERVER_CODE`

Fluxo recomendado:

1. o admin entra no app
2. usa o acesso administrativo
3. informa o codigo administrativo
4. a rota `/api/admin/overview` valida o acesso
5. o servidor consulta o Supabase com a service role key, sem expor essa chave ao navegador

## Status do backend remoto

A rota `/api/status` agora informa:

- modo atual (`local` ou `remote`)
- se o provedor remoto foi configurado
- se o app esta pronto para sincronizar contas e progresso online
