# PLAK — Revisão completa do editor visual

## Editor visual
- Novo editor em formato de workspace, inspirado em ferramentas visuais como Canva.
- Pré-visualização central em formato de celular.
- Clique em qualquer bloco para abrir suas propriedades no painel lateral.
- Edição direta do nome e da frase na própria arte com duplo/edição inline.
- Painel de propriedades contextual para identidade, capa, logo, botões, catálogo, galeria, depoimentos e captação.
- Undo/redo local para alterações do editor.
- Organização por camadas/blocos.
- Ajustes de cores, tipografia, espaçamento e estilo dos botões.
- Capa com posição horizontal/vertical e overlay.
- Logo com tamanho, formato, encaixe e deslocamento.
- Galeria com upload de fotos/vídeos e texto alternativo.

## Catálogo e serviços
O antigo catálogo baseado apenas em texto/preço foi ampliado para uma estrutura comercial:
- produto ou serviço;
- imagem;
- categoria;
- selo de destaque;
- preço atual;
- preço anterior;
- duração;
- descrição orientada a benefício;
- lista de características/entregáveis;
- CTA configurável;
- link de compra/agendamento/WhatsApp;
- item em destaque.

As imagens dos itens de catálogo são armazenadas no Supabase Storage pelo mesmo mecanismo de assets da plataforma.

## Página pública
- Cards comerciais mais completos para produtos e serviços.
- Exibição de categoria, selo, preço promocional, duração, benefícios e CTA.
- Preservada compatibilidade com o formato antigo de catálogo por texto.
- Posições de capa, logo e imagens da galeria respeitadas na página pública.

## Direção de produto
Foram reduzidos fluxos excessivamente dependentes de formulários e concentrada a experiência no ato de montar a página visualmente. O objetivo é fazer a plataforma parecer uma ferramenta de criação de página, e não apenas um cadastro administrativo.
