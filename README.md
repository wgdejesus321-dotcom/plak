# PLAK Studio — criador e gerenciador de BioSites

Plataforma para uma agência criar, revisar, publicar e entregar BioSites empresariais. Leia `docs/PLAK_SAAS.md` para arquitetura, fluxo, migrations, testes executados e limites.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

Os Bio-sites usam as migrations 0001–0006 (0007 contém recursos opcionais). Para habilitar Web Cardápios e pedidos, aplique também `supabase/migrations/0008_web_menus_orders.sql`; veja `docs/WEB_MENUS_ORDERS.md`. O projeto exige uma conta administradora aprovada para gerenciar clientes.

O editor livre `/admin/studio` e o editor de clientes `/admin/client/:id` continuam disponíveis. Para uma verificação estática do contrato do novo módulo (sem conexão ao Supabase), execute `node scripts/check-web-menu-contract.mjs`. Deploy: `docs/DEPLOYMENT.md` e `DEPLOY_RAILWAY.md`.
