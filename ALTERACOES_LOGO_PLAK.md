# Atualização da identidade visual do PLAK

## O que foi alterado
- O componente compartilhado `BrandLogo` agora usa o símbolo e o lettering oficiais do PLAK em PNG com fundo transparente.
- A versão clara da marca é usada em superfícies escuras; a versão escura é usada em superfícies claras.
- A logo foi atualizada nos locais que reutilizam `BrandLogo`, incluindo página inicial, acesso e painel administrativo.
- A imagem do símbolo no mockup da página inicial também usa o novo arquivo transparente.
- O favicon do site agora usa o símbolo do PLAK.

## Arquivos principais
- `client/src/components/BrandLogo.tsx`
- `client/src/pages/Home.tsx`
- `client/index.html`
- `client/public/plak-mark.png`
- `client/public/plak-mark-light.png`
- `client/public/plak-wordmark.png`
- `client/public/plak-wordmark-light.png`

## Validação
Os caminhos dos assets e as referências no código foram conferidos. Não foi possível executar build/testes nesta sessão porque as dependências do projeto não estão instaladas e o ambiente não conseguiu acessar o registry do npm para instalá-las. Esta entrega atualiza a identidade visual; não representa uma reformulação completa do editor.
