import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => {
  assert.ok(existsSync(path), `Arquivo ausente: ${path}`);
  return readFileSync(path, 'utf8');
};
const migration = read('supabase/migrations/0008_web_menus_orders.sql');
const app = read('client/src/App.tsx');
const styles = read('client/src/pages/WebMenu.css');
const data = read('client/src/lib/menu-data.ts');
const publicMenu = read('client/src/pages/PublicMenuPage.tsx');
const dashboard = read('client/src/pages/OrdersDashboard.tsx');
const tracking = read('client/src/pages/OrderTrackingPage.tsx');
const history = read('client/src/pages/OrderHistoryPage.tsx');
const supabase = read('client/src/lib/supabase.tsx');
const docs = read('docs/WEB_MENUS_ORDERS.md');

const tables = [
  'business_menus', 'menu_categories', 'menu_stations', 'menu_products',
  'menu_product_option_groups', 'menu_product_option_choices', 'menu_tables',
  'business_order_counters', 'menu_orders', 'menu_order_items',
  'menu_order_status_history', 'business_subscriptions',
];
for (const table of tables) {
  assert.match(migration, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'), `Tabela ausente: ${table}`);
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `RLS ausente: ${table}`);
}
for (const fn of ['place_menu_order', 'get_public_order_tracking', 'resolve_public_menu_table', 'list_accessible_businesses', 'get_public_menu_business']) {
  assert.match(migration, new RegExp(`function public\\.${fn}\\(`, 'i'), `RPC ausente: ${fn}`);
}
assert.match(migration, /unique \(business_id, order_date, daily_number\)/i, 'Falta unicidade na numeração diária');
assert.match(migration, /unique \(business_id, idempotency_key\)/i, 'Falta unicidade da idempotência');
assert.match(migration, /grant execute on function public\.place_menu_order[\s\S]*?to anon, authenticated/i, 'RPC pública controlada não está concedida');
assert.match(migration, /revoke insert, delete on public\.menu_orders[\s\S]*?from anon, authenticated/i, 'Inserção direta de pedidos não foi bloqueada');
assert.match(migration, /can_edit_business\(old\.business_id\)/i, 'Trigger não valida permissão ao avançar pedido');
assert.match(migration, /guard_menu_order_payment/i, 'Confirmação de pagamento não tem validação no banco');
assert.match(dashboard, /updateOrderPaymentStatus/, 'Painel sem ação explícita de confirmação de pagamento');
assert.match(app, /path="\/:slug\/cardapio"/i, 'Rota pública ausente');
assert.match(app, /path="\/painel\/pedidos"/i, 'Rota do painel de pedidos ausente');
assert.match(app, /path="\/painel\/cozinha"/i, 'Rota da cozinha ausente');
assert.match(app, /path="\/painel\/historico"/i, 'Rota de histórico ausente');
assert.match(app, /path="\/pedido\/:token"/i, 'Rota de acompanhamento seguro ausente');
for (const key of ['smash-dark', 'pizza-italiana', 'mesa-natural', 'delivery-bold', 'cafe-editorial']) {
  assert.ok(styles.includes(`plak-menu-theme-${key}`) || styles.includes(`wm-theme-${key}`), `Tema visual ausente: ${key}`);
}
assert.match(data, /p_idempotency_key:\s*input\.idempotencyKey/, 'Checkout não encaminha chave de idempotência');
assert.match(publicMenu, /checkoutKey\.current=""/, 'Chave de idempotência não é renovada depois de sucesso');
assert.match(publicMenu, /window\.location\.assign\(`\/pedido\/\$\{result\.tracking_token\}`\)/, 'Checkout não redireciona após resposta do banco');
assert.match(dashboard, /postgres_changes/, 'Assinatura Realtime ausente');
assert.match(dashboard, /type=\"time\"/, 'Filtro por horário ausente');
assert.match(dashboard, /setInterval\(\(\)=>void refresh\(true\),20000\)/, 'Consulta periódica de contingência ausente');
assert.match(tracking, /getPublicOrderTracking/, 'Acompanhamento não usa RPC com token');
assert.match(data, /rpc\(\"get_public_menu_business\"/, 'Cardápio público não usa RPC com campos mínimos');
assert.match(migration, /drop policy if exists business_menu_public_read on public\.businesses/i, 'Política pública ampla de businesses não foi removida');
assert.match(history, /topCategories/, 'Indicador por categoria ausente');
assert.match(supabase, /VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*import\.meta\.env\.VITE_SUPABASE_ANON_KEY/, 'Configuração de chave pública Supabase ausente');
assert.ok(!/VITE_SUPABASE_SERVICE_ROLE_KEY|VITE_SUPABASE_SECRET_KEY/.test(supabase), 'Segredo Supabase referenciado no cliente');
assert.match(docs, /sem credenciais de um Supabase de teste/i, 'Limitações de teste não documentadas');
console.log(`PASS: ${tables.length} tabelas com RLS; 5 RPCs; unicidade/idempotência; rotas; 5 temas; Realtime+polling; tracking tokenizado; relatórios; configuração pública sem chave secreta.`);
