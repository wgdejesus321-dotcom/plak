# PLAK Studio — pacote de alterações

## Escopo
Projeto completo com Home comercial escura premium, sete seções, quatro exemplos fictícios em celulares e modal de apresentação. Visual grafite e violeta, logo existente em versão clara, responsividade por CSS, acesso discreto ao login.
Os visuais dos celulares são ilustrações geométricas em CSS, não fotos de empresas. Botões demonstrativos não têm destino externo. Não há métricas de clientes inventadas nem exemplos publicados no banco.
O dashboard, editor por blocos e novas métricas de analytics NÃO foram implementados nesta entrega.

## Proteções técnicas incluídas
PublicPage.tsx: proteção de split em textos ausentes, coleções inválidas e certos campos nulos.
data.ts: mídia sem URL é descartada antes de startsWith.
main.tsx: ErrorBoundary conectado à aplicação.
ErrorBoundary.tsx: mensagem em português e stack apenas em desenvolvimento.
LivePreview.tsx: preservação de canvas_objects para reduzir divergência com a publicação.
Não modifica banco de dados ou políticas RLS e não confirma a causa exata do erro no site publicado.

## Aplicação
Faça backup e preserve suas variáveis de ambiente. O ZIP foi gerado a partir do projeto original anexado nesta conversa com as alterações desta entrega. Não é uma cópia byte a byte dos ZIPs anteriores; compare antes de substituir mudanças locais.
Abra a pasta plakwork no terminal. Requer Node >=20 e pnpm.

pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build

Para desenvolvimento: pnpm dev
Para prévia do frontend compilado: pnpm preview
Não é necessária migration para estas alterações.
Verifique a Home no desktop e celular, navegação interna, abertura/fechamento dos exemplos, login, prévia interna e página pública em janela anônima antes do deploy.

## Validação desta entrega
Checagens estáticas das âncoras internas, sete seções e arquivos de logo. Integridade ZIP verificada.
Não foram executados build, typecheck, testes React ou testes visuais no navegador. Não houve deploy, acesso ao Supabase ou alteração em serviços externos.
