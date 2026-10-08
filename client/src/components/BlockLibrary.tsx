import { useRef, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Camera, Image as ImageIcon, Link2, ListChecks, MapPin, MessageCircle, Package, Phone, Plus, Quote, Star, Trash2, Type, Utensils } from "lucide-react";
import { mapsUrl, whatsappUrl } from "@/lib/blueprints";
import { normalizeInstagram } from "@/lib/validation";
import type { CatalogItem, PageBlock, PageBlockType } from "@/lib/types";

export interface BlockLibraryProps {
  blocks: PageBlock[];
  catalog: CatalogItem[];
  whatsapp: string;
  whatsappMessage: string;
  instagram: string;
  address: string;
  leadEnabled: boolean;
  onBlocks: (next: PageBlock[]) => void;
  onCatalog: (next: CatalogItem[]) => void;
  onLead: (enabled: boolean) => void;
  onGo: (panel: "images" | "actions") => void;
  onNotice: (message: string) => void;
}

const TYPE_LABEL: Record<PageBlockType, string> = { text: "Texto", image: "Banner", video: "Vídeo", quote: "Avaliação", offer: "Oferta", social: "Instagram", map: "Mapa", hours: "Horários", faq: "Perguntas", divider: "Divisor", booking: "WhatsApp", list: "Lista" };
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

function move<T>(list: T[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

export function BlockLibrary(props: BlockLibraryProps) {
  const { blocks, catalog, onBlocks, onCatalog } = props;
  const add = (block: Omit<PageBlock, "id">) => onBlocks([...blocks, { ...block, id: newId() }]);
  const addWhatsapp = () => {
    const url = whatsappUrl(props.whatsapp, props.whatsappMessage);
    if (!url) { props.onNotice("Informe o WhatsApp em Conteúdo antes de adicionar este bloco."); return; }
    add({ type: "booking", eyebrow: "WhatsApp", title: "Fale com a equipe", text: "Tire dúvidas ou faça seu pedido.", button_label: "Chamar no WhatsApp", button_url: url, align: "center", visible: true, radius: 28, padding: 22 });
  };
  const addInstagram = () => {
    let url = "";
    try { url = normalizeInstagram(props.instagram); } catch { url = ""; }
    if (!url) { props.onNotice("Informe o Instagram em Botões e links antes de adicionar este bloco."); return; }
    add({ type: "social", title: "Acompanhe no Instagram", text: "Veja novidades e atualizações.", button_label: "Abrir Instagram", button_url: url, align: "center", visible: true });
  };
  const addMap = () => {
    if (!props.address.trim()) { props.onNotice("Informe o endereço em Seções antes de adicionar o mapa."); return; }
    add({ type: "map", title: "Como chegar", text: props.address.trim(), url: mapsUrl(props.address), align: "left", visible: true });
  };
  const addItem = (category: string) => onCatalog([...catalog, { id: newId(), item_type: "product", title: "", description: "", price: "", category, image_url: "", button_label: "", button_url: "" } as CatalogItem]);

  const tiles: Array<{ icon: ReactNode; label: string; hint: string; run: () => void; state?: string }> = [
    { icon: <ImageIcon size={18} />, label: "Banner", hint: "Imagem de destaque", run: () => add({ type: "image", title: "Banner", align: "center", visible: true, radius: 24, padding: 0 }) },
    { icon: <Camera size={18} />, label: "Galeria", hint: "Gerenciar fotos", run: () => props.onGo("images") },
    { icon: <Package size={18} />, label: "Produtos", hint: "Adicionar produto", run: () => addItem("") },
    { icon: <Utensils size={18} />, label: "Cardápio", hint: "Adicionar prato", run: () => addItem("Cardápio") },
    { icon: <Link2 size={18} />, label: "Botões", hint: "Links personalizados", run: () => props.onGo("actions") },
    { icon: <MessageCircle size={18} />, label: "WhatsApp", hint: "Chamada para ação", run: addWhatsapp },
    { icon: <Star size={18} />, label: "Instagram", hint: "Botão para o perfil", run: addInstagram },
    { icon: <MapPin size={18} />, label: "Mapa", hint: "Como chegar", run: addMap },
    { icon: <Quote size={18} />, label: "Avaliações", hint: "Depoimento real", run: () => add({ type: "quote", title: "Nome do cliente", text: "", align: "center", visible: false }) },
    { icon: <Phone size={18} />, label: "Contato", hint: "Formulário de contato", run: () => props.onLead(!props.leadEnabled), state: props.leadEnabled ? "Ativo" : "Inativo" },
    { icon: <Type size={18} />, label: "Texto", hint: "Parágrafo livre", run: () => add({ type: "text", title: "Título", text: "", align: "left", visible: true }) },
    { icon: <ListChecks size={18} />, label: "Horários", hint: "Funcionamento", run: () => add({ type: "hours", title: "Horário de funcionamento", items: [], align: "left", visible: true }) },
  ];

  return <div className="sx-blocks">
    <section aria-labelledby="library-title">
      <h2 id="library-title" className="sx-mini-title">Biblioteca de blocos</h2>
      <div className="sx-tiles">{tiles.map(tile => <button key={tile.label} type="button" className="sx-tile" onClick={tile.run}><span aria-hidden="true">{tile.icon}</span><strong>{tile.label}</strong><small>{tile.state ?? tile.hint}</small>{!tile.state && <Plus size={14} aria-hidden="true" />}</button>)}</div>
      <p className="sx-note">Avaliações novas ficam ocultas até você colar um depoimento real e ativar o bloco.</p>
    </section>

    <section aria-labelledby="catalog-title">
      <h2 id="catalog-title" className="sx-mini-title">Produtos e cardápio ({catalog.length})</h2>
      {catalog.length === 0 && <p className="sx-note">Nenhum item. Use Produtos ou Cardápio na biblioteca.</p>}
      <ul className="sx-edit-list">{catalog.map((item, index) => <CatalogRow key={item.id} item={item} index={index} total={catalog.length} onChange={patch => onCatalog(catalog.map(entry => entry.id === item.id ? { ...entry, ...patch } : entry))} onMove={delta => onCatalog(move(catalog, index, delta))} onRemove={() => onCatalog(catalog.filter(entry => entry.id !== item.id))} />)}</ul>
    </section>

    <section aria-labelledby="blocks-title">
      <h2 id="blocks-title" className="sx-mini-title">Blocos da página ({blocks.length})</h2>
      {blocks.length === 0 && <p className="sx-note">Nenhum bloco adicional.</p>}
      <ul className="sx-edit-list">{blocks.map((block, index) => <BlockRow key={block.id} block={block} index={index} total={blocks.length} onChange={patch => onBlocks(blocks.map(entry => entry.id === block.id ? { ...entry, ...patch } : entry))} onMove={delta => onBlocks(move(blocks, index, delta))} onRemove={() => onBlocks(blocks.filter(entry => entry.id !== block.id))} />)}</ul>
    </section>
  </div>;
}

function RowTools({ index, total, onMove, onRemove, label }: { index: number; total: number; onMove: (delta: number) => void; onRemove: () => void; label: string }) {
  return <div className="sx-row-tools"><button type="button" aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={14} /></button><button type="button" aria-label={`Descer ${label}`} disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={14} /></button><button type="button" className="is-danger" aria-label={`Remover ${label}`} onClick={() => { if (window.confirm(`Remover ${label}?`)) onRemove(); }}><Trash2 size={14} /></button></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="sx-mini-field"><span>{label}</span>{children}</label>;
}

function CatalogRow({ item, index, total, onChange, onMove, onRemove }: { item: CatalogItem; index: number; total: number; onChange: (patch: Partial<CatalogItem>) => void; onMove: (delta: number) => void; onRemove: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = item.title || `item ${index + 1}`;
  return <li className="sx-edit-card"><div className="sx-edit-head"><strong>{item.badge === "EXEMPLO" ? "Exemplo · " : ""}{label}</strong><RowTools index={index} total={total} onMove={onMove} onRemove={onRemove} label={label} /></div>
    <div className="sx-edit-grid">
      <Field label="Nome"><input value={item.title} onChange={event => onChange({ title: event.target.value })} /></Field>
      <Field label="Preço"><input value={item.price} onChange={event => onChange({ price: event.target.value })} placeholder="R$ 00,00" /></Field>
      <Field label="Descrição"><textarea rows={2} value={item.description} onChange={event => onChange({ description: event.target.value })} /></Field>
      <Field label="Categoria"><input value={item.category || ""} onChange={event => onChange({ category: event.target.value })} /></Field>
      <Field label="Texto do botão"><input value={item.button_label} onChange={event => onChange({ button_label: event.target.value })} placeholder="Pedir agora" /></Field>
      <Field label="Link do botão"><input value={item.button_url} onChange={event => onChange({ button_url: event.target.value })} placeholder="https://" /></Field>
    </div>
    <div className="sx-edit-foot"><label className="sx-check"><input type="checkbox" checked={Boolean(item.featured)} onChange={event => onChange({ featured: event.target.checked })} /><span>Destacar</span></label>
      {item.badge === "EXEMPLO" && <button type="button" className="sx-link" onClick={() => onChange({ badge: "" })}>Já substituí o exemplo</button>}
      <button type="button" className="sx-button sx-secondary" onClick={() => fileRef.current?.click()}>{item.image_url ? "Trocar imagem" : "Adicionar imagem"}</button>
      <input ref={fileRef} hidden type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (file) onChange({ file, image_url: URL.createObjectURL(file) }); event.currentTarget.value = ""; }} />
      {item.image_url && <img className="sx-thumb" src={item.image_url} alt={`Imagem de ${label}`} />}
    </div></li>;
}

function BlockRow({ block, index, total, onChange, onMove, onRemove }: { block: PageBlock; index: number; total: number; onChange: (patch: Partial<PageBlock>) => void; onMove: (delta: number) => void; onRemove: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const label = `${TYPE_LABEL[block.type]}${block.title ? `: ${block.title}` : ""}`;
  const listLike = block.type === "hours" || block.type === "faq" || block.type === "list";
  const hasButton = ["booking", "offer", "social", "text"].includes(block.type);
  return <li className="sx-edit-card"><div className="sx-edit-head"><strong>{label}</strong><RowTools index={index} total={total} onMove={onMove} onRemove={onRemove} label={label} /></div>
    <div className="sx-edit-grid">
      {block.type !== "divider" && <Field label="Título"><input value={block.title || ""} onChange={event => onChange({ title: event.target.value })} /></Field>}
      {block.type !== "divider" && <Field label="Rótulo pequeno"><input value={block.eyebrow || ""} onChange={event => onChange({ eyebrow: event.target.value })} /></Field>}
      {!listLike && block.type !== "divider" && block.type !== "image" && <Field label={block.type === "quote" ? "Depoimento" : "Texto"}><textarea rows={3} value={block.text || ""} onChange={event => onChange({ text: event.target.value })} /></Field>}
      {listLike && <Field label="Itens (um por linha)"><textarea rows={4} value={(block.items || []).join("\n")} onChange={event => onChange({ items: event.target.value.split("\n").map(line => line.trim()).filter(Boolean) })} /></Field>}
      {(block.type === "map" || block.type === "video") && <Field label={block.type === "map" ? "Link do mapa" : "Link do vídeo (incorporação)"}><input value={block.url || ""} onChange={event => onChange({ url: event.target.value })} placeholder="https://" /></Field>}
      {hasButton && <Field label="Texto do botão"><input value={block.button_label || ""} onChange={event => onChange({ button_label: event.target.value })} /></Field>}
      {hasButton && <Field label="Link do botão"><input value={block.button_url || ""} onChange={event => onChange({ button_url: event.target.value })} placeholder="https://" /></Field>}
      <Field label="Alinhamento"><select value={block.align || "left"} onChange={event => onChange({ align: event.target.value as PageBlock["align"] })}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></Field>
      <Field label="Cor de fundo"><span className="sx-color"><input type="color" value={block.background && /^#[0-9a-f]{6}$/i.test(block.background) ? block.background : "#ffffff"} onChange={event => onChange({ background: event.target.value })} /><button type="button" className="sx-link" onClick={() => onChange({ background: "" })}>Sem fundo</button></span></Field>
    </div>
    <div className="sx-edit-foot"><label className="sx-check"><input type="checkbox" checked={block.visible !== false} onChange={event => onChange({ visible: event.target.checked })} /><span>Visível na página</span></label>
      {block.type === "image" && <><button type="button" className="sx-button sx-secondary" onClick={() => fileRef.current?.click()}>{block.image_url ? "Trocar imagem" : "Escolher imagem"}</button><input ref={fileRef} hidden type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (file) onChange({ file, image_url: URL.createObjectURL(file) }); event.currentTarget.value = ""; }} />{block.image_url && <img className="sx-thumb" src={block.image_url} alt="Prévia do banner" />}</>}
    </div></li>;
}
