# Capa e imagem de fundo independentes

- Adicionada a opção de imagem de fundo da página em Propriedades > Página.
- A imagem de fundo preenche o fundo geral da página e não depende da capa.
- A capa agora possui imagem própria (`features.layout.cover_image_url`) e pode ser ativada/desativada ou removida independentemente.
- O upload da capa e o upload do fundo usam caminhos de armazenamento separados (`cover/` e `background/`).
- A prévia do editor, a prévia privada e a página pública distinguem capa e fundo.
- Compatibilidade: páginas antigas que tinham imagem de fundo e capa ativada recebem a URL antiga como capa na abertura do editor; é possível desativar/remover a capa e manter apenas o fundo.
