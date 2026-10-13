import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Copy, Eye, Pencil, Plus, Search, Send, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { deleteBusiness, duplicateBusiness, getPortfolioStats, listBusinesses, setBusinessStatus, setBusinessWorkflow, type PortfolioStats } from "@/lib/data";
import { ACTIVE_PLAN, PLANS } from "@/lib/plans";
import { SEGMENTS } from "@/lib/segments";
import type { Business, SegmentId } from "@/lib/types";
import { categoryOf, STAGE_LABEL, stageOf, type DisplayStage } from "@/lib/workflow";

const stages: DisplayStage[] = ["editing", "review", "published", "inactive"];
const number = new Intl.NumberFormat("pt-BR");

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<"all" | DisplayStage>("all");
  const [segment, setSegment] = useState<"all" | SegmentId | "none">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setError(""); setLoading(true);
    listBusinesses().then(setBusinesses).catch(e => setError(e instanceof Error ? e.message : "Não foi possível carregar os clientes.")).finally(() => setLoading(false));
    setStatsError("");
    getPortfolioStats(30).then(setStats).catch(() => { setStats(null); setStatsError("Visualizações e conversões indisponíveis agora."); });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const counts = useMemo(() => {
    const result: Record<DisplayStage, number> = { editing: 0, review: 0, published: 0, inactive: 0 };
    businesses.forEach(item => { result[stageOf(item)] += 1; });
    return result;
  }, [businesses]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return businesses.filter(item => {
      const itemSegment = item.features?.meta?.segment;
      return (stage === "all" || stageOf(item) === stage)
        && (segment === "all" || (segment === "none" ? !itemSegment : itemSegment === segment))
        && (!term || `${item.name} ${item.slug}`.toLowerCase().includes(term));
    });
  }, [businesses, search, stage, segment]);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusy(id); setError("");
    try { await action(); refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a ação."); }
    finally { setBusy(null); }
  };

  const plan = PLANS[ACTIVE_PLAN];
  const limit = plan.maxBioSites === null ? "ilimitados" : `${businesses.length}/${plan.maxBioSites}`;

  return <AdminShell><div className="sx-page">
    <header className="sx-header">
      <div>
        <p className="sx-eyebrow">PLAK Studio · {plan.label}</p>
        <h1>Central de BioSites</h1>
        <p>Crie, revise e entregue páginas profissionais para seus clientes. A estrutura de planos está preparada, sem cobrança ou bloqueio ativo. BioSites: {limit}.</p>
      </div>
      <div className="sx-header-actions">
        <Link href="/admin/templates" className="sx-button sx-secondary"><Sparkles size={16} />Modelos</Link>
        <Link href="/admin/create" className="sx-button sx-primary"><Plus size={16} />Criar Novo BioSite</Link>
      </div>
    </header>

    {error && <p role="alert" className="alert-error">{error}</p>}

    <section className="sx-metrics" aria-label="Indicadores">
      <Metric label="Total de clientes" value={number.format(businesses.length)} />
      <Metric label="BioSites publicados" value={number.format(counts.published)} tone="live" />
      <Metric label="BioSites em edição" value={number.format(counts.editing + counts.review)} hint={`${counts.review} em revisão`} />
      <Metric label="Visualizações · 30 dias" value={stats ? number.format(stats.views) : "—"} hint={statsError || "Páginas publicadas"} />
      <Metric label="Conversões · 30 dias" value={stats ? number.format(stats.conversions) : "—"} hint={stats ? `${number.format(stats.clicks)} cliques + ${number.format(stats.leads)} leads` : statsError} />
    </section>

    <section className="sx-section" aria-labelledby="clients-title">
      <div className="sx-section-head">
        <div><h2 id="clients-title">Meus Clientes</h2><p>{filtered.length} de {businesses.length} BioSites</p></div>
        <label className="sx-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Buscar cliente</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome ou endereço" /></label>
      </div>

      <div className="sx-filters">
        <div className="sx-chips" role="group" aria-label="Filtrar por status">
          <button className={stage === "all" ? "is-active" : ""} aria-pressed={stage === "all"} onClick={() => setStage("all")}>Todos <b>{businesses.length}</b></button>
          {stages.map(item => <button key={item} className={stage === item ? "is-active" : ""} aria-pressed={stage === item} onClick={() => setStage(item)}>{STAGE_LABEL[item]} <b>{counts[item]}</b></button>)}
        </div>
        <select aria-label="Filtrar por categoria" value={segment} onChange={event => setSegment(event.target.value as typeof segment)}>
          <option value="all">Todas as categorias</option>
          {SEGMENTS.map(item => <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>)}
          <option value="none">Sem categoria</option>
        </select>
      </div>

      {loading ? <div className="sx-empty" role="status">Carregando clientes…</div> : filtered.length === 0 ? <div className="sx-empty">
        <strong>{businesses.length ? "Nenhum resultado." : "Seu primeiro cliente começa aqui."}</strong>
        <p>{businesses.length ? "Ajuste a busca ou os filtros." : "Escolha o segmento, preencha os dados e gere um BioSite pronto para revisar."}</p>
        {!businesses.length && <Link href="/admin/create" className="sx-button sx-primary"><Plus size={16} />Criar Novo BioSite</Link>}
      </div> : <ul className="sx-clients">{filtered.map(item => <ClientRow key={item.id} business={item} busy={busy === item.id} run={run} />)}</ul>}
    </section>
  </div></AdminShell>;
}

function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "live" }) {
  return <article className={`sx-metric ${tone === "live" ? "is-live" : ""}`}><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</article>;
}

function ClientRow({ business, busy, run }: { business: Business; busy: boolean; run: (id: string, action: () => Promise<void>) => Promise<void> }) {
  const current = stageOf(business);
  const category = categoryOf(business);
  const date = business.updated_at ? new Date(business.updated_at).toLocaleDateString("pt-BR") : "—";
  return <li className="sx-client">
    <div className="sx-logo" aria-hidden="true">{business.logo_url ? <img src={business.logo_url} alt="" loading="lazy" /> : <span>{business.name.slice(0, 1).toUpperCase()}</span>}</div>
    <div className="sx-client-main">
      <h3>{business.name}</h3>
      <p><span>{category.emoji} {category.label}</span><span>/{business.slug}</span><span>Atualizado em {date}</span></p>
    </div>
    <span className={`sx-status is-${current}`}>{STAGE_LABEL[current]}</span>
    <div className="sx-row-actions">
      <Link href={`/admin/client/${business.id}`} className="sx-button sx-ghost"><Pencil size={15} />Editar</Link>
      <Link href={`/admin/preview/${business.slug}`} className="sx-button sx-ghost"><Eye size={15} />Visualizar</Link>
      <Link href={`/admin/delivery/${business.id}`} className="sx-button sx-primary-soft"><Send size={15} />{current === "published" ? "Entregar" : "Publicar"}</Link>
      <details className="sx-menu">
        <summary aria-label={`Mais ações para ${business.name}`}>Mais</summary>
        <div>
          <button disabled={busy} onClick={() => run(business.id, async () => { await duplicateBusiness(business.id); })}><Copy size={14} />Duplicar</button>
          <Link href={`/admin/analytics/${business.id}`}><BarChart3 size={14} />Estatísticas</Link>
          {current === "editing" && <button disabled={busy} onClick={() => run(business.id, () => setBusinessWorkflow(business.id, "review"))}>Enviar para revisão</button>}
          {current === "review" && <button disabled={busy} onClick={() => run(business.id, () => setBusinessWorkflow(business.id, "editing"))}>Voltar para edição</button>}
          {current === "published" && <button disabled={busy} onClick={() => run(business.id, () => setBusinessStatus(business.id, "inactive"))}>Desativar</button>}
          {current === "inactive" && <button disabled={busy} onClick={() => run(business.id, () => setBusinessStatus(business.id, "draft"))}>Reativar como rascunho</button>}
          <button className="is-danger" disabled={busy} onClick={() => { if (window.confirm(`Remover ${business.name}? Esta ação apaga a página e seus dados.`)) void run(business.id, () => deleteBusiness(business.id)); }}>Remover</button>
        </div>
      </details>
    </div>
  </li>;
}
