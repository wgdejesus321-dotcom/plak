# Changelog — reconstrução do editor livre PLAK

## Nova implementação

O editor de `/admin/new` e `/admin/client/:id` foi reconstruído do zero em relação à experiência de edição. O editor antigo por áreas fixas foi substituído por um palco de objetos livre, mantendo o restante da aplicação, a autenticação, as rotas, o modelo de negócios e a persistência Supabase.

O documento do editor agora é serializado em `features.blocks`. Cada objeto possui identificador, tipo, posição X/Y em percentual, largura, altura, rotação, opacidade, ordem de sobreposição, visibilidade, bloqueio, conteúdo e estilo. Isso permite mover elementos sem destruir o conteúdo da página.

## Recursos implementados

- criar objetos de texto, imagem, botão e forma;
- editar título e conteúdo diretamente no canvas;
- arrastar objetos;
- redimensionar pela alça inferior direita;
- girar pela alça superior;
- sobrepor objetos e alterar a ordem para frente/trás;
- duplicar e excluir objetos;
- selecionar pelo canvas ou pelo painel de camadas;
- ocultar e bloquear objetos;
- editar posição, dimensões, rotação e opacidade no painel;
- upload de imagens com URL temporária durante a edição e upload permanente no salvamento;
- undo/redo por snapshots do documento;
- atalhos de Delete, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z e Ctrl/Cmd+Y;
- renderer público compatível com os objetos salvos;
- migração de blocos antigos para coordenadas livres com valores padrão.

## Validação executada

- `pnpm install --frozen-lockfile`: aprovado;
- `pnpm check`: aprovado;
- `pnpm test`: aprovado, 3 arquivos e 12 testes;
- `pnpm build`: aprovado, frontend e servidor gerados;
- testes específicos do modelo: criação, serialização, movimento, limites, resize, rotação, camadas, duplicação, remoção e migração.

## Limitações conhecidas

A validação autenticada do fluxo Supabase depende das credenciais e da sessão do ambiente de produção. O pacote contém a integração com `saveBusiness` e `uploadAsset`, mas o teste remoto exige um projeto Supabase configurado.

O renderer público livre é intencionalmente focado nos objetos do editor. Páginas antigas sem `features.blocks` continuam usando o renderer legado. Páginas que já possuam blocos antigos são migradas para a geometria padrão do editor na abertura.
