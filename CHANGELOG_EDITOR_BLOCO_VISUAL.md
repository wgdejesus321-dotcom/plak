# PLAK — Editor Visual por Blocos

## Evolução

- Canvas central com seleção direta dos blocos.
- Blocos reorganizáveis por arrastar e soltar.
- Camadas persistidas em `features.layout.section_order`.
- Seções podem ser ocultadas e reexibidas por `features.layout.hidden_sections`.
- Seleção visual mostra o nome do bloco sobre a arte.
- Botões, campanha, catálogo, depoimentos, captação, galeria e endereço passaram a ser tratados como blocos.
- Histórico de desfazer/refazer continua funcionando para as alterações.
- Itens de catálogo podem ser duplicados rapidamente.
- Mantida a edição direta do nome e da frase no canvas.

## Observação

A ordem/visibilidade foi adicionada ao modelo do editor. A página pública atual continua renderizando sua estrutura existente; para sincronizar visualmente a ordem pública com a ordem do editor, o próximo passo pode aplicar `section_order` também ao renderer público.
