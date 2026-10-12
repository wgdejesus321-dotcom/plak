import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Clock3, ExternalLink, ListChecks, RefreshCw, Search, Volume2, VolumeX, X } from "lucide-react";
import { Link } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { listAccessibleBusinesses, listOrders, listOrderStatusHistory, updateOrderPaymentStatus, updateOrderStatus, type Fulfillment, type MenuBusiness, type MenuOrder, type MenuOrderStatusHistory, type OrderStatus } from "@/lib/menu-data";
import { canCancelOrder, elapsedLabel, formatOrderNumber, nextOrderAction } from "@/lib/menu-domain";
import "./WebMenu.css";

const brl=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((cents||0)/100);
const statusLabels:Record<OrderStatus,string>={new:"Novo",confirmed:"Confirmado",preparing:"Em preparação",ready:"Pronto",delivering:"Em entrega",completed:"Concluído",cancelled:"Cancelado"};
const fulfillmentLabels:Record<Fulfillment,string>={dine_in:"Consumo no local",pickup:"Retirada",delivery:"Entrega"};
const paymentLabels={pix:"Pix",card:"Cartão",cash:"Dinheiro"};
const paymentStatusLabels={pending:"Pagamento pendente",confirmed:"Pagamento confirmado",failed:"Pagamento não concluído",refunded:"Pagamento estornado"};
function dayStart(){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const part=(type:string)=>parts.find(item=>item.type===type)?.value||"00";
  return new Date(Date.UTC(Number(part("year")),Number(part("month"))-1,Number(part("day")),3,0,0)).toISOString();
}
function displayNumber(order:MenuOrder){return formatOrderNumber(order.daily_number);}
function saoPauloMinuteOfDay(iso:string){const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"America/Sao_Paulo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(iso));const read=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);return read("hour")*60+read("minute");}
function inputMinuteOfDay(value:string){const [hour,minute]=value.split(":").map(Number);return hour*60+minute;}
function beep(){try{const AudioContextClass=window.AudioContext;if(!AudioContextClass)return;const context=new AudioContextClass();const oscillator=context.createOscillator();const gain=context.createGain();oscillator.type="sine";oscillator.frequency.value=880;gain.gain.setValueAtTime(.0001,context.currentTime);gain.gain.exponentialRampToValueAtTime(.12,context.currentTime+.025);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.28);oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.3);oscillator.onended=()=>void context.close();}catch{}}

type Props={kitchenMode?:boolean};
export default function OrdersDashboard({kitchenMode=false}:Props){
  const [businesses,setBusinesses]=useState<MenuBusiness[]>([]);
  const [businessId,setBusinessId]=useState("");
  const [orders,setOrders]=useState<MenuOrder[]>([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState("");
  const [realtime,setRealtime]=useState(false);
  const [query,setQuery]=useState("");
  const [timeFrom,setTimeFrom]=useState("");
  const [timeTo,setTimeTo]=useState("");
  const [fulfillment,setFulfillment]=useState<"all"|Fulfillment>("all");
  const [category,setCategory]=useState("all");
  const [station,setStation]=useState("all");
  const [statusFilter,setStatusFilter]=useState<"active"|"all">("active");
  const [selectedOrderId,setSelectedOrderId]=useState<string|null>(null);
  const [busyOrderId,setBusyOrderId]=useState<string|null>(null);
  const [paymentBusyOrderId,setPaymentBusyOrderId]=useState<string|null>(null);
  const [orderHistory,setOrderHistory]=useState<MenuOrderStatusHistory[]>([]);
  const [historyLoading,setHistoryLoading]=useState(false);
  const [alertMessage,setAlertMessage]=useState("");
  const [soundEnabled,setSoundEnabled]=useState(()=>{try{return localStorage.getItem("plak-order-alert-sound")==="true";}catch{return false;}});
  const [unseen,setUnseen]=useState(0);
  const [clock,setClock]=useState(Date.now());
  const initialized=useRef(false);
  const knownOrders=useRef<Set<string>>(new Set());
  const lastAnnounced=useRef("");
  const loadingRef=useRef(false);
  const selectedOrder=orders.find(order=>order.id===selectedOrderId)||null;

  useEffect(()=>{
    if(!selectedOrderId){setOrderHistory([]);setHistoryLoading(false);return;}
    let active=true;setHistoryLoading(true);
    listOrderStatusHistory(selectedOrderId).then(rows=>active&&setOrderHistory(rows))
      .catch(()=>active&&setOrderHistory([])).finally(()=>active&&setHistoryLoading(false));
    return()=>{active=false;};
  },[selectedOrderId]);

  useEffect(()=>{
    let active=true;
    listAccessibleBusinesses().then(rows=>{if(active){setBusinesses(rows);const fromUrl=new URLSearchParams(window.location.search).get("business");if(fromUrl&&rows.some(row=>row.id===fromUrl))setBusinessId(fromUrl);}})
      .catch(e=>active&&setError(e instanceof Error?e.message:"Não foi possível carregar estabelecimentos autorizados."))
      .finally(()=>active&&setLoading(false));
    return()=>{active=false;};
  },[]);

  const refresh=useCallback(async(silent=false)=>{
    if(!businesses.length||loadingRef.current)return;
    loadingRef.current=true;
    if(!silent)setRefreshing(true);
    try{
      const rows=await listOrders(businesses.map(b=>b.id),businessId||undefined,dayStart());
      const ids=new Set(rows.map(order=>order.id));
      if(initialized.current){
        const newcomers=rows.filter(order=>!knownOrders.current.has(order.id));
        if(newcomers.length){
          setUnseen(current=>current+newcomers.length);
          setAlertMessage(`${newcomers.length===1?"Novo pedido recebido":"Novos pedidos recebidos"}: ${newcomers.slice(0,3).map(displayNumber).join(", ")}`);
          if(soundEnabled)beep();
        }
      }else initialized.current=true;
      knownOrders.current=new Set([...knownOrders.current,...ids]);
      setOrders(rows);setError("");
    }catch(e){setError(e instanceof Error?e.message:"Falha ao consultar pedidos.");}
    finally{loadingRef.current=false;setRefreshing(false);}
  },[businesses,businessId,soundEnabled]);

  useEffect(()=>{if(businesses.length)void refresh();},[businesses.length,businessId,refresh]);
  useEffect(()=>{
    if(!businesses.length)return;
    let channel:any;
    if(supabase){
      channel=supabase.channel(`plak-orders-${businessId||"accessible"}-${kitchenMode?"kitchen":"dashboard"}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"menu_orders"},()=>void refresh(true))
        .on("postgres_changes",{event:"INSERT",schema:"public",table:"menu_order_items"},()=>void refresh(true))
        .subscribe((status)=>{setRealtime(status==="SUBSCRIBED");});
    }
    const poll=window.setInterval(()=>void refresh(true),20000);
    const tick=window.setInterval(()=>setClock(Date.now()),12000);
    return()=>{window.clearInterval(poll);window.clearInterval(tick);if(channel&&supabase)void supabase.removeChannel(channel);setRealtime(false);};
  },[businesses.length,businessId,kitchenMode,refresh]);

  const filtered=useMemo(()=>{
    const term=query.trim().toLocaleLowerCase("pt-BR");
    return orders.filter(order=>{
      if(statusFilter==="active"&&["completed","cancelled"].includes(order.status))return false;
      if(fulfillment!=="all"&&order.fulfillment!==fulfillment)return false;
      const orderMinute=saoPauloMinuteOfDay(order.created_at);
      if(timeFrom&&orderMinute<inputMinuteOfDay(timeFrom))return false;
      if(timeTo&&orderMinute>inputMinuteOfDay(timeTo))return false;
      if(category!=="all"&&!order.menu_order_items.some(item=>item.category_name===category))return false;
      if(station!=="all"&&!order.menu_order_items.some(item=>item.station_name===station))return false;
      if(term&&!`${order.daily_number} ${order.customer_name} ${order.customer_phone} ${order.table_number||""} ${order.id}`.toLocaleLowerCase("pt-BR").includes(term))return false;
      return true;
    });
  },[orders,query,timeFrom,timeTo,fulfillment,category,station,statusFilter]);
  const activeOrders=orders.filter(order=>!['completed','cancelled'].includes(order.status));
  const todayValue=orders.filter(order=>order.status!=="cancelled").reduce((sum,order)=>sum+order.total_cents,0);
  const stats=[
    {label:"Pedidos novos",value:orders.filter(o=>o.status==="new").length,detail:"Aguardando confirmação"},
    {label:"Em preparação",value:orders.filter(o=>o.status==="preparing").length,detail:"Na cozinha"},
    {label:"Prontos / em entrega",value:orders.filter(o=>o.status==="ready"||o.status==="delivering").length,detail:"Aguardando cliente ou rota"},
    {label:"Concluídos",value:orders.filter(o=>o.status==="completed").length,detail:"Atendimento finalizado"},
    {label:"Pedidos de hoje",value:orders.length,detail:"Inclui cancelamentos"},
    {label:"Valor registrado",value:brl(todayValue),detail:"Exclui pedidos cancelados"},
  ];
  const categories=Array.from(new Set(orders.flatMap(o=>o.menu_order_items.map(item=>item.category_name).filter(Boolean) as string[]))).sort();
  const stations=Array.from(new Set(orders.flatMap(o=>o.menu_order_items.map(item=>item.station_name).filter(Boolean) as string[]))).sort();

  const changeStatus=async(order:MenuOrder,next:OrderStatus)=>{
    let cancelReason="";
    if(next==="cancelled"){
      const reason=window.prompt(`Motivo do cancelamento do pedido ${displayNumber(order)}:`);
      if(reason===null)return;
      cancelReason=reason.trim();if(cancelReason.length<3){setError("Informe um motivo de pelo menos 3 caracteres para cancelar.");return;}
    }
    setBusyOrderId(order.id);setError("");
    try{await updateOrderStatus(order.id,next,cancelReason);setAlertMessage("");await refresh(true);setSelectedOrderId(null);}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível atualizar o status.");}
    finally{setBusyOrderId(null);}
  };
  const confirmPayment=async(order:MenuOrder)=>{
    if(order.payment_status!=="pending")return;
    if(!window.confirm(`Confirmar que o estabelecimento recebeu o pagamento do pedido ${displayNumber(order)}? Esta ação é manual e não consulta um provedor de pagamento.`))return;
    setPaymentBusyOrderId(order.id);setError("");
    try{await updateOrderPaymentStatus(order.id);setAlertMessage("Pagamento marcado como confirmado pelo estabelecimento.");await refresh(true);}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível confirmar o pagamento.");}
    finally{setPaymentBusyOrderId(null);}
  };
  const openOrder=(id:string)=>{setSelectedOrderId(id);setUnseen(0);setAlertMessage("");};
  const toggleSound=()=>{setSoundEnabled(current=>{const next=!current;try{localStorage.setItem("plak-order-alert-sound",String(next));}catch{}if(next)beep();return next;});};
  const activeStatuses:OrderStatus[]=kitchenMode?["new","confirmed","preparing","ready"]:["new","confirmed","preparing","ready"];
  const lanes:{status:OrderStatus[];label:string;description:string}[]=kitchenMode?[
    {status:["new","confirmed"],label:"Entrada",description:"Confirmar e iniciar"},
    {status:["preparing"],label:"Em preparo",description:"Produção em andamento"},
    {status:["ready"],label:"Prontos",description:"Liberar para atendimento"},
  ]:[
    {status:["new"],label:"Novos",description:"Aguardando análise"},
    {status:["confirmed"],label:"Confirmados",description:"Prontos para a cozinha"},
    {status:["preparing"],label:"Em preparação",description:"Em produção"},
    {status:["ready","delivering"],label:"Pronto / Entrega",description:"Retirada, mesa ou rota"},
  ];
  const getNextAction=(order:MenuOrder)=>nextOrderAction(order.status,order.fulfillment,kitchenMode);
  const sortedByQueue=(items:MenuOrder[])=>items.slice().sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());

  return <AdminShell adminOnly={false}><div className={`wm-admin ${kitchenMode?"wm-kitchen":""}`}>
    <header className="wm-admin-header"><div><p className="wm-kicker">PLAK / OPERAÇÃO DO ESTABELECIMENTO</p><h1>{kitchenMode?"Tela da cozinha":"Painel de pedidos"}</h1><p>{kitchenMode?"Uma fila de leitura rápida para a equipe preparar, liberar e acompanhar os pedidos.":"Organize a fila por etapa, identifique a mesa e acompanhe o tempo desde a criação, sem perder o histórico."}</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/cardapios" className="wm-admin-button">Gerenciar cardápio</Link>{!kitchenMode&&<Link href="/painel/historico" className="wm-admin-button"><ListChecks size={14}/>Histórico e relatórios</Link>}<button className="wm-admin-button" onClick={()=>void refresh()} disabled={refreshing}><RefreshCw size={14} className={refreshing?"animate-spin":""}/>{refreshing?"Atualizando":"Atualizar"}</button></div></header>
    {error&&<div className="wm-error mb-4" role="alert">{error}</div>}
    {alertMessage&&<div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#d9e8c6] bg-[#eef6e4] p-3 text-sm font-bold text-[#38582f]" role="status"><BellRing size={17}/><span className="flex-1">{alertMessage}</span><button className="wm-admin-button" onClick={()=>setAlertMessage("")}>Dispensar</button></div>}
    <section className="wm-admin-card"><div className="flex flex-wrap items-end justify-between gap-4"><div className="wm-admin-field mb-0 min-w-[240px] flex-1"><label htmlFor="order-business">Estabelecimento</label><select id="order-business" value={businessId} onChange={e=>setBusinessId(e.target.value)}><option value="">Todos os estabelecimentos autorizados</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[#7f8b81]"><span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${realtime?"bg-[#76a85e]":"bg-[#d6a56b]"}`}/>{realtime?"Tempo real conectado":"Sincronização automática"}</span><span>Verificado {new Date(clock).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span><button className="wm-admin-button" onClick={toggleSound}>{soundEnabled?<Volume2 size={14}/>:<VolumeX size={14}/>}Som {soundEnabled?"ativado":"desativado"}</button></div></div></section>
    {!kitchenMode&&<div className="wm-stat-grid">{stats.map(stat=><article key={stat.label} className="wm-stat"><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}</div>}
    <div className="wm-filterbar"><label className="wm-search"><Search size={15} className="shrink-0 opacity-45"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar número, cliente ou mesa…" aria-label="Pesquisar pedidos"/></label><select value={fulfillment} onChange={e=>setFulfillment(e.target.value as any)} aria-label="Filtrar modalidade"><option value="all">Todas as modalidades</option><option value="dine_in">Consumo no local</option><option value="pickup">Retirada</option><option value="delivery">Entrega</option></select><label className="wm-date-field"><span>Das</span><input aria-label="Horário inicial" type="time" value={timeFrom} onChange={e=>setTimeFrom(e.target.value)}/></label><label className="wm-date-field"><span>Até</span><input aria-label="Horário final" type="time" value={timeTo} onChange={e=>setTimeTo(e.target.value)}/></label><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filtrar categoria"><option value="all">Todas as categorias</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select><select value={station} onChange={e=>setStation(e.target.value)} aria-label="Filtrar estação"><option value="all">Todas as estações</option>{stations.map(s=><option key={s} value={s}>{s}</option>)}</select>{!kitchenMode&&<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} aria-label="Filtrar histórico"><option value="active">Em andamento</option><option value="all">Todos os pedidos de hoje</option></select>}</div>
    {loading?<div className="wm-admin-card wm-empty"><strong>Carregando pedidos reais…</strong>Consultando o banco de dados.</div>:!businesses.length?<div className="wm-admin-card wm-empty"><strong>Nenhum estabelecimento autorizado</strong>Peça ao administrador do PLAK para vincular seu usuário ao estabelecimento.</div>:<section className="wm-status-board">{lanes.map(lane=>{const laneOrders=sortedByQueue(filtered.filter(order=>lane.status.includes(order.status)));return <div key={lane.label} className="wm-status-lane"><div className="wm-lane-title"><div><b>{lane.label}</b><small className="block mt-1 text-[9px] font-medium text-[#879287]">{lane.description}</small></div><span>{laneOrders.length}</span></div>{laneOrders.map(order=>{const orderItems=order.menu_order_items||[];const minutes=(Date.now()-new Date(order.created_at).getTime())/60000;const overdue=minutes>order.estimated_prep_minutes&&!["ready","delivering","completed","cancelled"].includes(order.status);const action=getNextAction(order);const unseenBadge=unseen>0&&order.status==="new";return <article key={order.id} className={`wm-order-card ${overdue?"overdue":""}`}><div className="wm-order-heading"><div><div className="wm-order-number">{displayNumber(order)}{unseenBadge&&<span className="ml-2 inline-block rounded-full bg-[#f5dfd6] px-2 py-1 align-middle text-[8px] font-black uppercase tracking-wider text-[#9e4a34]">Novo</span>}</div><div className="wm-order-sub">{new Date(order.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} · {elapsedLabel(order.created_at)}</div></div><span className="wm-order-kind">{order.fulfillment==="dine_in"?`Mesa ${order.table_number||"—"}`:fulfillmentLabels[order.fulfillment]}</span></div><div className="mt-3"><b className="block truncate text-xs">{order.customer_name}</b><small className="mt-1 block text-[10px] text-[#879187]">{order.customer_phone}</small></div><ul className="wm-order-items">{orderItems.map(item=><li key={item.id}><b>{item.quantity}×</b><span>{item.product_name}{item.selected_options?.length?` · ${item.selected_options.map(v=>v.name).join(", ")}`:""}{item.notes&&<small>Obs.: {item.notes}</small>}{item.station_name&&<small>Estação: {item.station_name}</small>}</span></li>)}</ul>{order.customer_notes&&<div className="mb-3 rounded-lg bg-[#fff8e9] p-2 text-[10px] leading-4 text-[#876c3d]"><b>Observação:</b> {order.customer_notes}</div>}<div className="wm-order-bottom"><span className={`wm-order-time ${overdue?"overdue":""}`}>{overdue?"Tempo estimado excedido · ":"Em fila · "}{elapsedLabel(order.created_at)}</span><b className="wm-order-price">{brl(order.total_cents)}</b></div><div className="mt-2 flex items-center justify-between text-[9px] text-[#909b91]"><span>{paymentLabels[order.payment_method]} · {paymentStatusLabels[order.payment_status]}</span><span>Meta {order.estimated_prep_minutes} min</span></div><div className="wm-order-actions"><button onClick={()=>openOrder(order.id)} className="secondary"><ExternalLink size={12} className="mr-1 inline"/>Detalhes</button>{action&&<button disabled={busyOrderId===order.id} onClick={()=>void changeStatus(order,action.status)}>{busyOrderId===order.id?"Salvando…":action.label}</button>}{!kitchenMode&&canCancelOrder(order.status)&&<button className="cancel" disabled={busyOrderId===order.id} onClick={()=>void changeStatus(order,"cancelled")}>Cancelar</button>}</div></article>;})}{!laneOrders.length&&<div className="py-8 text-center text-[10px] leading-5 text-[#8b968c]">Nenhum pedido nesta etapa.</div>}</div>;})}</section>}
    {!kitchenMode&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#8b968c]"><span>Mostrando {filtered.length} pedidos de hoje · Os concluídos e cancelados permanecem disponíveis no histórico.</span><Link href="/painel/historico" className="font-black text-[#506744]">Abrir histórico completo →</Link></div>}
    {selectedOrder&&<div className="wm-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedOrderId(null);}}><section className="wm-drawer" role="dialog" aria-modal="true" aria-label={`Detalhes do pedido ${displayNumber(selectedOrder)}`}><div className="wm-drawer-head"><div><p className="wm-kicker">PEDIDO / {selectedOrder.order_date.split("-").reverse().join("/")}</p><h2>{displayNumber(selectedOrder)}</h2><p className="mt-1 text-xs text-[#879187]">{statusLabels[selectedOrder.status]} · {elapsedLabel(selectedOrder.created_at)}</p></div><button className="wm-close" onClick={()=>setSelectedOrderId(null)} aria-label="Fechar detalhes"><X size={17}/></button></div><div className="wm-details-grid"><div className="wm-detail-box"><span>Cliente</span><b>{selectedOrder.customer_name}</b><b>{selectedOrder.customer_phone}</b></div><div className="wm-detail-box"><span>Modalidade</span><b>{fulfillmentLabels[selectedOrder.fulfillment]}</b><b>{selectedOrder.table_number?`Mesa ${selectedOrder.table_number}`:selectedOrder.customer_address||"Sem endereço de entrega"}</b></div><div className="wm-detail-box"><span>Pagamento</span><b>{paymentLabels[selectedOrder.payment_method]}</b><b>{paymentStatusLabels[selectedOrder.payment_status]}</b></div><div className="wm-detail-box"><span>Tempo estimado</span><b>{selectedOrder.estimated_prep_minutes} min</b><b>Etapa atual: {elapsedLabel(selectedOrder.stage_updated_at)}</b></div></div><h3 className="mt-6 text-sm font-black">Itens do pedido</h3><div className="mt-2 space-y-3">{selectedOrder.menu_order_items.map(item=><div className="border-b border-[#e8ece4] pb-3" key={item.id}><div className="flex justify-between gap-3 text-sm"><b>{item.quantity}× {item.product_name}</b><strong>{brl(item.line_total_cents)}</strong></div><p className="mt-1 text-xs leading-5 text-[#7b887e]">Categoria: {item.category_name||"—"} · Estação: {item.station_name||"Geral"}</p>{item.selected_options?.length>0&&<p className="mt-1 text-xs text-[#7b887e]">Adicionais: {item.selected_options.map(v=>`${v.name}${v.price_cents?` (+${brl(v.price_cents)})`:""}`).join(", ")}</p>}{item.notes&&<p className="mt-1 rounded-lg bg-[#fff8e9] p-2 text-xs text-[#81683e]">Observação: {item.notes}</p>}</div>)}</div>{selectedOrder.customer_notes&&<div className="mt-4 rounded-xl bg-[#fff8e9] p-3 text-xs leading-5 text-[#876c3d]"><b>Observação do cliente</b><p>{selectedOrder.customer_notes}</p></div>}<div className="mt-5"><div className="wm-total-row"><span>Subtotal</span><b>{brl(selectedOrder.subtotal_cents)}</b></div>{selectedOrder.delivery_fee_cents>0&&<div className="wm-total-row"><span>Taxa de entrega</span><b>{brl(selectedOrder.delivery_fee_cents)}</b></div>}<div className="wm-total-row grand"><span>Total</span><b>{brl(selectedOrder.total_cents)}</b></div></div>{getNextAction(selectedOrder)&&<button className="wm-pill primary mt-5 w-full py-4" disabled={busyOrderId===selectedOrder.id} onClick={()=>{const action=getNextAction(selectedOrder);if(action)void changeStatus(selectedOrder,action.status);}}>{getNextAction(selectedOrder)?.label}</button>}{!kitchenMode&&selectedOrder.payment_status==="pending"&&<div className="mt-4 rounded-xl border border-[#dfe7d7] bg-[#f6f8f2] p-4"><p className="text-xs leading-5 text-[#6e7d70]">A confirmação é manual. Só marque depois de verificar o recebimento no meio de pagamento utilizado.</p><button className="wm-admin-button primary mt-3 w-full justify-center" disabled={paymentBusyOrderId===selectedOrder.id} onClick={()=>void confirmPayment(selectedOrder)}>{paymentBusyOrderId===selectedOrder.id?"Salvando confirmação…":"Confirmar recebimento do pagamento"}</button></div>}<div className="mt-6 border-t border-[#e8ece4] pt-5"><h3 className="text-sm font-black">Histórico das etapas</h3>{historyLoading?<p className="mt-3 text-xs text-[#879187]">Carregando histórico…</p>:orderHistory.length?<div className="wm-history">{orderHistory.map(event=><div className="wm-history-item" key={event.id}><i/><div><b>{event.to_status in statusLabels?statusLabels[event.to_status]:event.to_status}</b><span>{new Date(event.changed_at).toLocaleString("pt-BR")}</span>{event.note&&<small className="mt-1 block">{event.note}</small>}</div></div>)}</div>:<p className="mt-3 text-xs text-[#879187]">Nenhuma mudança de etapa registrada além do estado atual.</p>}</div><p className="mt-4 text-[10px] leading-5 text-[#929c92]">Identificador interno: {selectedOrder.id}. O número visível reinicia por estabelecimento a cada dia; o histórico mantém o ID único.</p></section></div>}
  </div></AdminShell>;
}
