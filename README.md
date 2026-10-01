

## Editor livre PLAK Studio

O editor livre está disponível em `/admin/studio`. Os painéis laterais podem ser recolhidos: o painel esquerdo fica acessível por uma seta flutuante na borda e essa preferência é preservada no navegador. O painel de propriedades também pode ser recolhido para ampliar o canvas.

A persistência remota do documento usa a migration `supabase/migrations/0005_studio_projects.sql` e a tabela `studio_projects`, protegida por RLS para administradores autenticados. Sem Supabase configurado, o editor informa claramente que está salvando neste navegador e usa o fallback local para permitir trabalho offline sem simular sucesso remoto. PNG, JPEG e `.plak.json` podem ser exportados diretamente pelo topo do editor.

Consulte `CHANGELOG_EDITOR_PROFISSIONAL.md` para o escopo, testes executados e limitações verificadas.
