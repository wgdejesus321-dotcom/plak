import { useState } from "react";
import { Link, useRoute } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import PublicPage from "./PublicPage";

export default function AdminPreview() {
  return <AdminShell adminOnly><PreviewContent /></AdminShell>;
}

function PreviewContent() {
  const [, params] = useRoute("/admin/preview/:slug");
  const [mobile, setMobile] = useState(true);
  if (!params?.slug) return <p role="alert">Página não encontrada.</p>;
  return <div className="pk-preview">
    <header className="pk-preview-bar">
      <Link href="/admin" className="action-button">Voltar aos clientes</Link>
      <div><strong>Prévia privada</strong><small>Usa o mesmo conteúdo da página pública. Cliques, visitas e leads não são registrados.</small></div>
      <button className="action-button" onClick={() => setMobile(!mobile)} aria-pressed={mobile}>{mobile ? "Largura completa" : "Largura de celular"}</button>
    </header>
    <p className="pk-help">A largura de celular é uma simulação. Confira também em um aparelho real.</p>
    <div className={`pk-device ${mobile ? "is-mobile" : ""}`}><PublicPage previewSlug={params.slug} /></div>
  </div>;
}
