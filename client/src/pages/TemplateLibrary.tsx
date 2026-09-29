import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, LayoutTemplate, Search, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { templatePresets, type TemplateCategory } from "@/lib/templates";

const categories: Array<"Todos" | TemplateCategory> = ["Todos", "Gastronomia", "Beleza", "Serviços", "Varejo", "Criativo"];

export default function TemplateLibrary() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Todos");
  const [copied, setCopied] = useState("");
  const filtered = useMemo(() => templatePresets.filter((template) => {
    const matchesCategory = category === "Todos" || template.category === category;
    const haystack = `${template.name} ${template.description} ${template.category}`.toLowerCase();
    return matchesCategory && haystack.includes(search.toLowerCase());
  }), [category, search]);
  const useTemplate = (id: string) => {
    const template = templatePresets.find((item) => item.id === id);
    if (!template) return;
    window.localStorage.setItem("plak-template-draft", JSON.stringify(template.form));
    navigate("/admin/new");
  };
  const copyTemplate = async (id: string) => {
    const template = templatePresets.find((item) => item.id === id);
    if (!template) return;
    await navigator.clipboard?.writeText(JSON.stringify(template.form, null, 2));
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1400);
  };
  return <AdminShell><div className="space-y-8 plak-grid">
    <header className="relative overflow-hidden rounded-[30px] bg-[#17262d] p-7 text-white shadow-[0_24px_55px_rgba(23,38,45,.18)] sm:p-10">
      <div className="relative z-10 max-w-2xl"><p className="eyebrow text-[#d8ee77]">PLAK / BIBLIOTECA</p><h1 className="mt-3 font-display text-5xl font-black tracking-[-.09em] sm:text-6xl">Comece com uma<br /><span className="text-[#d8ee77]">boa direção.</span></h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/55">Escolha um modelo configurado, replique no editor e personalize com os dados do seu cliente. Todos os presets usam apenas recursos que o PLAK já oferece.</p></div><div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border-[32px] border-[#d8ee77]/15" /><div className="pointer-events-none absolute bottom-[-100px] right-28 h-56 w-56 rounded-full bg-[#d8ee77]/10 blur-3xl" /></header>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="section-title">20 modelos prontos</h2><p className="mt-1 text-sm text-[#89938d]">Escolha uma base e transforme em uma página única.</p></div><div className="relative w-full lg:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a099]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar modelo" className="h-11 w-full rounded-full border border-[#dfe5dc] bg-white/80 pl-10 pr-4 text-sm outline-none focus:border-[#b8d66a]" /></div></div>
    <div className="flex flex-wrap gap-2">{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? "bg-[#17262d] text-white" : "bg-[#e9f0e5] text-[#6e8571] hover:bg-[#dceaca]"}`}>{item}</button>)}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((template, index) => <article key={template.id} className="group overflow-hidden rounded-[25px] border border-[#dce4dc] bg-white/80 shadow-[0_14px_35px_rgba(27,49,43,.05)] transition hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(27,49,43,.12)]"><div className="relative h-36 overflow-hidden bg-[#17262d] p-5" style={{ background: `radial-gradient(circle at 78% 12%, ${template.tone}55, transparent 35%), linear-gradient(135deg, #17262d, #21383d)` }}><div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[18px] border-white/10" /><div className="relative flex items-start justify-between"><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-white/65">{String(index + 1).padStart(2, "0")} · {template.category}</span><LayoutTemplate className="h-5 w-5 text-white/45" /></div><div className="relative mt-7 flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: template.tone }} /><span className="text-xs font-bold text-white/70">PLAK / {template.name.toUpperCase()}</span></div></div><div className="p-5"><h3 className="font-display text-xl font-black tracking-[-.04em] text-[#1d3438]">{template.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-[#82908a]">{template.description}</p><div className="mt-5 flex items-center gap-2"><button type="button" onClick={() => useTemplate(template.id)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#d8ee77] px-4 text-xs font-black text-[#17262d] transition hover:bg-[#c8e343]"><Sparkles className="h-3.5 w-3.5" />Usar modelo <ArrowUpRight className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void copyTemplate(template.id)} className="grid h-10 w-10 place-items-center rounded-full border border-[#dce5df] text-[#78927c] transition hover:bg-[#eef5e8]" title="Copiar configuração">{copied === template.id ? <Check className="h-4 w-4 text-[#659451]" /> : <Copy className="h-4 w-4" />}</button></div></div></article>)}</div>
    {filtered.length === 0 && <div className="rounded-[24px] border border-dashed border-[#cfdace] bg-white/60 p-12 text-center text-sm text-[#83908a]">Nenhum modelo encontrado. Tente outra busca.</div>}
    <div className="rounded-[24px] border border-[#dce5df] bg-[#eaf3d3] p-5 text-sm text-[#4e6751]"><strong>Como funciona:</strong> ao clicar em “Usar modelo”, o PLAK abre o editor com nome, cores, frase, slug e estrutura prontos. Depois você só troca as informações do cliente e publica.</div>
  </div></AdminShell>;
}
