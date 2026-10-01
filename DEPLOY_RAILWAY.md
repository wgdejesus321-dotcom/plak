# Deploy do PLAK no Railway

## Estrutura correta do pacote

O ZIP entregue contém uma única pasta raiz chamada `plak-platform`:

```text
plak-platform/
├── client/
├── server/
├── supabase/
├── package.json
├── pnpm-lock.yaml
├── railway.json
└── ...
```

Não extraia apenas o conteúdo interno sobre uma pasta antiga. Extraia o ZIP e use a pasta `plak-platform` como raiz do serviço no Railway.

## Opção A — Deploy pelo GitHub

1. Extraia o ZIP localmente.
2. Abra o repositório conectado ao Railway.
3. Substitua o conteúdo do repositório pela pasta `plak-platform` extraída, preservando a pasta como raiz do projeto.
4. Faça commit e push para a branch conectada ao Railway:

```bash
cd plak-platform
git add .
git commit -m "Atualiza PLAK Studio Editor"
git push origin main
```

5. No Railway, abra o serviço e aguarde o novo deploy.
6. Em **Deployments**, confirme que o commit novo foi construído com sucesso.
7. Acesse a URL pública somente depois do status ficar **Success**.

## Opção B — Deploy pelo Railway CLI

Instale/autentique a CLI do Railway, vincule o projeto e execute a partir da pasta `plak-platform`:

```bash
cd plak-platform
railway login
railway link
railway up
```

Se o Railway pedir confirmação do projeto ou serviço, escolha o projeto correto do PLAK.

## Configuração do serviço

O pacote inclui `railway.json` configurado para usar o `Dockerfile`. O Dockerfile instala o pnpm, instala as dependências com lockfile, executa o build e inicia o servidor com `pnpm start`.

Se você configurar os comandos manualmente no painel Railway, use:

### Build command

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm build
```

### Start command

```bash
pnpm start
```

Não configure simultaneamente um buildpack manual e o Dockerfile; escolha uma estratégia. A configuração incluída no ZIP já prioriza o Dockerfile. O servidor usa a variável `PORT` fornecida pelo Railway e escuta em `0.0.0.0`.

## Variáveis de ambiente

Configure no serviço Railway, em **Variables**:

```text
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_DE_SERVICO
```

Use os nomes reais já usados pelo projeto e nunca coloque chaves privadas em arquivos versionados ou no ZIP público.

Se as variáveis do Supabase não estiverem configuradas, o login e a persistência remota não funcionarão no ambiente publicado.

## Supabase antes do deploy

Aplique as migrations na instância Supabase usada pelo Railway, incluindo:

```text
supabase/migrations/0005_studio_projects.sql
```

Depois confirme que:

- o usuário administrador existe;
- o e-mail está aprovado;
- as políticas RLS estão aplicadas;
- o domínio público do Railway está permitido nas configurações de autenticação do Supabase.

## Verificação pós-deploy

Depois do deploy, valide:

```bash
curl -fsS https://SEU-DOMINIO.up.railway.app/api/health
```

A resposta esperada é semelhante a:

```json
{"ok":true,"service":"plak"}
```

Em seguida, faça um recarregamento completo do navegador (`Ctrl+Shift+R` ou `Cmd+Shift+R`). Se o navegador ainda mostrar a versão antiga, teste em uma janela anônima e confirme no Railway se o deployment novo está associado ao commit correto.

## Como confirmar que o build novo está publicado

No Railway, verifique:

1. horário do último deployment;
2. hash/commit implantado;
3. logs de `pnpm build` sem erro;
4. logs de `pnpm start` sem erro;
5. resposta atual de `/api/health`;
6. aba Network do navegador carregando um bundle JavaScript com timestamp/hash novo.

O ZIP por si só não publica nada no Railway: ele precisa substituir o código do repositório ou ser enviado pela CLI, seguido de um novo deployment.
