import { Component, useMemo, type ReactNode } from "react";
import PublicPage from "@/pages/PublicPage";
import type { Business, BusinessBundle, BusinessForm } from "@/lib/types";

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="sx-preview-error" role="alert">Não foi possível montar a prévia fiel. Use a prévia rápida ou salve e abra a prévia privada.</div> : this.props.children;
  }
}

/** Renders the real public page from unsaved editor state, without registering analytics or leads. */
export function LivePreview({ form, id }: { form: BusinessForm; id?: string }) {
  const bundle = useMemo<BusinessBundle>(() => {
    const business = { ...form, id: id || "preview", status: "draft", published_at: null, created_at: "", updated_at: "", created_by: null, features: { ...form.features, canvas_objects: [] } } as unknown as Business;
    return { business, links: form.links.map((link, position) => ({ ...link, position })), media: form.media.map((media, position) => ({ ...media, position })) };
  }, [form, id]);
  return <PreviewBoundary><PublicPage previewBundle={bundle} /></PreviewBoundary>;
}
