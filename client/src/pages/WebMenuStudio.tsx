import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Clipboard, ExternalLink, Plus, Save, Settings2, ShoppingBag, Store, Trash2, Utensils, Users, X } from "lucide-react";
import { Link } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { currentProfile } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { useAuth } from "@/lib/supabase";
import { parsePriceToCents } from "@/lib/menu-domain";
import {
  addBusinessMember, createMenuCategory, DEFAULT_ORDER_SETTINGS, deleteMenuCategory, deleteMenuProduct, deleteStation,
  ensureMenu, getMenuForBusiness, listAccessibleBusinesses, listApprovedUsers, listBusinessMembers, MENU_TEMPLATES,
  removeBusinessMember, saveMenu, saveMenuProduct, saveStation, saveTable, updateMenuCategory, updateTable,
  type MenuBundle, type MenuCategory, type MenuProduct, type MenuRecord, type MenuStation, type MenuTable, type ProductDraft,
} from "@/lib/menu-data";
import "./WebMenu.css";

type EditorTab = "products" | "look" | "service" | "tables" | "access";
const tabs: {id:EditorTab;title:string;subtitle:string}[] = [
  {id:"products",title:"Produtos e categorias",subtitle:"Monte o catálogo e os adicionais"},
  {id:"look",title:"Identidade visual",subtitle:"Escolha um dos cinco modelos"},
  {id:"service",title:"Operação e entrega",subtitle:"Modalidades, tempo e taxa"},
  {id:"tables",title:"Mesas e QR Codes",subtitle:"Links individuais de mesa"},
  {id:"access",title:"Acesso da equipe",subtitle:"Permissões por estabelecimento"},
];
const blankDraft = (businessId:string, position:number):ProductDraft => ({
  business_id:businessId,category_id:null,station_id:null,name:"",description:"",price_cents:0,image_url:null,is_available:true,is_featured:false,position,
  option_group_name:"Adicionais",option_group_required:false,option_group_min:0,option_group_max:5,option_lines:"",
});
const brl = (cents:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((cents||0)/100);
function formatPriceInput(cents:number) { return (cents/100).toFixed(2).replace(".",","); }

export default function WebMenuStudio() {
  const {user}=useAuth();
  const [businesses,setBusinesses]=useState<any[]>([]);
  const [businessId,setBusinessId]=useState("");
  const [bundle,setBundle]=useState<MenuBundle|null>(null);
  const [tab,setTab]=useState<EditorTab>("products");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [categoryName,setCategoryName]=useState("");
  const [categoryDescription,setCategoryDescription]=useState("");
  const [stationName,setStationName]=useState("");
  const [tableNumber,setTableNumber]=useState("");
  const [draft,setDraft]=useState<ProductDraft|null>(null);
  const [priceInput,setPriceInput]=useState("0,00");
  const [profile,setProfile]=useState<Profile|null>(null);
  const [approvedUsers,setApprovedUsers]=useState<any[]>([]);
  const [members,setMembers]=useState<any[]>([]);
  const [memberUserId,setMemberUserId]=useState("");
  const [memberRole,setMemberRole]=useState<"owner"|"editor"|"viewer">("owner");
  const [saveError,setSaveError]=useState("");

  useEffect(()=>{
    let active=true;
    listAccessibleBusinesses().then(list=>{
      if(!active)return;
      setBusinesses(list);
      const fromUrl=new URLSearchParams(window.location.search).get("business");
      setBusinessId(current=>current||(fromUrl&&list.some(b=>b.id===fromUrl)?fromUrl:list[0]?.id||""));
      if(!list.length)setError("Sua conta ainda não está vinculada a um estabelecimento. Peça ao administrador do PLAK para conceder acesso.");
    }).catch(e=>active&&setError(e instanceof Error?e.message:"Não foi possível carregar os estabelecimentos."))
      .finally(()=>active&&setLoading(false));
    currentProfile().then(p=>active&&setProfile(p)).catch(()=>{});
    return()=>{active=false;};
  },[user]);

  const refresh=useCallback(async()=>{
    if(!businessId)return;
    setError("");
    try{setBundle(await getMenuForBusiness(businessId));}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar o cardápio.");}
  },[businessId]);
  useEffect(()=>{setBundle(null);if(businessId)refresh();},[businessId,refresh]);

  useEffect(()=>{
    let active=true;
    if(profile?.role==="admin"&&businessId){
      Promise.all([listApprovedUsers(),listBusinessMembers(businessId)]).then(([u,m])=>{
        if(active){setApprovedUsers(u);setMembers(m);setMemberUserId(current=>current||(u[0]?.id||""));}
      }).catch(e=>active&&setSaveError(e instanceof Error?e.message:"Falha ao carregar permissões."));
    }
    return()=>{active=false;};
  },[profile?.role,businessId,bundle?.business.id]);

  const business=useMemo(()=>businesses.find(b=>b.id===businessId),[businesses,businessId]);
  const menu=bundle?.menu?.id?bundle.menu:null;
  const productList=bundle?.products??[];
  const productCount=productList.length;
  const activeCount=productList.filter(p=>p.is_available).length;
  const copy=async(value:string)=>{try{await navigator.clipboard.writeText(value);setNotice("Link copiado.");setTimeout(()=>setNotice(""),2600);}catch{setNotice(value);}};
  const menuUrl=business?`${window.location.origin}/${business.slug}/cardapio`:"";
  const orderPanelUrl=business?`${window.location.origin}/painel/pedidos?business=${encodeURIComponent(business.id)}`:"";

  const createMenu=async()=>{
    if(!businessId||busy)return;
    setBusy(true);setError("");
    try{await ensureMenu(businessId,business?.name||"");await refresh();setNotice("Cardápio criado. Agora adicione categorias e produtos.");}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível criar o cardápio.");}
    finally{setBusy(false);}
  };
  const withBusy=async(action:()=>Promise<void>,success?:string)=>{
    setBusy(true);setError("");setSaveError("");
    try{await action();await refresh();if(success)setNotice(success);}
    catch(e){setError(e instanceof Error?e.message:"A operação não foi concluída.");}
    finally{setBusy(false);}
  };
  const addCategory=()=>{
    if(!bundle||!categoryName.trim())return;
    void withBusy(async()=>{await createMenuCategory(bundle.business.id,categoryName.trim(),bundle.categories.length,categoryDescription);setCategoryName("");setCategoryDescription("");},"Categoria criada.").then(()=>{
      // description remains editable from the list after creation; initialize as supplied when possible.
    });
  };
  const editProduct=(product?:MenuProduct)=>{
    if(!bundle)return;
    if(!product){setDraft(blankDraft(bundle.business.id,productList.length));setPriceInput("0,00");return;}
    const group=product.option_groups?.[0];
    setDraft({...blankDraft(bundle.business.id,product.position),...product,id:product.id,
      option_group_name:group?.name||"Adicionais",option_group_required:group?.is_required||false,
      option_group_min:group?.min_selections??0,option_group_max:group?.max_selections??5,
      option_lines:(group?.choices||[]).map(choice=>`${choice.name} | ${formatPriceInput(choice.price_cents)}`).join("\n")});
    setPriceInput(formatPriceInput(product.price_cents));
  };
  const saveProduct=async()=>{
    if(!draft)return;
    setBusy(true);setError("");
    try{
      const price=parsePriceToCents(priceInput);
      if(price===null)throw new Error("Informe um preço válido, como 25,90.");
      await saveMenuProduct({...draft,price_cents:price});setDraft(null);await refresh();setNotice("Produto salvo no cardápio.");
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar o produto.");}
    finally{setBusy(false);}
  };
  const saveSettings=async(changes:Partial<Pick<MenuRecord,"name"|"template_key"|"settings">>,message:string)=>{
    if(!menu)return;
    await withBusy(async()=>{await saveMenu(menu,changes);},message);
  };
  const togglePublish=async()=>{
    if(!menu)return;
    const next=!menu.is_published;
    if(next&&(!bundle?.categories.length||!bundle.products.some(p=>p.is_available))){setError("Cadastre pelo menos uma categoria e um produto disponível antes de publicar.");return;}
    await withBusy(async()=>{await saveMenu(menu,{is_published:next});},next?"Cardápio publicado. O link público já pode receber pedidos.":"Cardápio despublicado.");
  };
  const addTeamMember=async()=>{
    if(!businessId||!memberUserId)return;
    await withBusy(async()=>{await addBusinessMember(businessId,memberUserId,memberRole);setMembers(await listBusinessMembers(businessId));},"Acesso vinculado ao estabelecimento.");
  };
  const removeTeamMember=async(userId:string)=>{
    if(!businessId||!window.confirm("Remover o acesso desta pessoa ao estabelecimento?"))return;
    await withBusy(async()=>{await removeBusinessMember(businessId,userId);setMembers(await listBusinessMembers(businessId));},"Acesso removido.");
  };

  if(loading)return <AdminShell adminOnly={false}><div className="wm-empty"><strong>Preparando o Web Cardápio…</strong>Carregando os estabelecimentos autorizados.</div></AdminShell>;
  return <AdminShell adminOnly={false}>
    <div className="wm-admin">
      <header className="wm-admin-header">
        <div><p className="wm-kicker">PLAK STUDIO / WEB CARDÁPIOS</p><h1>Cardápio que recebe pedidos.</h1><p>Crie um link público para os clientes e gerencie a operação em uma área privada, com dados reais do Supabase.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/painel/pedidos" className="wm-admin-button"><ShoppingBag size={15}/>Painel de pedidos</Link><Link href="/painel/cozinha" className="wm-admin-button"><Utensils size={15}/>Tela da cozinha</Link></div>
      </header>
      {(error||notice)&&<div className={error?"wm-error mb-4":"wm-success mb-4"} role={error?"alert":"status"}>{error||notice}</div>}
      <section className="wm-admin-card mb-4">
        <div className="wm-admin-grid items-end">
          <div className="wm-admin-field mb-0"><label htmlFor="wm-business">Estabelecimento</label><select id="wm-business" value={businessId} onChange={e=>setBusinessId(e.target.value)}><option value="">Selecione um estabelecimento</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="flex flex-wrap items-center justify-between gap-2">{menu&&<div className="text-xs leading-6 text-[#77847a]">{productCount} produtos · {activeCount} disponíveis · <b className={menu.is_published?"text-[#4d7843]":"text-[#9a7540]"}>{menu.is_published?"Publicado":"Rascunho"}</b></div>}{menu&&<div className="flex flex-wrap gap-2"><button className="wm-admin-button" onClick={()=>copy(menuUrl)}><Clipboard size={14}/>Copiar link público</button><button className="wm-admin-button" onClick={()=>copy(orderPanelUrl)}><Clipboard size={14}/>Copiar painel privado</button><a className="wm-admin-button" href={menuUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Abrir cardápio</a><a className="wm-admin-button" href={`/painel/pedidos?business=${encodeURIComponent(business.id)}`} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Abrir painel</a></div>}</div>
        </div>
      </section>
      {!businessId?<section className="wm-admin-card wm-empty"><strong>Nenhum estabelecimento selecionado</strong>{error||"Crie um Bio-site primeiro ou peça para vincularem seu usuário a um estabelecimento."}<div className="mt-4"><Link href="/admin/create" className="wm-admin-button primary">Criar Bio-site</Link></div></section>
      :!bundle?<div className="wm-admin-card wm-empty"><strong>Carregando os dados do estabelecimento…</strong></div>
      :!menu?<section className="wm-admin-card py-12 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eaf0df] text-[#425c37]"><ShoppingBag size={25}/></div><h2 className="mt-5 text-2xl font-black tracking-tight">Crie o Web Cardápio de {bundle.business.name}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[#7c8980]">O cardápio ficará vinculado a este estabelecimento. O link público só funcionará depois de publicar e incluir pelo menos uma categoria e um produto.</p><button className="wm-admin-button primary mt-5" onClick={createMenu} disabled={busy}><Plus size={15}/>{busy?"Criando…":"Criar cardápio"}</button></section>
      :<div className="wm-admin-layout">
        <aside className="wm-admin-side">{tabs.filter(t=>t.id!=="access"||profile?.role==="admin").map(item=><button key={item.id} className={`wm-admin-tab ${tab===item.id?"active":""}`} onClick={()=>setTab(item.id)}>{item.title}<span>{item.subtitle}</span></button>)}<div className="rounded-2xl bg-[#1d3227] p-4 text-white"><span className="text-[9px] font-black uppercase tracking-[.18em] text-[#cce68f]">PUBLICAÇÃO</span><strong className="mt-2 block text-lg tracking-tight">{menu.is_published?"Seu cardápio está no ar":"Pronto para publicar?"}</strong><p className="mt-2 text-[11px] leading-5 text-white/65">Pedidos são gravados no banco mesmo se o painel não estiver aberto.</p><button onClick={togglePublish} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#cce68f] px-4 py-3 text-xs font-black text-[#1d3227]"><Check size={15}/>{menu.is_published?"Despublicar":"Publicar cardápio"}</button></div></aside>
        <main className="space-y-4">
          {tab==="products"&&<>
            <section className="wm-admin-card">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="wm-kicker">CATÁLOGO</p><h2 className="mt-1 text-xl font-black tracking-tight">Categorias e produtos</h2><p className="mt-1 text-xs leading-6 text-[#879187]">Cada produto tem preço validado novamente no banco ao finalizar um pedido.</p></div><button className="wm-admin-button primary" onClick={()=>editProduct()}><Plus size={15}/>Novo produto</button></div>
              <div className="mb-5 rounded-2xl bg-[#f4f6ef] p-4"><h3 className="text-sm font-black">Adicionar categoria</h3><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="Ex.: Hambúrgueres, Pizzas, Cafés" className="min-w-0 rounded-xl border border-[#dfe5da] bg-white px-3 py-3 text-sm outline-none focus:border-[#92a977]" onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),addCategory())}/><input value={categoryDescription} onChange={e=>setCategoryDescription(e.target.value)} maxLength={300} placeholder="Descrição (opcional)" className="min-w-0 rounded-xl border border-[#dfe5da] bg-white px-3 py-3 text-sm outline-none focus:border-[#92a977]"/><button className="wm-admin-button primary" disabled={busy||!categoryName.trim()} onClick={addCategory}><Plus size={14}/>Adicionar</button></div></div>
              <div className="mb-5 flex flex-wrap gap-2">{bundle.categories.map(cat=><span key={cat.id} className="inline-flex items-center gap-2 rounded-full border border-[#dce4d8] bg-white py-2 pl-3 pr-2 text-xs font-bold">{cat.name}<button className="grid h-6 w-6 place-items-center rounded-full bg-[#f3f5ef] text-[#8a6459]" title={`Excluir ${cat.name}`} onClick={()=>window.confirm(`Excluir a categoria ${cat.name}? Os produtos serão mantidos sem categoria.`)&&void withBusy(async()=>{await deleteMenuCategory(cat.id);},"Categoria removida.")}><X size={12}/></button></span>)}{!bundle.categories.length&&<p className="text-xs text-[#8b968c]">Nenhuma categoria ainda.</p>}</div>
              <div className="mt-5 rounded-2xl border border-[#dfe6da] bg-white p-4"><div className="mb-3"><h3 className="text-sm font-black">Estações de preparo</h3><p className="mt-1 text-xs leading-5 text-[#879187]">Organize o trabalho operacional (cozinha, bebidas, sobremesas). Isso é separado das categorias comerciais do cardápio.</p></div><div className="flex flex-wrap gap-2"><input value={stationName} onChange={e=>setStationName(e.target.value)} maxLength={80} placeholder="Ex.: Chapa, Bebidas, Sobremesas" className="min-w-[200px] flex-1 rounded-xl border border-[#dfe5da] bg-[#fbfcf9] px-3 py-3 text-sm" onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),stationName.trim()&&void withBusy(async()=>{await saveStation(businessId,stationName.trim(),bundle.stations.length);setStationName("");},"Estação criada."))}/><button className="wm-admin-button primary" disabled={busy||!stationName.trim()} onClick={()=>void withBusy(async()=>{await saveStation(businessId,stationName.trim(),bundle.stations.length);setStationName("");},"Estação criada.")}><Plus size={14}/>Adicionar estação</button></div><div className="mt-3 flex flex-wrap gap-2">{bundle.stations.map(station=><span key={station.id} className="inline-flex items-center gap-2 rounded-full border border-[#dce5df] bg-[#f6f8f2] py-2 pl-3 pr-1 text-xs font-bold">{station.name}<button className="grid h-6 w-6 place-items-center rounded-full bg-white text-[#9a6254]" title={`Remover estação ${station.name}`} aria-label={`Remover estação ${station.name}`} onClick={()=>window.confirm(`Remover a estação ${station.name}? Os produtos serão mantidos sem estação específica.`)&&void withBusy(async()=>{await deleteStation(station.id);},"Estação removida.")}><X size={12}/></button></span>)}{!bundle.stations.length&&<span className="text-xs text-[#89948a]">Nenhuma estação criada. Produtos sem estação entram como “Geral”.</span>}</div></div>
              <div className="wm-admin-list">{productList.map(product=><article className="wm-admin-row" key={product.id}><div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-xl bg-[#e7ecdf]">{product.image_url?<img src={product.image_url} alt="" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-lg">{product.name.slice(0,1).toUpperCase()}</div>}</div><div className="wm-admin-row-content"><b>{product.name}{product.is_featured&&<span className="ml-2 rounded-full bg-[#e9f1dc] px-2 py-1 text-[9px] text-[#526b44]">DESTAQUE</span>}</b><small>{bundle.categories.find(c=>c.id===product.category_id)?.name||"Sem categoria"} · {product.is_available?"Disponível":"Indisponível"} · {(product.option_groups?.reduce((n,g)=>n+g.choices.length,0)||0)} adicionais</small><strong className="mt-1 block text-xs">{brl(product.price_cents)}</strong></div><button className="wm-admin-button" onClick={()=>editProduct(product)}>Editar</button><button className="wm-admin-button danger" aria-label={`Excluir ${product.name}`} onClick={()=>window.confirm(`Excluir ${product.name}?`)&&void withBusy(async()=>{await deleteMenuProduct(product.id);},"Produto removido.")}><Trash2 size={14}/></button></article>)}{!productList.length&&<div className="wm-empty"><strong>Seu catálogo começa aqui</strong>Cadastre uma categoria e adicione seus primeiros produtos. O público não verá produtos de demonstração.</div>}</div>
            </section>
          </>}
          {tab==="look"&&<section className="wm-admin-card"><p className="wm-kicker">IDENTIDADE VISUAL</p><h2 className="mt-1 text-xl font-black tracking-tight">Escolha um modelo de cardápio</h2><p className="mt-1 mb-5 text-xs leading-6 text-[#879187]">Os modelos mudam a composição, a tipografia e a apresentação dos produtos — não apenas a paleta de cores.</p><div className="wm-template-strip">{MENU_TEMPLATES.map((template,index)=><button key={template.id} onClick={()=>void saveSettings({template_key:template.id},`Modelo ${template.name} aplicado.`)} disabled={busy} className={`wm-template ${menu.template_key===template.id?"active":""}`}><div className="wm-template-art" style={{background:["linear-gradient(135deg,#1b1b18,#a44a2b)","linear-gradient(135deg,#2e6749,#be4035)","linear-gradient(135deg,#dae5c8,#f0e0b8)","linear-gradient(135deg,#162a3a,#f7c63e)","linear-gradient(135deg,#e6c6a6,#4a2e24)"][index],color:index===2?"#243628":"#fff"}}>{["SMASH / GRILL","FORNO & PASTA","DA HORTA À MESA","PEÇA AGORA","CAFÉ ARTESANAL"][index]}</div><b>{template.name}</b><small>{template.recommended}</small><small>{template.subtitle}</small></button>)}</div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f3f6ed] p-4"><div><b className="block text-sm">Prévia pública</b><p className="mt-1 text-xs text-[#879187]">Confira o modelo em um celular antes de compartilhar.</p></div><a href={menuUrl} target="_blank" rel="noreferrer" className="wm-admin-button"><ExternalLink size={14}/>Abrir prévia</a></div></section>}
          {tab==="service"&&<ServiceSettings menu={menu} busy={busy} onSave={saveSettings} />}
          {tab==="tables"&&<section className="wm-admin-card"><p className="wm-kicker">CONSUMO NO LOCAL</p><h2 className="mt-1 text-xl font-black tracking-tight">Mesas e links QR individuais</h2><p className="mt-1 mb-5 text-xs leading-6 text-[#879187]">Cada mesa recebe um token aleatório. O servidor valida o token na chegada e no pedido — não usa apenas um número livre na URL.</p><div className="mb-5 flex flex-wrap gap-2"><input value={tableNumber} onChange={e=>setTableNumber(e.target.value)} placeholder="Ex.: 01 ou Varanda 2" className="min-w-[180px] flex-1 rounded-xl border border-[#dfe5da] bg-white px-3 py-3 text-sm"/><button className="wm-admin-button primary" disabled={busy||!tableNumber.trim()} onClick={()=>void withBusy(async()=>{await saveTable(businessId,tableNumber);setTableNumber("");},"Mesa criada com token privado.")}><Plus size={14}/>Adicionar mesa</button></div><div className="wm-admin-list">{(bundle.tables||[]).map((table:MenuTable)=><div className="wm-admin-row" key={table.id}><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e9f0df] text-sm font-black">{table.table_number}</div><div className="wm-admin-row-content"><b>Mesa {table.table_number}</b><small>{table.is_active?"Ativa":"Desativada"} · token QR vinculado a esta mesa</small></div><button className="wm-admin-button" onClick={()=>copy(`${menuUrl}?mesa=${table.qr_token}`)}><Clipboard size={14}/>Copiar link QR</button><button className="wm-admin-button" onClick={()=>void withBusy(async()=>{await updateTable(table.id,!table.is_active);},table.is_active?"Mesa desativada.":"Mesa ativada.")}>{table.is_active?"Desativar":"Ativar"}</button></div>)}{!(bundle.tables||[]).length&&<div className="wm-empty"><strong>Nenhuma mesa cadastrada</strong>Cadastre as mesas para gerar links individuais. Para imprimir o QR Code, use o link copiado em um gerador de QR confiável.</div>}</div></section>}
          {tab==="access"&&profile?.role==="admin"&&<section className="wm-admin-card"><p className="wm-kicker">PERMISSÕES</p><h2 className="mt-1 text-xl font-black tracking-tight">Quem acessa este estabelecimento</h2><p className="mt-1 mb-5 text-xs leading-6 text-[#879187]">Somente usuários aprovados podem ser vinculados. O banco limita as consultas e alterações ao estabelecimento autorizado.</p><div className="wm-admin-grid items-end"><div className="wm-admin-field"><label>Usuário aprovado</label><select value={memberUserId} onChange={e=>setMemberUserId(e.target.value)}><option value="">Selecione a pessoa</option>{approvedUsers.map(u=><option key={u.id} value={u.id}>{u.full_name||u.email} {u.email?`· ${u.email}`:""}</option>)}</select></div><div className="wm-admin-field"><label>Permissão</label><select value={memberRole} onChange={e=>setMemberRole(e.target.value as any)}><option value="owner">Responsável · editar e operar pedidos</option><option value="editor">Editor · editar e operar pedidos</option><option value="viewer">Somente leitura</option></select></div></div><button className="wm-admin-button primary" disabled={busy||!memberUserId} onClick={()=>void addTeamMember()}><Users size={14}/>Vincular usuário</button>{saveError&&<p className="wm-error mt-3">{saveError}</p>}<div className="wm-admin-list mt-5">{members.map((member:any)=><div className="wm-admin-row" key={member.user_id}><div className="grid h-11 w-11 place-items-center rounded-full bg-[#eaf0df] font-black">{(member.profile?.full_name||member.profile?.email||"U").slice(0,1).toUpperCase()}</div><div className="wm-admin-row-content"><b>{member.profile?.full_name||member.profile?.email||"Usuário sem nome"}</b><small>{member.profile?.email||member.user_id} · {member.role}</small></div><button className="wm-admin-button danger" onClick={()=>void removeTeamMember(member.user_id)}>Remover acesso</button></div>)}{!members.length&&<p className="py-4 text-xs text-[#89948a]">Nenhum usuário externo vinculado.</p>}</div></section>}
        </main>
      </div>}

      {draft&&<div className="wm-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setDraft(null);}}><section className="wm-drawer" role="dialog" aria-modal="true" aria-label="Editar produto"><div className="wm-drawer-head"><div><p className="wm-kicker">CATÁLOGO / PRODUTO</p><h2>{draft.id?"Editar produto":"Novo produto"}</h2></div><button className="wm-close" onClick={()=>setDraft(null)} aria-label="Fechar">×</button></div><div className="wm-admin-grid"><div className="wm-admin-field"><label>Nome do produto</label><input autoFocus value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Ex.: Smash da casa"/></div><div className="wm-admin-field"><label>Preço (R$)</label><input inputMode="decimal" value={priceInput} onChange={e=>setPriceInput(e.target.value)} placeholder="25,90"/></div></div><div className="wm-admin-field"><label>Descrição</label><textarea rows={3} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Ingredientes, tamanho, sabor..."/></div><div className="wm-admin-field"><label>URL da imagem (https://)</label><input value={draft.image_url||""} onChange={e=>setDraft({...draft,image_url:e.target.value||null})} placeholder="https://..."/></div><div className="wm-admin-grid"><div className="wm-admin-field"><label>Categoria</label><select value={draft.category_id||""} onChange={e=>setDraft({...draft,category_id:e.target.value||null})}><option value="">Sem categoria</option>{bundle?.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="wm-admin-field"><label>Estação de preparo</label><select value={draft.station_id||""} onChange={e=>setDraft({...draft,station_id:e.target.value||null})}><option value="">Sem estação específica</option>{bundle?.stations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div></div><div className="flex flex-wrap gap-4 mb-4"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.is_available} onChange={e=>setDraft({...draft,is_available:e.target.checked})}/> Disponível para compra</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.is_featured} onChange={e=>setDraft({...draft,is_featured:e.target.checked})}/> Marcar como destaque</label></div><div className="rounded-2xl bg-[#f1f4ec] p-4"><h3 className="text-sm font-black">Tamanhos, sabores e adicionais</h3><p className="mt-1 text-xs leading-5 text-[#7b887e]">Cada linha define uma opção. Escreva “Bacon extra | 4,00”. O preço do adicional será validado no banco.</p><div className="wm-admin-field mt-4"><label>Nome do grupo</label><input value={draft.option_group_name} onChange={e=>setDraft({...draft,option_group_name:e.target.value})} placeholder="Ex.: Escolha o tamanho"/></div><div className="wm-admin-field"><label>Opções — uma por linha</label><textarea rows={5} value={draft.option_lines} onChange={e=>setDraft({...draft,option_lines:e.target.value})} placeholder={'Pequena | 0,00\nGrande | 12,00\nBorda recheada | 8,00'}/></div><div className="wm-admin-grid"><div className="wm-admin-field"><label>Mínimo de escolhas</label><input type="number" min={0} max={30} value={draft.option_group_min} onChange={e=>setDraft({...draft,option_group_min:Number(e.target.value)})}/></div><div className="wm-admin-field"><label>Máximo de escolhas</label><input type="number" min={1} max={30} value={draft.option_group_max} onChange={e=>setDraft({...draft,option_group_max:Number(e.target.value)})}/></div></div><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.option_group_required} onChange={e=>setDraft({...draft,option_group_required:e.target.checked,option_group_min:e.target.checked?Math.max(1,draft.option_group_min):0})}/> Tornar a escolha obrigatória</label></div>{error&&<div className="wm-error mt-4">{error}</div>}<button className="wm-admin-button primary mt-5 w-full py-3" disabled={busy} onClick={saveProduct}><Save size={15}/>{busy?"Salvando…":"Salvar produto"}</button><p className="mt-3 text-center text-[10px] text-[#8b958d]">As alterações só aparecem no público quando o item estiver disponível e o cardápio publicado.</p></section></div>}
    </div>
  </AdminShell>;
}

function ServiceSettings({menu,busy,onSave}:{menu:MenuRecord;busy:boolean;onSave:(changes:Partial<Pick<MenuRecord,"name"|"template_key"|"settings">>,message:string)=>Promise<void>}) {
  const [settings,setSettings]=useState({...DEFAULT_ORDER_SETTINGS,...menu.settings});
  const [name,setName]=useState(menu.name);
  useEffect(()=>{setSettings({...DEFAULT_ORDER_SETTINGS,...menu.settings});setName(menu.name);},[menu.id,menu.updated_at]);
  const change=(key:"allow_dine_in"|"allow_pickup"|"allow_delivery"|"allow_manual_table_number"|"delivery_fee_cents"|"estimated_prep_minutes",value:boolean|number)=>setSettings(current=>({...current,[key]:value} as typeof current));
  const noFulfillmentAvailable=!settings.allow_dine_in&&!settings.allow_pickup&&!settings.allow_delivery;
  return <section className="wm-admin-card"><p className="wm-kicker">CONFIGURAÇÃO DO ATENDIMENTO</p><h2 className="mt-1 text-xl font-black tracking-tight">Como este estabelecimento opera</h2><p className="mt-1 mb-5 text-xs leading-6 text-[#879187]">O servidor verifica a modalidade escolhida antes de registrar cada pedido.</p>{noFulfillmentAvailable&&<div className="wm-error mb-4">Ative pelo menos uma modalidade antes de salvar: consumo no local, retirada ou entrega.</div>}<div className="wm-admin-field"><label>Nome interno do cardápio</label><input value={name} onChange={e=>setName(e.target.value)}/></div><div className="mt-3 rounded-2xl border border-[#e5e9e1] px-4"><ToggleSetting title="Consumo no local" description="O cliente escolhe uma mesa ou chega pelo QR Code individual." checked={settings.allow_dine_in} onChange={v=>change("allow_dine_in",v)}/><ToggleSetting title="Retirada no balcão" description="O cliente informa nome e telefone para identificar a retirada." checked={settings.allow_pickup} onChange={v=>change("allow_pickup",v)}/><ToggleSetting title="Entrega" description="Solicita endereço completo e aplica a taxa configurada." checked={settings.allow_delivery} onChange={v=>change("allow_delivery",v)}/><ToggleSetting title="Permitir informar mesa manualmente" description="Desative para exigir que o consumidor use o token de um QR Code de mesa." checked={settings.allow_manual_table_number} onChange={v=>change("allow_manual_table_number",v)}/></div><div className="wm-admin-grid mt-5"><div className="wm-admin-field"><label>Taxa de entrega (R$)</label><input inputMode="decimal" value={formatPriceInput(settings.delivery_fee_cents)} onChange={e=>{const p=parsePriceToCents(e.target.value);if(p!==null)change("delivery_fee_cents",p);}} disabled={!settings.allow_delivery}/></div><div className="wm-admin-field"><label>Tempo estimado de preparo (min)</label><input type="number" min={1} max={240} value={settings.estimated_prep_minutes} onChange={e=>change("estimated_prep_minutes",Math.min(240,Math.max(1,Number(e.target.value)||1)))}/></div></div><div className="mt-5 flex justify-end"><button className="wm-admin-button primary" disabled={busy||noFulfillmentAvailable} onClick={()=>void onSave({name:name.trim()||"Cardápio principal",settings},"Configurações de atendimento salvas.")}><Save size={15}/>Salvar configurações</button></div></section>;
}
function ToggleSetting({title,description,checked,onChange}:{title:string;description:string;checked:boolean;onChange:(value:boolean)=>void}) {return <label className="wm-toggle-row cursor-pointer"><span><b>{title}</b><small>{description}</small></span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/></label>;}
