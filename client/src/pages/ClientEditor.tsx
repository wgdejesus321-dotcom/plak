import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Eye, ImagePlus, Layers3, Link2, Loader2, Monitor, Palette, Plus, Redo2, Save, Smartphone, Sparkles, Trash2, Type, Upload, Undo2, X, LayoutTemplate, PanelLeftClose, PanelRightClose, MousePointer2, Image as ImageIcon, WandSparkles } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import "./ClientEditor.css";
import { getBusiness, saveBusiness, uploadAsset } from "@/lib/data";
import { BlockLibrary } from "@/components/BlockLibrary";
import { LivePreview } from "@/components/LivePreview";
import type { BusinessForm, BusinessMedia, LinkKind } from "@/lib/types";
import { normalizeBusinessForm, normalizeInstagram, normalizeSlug, validateBusinessForm, validateFile } from "@/lib/validation";

const baseLayout = { section_order:["actions","campaign","catalog","testimonials","lead","gallery","address"], hidden_sections:[], cover_enabled:true, profile_position:"cover", profile_shape:"circle", text_align:"center", button_style:"soft", show_gallery:true, cover_treatment:"light", logo_size:"medium", logo_shape:"circle", logo_fit:"contain", cover_opacity:35, cover_position_x:50, cover_position_y:50, logo_offset_x:0, logo_offset_y:0, logo_scale:1, cover_scale:100, title_color:"#17231e", tagline_color:"#65736b", font_family:"Inter", title_font_size:30, tagline_font_size:14, section_spacing:"comfortable", page_style:"clean", background_effect:"solid", hero_layout:"classic", button_size:"medium", button_shadow:true, button_text_color:"#263b3a", custom_button_text_color:"#FFFFFF", card_style:"soft", gallery_layout:"floating", gallery_radius:22, gallery_gap:12, gallery_background:"transparent", section_title_color:"#253d3e", body_text_color:"#718078", accent_color:"#91a08f", background_overlay:35 } as const;
const empty: BusinessForm = { name:"", slug:"", logo_url:"", tagline:"Olá! Como podemos ajudar?", google_review_url:"", whatsapp_number:"", whatsapp_message:"", instagram_url:"", website_url:"", address:"", maps_url:"", primary_color:"#66754B", secondary_color:"#C6B887", background_color:"#F5F4EC", background_image_url:"", standard_button_color:"#FFFFFF", custom_button_color:"#66754B", seo_title:"", seo_description:"", seo_image_url:"", features:{ layout:{...baseLayout}, lead_enabled:false, lead_title:"Fale com a gente", lead_button:"Enviar mensagem", campaign_enabled:false, campaign_title:"", campaign_text:"", campaign_cta:"Saiba mais", campaign_url:"", catalog_text:"", catalog_title:"Produtos e serviços", catalog_subtitle:"Veja nossas principais opções", testimonials_text:"", testimonials_title:"O que nossos clientes dizem", qr_label:"PLAK", show_badge:true, catalog_items:[] }, links:[], media:[] };
type Panel = "design"|"identity"|"images"|"actions"|"elements"|"sections"|"blocks";
type CanvasObject = { id:string; type:"text"|"image"|"button"|"shape"; x:number; y:number; width:number; height:number; text?:string; url?:string; href?:string; color?:string; background?:string; fontSize?:number; radius?:number; file?:File; alt?:string; };
type Device = "desktop"|"mobile";
type SavedTemplate = { id:string; name:string; createdAt:string; primary_color:string; secondary_color:string; background_color:string; custom_button_color:string; layout:Record<string,any>; canvas_objects:CanvasObject[] };
const TEMPLATES_KEY = "plak-studio-saved-templates-v1";
const inputClass = "studio-input";

export default function ClientEditor() {
  const [, params] = useRoute("/admin/client/:id");
  const [, navigate] = useLocation();
  const [form,setForm] = useState<BusinessForm>(empty);
  const [id,setId] = useState<string|undefined>(params?.id);
  const [loading,setLoading] = useState(Boolean(params?.id));
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [panel,setPanel] = useState<Panel>("identity");
  const [device,setDevice] = useState<Device>("mobile");
  const [livePreview,setLivePreview] = useState(true);
  const [leftOpen,setLeftOpen] = useState(true);
  const [rightOpen,setRightOpen] = useState(true);
  const [history,setHistory] = useState<BusinessForm[]>([]);
  const [future,setFuture] = useState<BusinessForm[]>([]);
  const [logoFile,setLogoFile] = useState<File|null>(null);
  const [coverFile,setCoverFile] = useState<File|null>(null);
  const logoRef=useRef<HTMLInputElement>(null), coverRef=useRef<HTMLInputElement>(null), mediaRef=useRef<HTMLInputElement>(null);
  const layout = {...baseLayout,...(form.features.layout||{})};
  const catalog = form.features.catalog_items||[];
  const objects:CanvasObject[] = ((form.features as any).canvas_objects || []) as CanvasObject[];
  const [selectedObject,setSelectedObject] = useState<string>("");
  const [savedTemplates,setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateChoice,setTemplateChoice] = useState("");
  const [dragging,setDragging] = useState<{id:string;mode:"move"|"resize";startX:number;startY:number;originX:number;originY:number;originWidth:number;originHeight:number;previewX:number;previewY:number;previewWidth:number;previewHeight:number}|null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    try { const raw=localStorage.getItem(TEMPLATES_KEY); if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setSavedTemplates(parsed);} } catch { /* biblioteca local indisponível/corrompida */ }
  },[]);
  const persistTemplates=(next:SavedTemplate[])=>{setSavedTemplates(next);try{localStorage.setItem(TEMPLATES_KEY,JSON.stringify(next));}catch{setError("Não foi possível guardar os modelos neste navegador. Remova modelos antigos ou imagens muito grandes.");}};
  const saveTemplate=()=>{
    const name=window.prompt("Nome para este modelo:",form.name?`Modelo ${form.name}`:"Meu modelo");
    if(!name?.trim())return;
    const hasTemporaryImages=objects.some(o=>o.type==="image"&&(o.url||"").startsWith("blob:"));
    const template:SavedTemplate={id:`template-${Date.now()}`,name:name.trim(),createdAt:new Date().toISOString(),primary_color:form.primary_color,secondary_color:form.secondary_color,background_color:form.background_color,custom_button_color:form.custom_button_color,layout:JSON.parse(JSON.stringify(layout)),canvas_objects:JSON.parse(JSON.stringify(objects.filter(o=>!(o.url||"").startsWith("blob:")).map(({file,...o})=>o)))};
    persistTemplates([template,...savedTemplates]);
    setNotice(hasTemporaryImages?"Modelo guardado. Observação: imagens recém-enviadas precisam ser salvas na página primeiro para ficarem incluídas no modelo.":"Modelo guardado neste navegador e pronto para reutilizar.");
  };
  const applyTemplate=(templateId:string)=>{
    const template=savedTemplates.find(t=>t.id===templateId);if(!template)return;
    if(!window.confirm(`Aplicar o modelo “${template.name}”? Isso substituirá os elementos livres e as cores atuais, mas não altera nome, contatos ou dados do cliente.`))return;
    change(c=>({...c,primary_color:template.primary_color,secondary_color:template.secondary_color,background_color:template.background_color,custom_button_color:template.custom_button_color,features:{...c.features,layout:{...baseLayout,...template.layout},canvas_objects:template.canvas_objects.map(o=>({...o,id:`obj-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}))} as any}));
    setSelectedObject("");setNotice(`Modelo “${template.name}” aplicado. Salve a página para publicar as alterações.`);
  };
  const deleteTemplate=(templateId:string)=>{const item=savedTemplates.find(t=>t.id===templateId);if(!item||!window.confirm(`Excluir o modelo “${item.name}” da biblioteca?`))return;persistTemplates(savedTemplates.filter(t=>t.id!==templateId));if(templateChoice===templateId)setTemplateChoice("");};
  const visibleLinks = useMemo(() => {
    const auto = [
      form.whatsapp_number ? {label:"Falar no WhatsApp",url:`https://wa.me/${form.whatsapp_number.replace(/\D/g,"")}${form.whatsapp_message?`?text=${encodeURIComponent(form.whatsapp_message)}`:""}`,kind:"whatsapp" as LinkKind,color:form.custom_button_color,position:0}:null,
      form.instagram_url ? {label:"Instagram",url:form.instagram_url,kind:"other" as LinkKind,color:form.custom_button_color,position:1}:null,
      form.google_review_url ? {label:"Avaliar no Google",url:form.google_review_url,kind:"other" as LinkKind,color:form.custom_button_color,position:2}:null,
      form.website_url ? {label:"Visitar site",url:form.website_url,kind:"site" as LinkKind,color:form.custom_button_color,position:3}:null,
    ].filter(Boolean) as {label:string;url:string;kind:LinkKind;color:string;position:number}[];
    return [...auto,...form.links].filter(x=>x.label.trim());
  },[form]);
  useEffect(()=>{
    if(!params?.id){
      try {
        const rawTemplate = localStorage.getItem("plak-template-draft");
        if (rawTemplate) {
          const draft = JSON.parse(rawTemplate) as Partial<BusinessForm>;
          setForm({ ...empty, ...draft, features: { ...empty.features, ...(draft.features || {}), layout: { ...baseLayout, ...((draft.features as any)?.layout || {}) }, catalog_items: (draft.features as any)?.catalog_items || [] }, links: draft.links || [], media: draft.media || [] });
          localStorage.removeItem("plak-template-draft");
          setNotice("Modelo carregado. Personalize os dados do cliente e salve para continuar.");
        }
      } catch { localStorage.removeItem("plak-template-draft"); }
      setLoading(false);return;
    }
    getBusiness(params.id).then(b=>{
      const loaded:BusinessForm={...empty,...b,google_review_url:b.google_review_url||"",whatsapp_number:b.whatsapp_number||"",whatsapp_message:b.whatsapp_message||"",instagram_url:b.instagram_url||"",website_url:b.website_url||"",address:b.address||"",maps_url:b.maps_url||"",seo_title:b.seo_title||"",seo_description:b.seo_description||"",seo_image_url:b.seo_image_url||"",logo_url:b.logo_url||"",background_image_url:b.background_image_url||"",features:{...empty.features,...(b.features||{}),layout:{...baseLayout,...(b.features?.layout||{})},catalog_items:b.features?.catalog_items||[]},links:b.business_links||[],media:b.business_media||[]};
      if(!((loaded.features as any).canvas_objects||[]).length){
        const migrated:CanvasObject[]=[];let y=5;
        if(loaded.logo_url)migrated.push({id:"migrated-logo",type:"image",x:7,y:4,width:20,height:18,url:loaded.logo_url,alt:"Logo da marca",color:loaded.primary_color});
        migrated.push({id:"migrated-title",type:"text",x:7,y:7,width:86,height:9,text:loaded.name||"Nome da marca",fontSize:34,color:loaded.primary_color});
        migrated.push({id:"migrated-tagline",type:"text",x:7,y:14,width:86,height:8,text:loaded.tagline||"Apresente sua marca",fontSize:16,color:"#68756e"});
        y=25;
        const migratedLinks=[...(loaded.whatsapp_number?[{label:"Falar no WhatsApp",href:`https://wa.me/${loaded.whatsapp_number.replace(/\D/g,"")}${loaded.whatsapp_message?`?text=${encodeURIComponent(loaded.whatsapp_message)}`:""}`}]:[]),...(loaded.instagram_url?[{label:"Instagram",href:loaded.instagram_url}]:[]),...(loaded.google_review_url?[{label:"Avaliar no Google",href:loaded.google_review_url}]:[]),...(loaded.website_url?[{label:"Visitar site",href:loaded.website_url}]:[]),...loaded.links.map(link=>({label:link.label,href:link.url}))];
        migratedLinks.forEach((link,i)=>migrated.push({id:`migrated-button-${i}`,type:"button",x:7,y:y+i*7,width:86,height:5,text:link.label,href:link.href,color:"#FFFFFF",background:loaded.custom_button_color||loaded.primary_color,fontSize:14}));
        y+=migratedLinks.length*7+4;
        if(loaded.features.campaign_enabled&&loaded.features.campaign_title)migrated.push({id:"migrated-campaign-title",type:"text",x:7,y,width:86,height:7,text:loaded.features.campaign_title,fontSize:25,color:loaded.primary_color});
        if(loaded.features.campaign_enabled&&loaded.features.campaign_text)migrated.push({id:"migrated-campaign-text",type:"text",x:7,y:y+5,width:86,height:10,text:loaded.features.campaign_text,fontSize:16,color:"#39443f"});
        if(loaded.features.campaign_enabled)y+=17;
        (loaded.features.catalog_items||[]).forEach((item,i)=>{if(item.image_url)migrated.push({id:`migrated-product-image-${i}`,type:"image",x:7,y:y+i*13,width:36,height:11,url:item.image_url,alt:item.title,color:loaded.primary_color});migrated.push({id:`migrated-product-title-${i}`,type:"text",x:47,y:y+i*13,width:46,height:5,text:item.title,fontSize:17,color:loaded.primary_color});if(item.price)migrated.push({id:`migrated-product-price-${i}`,type:"text",x:47,y:y+i*13+4,width:46,height:4,text:item.price,fontSize:14,color:loaded.primary_color});});
        y+=(loaded.features.catalog_items||[]).length*13+4;
        loaded.media.forEach((item,i)=>migrated.push({id:`migrated-media-${i}`,type:"image",x:7+(i%2)*46,y:y+Math.floor(i/2)*19,width:42,height:17,url:item.url,alt:item.alt||`Imagem ${i+1}`,color:loaded.primary_color}));
        if(loaded.address)migrated.push({id:"migrated-address",type:"text",x:7,y:y+Math.ceil(loaded.media.length/2)*19,width:86,height:8,text:loaded.address,fontSize:14,color:"#68756e"});
        loaded.features={...loaded.features,canvas_objects:migrated} as any;
      }
      setForm(loaded);
    }).then(()=>setId(params.id)).catch(e=>setError(e.message||"Não foi possível abrir o cliente.")).finally(()=>setLoading(false));
  },[params?.id]);
  useEffect(()=>{
    const onKeyDown=(e:KeyboardEvent)=>{
      const target=e.target as HTMLElement|null;
      if(target?.closest("input,textarea,select,[contenteditable=true]"))return;
      if((e.key==="Delete"||e.key==="Backspace")&&selectedObject){e.preventDefault();updateFeatures({canvas_objects:objects.filter(o=>o.id!==selectedObject)});setSelectedObject("");return;}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="d"&&selectedObject){e.preventDefault();const original=objects.find(o=>o.id===selectedObject);if(original){const copy={...original,id:`obj-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,x:Math.min(100-original.width,original.x+3),y:original.y+3};updateFeatures({canvas_objects:[...objects,copy]});setSelectedObject(copy.id);}return;}
      if(selectedObject&&["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)){e.preventDefault();const o=objects.find(item=>item.id===selectedObject);if(!o)return;const step=e.shiftKey?2:0.5;updateObject(selectedObject,{x:Math.max(0,Math.min(100-o.width,o.x+(e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0))),y:Math.max(0,o.y+(e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0))});}
    };
    window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown);
  },[selectedObject,form,history,future]);

  const change=(fn:(v:BusinessForm)=>BusinessForm)=>setForm(current=>{const next=fn(current);setHistory(h=>[...h.slice(-49),JSON.parse(JSON.stringify(current))]);setFuture([]);setNotice("");return next;});
  const update=(key:keyof BusinessForm,value:any)=>change(c=>({...c,[key]:value}));
  const updateName=(value:string)=>change(c=>({...c,name:value,slug:!c.slug||c.slug===normalizeSlug(c.name)?normalizeSlug(value):c.slug}));
  const updateLayout=(patch:Record<string,any>)=>change(c=>({...c,features:{...c.features,layout:{...baseLayout,...(c.features.layout||{}),...patch}}}));
  const updateFeatures=(patch:Record<string,any>)=>change(c=>({...c,features:{...c.features,...patch}}));
  const updateObject=(objectId:string,patch:Partial<CanvasObject>)=>updateFeatures({canvas_objects:objects.map(o=>o.id===objectId?{...o,...patch}:o)});
  const addObject=(type:CanvasObject["type"], file?:File)=>{
    const next:CanvasObject={id:`obj-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,x:12+(objects.length%4)*5,y:10+(objects.length%6)*8,width:type==="image"?34:type==="button"?35: type==="shape"?22:42,height:type==="image"?25:type==="button"?9:type==="shape"?18:12,text:type==="text"?"Clique para editar este texto":type==="button"?"Meu botão":"",url:file?URL.createObjectURL(file):"",href:"",color:form.primary_color,background:type==="shape"?form.secondary_color:"transparent",fontSize: type==="text"?24:14,radius:14,file,alt:"Imagem da página"};
    updateFeatures({canvas_objects:[...objects,next]});setSelectedObject(next.id);setPanel("elements");setRightOpen(true);
  };
  const startDrag=(e:React.PointerEvent,object:CanvasObject,mode:"move"|"resize"="move")=>{if((e.target as HTMLElement).closest("input,textarea,a,[contenteditable=true]"))return;e.preventDefault();e.stopPropagation();setSelectedObject(object.id);setPanel("elements");const w=object.width||30,h=object.height||12;setDragging({id:object.id,mode,startX:e.clientX,startY:e.clientY,originX:object.x,originY:object.y,originWidth:w,originHeight:h,previewX:object.x,previewY:object.y,previewWidth:w,previewHeight:h});(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);};
  const moveDrag=(e:React.PointerEvent)=>{if(!dragging||!canvasRef.current)return;const r=canvasRef.current.getBoundingClientRect();const dx=(e.clientX-dragging.startX)/r.width*100;const dy=(e.clientY-dragging.startY)/r.height*100;setDragging(d=>d?({...d,previewX:d.mode==="move"?Math.max(0,Math.min(100-d.previewWidth,d.originX+dx)):d.originX,previewY:d.mode==="move"?Math.max(0,d.originY+dy):d.originY,previewWidth:d.mode==="resize"?Math.max(8,Math.min(100-d.originX,d.originWidth+dx)):d.originWidth,previewHeight:d.mode==="resize"?Math.max(4,d.originHeight+dy):d.originHeight}):null);};
  const finishDrag=()=>{if(!dragging)return;const d=dragging;setDragging(null);if(d.previewX!==d.originX||d.previewY!==d.originY||d.previewWidth!==d.originWidth||d.previewHeight!==d.originHeight)updateFeatures({canvas_objects:objects.map(o=>o.id===d.id?{...o,x:d.previewX,y:d.previewY,width:d.previewWidth,height:d.previewHeight}:o)});};
  const undo=()=>{if(!history.length)return;setFuture(f=>[JSON.parse(JSON.stringify(form)),...f]);setForm(history[history.length-1]);setHistory(h=>h.slice(0,-1));};
  const redo=()=>{if(!future.length)return;setHistory(h=>[...h,JSON.parse(JSON.stringify(form))]);setForm(future[0]);setFuture(f=>f.slice(1));};
  const addButton=()=>change(c=>({...c,links:[...c.links,{label:"Novo botão",url:"https://",kind:"site" as LinkKind,color:c.custom_button_color||c.primary_color,position:c.links.length}]}));
  const addMedia=(file:File)=>{const issue=validateFile(file,file.type.startsWith("video/")?"video":"media");if(issue){setError(issue);return;}change(c=>({...c,media:[...c.media,{type:file.type.startsWith("video/")?"video":"image",url:URL.createObjectURL(file),alt:"Imagem da página",position:c.media.length,file,object_position_x:50,object_position_y:50,object_scale:1}]}));};
  const save=async(preview=false)=>{
    setError(""); setNotice(""); setSaving(true);
    try {
      const normalized=normalizeBusinessForm({...form,slug:form.slug||form.name});
      const errors=validateBusinessForm(normalized);
      if(Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      const assetId=id || crypto.randomUUID();
      const logoUrl=logoFile?(await uploadAsset(logoFile,assetId,"logo")).url:normalized.logo_url;
      const backgroundUrl=coverFile?(await uploadAsset(coverFile,assetId,"background")).url:normalized.background_image_url;
      const media:BusinessMedia[]=[];
      for(const item of normalized.media){
        const {file,...rest}=item;
        if(file){ const asset=await uploadAsset(file,assetId,"media"); media.push({...rest,url:asset.url,storage_path:asset.path}); }
        else { if(rest.url.startsWith("blob:")) throw new Error("Reenvie a imagem da galeria antes de salvar."); media.push(rest); }
      }
      const catalog_items=[];
      for(const item of normalized.features.catalog_items||[]){
        const {file,...rest}=item;
        const image_url=file?(await uploadAsset(file,assetId,"catalog")).url:rest.image_url;
        if(image_url?.startsWith("blob:")) throw new Error("Reenvie a imagem do catálogo.");
        catalog_items.push({...rest,image_url});
      }
      const blocks=[];
      for(const item of normalized.features.blocks||[]){
        const {file,...rest}=item;
        const image_url=file?(await uploadAsset(file,assetId,"media")).url:rest.image_url;
        if(image_url?.startsWith("blob:")) throw new Error("Reenvie a imagem da seção.");
        blocks.push({...rest,image_url});
      }
      const savedForm:BusinessForm={...normalized,logo_url:logoUrl,background_image_url:backgroundUrl,media,features:{...normalized.features,catalog_items,blocks,canvas_objects:[]}};
      const final=await saveBusiness(savedForm,id);
      setId(final.id); setForm(savedForm); setLogoFile(null); setCoverFile(null); setHistory([]); setFuture([]);
      setNotice("BioSite salvo. Use Publicar e entregar para enviar ao cliente.");
      if(preview) window.location.assign(`/admin/preview/${final.slug}`);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Não foi possível salvar o BioSite. Confira os dados e tente novamente.");}
    finally{setSaving(false);}
  };
  const choose=(next:Panel)=>{setPanel(next);setRightOpen(true);};
  const editText=(value:string,onChange:(v:string)=>void,cls="")=><span contentEditable suppressContentEditableWarning spellCheck={false} role="textbox" aria-label="Editar texto na página" onClick={e=>e.stopPropagation()} onInput={e=>onChange(e.currentTarget.textContent||"")} className={`studio-inline-edit ${cls}`}>{value}</span>;
  const buttonStyle:React.CSSProperties={background:form.custom_button_color||form.primary_color,color:layout.custom_button_text_color||"#fff",borderRadius:layout.button_style==="pill"?999:layout.button_style==="square"?8:16};
  if(loading)return <AdminShell><div className="bio-loading"><Loader2 className="animate-spin"/> Preparando seu espaço de criação…</div></AdminShell>;
  const navItems:[Panel,any,string,string][]=[
    ["identity",MousePointer2,"Conteúdo","Nome e apresentação"],
    ["actions",Link2,"Botões e links","Para onde seu público vai"],
    ["images",ImageIcon,"Imagens","Fotos e identidade"],
    ["sections",Layers3,"Seções","O que aparece na página"],
    ["blocks",LayoutTemplate,"Blocos","Biblioteca, produtos e cardápio"],
    ["design",Palette,"Visual","Cores e estilo"]
  ];
  const addLink=()=>addButton();
  return <AdminShell><div className="bio-builder">
    <header className="bio-header">
      <Link href="/admin" className="bio-back" aria-label="Voltar ao painel"><ArrowLeft size={18}/></Link>
      <div className="bio-brand"><div className="bio-brand-icon">P</div><div><strong>PLAK <span>CRIADOR</span></strong><small>{form.name||"Novo bio site"}</small></div></div>
      <div className="bio-header-actions">{id && <Link href={`/admin/delivery/${id}`} className="bio-preview-button">Publicar e entregar</Link>}<button className="bio-undo" onClick={undo} disabled={!history.length} title="Desfazer"><Undo2 size={17}/></button><button className="bio-undo" onClick={redo} disabled={!future.length} title="Refazer"><Redo2 size={17}/></button><button className="bio-preview-button" onClick={()=>save(true)} disabled={saving}><Eye size={16}/> Salvar e visualizar</button><button className="bio-save-button" onClick={()=>save(false)} disabled={saving}>{saving?<Loader2 size={16} className="animate-spin"/>:<Check size={16}/>} {saving?"Salvando…":"Salvar bio site"}</button></div>
    </header>
    {(error||notice)&&<div className={`bio-alert ${error?"error":"success"}`}>{error||notice}<button onClick={()=>{setError("");setNotice("")}}><X size={15}/></button></div>}
    <div className="bio-layout">
      <aside className="bio-sidebar"><div className="bio-side-title">CONSTRUA SUA PÁGINA</div>{navItems.map(([key,Icon,label,desc])=><button key={key} className={`bio-nav ${panel===key?"active":""}`} onClick={()=>choose(key)}><span className="bio-nav-icon"><Icon size={18}/></span><span><b>{label}</b><small>{desc}</small></span><ChevronDown size={14}/></button>)}<div className="bio-sidebar-tip"><Sparkles size={17}/><div><b>Simples e direto</b><p>Preencha o conteúdo e acompanhe o resultado na prévia ao lado.</p></div></div></aside>
      <main className="bio-editor-panel">
        <div className="bio-panel-heading"><div><span className="bio-kicker">EDITAR BIO SITE</span><h1>{panel==="identity"?"Apresentação":panel==="actions"?"Botões e destinos":panel==="images"?"Imagens da página":panel==="sections"?"Conteúdo adicional":panel==="blocks"?"Biblioteca de blocos":"Aparência"}</h1><p>{panel==="identity"?"Apresente o negócio com clareza.":panel==="actions"?"Adicione os caminhos que seus visitantes podem seguir.":panel==="images"?"Use fotos para dar personalidade à página.":panel==="sections"?"Escolha quais informações fazem parte do bio site.":panel==="blocks"?"Adicione, ordene e edite blocos, produtos e cardápio.":"Defina uma combinação visual para a sua marca."}</p></div><span className="bio-step">{navItems.findIndex(x=>x[0]===panel)+1} / {navItems.length}</span></div>
        <div className="bio-fields">
          {panel==="identity"&&<>
            <div className="bio-field"><label>Logo ou foto de perfil</label><div className="bio-logo-upload">{form.logo_url?<img src={form.logo_url} alt="Logo atual"/>:<span><ImageIcon size={20}/></span>}<div><b>{form.logo_url?"Imagem selecionada":"Adicione a marca do negócio"}</b><small>PNG ou JPG · imagem quadrada funciona melhor</small></div><button onClick={()=>logoRef.current?.click()}><Upload size={15}/> Escolher</button></div></div>
            <div className="bio-field"><label>Nome do negócio</label><input className="bio-input" value={form.name} onChange={e=>updateName(e.target.value)} placeholder="Ex.: Café da Praça"/><small>Esse é o nome principal que aparece na página.</small></div>
            <div className="bio-field"><label>Nome curto do endereço</label><div className="bio-slug"><span>{window.location.host}/</span><input className="bio-input" value={form.slug} onChange={e=>update("slug",normalizeSlug(e.target.value))} placeholder="seu-negocio"/></div></div>
            <div className="bio-field"><label>Descrição curta</label><textarea className="bio-input" rows={3} value={form.tagline} onChange={e=>update("tagline",e.target.value)} placeholder="Conte em uma frase o que você oferece."/><small>Uma frase clara ajuda as pessoas a entenderem seu negócio.</small></div>
            <div className="bio-field"><label>WhatsApp</label><input className="bio-input" value={form.whatsapp_number} onChange={e=>update("whatsapp_number",e.target.value)} placeholder="55 + DDD + número"/><small>Inclua o código do país: Brasil 55. Ex.: 5511999999999.</small></div>
            <div className="bio-field"><label>Mensagem inicial do WhatsApp</label><input className="bio-input" value={form.whatsapp_message} onChange={e=>update("whatsapp_message",e.target.value)} placeholder="Olá! Vim pelo seu bio site."/></div>
          </>}
          {panel==="actions"&&<>
            <div className="bio-field"><label>Instagram</label><input className="bio-input" value={form.instagram_url} onChange={e=>update("instagram_url",e.target.value)} placeholder="https://instagram.com/seunegocio"/></div>
            <div className="bio-field"><label>Site oficial</label><input className="bio-input" value={form.website_url} onChange={e=>update("website_url",e.target.value)} placeholder="https://seusite.com.br"/></div>
            <div className="bio-field"><label>Avaliações no Google</label><input className="bio-input" value={form.google_review_url} onChange={e=>update("google_review_url",e.target.value)} placeholder="Cole o link para avaliar"/></div>
            <div className="bio-section-head"><div><b>Botões personalizados</b><small>Crie links para cardápio, reservas, catálogo ou promoções.</small></div><button className="bio-add-button" onClick={addLink}><Plus size={15}/> Adicionar botão</button></div>
            {form.links.length===0&&<div className="bio-empty-note">Nenhum botão personalizado ainda. Adicione um para criar um novo destino.</div>}
            {form.links.map((link,i)=><div className="bio-link-editor" key={`${i}-${link.label}`}><div className="bio-link-index">{i+1}</div><div className="bio-link-fields"><input className="bio-input" aria-label="Texto do botão" value={link.label} onChange={e=>change(c=>({...c,links:c.links.map((x,j)=>j===i?{...x,label:e.target.value}:x)}))} placeholder="Texto do botão"/><input className="bio-input" aria-label="Destino do botão" value={link.url} onChange={e=>change(c=>({...c,links:c.links.map((x,j)=>j===i?{...x,url:e.target.value}:x)}))} placeholder="https:// ou https://wa.me/..."/></div><button className="bio-remove" onClick={()=>change(c=>({...c,links:c.links.filter((_,j)=>j!==i)}))} aria-label="Excluir botão"><Trash2 size={16}/></button></div>)}
          </>}
          {panel==="images"&&<>
            <div className="bio-upload-feature"><div className="bio-upload-symbol"><ImagePlus size={22}/></div><div><b>Fotos e imagens</b><p>Adicione imagens que ajudem a apresentar seus produtos, espaço ou serviços.</p></div><button onClick={()=>mediaRef.current?.click()}><Plus size={15}/> Adicionar</button></div>
            {form.media.length===0?<div className="bio-empty-note">Sua página ainda não tem imagens. Você pode adicionar fotos do ambiente, produtos ou equipe.</div>:<div className="bio-media-list">{form.media.map((m,i)=><div className="bio-media-row" key={`${m.url}-${i}`}><img src={m.url} alt={m.alt||"Imagem"}/><div><b>{m.alt||`Imagem ${i+1}`}</b><small>{m.type==="video"?"Vídeo":"Imagem"}</small><input className="bio-input" value={m.alt||""} onChange={e=>change(c=>({...c,media:c.media.map((x,j)=>j===i?{...x,alt:e.target.value}:x)}))} placeholder="Descrição da imagem"/></div><button className="bio-remove" onClick={()=>change(c=>({...c,media:c.media.filter((_,j)=>j!==i)}))} aria-label="Remover imagem"><Trash2 size={16}/></button></div>)}</div>}
            <div className="bio-field"><label>Imagem de fundo opcional</label><div className="bio-upload-inline"><span>{form.background_image_url?"Imagem de fundo selecionada":"Nenhuma imagem de fundo"}</span><button onClick={()=>coverRef.current?.click()}><Upload size={15}/> Escolher</button></div>{form.background_image_url&&<button className="bio-text-remove" onClick={()=>{update("background_image_url","");setCoverFile(null)}}>Remover imagem de fundo</button>}</div>
          </>}
          {panel==="sections"&&<>
            <label className="bio-toggle"><span><b>Mostrar destaque ou promoção</b><small>Divulgue uma oferta, novidade ou aviso.</small></span><input type="checkbox" checked={form.features.campaign_enabled} onChange={e=>updateFeatures({campaign_enabled:e.target.checked})}/></label>
            {form.features.campaign_enabled&&<><div className="bio-field"><label>Título do destaque</label><input className="bio-input" value={form.features.campaign_title||""} onChange={e=>updateFeatures({campaign_title:e.target.value})} placeholder="Ex.: Promoção da semana"/></div><div className="bio-field"><label>Descrição</label><textarea className="bio-input" rows={3} value={form.features.campaign_text||""} onChange={e=>updateFeatures({campaign_text:e.target.value})} placeholder="Explique a oferta."/></div><div className="bio-field"><label>Texto do botão</label><input className="bio-input" value={form.features.campaign_cta||"Saiba mais"} onChange={e=>updateFeatures({campaign_cta:e.target.value})}/></div><div className="bio-field"><label>Link do destaque</label><input className="bio-input" value={form.features.campaign_url||""} onChange={e=>updateFeatures({campaign_url:e.target.value})} placeholder="https://"/></div></>}
            <div className="bio-field"><label>Título da área de produtos ou serviços</label><input className="bio-input" value={form.features.catalog_title||"Produtos e serviços"} onChange={e=>updateFeatures({catalog_title:e.target.value})}/></div><div className="bio-field"><label>Subtítulo</label><input className="bio-input" value={form.features.catalog_subtitle||"Veja nossas principais opções"} onChange={e=>updateFeatures({catalog_subtitle:e.target.value})}/></div>
            <div className="bio-field"><label>Título dos depoimentos</label><input className="bio-input" value={form.features.testimonials_title||"O que nossos clientes dizem"} onChange={e=>updateFeatures({testimonials_title:e.target.value})}/></div><div className="bio-field"><label>Depoimentos (um por linha)</label><textarea className="bio-input" rows={4} value={form.features.testimonials_text||""} onChange={e=>updateFeatures({testimonials_text:e.target.value})} placeholder="Atendimento excelente!\nProdutos de qualidade."/></div>
            <div className="bio-field"><label>Endereço</label><input className="bio-input" value={form.address} onChange={e=>update("address",e.target.value)} placeholder="Rua, número, bairro e cidade"/></div><div className="bio-field"><label>Link do mapa</label><input className="bio-input" value={form.maps_url} onChange={e=>update("maps_url",e.target.value)} placeholder="https://maps.google.com/..."/></div>
          </>}
          {panel==="blocks"&&<BlockLibrary blocks={form.features.blocks||[]} catalog={form.features.catalog_items||[]} whatsapp={form.whatsapp_number} whatsappMessage={form.whatsapp_message} instagram={form.instagram_url} address={form.address} leadEnabled={Boolean(form.features.lead_enabled)} onBlocks={next=>updateFeatures({blocks:next})} onCatalog={next=>updateFeatures({catalog_items:next})} onLead={enabled=>updateFeatures({lead_enabled:enabled})} onGo={choose} onNotice={setNotice}/>}
          {panel==="design"&&<>
            <div className="bio-color-setting"><div><b>Cor principal</b><small>Botões e destaques</small></div><input type="color" value={form.primary_color} onChange={e=>update("primary_color",e.target.value)}/></div><div className="bio-color-setting"><div><b>Cor secundária</b><small>Detalhes e elementos de apoio</small></div><input type="color" value={form.secondary_color} onChange={e=>update("secondary_color",e.target.value)}/></div><div className="bio-color-setting"><div><b>Fundo da página</b><small>Cor de base do bio site</small></div><input type="color" value={form.background_color} onChange={e=>update("background_color",e.target.value)}/></div>
            <div className="bio-field"><label>Animações da página</label><select className="bio-input" value={layout.entrance||"soft"} onChange={e=>updateLayout({entrance:e.target.value})}><option value="soft">Entrada suave</option><option value="none">Sem animação</option></select></div>
            <div className="bio-field"><label>Estilo dos botões</label><select className="bio-input" value={layout.button_style} onChange={e=>updateLayout({button_style:e.target.value})}><option value="soft">Arredondado</option><option value="pill">Pílula</option><option value="square">Quadrado</option><option value="outline">Contorno</option></select></div><div className="bio-field"><label>Fonte dos títulos</label><select className="bio-input" value={layout.font_family} onChange={e=>updateLayout({font_family:e.target.value})}>{["Inter","Poppins","Montserrat","Playfair Display","Lora","Roboto","Open Sans","Nunito","Arial","Georgia"].map(f=><option key={f}>{f}</option>)}</select></div>
            <div className="bio-palette-title">PALETAS PRONTAS</div><div className="bio-palettes">{[["#173F35","#D6B878","#F7F5EF"],["#243B64","#E8B4A2","#F6F4F0"],["#3D2926","#D5A15E","#FBF4E9"],["#442C54","#C5A6D8","#F7F1FA"],["#245D75","#B9D9D0","#F4F8F7"],["#6B342D","#E4B7A0","#FFF8F1"]].map((p,i)=><button key={i} onClick={()=>change(c=>({...c,primary_color:p[0],secondary_color:p[1],background_color:p[2]}))} aria-label={`Aplicar paleta ${i+1}`}><i style={{background:p[0]}}/><i style={{background:p[1]}}/><i style={{background:p[2]}}/></button>)}</div>
          </>}
        </div>
        <div className="bio-panel-footer"><span><Check size={14}/> A prévia acompanha suas alterações</span><button onClick={()=>save(false)} disabled={saving}>{saving?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>} Salvar</button></div>
      </main>
      <section className="bio-preview-area"><div className="bio-preview-head"><div><span className="bio-kicker">PRÉVIA AO VIVO</span><h2>Assim sua página aparece</h2></div><div className="bio-device sx-device-switch" role="group" aria-label="Modo de visualização"><button type="button" className={device==="mobile"?"is-active":""} aria-pressed={device==="mobile"} onClick={()=>setDevice("mobile")}><Smartphone size={15}/><span>Celular</span></button><button type="button" className={device==="desktop"?"is-active":""} aria-pressed={device==="desktop"} onClick={()=>setDevice("desktop")}><Monitor size={15}/><span>Desktop</span></button><button type="button" className={livePreview?"is-active":""} aria-pressed={livePreview} onClick={()=>setLivePreview(!livePreview)}><span>{livePreview?"Página real":"Prévia rápida"}</span></button></div></div>{livePreview?<div className="bio-preview-scroll"><div className={`bio-phone sx-live ${device==="desktop"?"is-desktop":""}`}><LivePreview form={form} id={id||undefined}/></div></div>:<div className="bio-preview-scroll"><div className={`bio-phone ${device==="desktop"?"is-desktop":""}`}><div className="bio-phone-speaker"/><div className="bio-page" style={{background:form.background_color,color:form.primary_color,backgroundImage:form.background_image_url?`linear-gradient(#ffffff22,#ffffff22),url(${form.background_image_url})`:undefined,backgroundSize:"cover",backgroundPosition:"center"}}>
        <div className="bio-page-content"><div className="bio-avatar" style={{borderColor:form.secondary_color,background:form.background_color}}>{form.logo_url?<img src={form.logo_url} alt="Logo"/>:<span>{(form.name||"P").slice(0,1).toUpperCase()}</span>}</div><h2 style={{fontFamily:layout.font_family,color:form.primary_color}}>{form.name||"Nome do seu negócio"}</h2><p className="bio-tagline" style={{color:form.primary_color}}>{form.tagline||"Uma apresentação curta do seu negócio."}</p>
          {visibleLinks.length>0&&<div className="bio-preview-links">{visibleLinks.map((link,i)=><div key={`${link.label}-${i}`} className="bio-preview-link" style={{background:form.custom_button_color||form.primary_color,color:layout.custom_button_text_color||"#fff",borderRadius:layout.button_style==="pill"?999:layout.button_style==="square"?7:13}}>{link.label||"Novo botão"}<span>↗</span></div>)}</div>}
          {form.features.campaign_enabled&&form.features.campaign_title&&<div className="bio-preview-card"><small>DESTAQUE</small><b>{form.features.campaign_title}</b><p>{form.features.campaign_text||"Descrição da sua oferta."}</p></div>}
          {form.media.length>0&&<div className="bio-preview-gallery">{form.media.slice(0,4).map((m,i)=><img key={`${m.url}-${i}`} src={m.url} alt={m.alt||"Foto"}/>)}</div>}
          {form.features.catalog_title&&<div className="bio-preview-info"><b>{form.features.catalog_title}</b><p>{form.features.catalog_subtitle||"Veja nossas principais opções"}</p>{catalog.length>0&&<small>{catalog.length} itens cadastrados</small>}</div>}
          {form.features.testimonials_text&&<div className="bio-preview-info"><b>{form.features.testimonials_title||"O que nossos clientes dizem"}</b><p>“{form.features.testimonials_text.split("\n")[0]}”</p></div>}
          {form.address&&<div className="bio-preview-info"><b>Onde estamos</b><p>{form.address}</p></div>}<div className="bio-preview-footer">Feito com <b>PLAK</b></div></div></div><div className="bio-phone-bottom"/></div></div>}<div className="bio-preview-note"><span className="bio-status-dot"/> Prévia de edição <span>·</span> Salve para aplicar na página</div></section>
    </div>
    <input ref={logoRef} type="file" accept="image/*" hidden onChange={e=>{const file=e.target.files?.[0];if(file){setLogoFile(file);update("logo_url",URL.createObjectURL(file));}e.currentTarget.value="";}}/><input ref={mediaRef} type="file" accept="image/*" hidden onChange={e=>{const file=e.target.files?.[0];if(file)addMedia(file);e.currentTarget.value="";}}/><input ref={coverRef} type="file" accept="image/*" hidden onChange={e=>{const file=e.target.files?.[0];if(file){setCoverFile(file);update("background_image_url",URL.createObjectURL(file));}e.currentTarget.value="";}}/>
  </div></AdminShell>;
}
