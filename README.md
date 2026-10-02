

## Editor livre PLAK Studio

O editor livre está disponível em `/admin/studio`. Os painéis laterais podem ser recolhidos: o painel esquerdo fica acessível por uma seta flutuante na borda e essa preferência é preservada no navegador. O painel de propriedades também pode ser recolhido para ampliar o canvas.

A persistência remota do documento usa a migration `supabase/migrations/0005_studio_projects.sql` e a tabela `studio_projects`, protegida por RLS para administradores autenticados. Sem Supabase configurado, o editor informa claramente que está salvando neste navegador e usa o fallback local para permitir trabalho offline sem simular sucesso remoto. PNG, JPEG e `.plak.json` podem ser exportados diretamente pelo topo do editor.

Consulte `CHANGELOG_EDITOR_PROFISSIONAL.md` para o escopo, testes executados e limitações verificadas.


## Editor livre de páginas bio/sites

A edição de novos clientes está em `/admin/new` e a edição de clientes existentes em `/admin/client/:id`. Essa experiência foi reconstruída como um palco livre de objetos. É possível criar texto, imagem, botão e forma; editar diretamente no canvas; arrastar; redimensionar; girar; sobrepor; duplicar; excluir; ocultar; bloquear; alterar a ordem das camadas; editar propriedades; fazer undo/redo e salvar a página.

O documento livre é salvo em `features.blocks` e a página pública usa o renderer correspondente quando existem blocos livres. Páginas sem blocos continuam no renderer legado. O restante do produto, incluindo autenticação, painel, Supabase, uploads e deploy Railway, foi preservado.

Consulte `CHANGELOG_EDITOR_LIVRE.md` para o escopo e os testes executados e `DEPLOY_RAILWAY.md` para o deploy.
