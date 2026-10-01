# PLAK Studio — editor livre reconstruído

Foi adicionada uma nova experiência de edição livre em `/admin/studio`, acessível pelo botão **Editor livre** no painel administrativo.

## Recursos implementados
- Canvas com dimensões e fundo configuráveis, zoom e grade opcional.
- Adição de texto, retângulos, círculos e imagens locais.
- Seleção direta de objetos, arraste, redimensionamento pelas oito alças e rotação.
- Propriedades de posição, tamanho, rotação, opacidade, cor e tipografia.
- Fontes selecionáveis (incluindo Poppins, Lora, Playfair Display e Montserrat), com carregamento via Google Fonts.
- Painel de camadas, seleção por camada, ordenação, duplicação e exclusão.
- Atalhos de teclado, desfazer/refazer, salvamento local automático e manual.
- Salvar e reabrir modelos no navegador.
- Exportação do projeto JSON e exportação da página como HTML.
- Painel esquerdo recolhível e layout adaptado a telas menores.

## Observações
O editor novo é uma ferramenta independente do fluxo de cadastro de clientes existente. O documento é salvo no armazenamento local do navegador; para levar o projeto a outro dispositivo, use **Projeto** para exportar o JSON. A publicação integrada ao banco de dados/URL do cliente não foi ligada a esta nova ferramenta.
