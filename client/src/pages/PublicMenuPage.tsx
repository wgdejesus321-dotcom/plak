import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRoute } from "wouter";
import { ArrowRight, CheckCircle2, Clock3, MapPin, Minus, Plus, Search, ShoppingBag, Utensils, X } from "lucide-react";
import { getPublicMenu, placeMenuOrder, resolvePublicMenuTable, type Fulfillment, type PublicMenuBundle, type MenuProduct, type PaymentMethod } from "@/lib/menu-data";
import "./WebMenu.css";

type CartLine = {productId:string;quantity:number;optionChoiceIds:string[];notes:string};
type OrderForm = {name:string;phone:string;address:string;tableNumber:string;payment:PaymentMethod;notes:string};
const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((cents||0)/100);
function randomIdempotencyKey(){if(typeof crypto!="undefined"&&crypto.randomUUID)return crypto.randomUUID();const values=new Uint8Array(16);crypto.getRandomValues(values);values[6]=(values[6]&0x0f)|0x40;values[8]=(values[8]&0x3f)|0x80;const h=[...values].map(v=>v.toString(16).padStart(2,"0")).join("");return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}

export default function PublicMenuPage(){
  const [,params]=useRoute("/:slug/cardapio");
  const slug=params?.slug||"";
  const [bundle,setBundle]=useState<PublicMenuBundle|null>(null);
  const [loading,setLoading]=useState(true);
  const [pageError,setPageError]=useState("");
  const [query,setQuery]=useState("");
  const [selectedCategory,setSelectedCategory]=useState("all");
  const [activeProduct,setActiveProduct]=useState<MenuProduct|null>(null);
  const [selectedChoices,setSelectedChoices]=useState<Record<string,string[]>>({});
  const [modalQuantity,setModalQuantity]=useState(1);
  const [modalNotes,setModalNotes]=useState("");
  const [cart,setCart]=useState<CartLine[]>([]);
  const [cartOpen,setCartOpen]=useState(false);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [fulfillment,setFulfillment]=useState<Fulfillment>("pickup");
  const [form,setForm]=useState<OrderForm>({name:"",phone:"",address:"",tableNumber:"",payment:"pix",notes:""});
  const [submitting,setSubmitting]=useState(false);
  const [submitError,setSubmitError]=useState("");
  const [validTable,setValidTable]=useState<{table_number:string}|null>(null);
  const [tableCheckError,setTableCheckError]=useState("");
  const checkoutKey=useRef("");
  const urlParams=useMemo(()=>new URLSearchParams(window.location.search),[]);
  const tableToken=urlParams.get("mesa");

  useEffect(()=>{
    let active=true;
    setLoading(true);setPageError("");
    getPublicMenu(slug).then(data=>{if(active){setBundle(data);if(data?.menu){const allowed:Fulfillment[]=[];if(data.menu.settings.allow_dine_in)allowed.push("dine_in");if(data.menu.settings.allow_pickup)allowed.push("pickup");if(data.menu.settings.allow_delivery)allowed.push("delivery");setFulfillment(allowed[0]||"pickup");}else setPageError("Este cardápio não existe ou ainda não foi publicado.");}})
      .catch(e=>active&&setPageError(e instanceof Error?e.message:"Não foi possível carregar o cardápio."))
      .finally(()=>active&&setLoading(false));
    return()=>{active=false;};
  },[slug]);

  useEffect(()=>{
    let active=true;
    if(!slug||!tableToken){setValidTable(null);setTableCheckError("");return;}
    resolvePublicMenuTable(slug,tableToken).then(result=>{
      if(!active)return;
      if(result){setValidTable(result);setForm(current=>({...current,tableNumber:result.table_number}));setFulfillment("dine_in");setTableCheckError("");}
      else{setValidTable(null);setTableCheckError("Não conseguimos validar este QR Code. Confira se ele pertence a uma mesa ativa e abra o link impresso na mesa.");}
    }).catch(()=>active&&setTableCheckError("Não foi possível validar o QR Code desta mesa."));
    return()=>{active=false;};
  },[slug,tableToken]);

  const products=useMemo(()=>{
    const all=bundle?.products||[];
    const term=query.trim().toLocaleLowerCase("pt-BR");
    return all.filter(product=>(selectedCategory==="all"||product.category_id===selectedCategory)&&(!term||`${product.name} ${product.description}`.toLocaleLowerCase("pt-BR").includes(term)));
  },[bundle?.products,query,selectedCategory]);
  const cartDetailed=useMemo(()=>cart.map(line=>{
    const product=bundle?.products.find(p=>p.id===line.productId);
    if(!product)return null;
    const choices=(product.option_groups||[]).flatMap(group=>group.choices||[]).filter(choice=>line.optionChoiceIds.includes(choice.id));
    const unit=product.price_cents+choices.reduce((sum,choice)=>sum+choice.price_cents,0);
    return {...line,product,choices,unit,lineTotal:unit*line.quantity};
  }).filter(Boolean) as Array<CartLine & {product:MenuProduct;choices:any[];unit:number;lineTotal:number}>,[cart,bundle?.products]);
  const itemCount=cart.reduce((total,line)=>total+line.quantity,0);
  const subtotal=cartDetailed.reduce((total,line)=>total+line.lineTotal,0);
  const deliveryFee=fulfillment==="delivery"?(bundle?.menu.settings.delivery_fee_cents||0):0;
  const estimatedTotal=subtotal+deliveryFee;

  const pushProduct=(product:MenuProduct)=>{
    if((product.option_groups||[]).some(group=>(group.choices||[]).length>0)){setActiveProduct(product);setSelectedChoices({});setModalQuantity(1);setModalNotes("");return;}
    setCart(current=>{
      const key=current.find(line=>line.productId===product.id&&!line.optionChoiceIds.length&&!line.notes);
      return key?current.map(line=>line===key?{...line,quantity:Math.min(99,line.quantity+1)}:line):[...current,{productId:product.id,quantity:1,optionChoiceIds:[],notes:""}];
    });
  };
  const addConfiguredProduct=()=>{
    if(!activeProduct)return;
    for(const group of activeProduct.option_groups||[]){
      const count=(selectedChoices[group.id]||[]).length;
      const requiredCount=group.is_required?Math.max(1,group.min_selections):group.min_selections;
      if(count<requiredCount){setSubmitError(`Escolha pelo menos ${requiredCount} opção(ões) em “${group.name}”.`);return;}
      if(count>group.max_selections){setSubmitError(`Escolha no máximo ${group.max_selections} opção(ões) em “${group.name}”.`);return;}
    }
    const ids=Object.values(selectedChoices).flat();
    const notes=modalNotes.trim();
    const found=cart.find(line=>line.productId===activeProduct.id&&line.optionChoiceIds.slice().sort().join(",")===ids.slice().sort().join(",")&&line.notes===notes);
    if(found)setCart(current=>current.map(line=>line===found?{...line,quantity:Math.min(99,line.quantity+modalQuantity)}:line));
    else setCart(current=>[...current,{productId:activeProduct.id,quantity:modalQuantity,optionChoiceIds:ids,notes}]);
    setActiveProduct(null);setSubmitError("");
  };
  const changeQty=(index:number,delta:number)=>setCart(current=>current.map((line,i)=>i===index?{...line,quantity:line.quantity+delta}:line).filter(line=>line.quantity>0));

  const submitOrder=async(event:FormEvent)=>{
    event.preventDefault();if(!bundle||submitting)return;
    setSubmitError("");
    if(fulfillment==="dine_in"&&tableToken&&!validTable){setSubmitError(tableCheckError||"Não foi possível validar a mesa deste pedido.");return;}
    if(fulfillment==="dine_in"&&!validTable&&!bundle.menu.settings.allow_manual_table_number){setSubmitError("Este estabelecimento exige o QR Code da mesa.");return;}
    if(!cartDetailed.length){setSubmitError("Adicione pelo menos um produto ao carrinho.");return;}
    setSubmitting(true);
    if(!checkoutKey.current)checkoutKey.current=randomIdempotencyKey();
    try{
      const result=await placeMenuOrder({
        businessSlug:bundle.business.slug,
        items:cart.map(line=>({product_id:line.productId,quantity:line.quantity,option_choice_ids:line.optionChoiceIds,notes:line.notes||undefined})),
        fulfillment,customerName:form.name,customerPhone:form.phone,customerAddress:form.address,
        tableToken:fulfillment==="dine_in"&&validTable?tableToken:null,manualTableNumber:fulfillment==="dine_in"&&!validTable?form.tableNumber:undefined,
        paymentMethod:form.payment,notes:form.notes,idempotencyKey:checkoutKey.current,
      });
      // Reset only after a confirmed response: unknown network failures keep the key for safe retries.
      checkoutKey.current="";
      // A confirmation route is only opened after the database RPC resolves successfully.
      window.location.assign(`/pedido/${result.tracking_token}`);
    }catch(e){setSubmitError(e instanceof Error?e.message:"Não foi possível registrar o pedido. Tente novamente.");}
    finally{setSubmitting(false);}
  };

  if(loading)return <div className="wm-page grid place-items-center px-6"><div className="text-center"><div className="mx-auto mb-4 h-2 w-16 overflow-hidden rounded-full bg-[#e2e8d8]"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#8aa365]"/></div><p className="text-sm text-[#7c8980]">Preparando o cardápio…</p></div></div>;
  if(!bundle)return <div className="wm-page grid min-h-screen place-items-center px-5"><div className="max-w-md text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e5ecd9]"><ShoppingBag size={26}/></div><h1 className="mt-6 text-3xl font-black tracking-tight">Cardápio indisponível</h1><p className="mt-3 text-sm leading-7 text-[#7c8980]">{pageError||"Este endereço ainda não está publicado."}</p><a href="/" className="wm-pill primary mt-5 inline-flex">Ir para PLAK</a></div></div>;

  const settings=bundle.menu.settings;
  const modes=[{id:"dine_in" as const,title:"No local",detail:"Mesa" ,enabled:settings.allow_dine_in},{id:"pickup" as const,title:"Retirada",detail:"Buscar",enabled:settings.allow_pickup},{id:"delivery" as const,title:"Entrega",detail:settings.allow_delivery?money(settings.delivery_fee_cents):"",enabled:settings.allow_delivery}].filter(mode=>mode.enabled);
  const theme=`plak-menu-theme-${bundle.menu.template_key}`;
  return <div className={`wm-page ${theme}`}>
    <div className="wm-shell">
      <header className="wm-topbar"><div className="wm-wordmark"><span className="wm-mark">{bundle.business.logo_url?<img src={bundle.business.logo_url} alt="" className="h-full w-full rounded-[inherit] object-cover"/>:bundle.business.name.trim().slice(0,1).toUpperCase()}</span><div><strong className="block text-sm">{bundle.business.name}</strong><small className="block text-[10px] font-semibold opacity-60">CARDÁPIO DIGITAL</small></div></div><div className="wm-top-actions"><span className="hidden items-center gap-1.5 text-[10px] font-extrabold opacity-65 sm:flex"><span className="h-2 w-2 rounded-full bg-[#83b568]"/>PEDIDOS ABERTOS</span><button className="wm-pill primary" onClick={()=>setCartOpen(true)}><ShoppingBag size={14} className="mr-1 inline"/>Sacola {itemCount>0?`(${itemCount})`:""}</button></div></header>
      <section className="wm-hero"><div><p className="wm-kicker">{bundle.menu.name}</p><h1 className="wm-title">{bundle.business.name}<br/><span className="opacity-65">feito para você.</span></h1><p className="wm-subtitle">{bundle.business.tagline||"Escolha seus favoritos e faça seu pedido em poucos passos."}</p><div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] font-bold opacity-65"><span className="inline-flex items-center gap-1.5"><Clock3 size={13}/>Preparo estimado: {settings.estimated_prep_minutes} min</span><span className="inline-flex items-center gap-1.5"><Utensils size={13}/>{modes.map(m=>m.title).join(" · ")||"Consulte disponibilidade"}</span></div></div><div className="wm-hero-art"><strong>{bundle.menu.template_key==="pizza-italiana"?"Feito no forno. Servido com carinho.":bundle.menu.template_key==="cafe-editorial"?"Pequenas pausas, grandes sabores.":bundle.menu.template_key==="delivery-bold"?"Escolha. Peça. Aproveite.":bundle.menu.template_key==="mesa-natural"?"Sabor de verdade, à mesa.":"Seu próximo favorito está aqui."}</strong><span>MENU / {new Date().getFullYear()}</span></div></section>
      {tableCheckError&&<div className="wm-error mb-4"><b>QR Code de mesa</b><br/>{tableCheckError}</div>}
      <div className="wm-toolbar"><label className="wm-search"><Search size={17} className="shrink-0 opacity-45"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar no cardápio…" aria-label="Buscar produtos"/></label><button className="wm-pill" onClick={()=>setSelectedCategory("all")}>Ver todos</button></div>
      <nav className="wm-categories" aria-label="Categorias do cardápio"><button className={`wm-category ${selectedCategory==="all"?"active":""}`} onClick={()=>setSelectedCategory("all")}>Todos</button>{bundle.categories.map(category=><button key={category.id} className={`wm-category ${selectedCategory===category.id?"active":""}`} onClick={()=>setSelectedCategory(category.id)}>{category.name}</button>)}</nav>
      <section><div className="wm-section-title"><div><h2>{selectedCategory==="all"?"Nosso cardápio":bundle.categories.find(c=>c.id===selectedCategory)?.name}</h2><p>{products.length} {products.length===1?"opção disponível":"opções disponíveis"}</p></div><span className="text-[10px] font-extrabold uppercase tracking-[.15em] opacity-45">Escolha seu pedido</span></div>
        {products.length?<div className="wm-grid">{products.map(product=><article className="wm-product" key={product.id}><div className="wm-product-image">{product.image_url?<img src={product.image_url} alt={product.name} loading="lazy"/>:<div className="wm-product-placeholder">{product.name.trim().slice(0,1).toUpperCase()}</div>}{product.is_featured&&<span className="wm-featured">Favorito</span>}</div><div className="wm-product-body"><div><h3 className="wm-product-title">{product.name}</h3><p className="wm-product-description">{product.description||"Preparado com cuidado para você."}</p></div><div className="wm-product-foot"><span className="wm-price">{money(product.price_cents)}</span><button className="wm-add" onClick={()=>pushProduct(product)} aria-label={`Adicionar ${product.name}`}><Plus size={19}/></button></div>{(product.option_groups||[]).length>0&&<span className="text-[9px] font-bold opacity-50">Opções e adicionais disponíveis</span>}</div></article>)}</div>:<div className="wm-empty"><strong>Nenhum produto encontrado</strong>{bundle.products.length?"Tente outra busca ou categoria.":"Este cardápio ainda não tem produtos publicados."}</div>}
      </section>
      <footer className="mt-14 border-t border-current/10 pt-5 text-center text-[10px] font-semibold opacity-45">CARDÁPIO DIGITAL · {bundle.business.name} · PLAK</footer>
    </div>
    {itemCount>0&&<button className="wm-sticky-cart" onClick={()=>{setCartOpen(true);setCheckoutOpen(false);}}><span className="wm-cart-count">{itemCount}</span><span className="wm-cart-copy"><strong>Ver minha sacola</strong><small>{itemCount===1?"1 item no pedido":`${itemCount} itens no pedido`}</small></span><span className="wm-cart-total">{money(estimatedTotal)}</span><ArrowRight size={17}/></button>}

    {activeProduct&&<div className="wm-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setActiveProduct(null);}}><section className="wm-drawer" role="dialog" aria-modal="true" aria-label={`Escolher opções de ${activeProduct.name}`}><div className="wm-drawer-head"><div><p className="wm-kicker">PERSONALIZE SEU PEDIDO</p><h2>{activeProduct.name}</h2><p className="mt-1 text-sm text-[#7c8980]">{money(activeProduct.price_cents)} cada</p></div><button className="wm-close" onClick={()=>setActiveProduct(null)} aria-label="Fechar">×</button></div>{activeProduct.description&&<p className="mb-4 text-sm leading-6 text-[#77847b]">{activeProduct.description}</p>}{(activeProduct.option_groups||[]).map(group=><fieldset className="mb-5" key={group.id}><legend className="mb-2 text-sm font-black">{group.name} <span className="text-[10px] font-medium text-[#8a958c]">{group.is_required?"Obrigatório":"Opcional"} · até {group.max_selections}</span></legend><div className="space-y-2">{group.choices.map(choice=>{const selected=(selectedChoices[group.id]||[]).includes(choice.id);const disabled=!selected&&(selectedChoices[group.id]||[]).length>=group.max_selections;return <label key={choice.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${selected?"border-[#8ba667] bg-[#f0f5e7]":"border-[#e4e9e0] bg-white"} ${disabled?"opacity-45":""}`}><input type="checkbox" checked={selected} disabled={disabled} onChange={e=>setSelectedChoices(current=>({...current,[group.id]:e.target.checked?[...(current[group.id]||[]),choice.id]:(current[group.id]||[]).filter(id=>id!==choice.id)}))}/><span className="flex-1 text-sm font-semibold">{choice.name}</span><span className="text-xs font-bold">{choice.price_cents?`+ ${money(choice.price_cents)}`:"Grátis"}</span></label>;})}</div></fieldset>)}<div className="wm-field"><label>Observação deste item (opcional)</label><textarea rows={3} value={modalNotes} maxLength={500} onChange={e=>setModalNotes(e.target.value)} placeholder="Ex.: sem cebola, ponto da carne…"/></div><div className="flex items-center justify-between border-t border-[#e3e8df] pt-5"><div className="wm-qty"><button onClick={()=>setModalQuantity(q=>Math.max(1,q-1))} aria-label="Diminuir quantidade"><Minus size={14}/></button><b>{modalQuantity}</b><button onClick={()=>setModalQuantity(q=>Math.min(99,q+1))} aria-label="Aumentar quantidade"><Plus size={14}/></button></div><button className="wm-pill primary" onClick={addConfiguredProduct}>Adicionar · {money(modalQuantity*(activeProduct.price_cents+(activeProduct.option_groups||[]).flatMap(g=>g.choices).filter(c=>Object.values(selectedChoices).flat().includes(c.id)).reduce((sum,c)=>sum+c.price_cents,0)))}</button></div>{submitError&&<div className="wm-error mt-3">{submitError}</div>}</section></div>}

    {cartOpen&&<div className="wm-overlay" onMouseDown={e=>{if(e.target===e.currentTarget){setCartOpen(false);setCheckoutOpen(false);}}}><section className="wm-drawer" role="dialog" aria-modal="true" aria-label="Sua sacola"><div className="wm-drawer-head"><div><p className="wm-kicker">{checkoutOpen?"FINALIZAÇÃO":"SEU PEDIDO"}</p><h2>{checkoutOpen?"Quase lá.":"Sua sacola"}</h2></div><button className="wm-close" onClick={()=>{setCartOpen(false);setCheckoutOpen(false);}} aria-label="Fechar">×</button></div>
      {!checkoutOpen?<>{cartDetailed.length?cartDetailed.map((line,index)=><div className="wm-cart-line" key={`${line.product.id}-${index}`}><div><h3>{line.product.name}</h3>{line.choices.length>0&&<p>{line.choices.map(c=>c.name).join(", ")}</p>}{line.notes&&<p>Obs.: {line.notes}</p>}<b className="text-xs">{money(line.lineTotal)}</b></div><div className="wm-qty"><button onClick={()=>changeQty(index,-1)} aria-label="Diminuir">−</button><b>{line.quantity}</b><button onClick={()=>changeQty(index,1)} aria-label="Aumentar">+</button></div></div>):<div className="wm-empty"><strong>Sua sacola está vazia</strong>Adicione produtos do cardápio para continuar.</div>}{cartDetailed.length>0&&<><div className="mt-5"><div className="wm-total-row"><span>Subtotal</span><b>{money(subtotal)}</b></div>{fulfillment==="delivery"&&<div className="wm-total-row"><span>Taxa de entrega</span><b>{money(deliveryFee)}</b></div>}<div className="wm-total-row grand"><span>Total estimado</span><b>{money(estimatedTotal)}</b></div></div><button className="wm-pill primary mt-4 w-full py-4" onClick={()=>setCheckoutOpen(true)}>Continuar para finalizar <ArrowRight size={15} className="ml-1 inline"/></button></>}</>
      :<form onSubmit={submitOrder}>
        <div className="mb-5"><p className="mb-2 text-xs font-black uppercase tracking-[.12em]">Como você vai receber?</p><div className="wm-mode-list">{modes.map(mode=><button type="button" key={mode.id} className={`wm-mode ${fulfillment===mode.id?"active":""}`} onClick={()=>setFulfillment(mode.id)}>{mode.title}<small>{mode.id==="delivery"?money(settings.delivery_fee_cents):mode.id==="dine_in"?"Escolha a mesa":"No balcão"}</small></button>)}</div></div>
        <div className="wm-field"><label>Seu nome</label><input value={form.name} required minLength={2} maxLength={100} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Como podemos chamar você?" autoComplete="name"/></div>
        <div className="wm-field"><label>Telefone / WhatsApp</label><input value={form.phone} required minLength={8} maxLength={30} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(11) 99999-9999" autoComplete="tel"/></div>
        {fulfillment==="dine_in"&&<div className="wm-field"><label>Mesa</label>{validTable?<div className="flex items-center gap-3 rounded-xl border border-[#dce8ce] bg-[#f0f5e8] p-3"><MapPin size={17}/><div><b>Mesa {validTable.table_number}</b><small className="block text-[10px] text-[#6b8060]">Identificada pelo QR Code desta mesa</small></div><CheckCircle2 className="ml-auto" size={16}/></div>:<input value={form.tableNumber} onChange={e=>setForm({...form,tableNumber:e.target.value})} required={!settings.allow_manual_table_number||fulfillment==="dine_in"} disabled={!settings.allow_manual_table_number||Boolean(tableToken)} placeholder="Ex.: 05"/>}{!validTable&&tableToken&&tableCheckError&&<small className="text-xs text-[#a34c3a]">O QR Code não foi validado. Não é possível finalizar como consumo no local.</small>}</div>}
        {fulfillment==="delivery"&&<div className="wm-field"><label>Endereço completo para entrega</label><textarea rows={3} required minLength={6} maxLength={500} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Rua, número, bairro, complemento…" autoComplete="street-address"/></div>}
        <div className="wm-field"><label>Forma de pagamento</label><select value={form.payment} onChange={e=>setForm({...form,payment:e.target.value as PaymentMethod})}><option value="pix">Pix (combinar com estabelecimento)</option><option value="cash">Dinheiro</option><option value="card">Cartão na entrega / retirada</option></select><small className="text-[10px] leading-5 text-[#89948a]">O cardápio registra a forma escolhida; o pagamento ainda não é confirmado automaticamente.</small></div>
        <div className="wm-field"><label>Observações do pedido (opcional)</label><textarea rows={2} maxLength={1000} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Referência, troco para…"/></div>
        <div className="mt-5"><div className="wm-total-row"><span>Subtotal</span><b>{money(subtotal)}</b></div>{fulfillment==="delivery"&&<div className="wm-total-row"><span>Entrega</span><b>{money(deliveryFee)}</b></div>}<div className="wm-total-row grand"><span>Total</span><b>{money(estimatedTotal)}</b></div></div>
        {submitError&&<div className="wm-error mb-3" role="alert">{submitError}</div>}
        <button type="submit" className="wm-pill primary mt-3 w-full py-4" disabled={submitting||!cartDetailed.length||(fulfillment==="dine_in"&&Boolean(tableToken)&&!validTable)}>{submitting?"Registrando pedido…":"Confirmar pedido"} <ArrowRight className="ml-1 inline" size={15}/></button><p className="mt-3 text-center text-[10px] leading-5 text-[#89948a]">Seu pedido só será confirmado após ser registrado no banco de dados.</p><button type="button" className="mt-4 w-full text-xs font-bold text-[#65786b]" onClick={()=>{setCheckoutOpen(false);setSubmitError("");}}>Voltar à sacola</button>
      </form>}
    </section></div>}
  </div>;
}
