# PLAK Editor Pro Max

Esta versão evolui o editor de formulário para um editor visual por blocos, mantendo compatibilidade com a estrutura anterior.

## Experiência visual
- Edição direta do nome e da frase no canvas.
- Arraste da logo e zoom pela roda do mouse.
- Arraste e zoom da imagem de capa.
- Arraste e zoom das imagens da galeria.
- Zoom e reposicionamento das imagens de catálogo.
- Tamanho, cores e fontes de título/frase.
- Desfazer/refazer.
- Reordenação visual de seções e blocos.

## Biblioteca de blocos
- Texto
- Imagem
- Vídeo
- Depoimento
- Oferta
- Redes sociais
- Mapa
- Horários
- FAQ
- Agendamento
- Divisor

Cada bloco pode ser selecionado, editado, duplicado, excluído, ocultado e reordenado.

## Estruturas rápidas
- Restaurante
- Loja
- Beleza
- Profissional

São pontos de partida editáveis, não templates rígidos.

## Catálogo e serviços
Mantém produto/serviço com imagem, categoria, selo, preço atual/anterior, duração, descrição, características, CTA, destaque e controle visual da imagem.

## Galeria
A galeria continua sem fundo obrigatório e pode usar composição flutuante, mosaico, grade ou editorial. A cor do fundo pode ser transparente ou personalizada.

## Página pública
Os novos blocos e estilos são renderizados na página pública para evitar divergência entre editor e resultado final.

## Deploy
O pacote não contém node_modules, dist, build ou caches. `.dockerignore` e `.gitignore` impedem que dependências locais sejam enviadas ao build do Railway.
