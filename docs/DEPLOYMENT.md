# Checklist de implantação

## 1. Supabase
- Criar projeto e copiar URL/API anon key.
- Executar `supabase/migrations/0001_pagina_inteligente.sql`.
- Habilitar Email/Password em Auth.
- Configurar Site URL e Redirect URLs para local e domínio Pages.
- Criar primeiro usuário, promover a admin no SQL Editor e testar logout/login.

## 2. Cloudflare Pages
- Conectar o repositório ou fazer upload do projeto.
- Build: `pnpm build`.
- Saída: `dist`.
- Variáveis públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Não adicionar `SUPABASE_SERVICE_ROLE_KEY` ou segredos R2 ao frontend.

## 3. R2 (opcional)
- Criar bucket e domínio público/customizado.
- Criar API token limitado ao bucket.
- Colocar credenciais apenas em Pages Functions/Workers como secrets.
- Implementar presign/proxy validando JWT antes de permitir gravação.

## 4. Domínio e atualizações
- Adicionar domínio customizado no Pages.
- Adicionar o domínio final nos Redirect URLs do Supabase.
- Para atualizar: aplicar novas migrations, rodar `pnpm check`, `pnpm build` e publicar novo deploy.
