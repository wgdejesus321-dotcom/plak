# Página Inteligente — rebuild independente

Aplicação multi-tenant para criar páginas digitais de negócios, publicar links permanentes para QR Code/NFC e acompanhar visitas e cliques. Esta versão foi reconstruída do zero como uma aplicação React + TypeScript, sem reutilizar a implementação do projeto de referência.

## O que está incluído

- Landing page e login com Supabase Auth.
- Painel protegido com sidebar responsiva.
- CRUD de clientes/negócios, busca, filtros, status, publicação, preview, remoção e URL pública por slug.
- Editor completo: identidade, logo, canais, botões personalizados, galeria de fotos/vídeos, localização, cores, background, slug e SEO.
- Página pública mobile-first com Google, WhatsApp, Instagram, site, mapa, botões customizados, galeria, compartilhar e fallback de página indisponível.
- Analytics de views/clicks com dispositivo, origem, período, série diária e ranking de botões.
- Aprovação de contas, papéis admin/user, revogação e remoção.
- Migration Supabase com tabelas normalizadas, índices, trigger de perfil, RLS e bucket de assets.
- Templates Cloudflare Pages/R2 e documentação de deploy.

## Análise do produto de referência

O produto original era uma plataforma de links para múltiplos estabelecimentos, com painel de clientes, editor visual rico, publicação/preview, páginas públicas por slug, upload de logo/background/mídia, analytics e controle de contas. A nova versão preserva essa hierarquia visual (creme, teal profundo, verde-lima, cards arredondados, mobile-first) e os fluxos essenciais, mas usa uma arquitetura independente: Supabase Auth/Postgres/Storage, relações normalizadas e RLS; Cloudflare Pages para entrega; R2 como caminho opcional para um adapter server-side de uploads.

## Variáveis

Copie `.env.example` para `.env.local` durante o desenvolvimento. Para projetos Supabase novos, use `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no browser. `VITE_SUPABASE_ANON_KEY` continua aceito apenas como compatibilidade legada. No servidor, use `SUPABASE_URL` e `SUPABASE_SECRET_KEY`; `SUPABASE_SERVICE_ROLE_KEY` continua aceito para projetos legados. Nunca coloque uma secret/service-role key ou segredos R2 em variáveis `VITE_*`.

## Supabase

1. Crie um projeto em supabase.com.
2. Instale o Supabase CLI, execute `supabase link --project-ref SEU_PROJECT_REF` e aplique `supabase db push`. A migration versionada em `supabase/migrations/0001_pagina_inteligente.sql` é a fonte de verdade; evite alterar o banco remoto manualmente depois que o fluxo de migrations começar.
3. Em **Authentication → Providers**, habilite Email/Password e defina as URLs permitidas para o domínio local e de produção.
4. Crie o primeiro usuário pelo `/login`.
5. Promova esse usuário a admin apenas em uma migration/SQL controlado, uma única vez: `update public.profiles set role = 'admin', access_status = 'approved', is_protected = true where email = 'SEU_EMAIL';`
6. Confirme em **Storage** que o bucket `business-assets` foi criado como público. As policies da migration limitam gravação a admins.

## Desenvolvimento e build

```bash
pnpm install
cp .env.example .env.local
# edite .env.local
pnpm dev
pnpm check
pnpm build
```

O comando de build gera `dist/`, adequado para Cloudflare Pages ou para o servidor Express da Railway. A aplicação mostra estados explícitos de carregamento, sessão ausente e erro de conexão, em vez de simular dados. O build não lê nem valida secrets de backend.

## Railway

Use `pnpm build` como Build Command e `pnpm start` como Start Command. O `railway.json` e o `nixpacks.toml` já contêm essa configuração e fixam a instalação pelo `pnpm-lock.yaml`. `npm run build` também funciona quando as dependências já foram instaladas. O health check `/api/health` responde sem acessar Supabase, portanto a aplicação pode iniciar mesmo que a Railway ainda esteja propagando variáveis.

No painel da Railway, adicione `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` como **Service Variables** somente se o serviço tiver rotas backend administrativas que usem `server/supabase-admin.ts`. A chave service role nunca deve ser prefixada com `VITE_` e nunca deve ser adicionada a `client/src`. No navegador, a aplicação usa exclusivamente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

`SUPABASE_SERVICE_ROLE_KEY` é validada de forma lazy por `getSupabaseServiceRoleKey()`: a ausência da chave não quebra o build nem o arranque do servidor; produz um erro claro apenas quando uma operação protegida realmente solicitar o cliente admin. A implementação atual não usa essa chave nas rotas estáticas, mas o limite de segurança está preparado para futuras rotas.

## Cloudflare Pages

1. Crie um projeto em **Workers & Pages → Pages → Connect to Git**.
2. Build command: `pnpm build`.
3. Output directory: `dist/public` (Railway usa o servidor em `dist/index.js`; Cloudflare Pages usa somente o frontend estático).
4. Node version: 22 (ou a versão suportada pelo seu ambiente).
5. Em **Settings → Environment variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para Preview e Production.
6. Faça deploy. Configure o domínio em **Custom domains** e aguarde o certificado HTTPS.
7. Adicione a URL final no Supabase Auth Redirect URLs.

`wrangler.toml` é um template para Pages e contém um exemplo comentado de binding R2. Para usar R2 em uploads server-side, crie uma Pages Function que valide o usuário no Supabase, gere URLs assinadas ou faça proxy no bucket; mantenha `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` apenas como secrets de Functions. O frontend atual usa Supabase Storage diretamente, já protegido pela policy `public.is_admin()`.

## Modelo de dados

- `profiles`: extensão da identidade Supabase Auth, papel e estado de acesso.
- `businesses`: identidade, contatos, tema, SEO e ciclo draft/published/inactive.
- `business_links`: links customizados ordenados por negócio.
- `business_media`: imagens/vídeos ordenados por negócio.
- `analytics_events`: eventos anônimos de view/click com origem e dispositivo.
- Storage `business-assets`: logos, backgrounds e mídia.

RLS permite leitura pública somente para negócios publicados e suas relações. Escritas privadas exigem um perfil admin aprovado. Eventos podem ser inseridos anonimamente, mas apenas admins podem lê-los.

## Manutenção

Depois de alterar o schema, crie uma nova migration em `supabase/migrations/` e aplique-a no SQL Editor antes do deploy. Nunca altere diretamente produção sem migration versionada. Para mudar a identidade visual, edite `client/src/index.css`; para adicionar campos do editor, atualize `types.ts`, `data.ts`, migration e `ClientEditor.tsx`.

## Limitações deliberadas

Não há segredos reais no repositório. Sem Supabase configurado, as telas continuam navegáveis e exibem uma mensagem de configuração; não há clientes hardcoded nem fake auth. O adapter R2 server-side está documentado como extensão opcional porque segredos R2 não podem ser expostos em uma aplicação estática.
