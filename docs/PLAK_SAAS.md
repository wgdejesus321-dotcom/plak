# PLAK Studio — plataforma de criação e entrega de BioSites

## Visão geral
Fluxo do administrador: Criar cliente → escolher segmento → escolher modelo → inserir dados → personalizar → revisar → publicar → entregar o link. O cliente não precisa de login. As páginas ficam hospedadas na plataforma, em `/{endereço}`, usando React, TypeScript, Supabase e Express (stack original).

## Arquitetura encontrada
- Frontend: React 19, Vite 7, TypeScript, Tailwind 4, wouter (rotas) e componentes shadcn/Radix.
- Banco/autenticação: Supabase (Postgres, Auth, Storage, RLS). Administrador = `profiles.role = admin` e `access_status = approved`.
- Servidor: Express serve o build e `/api/health`; segredos do Supabase só no servidor.
- Rotas: `/admin` (painel), `/admin/new` e `/admin/client/:id` (editor), `/admin/studio` (editor livre), `/admin/templates`, `/admin/analytics/:id`, `/admin/leads`, `/admin/accounts`, `/:slug` (página pública).
- Editor atual: `ClientEditor` (painéis) e `StudioEditor` (canvas livre, separado). Modelos: `lib/templates.ts` e `TemplateLibrary` (mantidos).
- Dados do BioSite: tabelas `businesses`, `business_links`, `business_media`, `leads`, `analytics_events`; recursos extras em `businesses.features` (JSON).

Nada foi removido. Rotas, editores e modelos antigos continuam.

## O que foi adicionado
| Área | Arquivos principais |
|---|---|
| Dashboard SaaS | `pages/AdminDashboard.tsx`, `saas.css` |
| Assistente de criação (4 passos) | `pages/CreateWizard.tsx` em `/admin/create` |
| Segmentos e 12 modelos | `lib/segments.ts`, `lib/blueprints.ts` |
| Biblioteca de blocos | `components/BlockLibrary.tsx`, painel “Blocos” no editor |
| Prévia fiel (celular/desktop) | `components/LivePreview.tsx` |
| Entrega e checklist | `pages/DeliveryPage.tsx`, `lib/delivery.ts` |
| Preparação para escala | `lib/plans.ts`, `lib/domains.ts`, `lib/clientArea.ts`, migration 0007 |
| Preparação para IA | `lib/ai.ts` |

### Dashboard
Indicadores: total de clientes, publicados, em edição (inclui revisão), visualizações e conversões dos últimos 30 dias. Conversões = cliques rastreados + leads recebidos. “Meus Clientes” mostra logo, nome, categoria, status, data de atualização, Editar, Visualizar e Publicar/Entregar, além de duplicar, estatísticas, revisão, desativar/reativar e remover. Status: Em edição, Revisão, Publicado, Inativo. Categoria e revisão ficam em `features.meta`, sem migration.

### Criação
1. Categoria: restaurante, barbearia, clínica, loja, imobiliária, profissional.
2. Empresa: nome, endereço do site, descrição, WhatsApp, Instagram, endereço, horários, produtos/serviços, promoção, logo, foto principal e até 8 fotos. Clínica também tem especialidades e equipe.
3. Modelo: 2 por segmento (12 no total).
4. Gerar: cria um rascunho e abre o editor. Nada fica público até a entrega.

O WhatsApp brasileiro recebe `55` automaticamente quando tem 10 ou 11 dígitos. O botão “Sugerir descrição” usa regras locais, não um modelo de IA, e não inventa prêmios, preços, avaliações ou endereços.

Itens de exemplo são opcionais, ficam marcados como EXEMPLO e bloqueiam a publicação pela tela de entrega até serem substituídos. Depoimentos nunca são gerados.

### Editor
Esquerda: painéis e Biblioteca de blocos (banner, galeria, produtos, cardápio, botões, WhatsApp, Instagram, mapa, avaliações, contato, texto, horários). Centro: prévia “Página real” (usa o componente público) ou “Prévia rápida”, em celular ou desktop. Direita/painel: cores, fontes, espaçamento, botões, animações e imagens. Os blocos têm título, texto, itens, botão, alinhamento, cor de fundo, visibilidade e ordem. Produtos/cardápio têm nome, descrição, preço, categoria, destaque, imagem e botão.

### Escala e IA (somente estrutura)
- Planos Básico, Premium e Agência em `lib/plans.ts`. Sem preços e sem bloqueio ativo (`PLAN_ENFORCEMENT_ENABLED = false`).
- Domínio próprio: `publicUrlFor` usa o domínio só quando `features.meta.domain_status = active`. Roteamento por hostname, DNS e certificado NÃO estão implementados. A migration 0007 cria `business_domains` (opcional).
- Área do cliente: `lib/clientArea.ts` define papéis/permissões; `business_members` é criada vazia na 0007. Nenhuma política para clientes foi aberta.
- IA: interface `BioSiteGenerator`; a implementação atual (`rules-v1`) é determinística e offline.

## Instalação e atualização
Faça backup. Teste em homologação.
1. Node 20.19+ ou 22.12+ e pnpm 10.4.1.
2. Copie `docs/ENV.example` para `.env`; use apenas variáveis públicas `VITE_*` no frontend.
3. `pnpm install --frozen-lockfile`.
4. Aplique no Supabase, em ordem, as migrations ainda não aplicadas de 0001 a 0006. A 0006 (`save_biosite`) é obrigatória. A 0007 é opcional.
5. Garanta uma conta admin aprovada em `profiles`.
6. `pnpm check`, `pnpm test`, `pnpm build`, depois `pnpm dev` ou `pnpm start`.
7. Publique no domínio de produção antes de entregar links.

Docker: passe `--build-arg VITE_SUPABASE_URL=...` e `--build-arg VITE_SUPABASE_PUBLISHABLE_KEY=...` (nunca a chave secreta).

## Verificação: leia antes de usar
NÃO foi possível executar `pnpm install`, `pnpm check`, `pnpm test` nem `pnpm build` onde este pacote foi preparado (sem acesso à internet, sem dependências instaladas). Portanto:
- Não há comprovação de que o build passa nem de que o projeto inicia. Podem existir erros de TypeScript ou de execução.
- Passaram 25 verificações de lógica em Node (URLs, endereço, WhatsApp, detecção de segmento/cidade, domínio), usando as funções com anotações de tipos removidas.
- Conferência de balanceamento de chaves e parênteses nos arquivos novos.
- Os testes Vitest (`validation`, `blueprints`, `delivery`, `ai`) estão escritos, mas NÃO foram executados.
- O SQL das migrations não foi executado em PostgreSQL/Supabase.
- Nenhuma conferência visual em navegador, celular ou leitor de tela.
Rode os comandos acima e corrija o que aparecer antes de entregar páginas a clientes.

## Mudanças de comportamento
- O painel exige administrador aprovado.
- Publicar pela lista agora passa pela tela de entrega (checklist).
- O salvamento usa a função `save_biosite` (transação única).
- O editor continua descartando `canvas_objects` ao salvar: ele os recria ao abrir a página e preservá-los transformaria toda página em layout livre. (Uma versão anterior deste trabalho sugeriu o contrário; isso foi revertido.)
- Links com esquemas não permitidos são rejeitados.
- Ferramentas de debug da Manus ficam desligadas (`ENABLE_MANUS_TOOLS=true` para reativar em desenvolvimento).

## Segurança
O ZIP original continha credenciais em `.project-config.json`. O arquivo foi removido do pacote, mas as chaves continuam válidas até você revogá-las nos serviços de origem. Leads e analytics ainda aceitam INSERT público sem proteção real contra spam. Isto não é uma auditoria completa.

## Limitações conhecidas
- Modelos usam as fontes e seções da página pública existente; não há comparação visual validada.
- A página pública não segue a ordem de seções configurada; blocos aparecem depois da galeria.
- Limpeza de uploads órfãos, rascunho separado do publicado, QR Code de entrega, exportação HTML, edição pelo cliente, cobrança, domínio próprio funcional e IA generativa não foram implementados.
- Visualizações do painel contam eventos de páginas publicadas; conversões são aproximadas pela definição acima.

## Homologação sugerida
1. Criar um BioSite por segmento pelo assistente e abrir no editor.
2. Conferir a prévia “Página real” em celular e desktop.
3. Adicionar produto com imagem, bloco de WhatsApp, mapa e horário; salvar; recarregar.
4. Confirmar que um modelo não editado é bloqueado na entrega.
5. Publicar, abrir em janela anônima no celular e testar todos os botões.
6. Enviar um lead anônimo e conferir no painel.
7. Conferir que uma conta não administradora é barrada.
8. Rodar `pnpm check`, `pnpm test`, `pnpm build`.
