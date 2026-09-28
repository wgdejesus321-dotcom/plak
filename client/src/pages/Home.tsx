import {
  ArrowUpRight,
  BarChart3,
  Check,
  Link2,
  Radio,
  ScanLine,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";

const channels = [
  { icon: "★", label: "Avaliar no Google", tone: "lime" },
  { icon: "◌", label: "Falar no WhatsApp", tone: "light" },
  { icon: "◎", label: "Seguir no Instagram", tone: "light" },
  { icon: "⌖", label: "Como chegar", tone: "light" },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f6f1] text-[#16262e]">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:py-8">
        <BrandLogo />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#718087] md:flex">
          <a href="#como-funciona" className="transition hover:text-[#16262e]">Como funciona</a>
          <a href="#recursos" className="transition hover:text-[#16262e]">Recursos</a>
          <Link href="/login" className="rounded-full border border-[#d7dfda] bg-white/70 px-4 py-2.5 text-[#314950] transition hover:-translate-y-0.5 hover:border-[#b5c96a]">Entrar</Link>
        </nav>
        <Link href="/login" className="brand-button rounded-full bg-[#16262e] px-4 py-2.5 text-xs font-bold text-white md:hidden">Entrar</Link>
      </header>

      <main>
        <section className="plak-grid relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-6 lg:pb-32 lg:pt-20">
          <div className="pointer-events-none absolute -left-40 top-8 h-96 w-96 rounded-full bg-[#cfe95b]/30 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-[#d6e3c6] bg-[#eef6e4] px-3 py-2 text-[#789442]"><Sparkles className="h-3.5 w-3.5" /> Presença digital inteligente</div>
            <h1 className="font-display mt-8 text-[clamp(3.6rem,7.2vw,7rem)] font-black leading-[.88] tracking-[-.09em]">Sua presença digital.<br /><span className="text-[#8da934]">Em um toque.</span></h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#6d7b80] sm:text-lg">O link inteligente que conecta sua marca, seus clientes e todos os seus canais.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/login" className="brand-button inline-flex items-center gap-2 rounded-full bg-[#16262e] px-6 py-4 text-sm font-bold text-white">Criar minha página <ArrowUpRight className="h-4 w-4" /></Link>
              <a href="#como-funciona" className="inline-flex items-center gap-2 rounded-full px-4 py-4 text-sm font-bold text-[#66823e] transition hover:bg-[#edf4e6]">Explorar o PLAK <span className="text-lg">↓</span></a>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-xs font-bold text-[#84928e]"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#8eaa35]" />QR Code + NFC</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#8eaa35]" />Feito para celular</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#8eaa35]" />Analytics integrado</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px] lg:pr-8">
            <div className="absolute -inset-10 rounded-[60px] bg-[#d7ea99]/40 blur-3xl" />
            <div className="relative plak-panel rounded-[34px] border-white/80 p-3 shadow-[0_35px_100px_rgba(22,38,46,.17)]">
              <div className="rounded-[27px] bg-[#16262e] p-5 text-white sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5 text-[10px] font-black uppercase tracking-[.22em] text-white/55"><span className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e7f3bd] text-[#718d2c]"><ScanLine className="h-4 w-4" /></span> Página conectada</span><span className="flex items-center gap-2 text-[#d8ee77]"><i className="h-2 w-2 rounded-full bg-[#d8ee77] shadow-[0_0_14px_#d8ee77]" /> Online</span></div>
                <div className="grid gap-6 py-8 sm:grid-cols-[.85fr_1.15fr] sm:items-center">
                  <div className="text-center sm:text-left"><div className="mx-auto grid h-24 w-24 place-items-center rounded-[30px] border-8 border-[#263943] bg-[#dfeeb3] text-4xl font-black text-[#5e7729] shadow-[0_0_35px_rgba(215,234,153,.18)] sm:mx-0">M</div><h2 className="font-display mt-5 text-3xl font-black tracking-[-.06em]">Mercado Pátio</h2><p className="mt-2 text-sm text-white/50">Comida boa, perto de você.</p><div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#d8ee77]"><Radio className="h-4 w-4" /> Páginas que trabalham</div></div>
                  <div className="space-y-2.5">{channels.map((channel) => <div key={channel.label} className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left text-xs font-bold transition hover:-translate-y-0.5 ${channel.tone === "lime" ? "bg-[#cfe95b] text-[#16262e] shadow-[0_8px_24px_rgba(207,233,91,.2)]" : "border border-white/10 bg-white/[.07] text-white"}`}><span className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-black/10 text-sm">{channel.icon}</span>{channel.label}</span><ArrowUpRight className="h-4 w-4 opacity-60" /></div>)}</div>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[10px] font-black uppercase tracking-[.18em] text-white/35"><span>plak.to/mercadopatio</span><span className="flex items-center gap-2"><Zap className="h-3 w-3 text-[#d8ee77]" /> Link ativo</span></div>
              </div>
            </div>
            <div className="float-card absolute -right-2 top-8 hidden rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-xl sm:block"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf5d9] text-[#75922e]"><Radio className="h-4 w-4" /></span><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#86918b]">NFC ready</p><p className="text-xs font-bold text-[#24373e]">Toque para abrir</p></div></div></div>
            <div className="float-card absolute -bottom-7 -left-8 hidden rounded-2xl border border-white bg-[#dff0a5] px-4 py-3 shadow-xl sm:block"><div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-[#5c7629]" /><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#71853e]">Analytics</p><p className="text-xs font-bold text-[#24373e]">+28% esta semana</p></div></div></div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-[#dfe5df] bg-white/65 px-5 py-24 sm:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="eyebrow">Como funciona</p><h2 className="font-display mt-4 max-w-2xl text-4xl font-black tracking-[-.07em] sm:text-6xl">Tudo conectado.<br /><span className="text-[#8da934]">Sem complicar.</span></h2></div><p className="max-w-sm text-sm leading-7 text-[#7b898d]">Uma experiência simples para o cliente e poderosa para quem gerencia marcas.</p></div><div className="mt-14 grid gap-4 md:grid-cols-3"><Feature icon={Link2} index="01" title="Um link" text="Sua marca, seus canais e suas informações em um único endereço memorável." /><Feature icon={Sparkles} index="02" title="Mais clientes" text="Transforme QR Codes, NFCs e bios em pontos de contato que geram ação." /><Feature icon={BarChart3} index="03" title="Tudo medido" text="Entenda visitas, cliques e origens para decidir com mais clareza." /></div></div></section>

        <section id="recursos" className="relative overflow-hidden bg-[#16262e] px-5 py-24 text-white sm:px-8"><div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(207,233,91,.18),transparent_45%)]" /><div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><div><p className="eyebrow text-[#d8ee77]">Feito para avançar</p><h2 className="font-display mt-4 text-4xl font-black tracking-[-.07em] sm:text-6xl">A operação séria<br />começa no <span className="text-[#d8ee77]">link.</span></h2><p className="mt-6 max-w-md text-sm leading-7 text-white/55">Do primeiro toque ao próximo cliente, o PLAK deixa sua presença digital mais inteligente.</p><Link href="/login" className="brand-button mt-8 inline-flex items-center gap-2 rounded-full bg-[#d8ee77] px-6 py-4 text-sm font-black text-[#16262e]">Começar agora <ArrowUpRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[["01", "Múltiplos clientes", "Uma conta, todas as páginas."], ["02", "Publicação segura", "Rascunho, preview e publicar."], ["03", "Arquivos próprios", "Logo, galeria e background."], ["04", "Design responsivo", "Bonito em qualquer tela."]].map(([number, title, text]) => <div key={number} className="group rounded-2xl border border-white/10 bg-white/[.06] p-6 transition hover:-translate-y-1 hover:border-[#d8ee77]/40 hover:bg-white/[.1]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8ee77] text-sm font-black text-[#16262e]">{number}</span><ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:text-[#d8ee77]" /></div><h3 className="mt-8 text-lg font-black">{title}</h3><p className="mt-2 text-sm text-white/45">{text}</p></div>)}</div></div></section>
      </main>
      <footer className="bg-[#16262e] px-5 pb-8 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7"><BrandLogo inverse compact /><span className="text-xs text-white/35">PLAK · conecte sua marca ao próximo toque.</span></div></footer>
    </div>
  );
}

function Feature({ icon: Icon, index, title, text }: { icon: typeof Link2; index: string; title: string; text: string }) {
  return <div className="group rounded-[22px] border border-[#e0e7de] bg-[#fbfcf8] p-6 shadow-[0_18px_40px_rgba(43,62,53,.04)] transition hover:-translate-y-1 hover:border-[#c6db70] hover:shadow-[0_22px_48px_rgba(43,62,53,.1)]"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3cf] text-[#71922f] transition group-hover:bg-[#d8ee77]"><Icon className="h-5 w-5" /></span><span className="font-display text-sm font-black text-[#b8c5bb]">{index}</span></div><h3 className="font-display mt-9 text-xl font-black tracking-[-.04em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#7c898b]">{text}</p></div>;
}
