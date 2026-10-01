# Changelog — PLAK Studio Editor profissional

## Segunda auditoria — 2026-10-01

### Corrigido e implementado

- Movimento direto no canvas sem impedir a edição de textos.
- Edição multilinha registrada como transação de undo/redo ao sair do campo.
- Histórico de undo/redo para movimento, resize, rotação, propriedades, camadas, grupos, upload e recorte.
- Redimensionamento em eixo local para objetos rotacionados e preservação proporcional com Shift.
- Rotação por alça dedicada.
- Seleção consistente entre canvas e painel de camadas; seleção múltipla com Shift.
- Agrupamento e desagrupamento pela interface.
- Guias de alinhamento verticais/horizontais durante arraste.
- Upload de imagem e recorte não destrutivo por percentual nas quatro bordas.
- Exportação PNG/JPEG via SVG intermediário, preservando dimensões, quebras de linha, alinhamento, fonte, line-height, imagens, opacidade, rotação e recortes.
- Testes automatizados específicos do editor em `client/src/pages/studioEditorModel.test.ts`.

### Validação desta auditoria

- `pnpm check`: aprovado.
- `pnpm test`: aprovado — 2 arquivos e 8 testes.
- `pnpm build`: aprovado.
- `/api/health`: HTTP 200 com `{"ok":true,"service":"plak"}`.
- Navegador: movimento, edição multilinha, undo/redo, seleção múltipla, agrupamento/desagrupamento, guias, upload, recorte e recolhimento persistente foram executados.
- Navegador: PNG e JPEG foram acionados sem erro fatal; o browser sandbox não expôs novos downloads locais nesta rodada.
- Supabase remoto: pendente de teste contra instância real porque não há variáveis, projeto conectado ou sessão autenticada no ambiente recebido.

## Primeira entrega

- Painel esquerdo de ferramentas recolhível com estado persistido no navegador e botão flutuante de retorno.
- Painel direito de propriedades também recolhível.
- Presets de dimensões para Post, Story e Banner.
- Elementos de texto, retângulo, círculo, linha e imagem.
- Tipografia contextual, opacidade, ordenação, duplicação, exclusão, bloqueio e ocultação.
- Upload com validação de tipo e limite de 10 MB.
- Persistência real no Supabase por meio da tabela `studio_projects`, quando configurado e autenticado.
- Fallback offline explícito para `localStorage`.
- Migration `supabase/migrations/0005_studio_projects.sql` com RLS.
- Rota `/admin/studio` e identidade visual PLAK preservadas.

## Execução

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

Para persistência remota, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, aplique as migrations e acesse `/admin/studio` com administrador autenticado. Sem essas variáveis, a interface informa “Salvo neste navegador”.
