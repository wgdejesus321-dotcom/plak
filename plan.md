# Reconstrução do editor livre PLAK

## Objetivo
Substituir integralmente o `ClientEditor` por um editor livre de páginas bio/sites, preservando o restante da aplicação, as rotas existentes e a persistência do negócio.

## Decisões
- O documento editável será uma lista de objetos em `features.blocks`.
- Cada objeto terá `id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `zIndex`, `visible`, `locked`, `opacity` e conteúdo/estilo.
- O canvas será um palco absoluto com coordenadas percentuais, permitindo arrastar, redimensionar, girar e sobrepor objetos.
- O painel de camadas exibirá a mesma lista do canvas e permitirá selecionar, ocultar, bloquear, excluir e alterar a ordem.
- O painel de propriedades editará posição, dimensão, rotação, opacidade, texto, cores e tipografia.
- Undo/redo será baseado em snapshots JSON apenas do documento serializável.
- Imagens serão carregadas por URL e continuarão compatíveis com o upload existente.
- A página pública será adaptada para renderizar blocos livres com posicionamento absoluto dentro de um palco responsivo.
- Campos legados de negócio continuam sendo salvos para manter compatibilidade com páginas já existentes.

## Estrutura
- `client/src/pages/freeCanvasModel.ts`: tipos, criação, comandos geométricos, histórico e migração.
- `client/src/pages/ClientEditor.tsx`: editor livre e integração Supabase.
- `client/src/pages/ClientEditor.css`: layout do editor e handles.
- `client/src/pages/freeCanvasModel.test.ts`: testes do modelo.
- `client/src/pages/PublicPage.tsx`: renderização pública dos objetos livres.

## Limites
A reconstrução será feita sem apagar dashboard, autenticação, dados, migrations ou editor Studio. O que será substituído é apenas a experiência de edição de `/admin/new` e `/admin/client/:id`.
