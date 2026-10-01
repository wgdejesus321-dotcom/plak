# Galeria e posicionamento livre — 30/09/2026

- Galeria do editor agora aceita múltiplos arquivos na seleção de upload.
- Cada foto tem controles de enquadramento: arraste no quadro, ajuste horizontal/vertical e zoom, com opção para redefinir.
- Fotos e botões personalizados podem ser reordenados por alça de arraste no desktop e por setas em telas touch.
- Camadas de seções têm controles de subir/descer, além do arraste existente.
- A prévia do editor mostra todos os itens da galeria, não apenas os quatro primeiros.
- A página pública agora respeita `features.layout.section_order` e `hidden_sections`, refletindo a ordem configurada no editor.

## Verificação realizada

- Transpilação sintática TSX de `ClientEditor.tsx` e `PublicPage.tsx` sem diagnósticos.
- Verificação estática dos controles de ordenação, enquadramento e renderização da ordem pública.
- A compilação completa e testes de navegador não foram executados porque as dependências do projeto não estão instaladas neste ambiente.
