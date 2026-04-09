# App Memoria

Aplicativo de treino cognitivo com trilhas de:

- Memoria
- Atencao
- Comparacao
- Orientacao espacial
- Trilha exclusiva por publico

## Rodar localmente

```bash
npm install
npm run dev
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
