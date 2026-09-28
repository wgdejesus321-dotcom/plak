# Plak — alterações aplicadas

## Correções implementadas

- Substituição da identidade antiga por **Plak** no frontend, health check, package e documentação.
- Nova marca visual inspirada na logo enviada: símbolo com `P`, ondas de sinal e wordmark `PLAK`.
- Página pública com metadata dinâmica (`title`, description, Open Graph e Twitter Card).
- Links públicos normalizados por tipo: site, e-mail, telefone, WhatsApp e mapas.
- `rel="noopener noreferrer"` em links externos.
- Evento de compartilhamento incluído no analytics.
- Rastreamento de dispositivo corrigido: mobile, tablet e desktop em vez de registrar tudo como mobile.
- Analytics com estado vazio correto, compartilhamentos, labels em português e feedback de cópia do link.
- Editor com validação centralizada de slug, cores, URLs e tamanho/tipo de arquivo.
- Upload de logo, background e **múltiplas mídias pendentes** corrigido; o código anterior só mantinha o último arquivo escolhido.
- Arquivos locais `blob:` nunca são persistidos no banco.
- Queries Supabase com colunas explícitas para reduzir exposição e payload desnecessário.
- Sessões pendentes/revogadas agora são bloqueadas pelo shell administrativo.
- `/admin/accounts` exige admin aprovado, impede ações sobre a própria conta e respeita contas protegidas.
- Migration `0002_plak_hardening.sql` adicionada com bloqueio de `blob:`, trigger de `updated_at`, proteção de perfil e índice de analytics.
- Tratamento público de indisponibilidade sem revelar erro técnico do Supabase ao visitante.

## Validação executada

- `pnpm check` — aprovado.
- `pnpm build` — aprovado; há apenas o aviso de chunk frontend acima de 500 kB.
- `pnpm test` — aprovado: 4 testes.
- Servidor de produção local — aprovado: `/api/health` retornou `{ "ok": true, "service": "plak" }` e `/admin` respondeu `200`.

## Publicação

1. Execute `pnpm install` e `pnpm build`.
2. Aplique as migrations versionadas, incluindo `supabase/migrations/0002_plak_hardening.sql`.
3. Confira as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no frontend.
4. Faça o deploy do conteúdo construído pela Railway/Cloudflare conforme o README.
5. Depois do deploy, valide login, aprovação de conta, criação/edição, upload, publicação, analytics e página pública em dispositivo móvel.

## Próxima evolução recomendada

- Adicionar testes E2E de autenticação, upload, publicação e ações administrativas.
- Fazer code splitting por rota para reduzir o chunk inicial.
- Adicionar geração de QR Code dentro do painel.
- Migrar metadata pública para SSR/edge se SEO em redes sociais for prioridade crítica.
