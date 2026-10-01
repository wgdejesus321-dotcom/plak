# Relatório da segunda auditoria — PLAK Studio

**Data:** 2026-10-01  
**Projeto auditado:** `plak-studio-editor-reconstruido.zip` após a primeira entrega  
**Rota validada:** `/admin/studio`

## Escopo executado

A auditoria não recriou o projeto. O código existente foi preservado, o editor atual foi ampliado e os testes foram adicionados especificamente ao modelo do Studio.

### Correções implementadas

- Movimento direto dos objetos no canvas sem bloquear a edição do conteúdo de textos.
- Edição de texto em `textarea`, incluindo quebras de linha, com transação de histórico ao sair do campo.
- Histórico transacional de undo/redo para movimento, redimensionamento, rotação, edição de texto, propriedades, ordem, agrupamento, upload e recorte.
- Resize em eixo local para objetos rotacionados, com preservação proporcional usando Shift.
- Rotação por alça dedicada e campo de rotação nas propriedades.
- Exportação SVG intermediária para PNG/JPEG com dimensões do documento, quebras de linha, alinhamento, fonte, peso, line-height, imagens, opacidade, rotação e recortes.
- Seleção consistente entre canvas e camada; Shift alterna seleção múltipla e grupos são selecionados como conjunto.
- Agrupar e desagrupar pela interface e pelo atalho Ctrl/Cmd+G.
- Guias verticais/horizontais durante o arraste quando bordas ou centros se aproximam.
- Upload de imagem com validação e recorte independente nas quatro bordas.
- Recolhimento persistente dos painéis laterais continua funcionando.

## Testes executados e resultado

| Categoria | Comando/ação | Resultado |
|---|---|---|
| Tipos | `pnpm check` | **Aprovado** — TypeScript sem erros |
| Testes automatizados | `pnpm test` | **Aprovado** — 2 arquivos, 8 testes |
| Build | `pnpm build` | **Aprovado** — Vite frontend e esbuild server |
| Saúde do servidor | `GET /api/health` | **Aprovado** — `{"ok":true,"service":"plak"}` |
| Abertura do editor | Navegador em `/admin/studio` | **Aprovado** |
| Movimento de texto | Arraste simulado no canvas; posição observada mudou de X=90/Y=100 para X=155/Y=148 | **Aprovado** |
| Edição multilinha | Preenchimento real do `textarea` com `Linha 1\nLinha 2` | **Aprovado** |
| Undo/redo | Undo restaurou texto e posição anteriores; redo foi exercitado no fluxo | **Aprovado** |
| Seleção múltipla | Dois cliques sequenciais, segundo com Shift; painel mostrou `2 objetos selecionados` | **Aprovado** |
| Agrupamento | Botão Agrupar criou grupo; botão Desagrupar ficou disponível e foi executado | **Aprovado** |
| Guias | Arraste próximo a alinhamento; `.ps-guide` apareceu durante o movimento | **Aprovado** |
| Upload | Upload de PNG de teste pelo input de arquivo | **Aprovado** — 7 objetos e 1 imagem no canvas |
| Recorte | Recorte esquerdo de 10%; estilo observado: `inset(0% 0% 0% 10%)` | **Aprovado** |
| Exportação PNG | Botão PNG acionado no navegador | **Executado sem erro fatal**; o browser sandbox não disponibilizou um novo arquivo baixado para inspeção local nesta rodada |
| Exportação JPEG | Botão JPEG acionado no navegador | **Executado sem erro fatal**; o browser sandbox não disponibilizou um novo arquivo baixado para inspeção local nesta rodada |
| Painel esquerdo | Recolher, recarregar e verificar botão `Mostrar ferramentas` | **Aprovado** |
| Console | Console do navegador após interações | **Sem erro fatal observado** |
| Persistência local | Estado do documento e painel após recarregar | **Aprovado** |
| Persistência remota | Supabase real, salvar, reabrir e recarregar | **Pendente por ambiente** — não há variáveis `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`, projeto conectado ou sessão autenticada disponíveis |

## Testes automatizados específicos do editor

Arquivo: `client/src/pages/studioEditorModel.test.ts`

Coberturas:

1. Resize rotacionado com preservação proporcional.
2. Seleção de grupo e alternância com Shift.
3. Guias de alinhamento entre centros/bordas.
4. Exportação SVG com dimensões, fonte, alinhamento e quebras de linha.

Os testes de servidor existentes continuam passando, mas não foram considerados suficientes para aprovar o editor.

## Pendências e limites

- **Supabase remoto não aprovado nesta auditoria:** a migration e as funções de dados estão presentes, mas o ambiente recebido não permite provar uma operação contra banco real. Para fechar essa etapa, aplicar `supabase/migrations/0005_studio_projects.sql`, configurar as duas variáveis públicas, autenticar um administrador e repetir salvar, reabrir e recarregar.
- PNG/JPEG foram acionados no navegador sem erro fatal, mas a camada de browser isolado desta sessão não entregou novos downloads em `/home/ubuntu/Downloads` para validação por `file`. A cobertura determinística do conteúdo exportado está no teste SVG e no build; uma validação de artefato baixado deve ser repetida em um browser com downloads expostos.
- O exportador continua limitado aos tipos de objeto suportados pelo editor; PDF e SVG como formatos de download não fazem parte desta solicitação.
- O recorte é não destrutivo por percentuais; não há ferramenta de arraste visual de máscara, apenas os quatro controles numéricos.

## Arquivos principais da entrega

- `client/src/pages/StudioEditor.tsx`
- `client/src/pages/StudioEditor.css`
- `client/src/pages/studioEditorModel.ts`
- `client/src/pages/studioEditorModel.test.ts`
- `supabase/migrations/0005_studio_projects.sql`
- `RELATORIO_AUDITORIA_2_PLAK_STUDIO.md`
- `CHANGELOG_EDITOR_PROFISSIONAL.md`
