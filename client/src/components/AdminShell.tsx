import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, ChevronLeft, ChevronRight, LayoutDashboard, LayoutTemplate, LogOut, Menu, MessageCircle, Plus, ShieldCheck, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/supabase";
import { currentProfile } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { BrandLogo } from "./BrandLogo";

export function AdminShell({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [open, setOpen] = useState(false);
  const [editorNavOpen, setEditorNavOpen] = useState(false);
  const [location] = useLocation();
  const editorMode = location === "/admin/new" || location.startsWith("/admin/client/");

  useEffect(() => {
    let active = true;
    if (!user) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    currentProfile().then((next) => { if (active) setProfile(next); }).catch((error) => { if (active) { setProfile(null); setProfileError(error.message); } }).finally(() => active && setProfileLoading(false));
    return () => { active = false; };
  }, [user]);

  if (loading || profileLoading) return <div className="grid min-h-screen place-items-center bg-[#f5f6f1]"><div className="loader-dot" aria-label="Carregando sessão" /></div>;
  if (!user) return <AccessState title="Sessão necessária" text="Entre na sua conta para acessar o painel de gestão." action="Ir para login" href="/login" />;
  if (!profile || profile.access_status !== "approved") return <AccessState title="Acesso aguardando aprovação" text="Sua conta foi criada, mas ainda precisa ser aprovada por um administrador da Plak." action="Sair" onClick={signOut} error={profileError} />;
  if (adminOnly && profile.role !== "admin") return <AccessState title="Acesso restrito" text="Esta área está disponível apenas para administradores aprovados." action="Voltar ao painel" href="/admin" />;

  const links = [{ href: "/admin", label: "Visão geral", icon: LayoutDashboard }, { href: "/admin/new", label: "Novo cliente", icon: Plus }, { href: "/admin/templates", label: "Modelos prontos", icon: LayoutTemplate }, { href: "/admin/leads", label: "Leads", icon: MessageCircle }, ...(profile.role === "admin" ? [{ href: "/admin/accounts", label: "Contas", icon: ShieldCheck }] : [])];
  return <div className="plak-grid min-h-screen bg-[#f5f6f1] text-[#14252c]"><aside className={`fixed inset-y-0 left-0 z-40 plak-grid flex w-[278px] flex-col bg-[#16262e] px-4 py-5 text-[#f5f7ef] shadow-[12px_0_40px_rgba(22,38,46,.2)] transition-transform duration-200 ${editorMode ? `${open ? "translate-x-0" : "-translate-x-full"} ${editorNavOpen ? "lg:translate-x-0" : "lg:-translate-x-full"}` : `${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}`}><div className="flex items-center justify-between px-2"><BrandLogo inverse /><div className="flex items-center gap-1">{editorMode && <button className="hidden h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white lg:grid" onClick={() => setEditorNavOpen(false)} aria-label="Ocultar menu de gestão" title="Ocultar menu de gestão"><ChevronLeft className="h-5 w-5" /></button>}<button className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button></div></div><div className="mt-10 px-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#b7d36d]">PLAK / PAINEL DE GESTÃO</div><nav className="mt-3 space-y-1">{links.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${location === item.href ? "bg-[#d8ee77] text-[#14252c] shadow-[0_10px_22px_rgba(216,238,119,.18)]" : "text-[#c5d0ca] hover:bg-white/10 hover:text-[#d8ee77]"}`}><item.icon className="h-4 w-4" />{item.label}</Link>)}</nav><div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d8ee77] text-xs font-bold text-[#14252c]">{(profile.full_name || user.email || "U").slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{profile.full_name || (profile.role === "admin" ? "Administrador" : "Usuário")}</p><p className="truncate text-xs text-[#9fb2aa]">{user.email}</p></div></div><button onClick={signOut} className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold text-[#c5d0ca] hover:bg-white/10 hover:text-[#d8ee77]"><LogOut className="h-3.5 w-3.5" />Sair</button></div></aside>{editorMode && !editorNavOpen && <button type="button" onClick={() => setEditorNavOpen(true)} className="fixed left-3 top-20 z-50 hidden h-10 items-center gap-2 rounded-full border border-[#dce5df] bg-white px-3 text-xs font-extrabold text-[#263b40] shadow-lg transition hover:bg-[#f7fbe9] lg:inline-flex" aria-label="Mostrar menu de gestão" title="Mostrar menu de gestão"><ChevronRight className="h-4 w-4" />Menu</button>}<div className={editorMode ? (editorNavOpen ? "lg:pl-[278px] transition-[padding] duration-200" : "lg:pl-0 transition-[padding] duration-200") : "lg:pl-[278px]"}><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#dfe5df]/80 bg-[#f5f6f1]/90 px-4 backdrop-blur-xl sm:px-7 lg:hidden"><button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button><BrandLogo compact /><span className="w-10" /></header><main className={editorMode ? "mx-auto w-full max-w-none px-2 py-2 sm:px-3 lg:px-3 lg:py-2" : "mx-auto max-w-[1400px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10"}>{children}</main></div>{open && <button className="fixed inset-0 z-30 bg-[#16262e]/35 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}</div>;
}

function AccessState({ title, text, action, href, onClick, error }: { title: string; text: string; action: string; href?: string; onClick?: () => void; error?: string }) {
  return <div className="grid min-h-screen place-items-center bg-[#f5f6f1] px-6 text-center"><div><BrandLogo /><h1 className="font-display mt-8 text-3xl font-semibold text-[#14252c]">{title}</h1><p className="mt-3 max-w-sm text-sm leading-6 text-[#7c8982]">{text}</p>{error && <p className="mt-3 max-w-sm text-xs text-[#9b6653]">Não foi possível validar sua conta. Tente novamente.</p>}{href ? <Link href={href} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#16262e] px-5 py-3 text-sm font-bold text-white">{action}</Link> : <button onClick={onClick} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#16262e] px-5 py-3 text-sm font-bold text-white">{action}</button>}</div></div>;
}
