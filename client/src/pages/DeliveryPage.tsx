import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { getBusiness, publishBusiness } from "@/lib/data";
import type { Business, BusinessLink } from "@/lib/types";
import { buildDeliveryMessage, deliveryChecks, deliveryUrl } from "@/lib/delivery";

export default function DeliveryPage() {
  return <AdminShell adminOnly><DeliveryContent /></AdminShell>;
}

function DeliveryContent() {
  const [, params] = useRoute("/admin/delivery/:id");
  const [business, setBusiness] = useState<Business | null>(null);
  const [links, setLinks] = useState<BusinessLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setReviewed(false);
    if (!params?.id) { setError("Cliente não encontrado."); setLoading(false); return; }
    getBusiness(params.id).then(b => {
      if (!active) return;
      setBusiness(b); setLinks(b.business_links || []);
      setMessage(buildDeliveryMessage(b.name, deliveryUrl(b, window.location.origin)));
    }).catch(() => active && setError("Não foi possível carregar o BioSite. Confira sua conexão e permissões.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [params?.id]);

  const checks = useMemo(() => business ? deliveryChecks(business, links) : [], [business, links]);
  const url = business ? deliveryUrl(business, window.location.origin) : "";
  const requiredOk = checks.filter(c => c.required).every(c => c.ok);
  const published = business?.status === "published";
  const step = published ? 3 : reviewed && requiredOk ? 2 : 1;

  const copy = async (value: string) => {
    setError(""); setNotice("");
    try { await navigator.clipboard.writeText(value); setNotice("Copiado. Agora você pode enviar ao cliente."); }
    catch { setError("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente."); }
  };
  const publish = async () => {
    if (!business || busy || !requiredOk || !reviewed) return;
    if (!window.confirm(`Publicar o BioSite de ${business.name}? Qualquer pessoa com o link poderá abrir a página.`)) return;
    setBusy(true); setError(""); setNotice("");
    try { await publishBusiness(business.id); setBusiness({ ...business, status: "published" }); setNotice("BioSite publicado. Abra o link e faça o teste final."); }
    catch { setError("Não foi possível publicar. Confira sua conexão e tente novamente."); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="pk-state" role="status"><span className="loader-dot" />Preparando a entrega…</div>;
  if (!business) return <div className="pk-state"><p role="alert">{error}</p><Link href="/admin" className="action-button">Voltar ao painel</Link></div>;

  return <div className="pk-delivery">
    <header className="pk-hero">
      <div>
        <p className="pk-kicker">Entrega ao cliente</p>
        <h1>{business.name}</h1>
        <p>Revise, publique e envie um link pronto. O cliente não precisa entrar no seu painel.</p>
      </div>
      <span className={`pk-badge ${published ? "is-live" : ""}`}>{published ? "Publicado" : "Ainda não publicado"}</span>
    </header>

    <ol className="pk-steps" aria-label="Etapas da entrega">
      {["Revisar", "Publicar", "Enviar"].map((label, index) => <li key={label} className={step === index + 1 ? "is-current" : step > index + 1 ? "is-done" : ""}><span>{index + 1}</span>{label}</li>)}
    </ol>

    <nav className="pk-actions" aria-label="Ações do BioSite">
      <Link href={`/admin/client/${business.id}`} className="action-button">Editar BioSite</Link>
      <Link href={`/admin/preview/${business.slug}`} className="action-button">Ver prévia privada</Link>
      <Link href="/admin" className="action-button">Voltar aos clientes</Link>
    </nav>

    {error && <p role="alert" className="alert-error">{error}</p>}
    {notice && <p role="status" className="pk-notice">{notice}</p>}

    <section className="pk-card">
      <div className="pk-card-head"><span>1</span><div><h2>Revisão final</h2><p>A lista verifica formato e sinais de modelo. Ela não confirma que cada destino abre ou pertence ao cliente.</p></div></div>
      <ul className="pk-checks">{checks.map(check => <li key={check.label} className={check.ok ? "ok" : check.required ? "blocked" : "warn"}><b aria-hidden="true">{check.ok ? "✓" : check.required ? "!" : "–"}</b><div><strong>{check.label}{!check.required && " · recomendado"}</strong><small>{check.detail}</small></div></li>)}</ul>
      <label className="pk-confirm"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} />Conferi textos, imagens e botões em um celular e confirmo que os dados pertencem ao cliente.</label>
      {!requiredOk && <p className="pk-help">Corrija os itens marcados com ! no editor antes de publicar.</p>}
    </section>

    <section className="pk-card">
      <div className="pk-card-head"><span>2</span><div><h2>Publicação e link</h2><p>{published ? "A página está pública e pode ser aberta sem login." : "Antes da publicação, o link não funciona para visitantes."}</p></div></div>
      {!published && <button disabled={!requiredOk || !reviewed || busy} onClick={publish} className="pk-primary">{busy ? "Publicando…" : "Publicar BioSite"}</button>}
      <label htmlFor="delivery-url" className="pk-label">Link do cliente</label>
      <div className="pk-copy"><input id="delivery-url" readOnly value={url} onFocus={event => event.target.select()} /><button disabled={!published} onClick={() => copy(url)}>Copiar</button></div>
      {published && <a className="pk-link" href={url} target="_blank" rel="noopener noreferrer">Abrir página pública</a>}
      <p className="pk-help">Use o domínio de produção. Depois de divulgar ou imprimir QR Codes, não altere o nome curto: o endereço antigo deixará de funcionar.</p>
    </section>

    <section className="pk-card">
      <div className="pk-card-head"><span>3</span><div><h2>Mensagem de entrega</h2><p>Revise o texto. Nada é enviado automaticamente.</p></div></div>
      <label htmlFor="delivery-message" className="pk-label">Mensagem editável</label>
      <textarea id="delivery-message" rows={9} value={message} onChange={event => setMessage(event.target.value)} />
      <div className="pk-actions">
        <button className="pk-primary" disabled={!published || !reviewed} onClick={() => copy(message)}>Copiar mensagem</button>
        {published && reviewed && <a className="action-button" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Preparar no WhatsApp</a>}
      </div>
    </section>
  </div>;
}
