# PLAK Studio — criador e gerenciador de BioSites

Plataforma para uma agência criar, revisar, publicar e entregar BioSites empresariais. Leia `docs/PLAK_SAAS.md` para arquitetura, fluxo, migrations, testes executados e limites.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

Requer as migrations Supabase 0001–0006 (0007 é opcional) e uma conta administradora aprovada.

O editor livre `/admin/studio` e o editor de clientes `/admin/client/:id` continuam disponíveis. Deploy: `docs/DEPLOYMENT.md` e `DEPLOY_RAILWAY.md`.
