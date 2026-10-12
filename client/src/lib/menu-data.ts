import { supabase } from "@/lib/supabase";

export type MenuTemplateKey = "smash-dark" | "pizza-italiana" | "mesa-natural" | "delivery-bold" | "cafe-editorial";
export type Fulfillment = "dine_in" | "pickup" | "delivery";
export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled";
export type PaymentMethod = "pix" | "card" | "cash";

export interface OrderSettings {
  allow_dine_in: boolean;
  allow_pickup: boolean;
  allow_delivery: boolean;
  allow_manual_table_number: boolean;
  delivery_fee_cents: number;
  estimated_prep_minutes: number;
  alert_sound: boolean;
  currency: "BRL";
}
export interface MenuRecord {
  id: string;
  business_id: string;
  name: string;
  template_key: MenuTemplateKey;
  settings: OrderSettings;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface MenuCategory { id: string; business_id: string; name: string; description: string | null; position: number; is_active: boolean; }
export interface MenuStation { id: string; business_id: string; name: string; position: number; is_active: boolean; }
export interface MenuChoice { id: string; group_id: string; name: string; price_cents: number; is_active: boolean; position: number; }
export interface MenuOptionGroup { id: string; business_id: string; product_id: string; name: string; is_required: boolean; min_selections: number; max_selections: number; position: number; is_active: boolean; choices: MenuChoice[]; }
export interface MenuProduct {
  id: string; business_id: string; category_id: string | null; station_id: string | null; name: string;
  description: string; price_cents: number; image_url: string | null; is_available: boolean; is_featured: boolean; position: number;
  option_groups?: MenuOptionGroup[];
}
export interface MenuTable { id: string; business_id: string; table_number: string; qr_token: string; is_active: boolean; }
export interface MenuBusiness { id: string; name: string; slug: string; logo_url: string | null; tagline: string; primary_color: string; secondary_color: string; background_color: string; status?: string; }
export interface MenuBundle { business: MenuBusiness; menu: MenuRecord | null; categories: MenuCategory[]; products: MenuProduct[]; stations: MenuStation[]; tables?: MenuTable[]; }
export interface PublicMenuBundle extends Omit<MenuBundle, "menu"> { menu: MenuRecord; }
export interface OrderItem {
  id: string; order_id: string; product_id: string | null; category_id: string | null; station_id: string | null;
  product_name: string; category_name: string | null; station_name: string | null; quantity: number; base_price_cents: number;
  unit_price_cents: number; line_total_cents: number; selected_options: Array<{id: string; group_name: string; name: string; price_cents: number}>; notes: string | null;
}
export interface MenuOrderStatusHistory { id: number; order_id: string; from_status: OrderStatus | null; to_status: OrderStatus; note: string | null; changed_by: string | null; changed_at: string; }
export interface MenuOrder {
  id: string; business_id: string; menu_id: string; order_date: string; daily_number: number; status: OrderStatus;
  fulfillment: Fulfillment; customer_name: string; customer_phone: string; customer_address: string | null; table_number: string | null;
  customer_notes: string | null; payment_method: PaymentMethod; payment_status: "pending" | "confirmed" | "failed" | "refunded";
  subtotal_cents: number; delivery_fee_cents: number; total_cents: number; estimated_prep_minutes: number; cancel_reason: string | null;
  kitchen_notes: string | null; stage_updated_at: string; created_at: string; updated_at: string; menu_order_items: OrderItem[];
}

export const DEFAULT_ORDER_SETTINGS: OrderSettings = {
  allow_dine_in: true,
  allow_pickup: true,
  allow_delivery: false,
  allow_manual_table_number: true,
  delivery_fee_cents: 0,
  estimated_prep_minutes: 25,
  alert_sound: false,
  currency: "BRL",
};

export const MENU_TEMPLATES: { id: MenuTemplateKey; name: string; subtitle: string; shape: string; recommended: string }[] = [
  { id: "smash-dark", name: "Smash House", subtitle: "Escuro, intenso e visual", shape: "Fotografia ampla, cartões escuros e destaque para combos", recommended: "Hamburguerias" },
  { id: "pizza-italiana", name: "Forno Italiano", subtitle: "Tradição e elegância", shape: "Cabeçalho editorial, tons terrosos e preço bem legível", recommended: "Pizzarias" },
  { id: "mesa-natural", name: "Mesa Natural", subtitle: "Leve e acolhedor", shape: "Fundo claro, composição arejada e descrições em destaque", recommended: "Restaurantes" },
  { id: "delivery-bold", name: "Express Delivery", subtitle: "Direto ao pedido", shape: "Categorias compactas, chamadas fortes e carrinho destacado", recommended: "Lanchonetes e delivery" },
  { id: "cafe-editorial", name: "Café Editorial", subtitle: "Artesanal e delicado", shape: "Tipografia elegante, tons de café e fotos em mosaico", recommended: "Cafeterias e confeitarias" },
];

function db() { if (!supabase) throw new Error("Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_ANON_KEY). "); return supabase; }
function throwError(error: { message?: string; code?: string } | null, fallback: string): never | void {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205") throw new Error("As tabelas do Web Cardápio ainda não existem no Supabase. Aplique a migration 0008_web_menus_orders.sql.");
  if (error.code === "PGRST202") throw new Error("A função do Web Cardápio ainda não existe no Supabase. Aplique a migration 0008_web_menus_orders.sql.");
  throw new Error(error.message || fallback);
}

export async function listAccessibleBusinesses(): Promise<MenuBusiness[]> {
  const { data, error } = await db().rpc("list_accessible_businesses");
  throwError(error, "Não foi possível carregar os estabelecimentos autorizados.");
  return (data ?? []) as MenuBusiness[];
}

export async function getMenuForBusiness(businessId: string): Promise<MenuBundle | null> {
  const client = db();
  const { data: business, error: businessError } = await client.from("businesses")
    .select("id,name,slug,logo_url,tagline,primary_color,secondary_color,background_color,status")
    .eq("id", businessId).maybeSingle();
  throwError(businessError, "Não foi possível carregar o estabelecimento.");
  if (!business) return null;
  const { data: menu, error: menuError } = await client.from("business_menus").select("*").eq("business_id", businessId).maybeSingle();
  throwError(menuError, "Não foi possível carregar o cardápio.");
  const [categoriesResult, productsResult, stationsResult, tablesResult] = await Promise.all([
    client.from("menu_categories").select("*").eq("business_id", businessId).order("position").order("name"),
    client.from("menu_products").select("*").eq("business_id", businessId).order("position").order("name"),
    client.from("menu_stations").select("*").eq("business_id", businessId).order("position").order("name"),
    client.from("menu_tables").select("id,business_id,table_number,qr_token,is_active").eq("business_id", businessId).order("table_number"),
  ]);
  throwError(categoriesResult.error, "Falha ao carregar as categorias.");
  throwError(productsResult.error, "Falha ao carregar os produtos.");
  throwError(stationsResult.error, "Falha ao carregar as estações.");
  throwError(tablesResult.error, "Falha ao carregar as mesas.");
  const products = (productsResult.data ?? []) as MenuProduct[];
  const productIds = products.map(p => p.id);
  let groups: MenuOptionGroup[] = [];
  if (productIds.length) {
    const groupResult = await client.from("menu_product_option_groups").select("*").in("product_id", productIds).order("position");
    throwError(groupResult.error, "Falha ao carregar os adicionais.");
    groups = (groupResult.data ?? []) as MenuOptionGroup[];
  }
  const groupIds = groups.map(g => g.id);
  if (groupIds.length) {
    const choicesResult = await client.from("menu_product_option_choices").select("*").in("group_id", groupIds).order("position");
    throwError(choicesResult.error, "Falha ao carregar as opções.");
    const choices = (choicesResult.data ?? []) as MenuChoice[];
    groups = groups.map(group => ({ ...group, choices: choices.filter(choice => choice.group_id === group.id) }));
  } else groups = [];
  return {
    business: business as MenuBusiness,
    menu: menu ? ({ ...menu, settings: { ...DEFAULT_ORDER_SETTINGS, ...(menu.settings || {}) } } as MenuRecord) : null,
    categories: (categoriesResult.data ?? []) as MenuCategory[],
    products: products.map(product => ({ ...product, option_groups: groups.filter(group => group.product_id === product.id) })),
    stations: (stationsResult.data ?? []) as MenuStation[],
    tables: (tablesResult.data ?? []) as MenuTable[],
  };
}

export async function getPublicMenu(slug: string): Promise<PublicMenuBundle | null> {
  const client = db();
  const { data: businessData, error: businessError } = await client.rpc("get_public_menu_business", { p_slug: slug });
  throwError(businessError, "Não foi possível carregar o estabelecimento.");
  if (!businessData) return null;
  const business = businessData as MenuBusiness;
  const { data: menu, error: menuError } = await client.from("business_menus").select("*")
    .eq("business_id", business.id).eq("is_published", true).maybeSingle();
  throwError(menuError, "Não foi possível carregar o cardápio.");
  if (!menu) return null;
  const [categoriesResult, productsResult] = await Promise.all([
    client.from("menu_categories").select("*").eq("business_id", business.id).eq("is_active", true).order("position").order("name"),
    client.from("menu_products").select("*").eq("business_id", business.id).eq("is_available", true).order("position").order("name"),
  ]);
  throwError(categoriesResult.error, "Falha ao carregar as categorias.");
  throwError(productsResult.error, "Falha ao carregar os produtos.");
  const products = (productsResult.data ?? []) as MenuProduct[];
  const groupsResult = products.length ? await client.from("menu_product_option_groups").select("*")
    .eq("business_id", business.id).eq("is_active", true).in("product_id", products.map(p => p.id)).order("position") : { data: [], error: null };
  throwError(groupsResult.error, "Falha ao carregar as opções dos produtos.");
  const groups = (groupsResult.data ?? []) as MenuOptionGroup[];
  const choicesResult = groups.length ? await client.from("menu_product_option_choices").select("*")
    .in("group_id", groups.map(g => g.id)).eq("is_active", true).order("position") : { data: [], error: null };
  throwError(choicesResult.error, "Falha ao carregar os adicionais.");
  const choices = (choicesResult.data ?? []) as MenuChoice[];
  const menuRecord = { ...menu, settings: { ...DEFAULT_ORDER_SETTINGS, ...(menu.settings || {}) } } as MenuRecord;
  return {
    business: business as MenuBusiness,
    menu: menuRecord,
    categories: (categoriesResult.data ?? []) as MenuCategory[],
    products: products.map(product => ({ ...product, option_groups: groups.filter(group => group.product_id === product.id).map(group => ({ ...group, choices: choices.filter(choice => choice.group_id === group.id) })) })),
    stations: [],
  };
}

export async function ensureMenu(businessId: string, name: string): Promise<MenuRecord> {
  const existing = await getMenuForBusiness(businessId);
  if (existing?.menu?.id) return existing.menu;
  const { data, error } = await db().from("business_menus").insert({ business_id: businessId, name: name ? `Cardápio de ${name}` : "Cardápio principal" }).select("*").single();
  throwError(error, "Não foi possível criar o cardápio.");
  return { ...data, settings: { ...DEFAULT_ORDER_SETTINGS, ...(data.settings || {}) } } as MenuRecord;
}

export async function saveMenu(menu: MenuRecord, changes: Partial<Pick<MenuRecord, "name" | "template_key" | "settings" | "is_published">>): Promise<MenuRecord> {
  const payload: Record<string, unknown> = { ...changes };
  if (changes.is_published === true) payload.published_at = new Date().toISOString();
  if (changes.is_published === false) payload.published_at = null;
  const { data, error } = await db().from("business_menus").update(payload).eq("id", menu.id).select("*").single();
  throwError(error, "Não foi possível salvar as configurações do cardápio.");
  return { ...data, settings: { ...DEFAULT_ORDER_SETTINGS, ...(data.settings || {}) } } as MenuRecord;
}

export async function createMenuCategory(businessId: string, name: string, position: number, description = ""): Promise<MenuCategory> {
  const { data, error } = await db().from("menu_categories").insert({ business_id: businessId, name: name.trim(), description: description.trim() || null, position }).select("*").single();
  throwError(error, "Não foi possível criar a categoria."); return data as MenuCategory;
}
export async function updateMenuCategory(id: string, changes: Partial<Pick<MenuCategory, "name" | "description" | "position" | "is_active">>) {
  const { error } = await db().from("menu_categories").update(changes).eq("id", id); throwError(error, "Não foi possível atualizar a categoria.");
}
export async function deleteMenuCategory(id: string) { const { error } = await db().from("menu_categories").delete().eq("id", id); throwError(error, "Não foi possível remover a categoria."); }

export interface ProductDraft {
  id?: string; business_id: string; category_id: string | null; station_id: string | null; name: string; description: string;
  price_cents: number; image_url: string | null; is_available: boolean; is_featured: boolean; position: number;
  option_group_name: string; option_group_required: boolean; option_group_min: number; option_group_max: number;
  option_lines: string;
}
export async function saveMenuProduct(draft: ProductDraft): Promise<MenuProduct> {
  if (!draft.name.trim()) throw new Error("Informe o nome do produto.");
  if (!Number.isInteger(draft.price_cents) || draft.price_cents < 0) throw new Error("Informe um preço válido.");
  const payload = { business_id: draft.business_id, category_id: draft.category_id || null, station_id: draft.station_id || null,
    name: draft.name.trim(), description: draft.description.trim(), price_cents: draft.price_cents,
    image_url: draft.image_url?.trim() || null, is_available: draft.is_available, is_featured: draft.is_featured, position: draft.position };
  let product: MenuProduct;
  if (draft.id) {
    const { data, error } = await db().from("menu_products").update(payload).eq("id", draft.id).select("*").single();
    throwError(error, "Não foi possível salvar o produto."); product = data as MenuProduct;
  } else {
    const { data, error } = await db().from("menu_products").insert(payload).select("*").single();
    throwError(error, "Não foi possível cadastrar o produto."); product = data as MenuProduct;
  }
  const lineChoices = draft.option_lines.split("\n").map(line => line.trim()).filter(Boolean).map((line, position) => {
    const [nameRaw, priceRaw = "0"] = line.split("|");
    const name = nameRaw.trim();
    const price = priceRaw.trim().replace(/R\$/i, "").trim();
    if (!name) return null;
    const normalized = price.includes(",") ? price.replace(/\./g, "").replace(",", ".") : price;
    const cents = Math.round(Number(normalized || 0) * 100);
    if (!Number.isFinite(cents) || cents < 0) throw new Error(`Preço inválido no adicional “${name}”. Use o formato Nome | 4,00.`);
    return { name, price_cents: cents, position };
  }).filter(Boolean) as {name:string;price_cents:number;position:number}[];
  const { data: existingGroups, error: groupLoadError } = await db().from("menu_product_option_groups").select("id")
    .eq("product_id", product.id).order("position").limit(1);
  throwError(groupLoadError, "Não foi possível carregar os adicionais atuais.");
  const existingGroupId = existingGroups?.[0]?.id as string | undefined;
  if (draft.option_group_name.trim() && lineChoices.length) {
    if (draft.option_group_min > draft.option_group_max || draft.option_group_max < 1 || draft.option_group_max > 30) throw new Error("Confira os limites de escolha dos adicionais.");
    const groupPayload = { business_id: draft.business_id, product_id: product.id, name: draft.option_group_name.trim(),
      is_required: draft.option_group_required, min_selections: draft.option_group_min, max_selections: draft.option_group_max, is_active: true };
    const groupResult = existingGroupId
      ? await db().from("menu_product_option_groups").update(groupPayload).eq("id", existingGroupId).select("id").single()
      : await db().from("menu_product_option_groups").insert(groupPayload).select("id").single();
    throwError(groupResult.error, "Não foi possível salvar o grupo de adicionais.");
    const groupId = groupResult.data.id as string;
    const { error: deleteChoicesError } = await db().from("menu_product_option_choices").delete().eq("group_id", groupId);
    throwError(deleteChoicesError, "Não foi possível atualizar os adicionais.");
    const { error: insertChoicesError } = await db().from("menu_product_option_choices").insert(lineChoices.map(choice => ({ ...choice, group_id: groupId, is_active: true })));
    throwError(insertChoicesError, "Não foi possível salvar os adicionais.");
  } else if (existingGroupId) {
    const { error } = await db().from("menu_product_option_groups").delete().eq("id", existingGroupId);
    throwError(error, "Não foi possível remover os adicionais antigos.");
  }
  return product;
}
export async function deleteMenuProduct(id: string) { const { error } = await db().from("menu_products").delete().eq("id", id); throwError(error, "Não foi possível remover o produto."); }

export async function saveStation(businessId: string, name: string, position: number): Promise<MenuStation> {
  const { data, error } = await db().from("menu_stations").insert({ business_id: businessId, name: name.trim(), position }).select("*").single();
  throwError(error, "Não foi possível criar a estação."); return data as MenuStation;
}
export async function deleteStation(id: string) { const { error } = await db().from("menu_stations").delete().eq("id", id); throwError(error, "Não foi possível remover a estação."); }
export async function saveTable(businessId: string, tableNumber: string): Promise<MenuTable> {
  const { data, error } = await db().from("menu_tables").insert({ business_id: businessId, table_number: tableNumber.trim() }).select("id,business_id,table_number,qr_token,is_active").single();
  throwError(error, "Não foi possível cadastrar a mesa."); return data as MenuTable;
}
export async function updateTable(id: string, isActive: boolean) { const { error } = await db().from("menu_tables").update({ is_active: isActive }).eq("id", id); throwError(error, "Não foi possível atualizar a mesa."); }

export async function resolvePublicMenuTable(slug: string, token: string): Promise<{table_number:string}|null> {
  const { data, error } = await db().rpc("resolve_public_menu_table", { p_business_slug: slug, p_table_token: token });
  throwError(error, "Não foi possível validar o QR Code desta mesa."); return data as {table_number:string}|null;
}
export interface PlaceOrderInput {
  businessSlug: string; items: { product_id: string; quantity: number; option_choice_ids: string[]; notes?: string }[];
  fulfillment: Fulfillment; customerName: string; customerPhone: string; customerAddress: string; tableToken?: string | null;
  manualTableNumber?: string; paymentMethod: PaymentMethod; notes?: string; idempotencyKey: string;
}
export interface PlacedOrder { order_id: string; order_date: string; order_number: number; tracking_token: string; total_cents: number; duplicate: boolean; }
export async function placeMenuOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const { data, error } = await db().rpc("place_menu_order", {
    p_business_slug: input.businessSlug, p_items: input.items, p_fulfillment: input.fulfillment,
    p_customer_name: input.customerName, p_customer_phone: input.customerPhone, p_customer_address: input.customerAddress || null,
    p_table_token: input.tableToken || null, p_manual_table_number: input.manualTableNumber || null,
    p_payment_method: input.paymentMethod, p_notes: input.notes || null, p_idempotency_key: input.idempotencyKey,
  });
  throwError(error, "Não foi possível registrar o pedido.");
  return data as PlacedOrder;
}
export async function getPublicOrderTracking(token: string) {
  const { data, error } = await db().rpc("get_public_order_tracking", { p_tracking_token: token });
  throwError(error, "Não foi possível consultar o acompanhamento do pedido."); return data as any | null;
}

export async function listOrders(businessIds: string[], businessId?: string, since?: string): Promise<MenuOrder[]> {
  if (!businessIds.length) return [];
  const scopedIds = businessId ? [businessId] : businessIds;
  const pageSize = 500;
  const all: MenuOrder[] = [];
  for (let start = 0; ; start += pageSize) {
    let query = db().from("menu_orders").select("*, menu_order_items(*)")
      .in("business_id", scopedIds).order("created_at", { ascending: false }).order("id", { ascending: false })
      .range(start, start + pageSize - 1);
    if (since) query = query.gte("created_at", since);
    const { data, error } = await query;
    throwError(error, "Não foi possível carregar os pedidos.");
    const page = (data ?? []) as MenuOrder[];
    all.push(...page.map(order => ({ ...order, menu_order_items: order.menu_order_items ?? [] })));
    if (page.length < pageSize) break;
  }
  return all;
}
export async function listOrderStatusHistory(orderId: string): Promise<MenuOrderStatusHistory[]> {
  const { data, error } = await db().from("menu_order_status_history")
    .select("id,order_id,from_status,to_status,note,changed_by,changed_at")
    .eq("order_id", orderId).order("changed_at", { ascending: true });
  throwError(error, "Não foi possível carregar o histórico de etapas.");
  return (data ?? []) as MenuOrderStatusHistory[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, cancelReason?: string) {
  const payload: Record<string, unknown> = { status };
  if (status === "cancelled") payload.cancel_reason = cancelReason?.trim() || "";
  const { data, error } = await db().from("menu_orders").update(payload).eq("id", orderId).select("id").maybeSingle();
  throwError(error, "Não foi possível atualizar o pedido. Confira o status e suas permissões.");
  if (!data) throw new Error("O pedido não foi atualizado. Verifique se seu usuário pode operar este estabelecimento e se o pedido ainda está aberto.");
}
export async function updateOrderPaymentStatus(orderId: string) {
  const { data, error } = await db().from("menu_orders").update({ payment_status: "confirmed" })
    .eq("id", orderId).eq("payment_status", "pending").select("id").maybeSingle();
  throwError(error, "Não foi possível confirmar o pagamento.");
  if (!data) throw new Error("O pagamento não foi alterado. Verifique se ele ainda está pendente e se sua conta tem permissão para confirmar recebimentos.");
}

export async function updateOrderKitchenNotes(orderId: string, notes: string) {
  const { data, error } = await db().from("menu_orders").update({ kitchen_notes: notes.trim().slice(0,1000) }).eq("id", orderId).select("id").maybeSingle();
  throwError(error, "Não foi possível salvar a observação da cozinha.");
  if (!data) throw new Error("A observação não foi salva. Verifique as permissões do seu usuário.");
}
export async function listBusinessMembers(businessId: string) {
  const client = db();
  const { data, error } = await client.from("business_members").select("business_id,user_id,role,created_at").eq("business_id", businessId).order("created_at");
  throwError(error, "Não foi possível carregar os acessos do estabelecimento.");
  const memberships = data ?? [];
  const ids = memberships.map((member: any) => member.user_id);
  if (!ids.length) return [];
  const profiles = await client.from("profiles").select("id,full_name,email,access_status,role").in("id", ids);
  throwError(profiles.error, "Não foi possível carregar os dados dos usuários vinculados.");
  return memberships.map((member: any) => ({ ...member, profile: (profiles.data ?? []).find((p: any) => p.id === member.user_id) ?? null }));
}
export async function listApprovedUsers() {
  const { data, error } = await db().from("profiles").select("id,full_name,email,access_status,role").eq("access_status", "approved").order("email");
  throwError(error, "Não foi possível carregar a lista de usuários aprovados."); return data ?? [];
}
export async function addBusinessMember(businessId: string, userId: string, role: "owner" | "editor" | "viewer") {
  const { error } = await db().from("business_members").upsert({ business_id: businessId, user_id: userId, role }, { onConflict: "business_id,user_id" });
  throwError(error, "Não foi possível vincular o usuário ao estabelecimento.");
}
export async function removeBusinessMember(businessId: string, userId: string) {
  const { error } = await db().from("business_members").delete().eq("business_id", businessId).eq("user_id", userId);
  throwError(error, "Não foi possível remover o acesso.");
}
