import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { AdminShell } from "@/components/AdminShell";
import { getGenerator } from "@/lib/ai";
import { blueprintById, blueprintsFor, buildBioSiteForm, emptyCompanyInput, type CompanyInput, type TemplateBlueprint } from "@/lib/blueprints";
import { saveBusiness, uploadAsset } from "@/lib/data";
import { SEGMENTS, SEGMENT_BY_ID } from "@/lib/segments";
import type { BusinessMedia, SegmentId } from "@/lib/types";
import { normalizeBusinessForm, normalizeSlug, validateBusinessForm, validateFile } from "@/lib/validation";

const STEPS = ["Categoria", "Empresa", "Modelo", "Gerar"] as const;
const MAX_GALLERY = 8;

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

export default function CreateWizard() {
  return <AdminShell adminOnly><WizardContent /></AdminShell>;
}

function WizardContent() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [segmentId, setSegmentId] = useState<SegmentId | "">("");
  const [input, setInput] = useState<CompanyInput>(emptyCompanyInput);
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const logoPreview = useObjectUrl(logoFile);
  const coverPreview = useObjectUrl(coverFile);

  const segment = segmentId ? SEGMENT_BY_ID[segmentId] : null;
  const templates = segmentId ? blueprintsFor(segmentId) : [];
  const blueprint = blueprintById(templateId);

  const patch = (values: Partial<CompanyInput>) => setInput(current => ({ ...current, ...values }));
  const setName = (name: string) => setInput(current => ({ ...current, name, slug: slugTouched ? current.slug : normalizeSlug(name) }));

  const chooseSegment = (id: SegmentId) => {
    if (id !== segmentId) setTemplateId("");
    setSegmentId(id);
    setError(""); setStep(1);
  };

  const pickFile = (file: File | undefined, kind: "logo" | "background", set: (file: File | null) => void) => {
    if (!file) return;
    const problem = validateFile(file, kind);
    if (problem) { setError(problem); return; }
    setError(""); set(file);
  };
  const addGallery = (list: FileList | null) => {
    if (!list) return;
    const next = [...galleryFiles];
    for (const file of Array.from(list)) {
      const problem = validateFile(file, "media");
      if (problem) { setError(`${file.name}: ${problem}`); continue; }
      if (next.length >= MAX_GALLERY) { setError(`Use até ${MAX_GALLERY} fotos neste assistente. Adicione mais depois no editor.`); break; }
      next.push(file);
    }
    setGalleryFiles(next);
  };

  const suggest = async () => {
    if (!segmentId || !prompt.trim()) return;
    setSuggesting(true); setError("");
    try {
      const draft = await getGenerator().generate({ prompt, segment: segmentId });
      patch({ description: draft.description });
    } catch { setError("Não foi possível gerar a sugestão. Escreva a descrição manualmente."); }
    finally { setSuggesting(false); }
  };

  const validateCompany = () => {
    if (input.name.trim().length < 2) return "Informe o nome do negócio.";
    if (!input.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) return "Informe um endereço com letras, números e hífens.";
    if (!input.whatsapp.trim() && !input.instagram.trim()) return "Informe WhatsApp ou Instagram para ter um contato principal.";
    return "";
  };

  const next = () => {
    setError("");
    if (step === 1) { const problem = validateCompany(); if (problem) { setError(problem); return; } }
    if (step === 2 && !blueprint) { setError("Escolha um modelo."); return; }
    setStep(current => Math.min(current + 1, STEPS.length - 1));
  };

  const create = async () => {
    if (!blueprint || creating) return;
    setError("");
    const problem = validateCompany();
    if (problem) { setError(problem); setStep(1); return; }
    try {
      const preflight = normalizeBusinessForm(buildBioSiteForm(blueprint, input));
      const errors = validateBusinessForm(preflight);
      if (Object.keys(errors).length) { setError(Object.values(errors)[0]); setStep(1); return; }
    } catch (e) { setError(e instanceof Error ? e.message : "Revise os dados informados."); setStep(1); return; }
    setCreating(true);
    try {
      const assetId = crypto.randomUUID();
      const logo_url = logoFile ? (await uploadAsset(logoFile, assetId, "logo")).url : "";
      const cover_url = coverFile ? (await uploadAsset(coverFile, assetId, "background")).url : "";
      const media: BusinessMedia[] = [];
      for (const file of galleryFiles) {
        const asset = await uploadAsset(file, assetId, "media");
        media.push({ type: "image", url: asset.url, storage_path: asset.path, alt: `Foto de ${input.name.trim()}`, position: media.length });
      }
      const form = buildBioSiteForm(blueprint, { ...input, logo_url, cover_url });
      form.media = media;
      const saved = await saveBusiness(form);
      navigate(`/admin/client/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível gerar o BioSite. Tente novamente.");
    } finally { setCreating(false); }
  };

  return <div className="sx-wizard">
    <header className="sx-wizard-head">
      <div><p className="sx-eyebrow">Novo BioSite</p><h1>Do cliente ao link pronto em quatro passos</h1></div>
      <Link href="/admin" className="sx-button sx-ghost">Cancelar</Link>
    </header>
    <ol className="sx-stepper" aria-label="Etapas">
      {STEPS.map((label, index) => <li key={label} className={index === step ? "is-current" : index < step ? "is-done" : ""} aria-current={index === step ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}
    </ol>
    {error && <p role="alert" className="alert-error">{error}</p>}

    {step === 0 && <section aria-labelledby="step-category"><h2 id="step-category" className="sx-step-title">Qual é o segmento do cliente?</h2>
      <div className="sx-segment-grid">{SEGMENTS.map(item => <button key={item.id} className={`sx-segment ${segmentId === item.id ? "is-active" : ""}`} aria-pressed={segmentId === item.id} onClick={() => chooseSegment(item.id)}><span aria-hidden="true">{item.emoji}</span><strong>{item.label}</strong><small>{item.summary}</small></button>)}</div>
      <p className="sx-note">Prefere começar sem modelo? <Link href="/admin/new">Abrir editor em branco</Link>.</p></section>}

    {step === 1 && segment && <section className="sx-form-card" aria-labelledby="step-company"><h2 id="step-company" className="sx-step-title">Informações da empresa · {segment.emoji} {segment.label}</h2>
      <div className="sx-assistant"><label htmlFor="prompt">Assistente de texto (regras locais, sem IA externa)</label><div><input id="prompt" value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Ex.: Restaurante italiano premium em São Paulo" /><button className="sx-button sx-secondary" disabled={!prompt.trim() || suggesting} onClick={suggest}>{suggesting ? "Gerando…" : "Sugerir descrição"}</button></div><small>Gera um texto neutro com base nas palavras digitadas. Revise antes de publicar.</small></div>
      <div className="sx-fields">
        <Field label="Nome do negócio" required><input value={input.name} onChange={event => setName(event.target.value)} maxLength={160} autoComplete="organization" /></Field>
        <Field label="Endereço do BioSite" hint={`${window.location.host}/${input.slug || "nome-do-cliente"}`}><input value={input.slug} onChange={event => { setSlugTouched(true); patch({ slug: normalizeSlug(event.target.value) }); }} /></Field>
        <Field label="Descrição curta" wide hint={`${input.description.length}/255`}><textarea rows={3} maxLength={255} value={input.description} onChange={event => patch({ description: event.target.value })} placeholder={segment.defaultDescription} /></Field>
        <Field label="WhatsApp" hint="DDD + número. O código 55 é adicionado automaticamente."><input inputMode="tel" value={input.whatsapp} onChange={event => patch({ whatsapp: event.target.value })} placeholder="(11) 99999-9999" /></Field>
        <Field label="Instagram" hint="@usuario ou link"><input value={input.instagram} onChange={event => patch({ instagram: event.target.value })} placeholder="@nomedacliente" /></Field>
        <Field label="Endereço" wide><input value={input.address} onChange={event => patch({ address: event.target.value })} autoComplete="street-address" placeholder="Rua, número, bairro e cidade" /></Field>
        <Field label="Horário de funcionamento" wide hint="Uma linha por dia ou faixa"><textarea rows={3} value={input.hours} onChange={event => patch({ hours: event.target.value })} placeholder={"Seg a Sex: 11h às 22h\nSáb e Dom: 12h às 23h"} /></Field>
        <Field label={segment.itemsLabel} wide hint={segment.itemsHint}><textarea rows={5} value={input.items} onChange={event => patch({ items: event.target.value })} /></Field>
        {segment.extraFields.map(extra => <Field key={extra.key} label={extra.label} wide hint={extra.hint}><textarea rows={3} value={input[extra.key]} onChange={event => patch({ [extra.key]: event.target.value } as Partial<CompanyInput>)} /></Field>)}
        <Field label="Promoção ou destaque" wide hint="Opcional"><input value={input.promotion} onChange={event => patch({ promotion: event.target.value })} maxLength={240} /></Field>
        <label className="sx-check sx-wide"><input type="checkbox" checked={input.useSamples} onChange={event => patch({ useSamples: event.target.checked })} /><span>Usar itens de exemplo se eu não digitar nenhum. Eles ficam marcados como EXEMPLO e bloqueiam a publicação até serem substituídos.</span></label>
      </div>
      <div className="sx-uploads">
        <UploadCard label="Logo" preview={logoPreview} help="PNG ou JPG até 5 MB" onFile={file => pickFile(file, "logo", setLogoFile)} onClear={logoFile ? () => setLogoFile(null) : undefined} />
        <UploadCard label="Foto principal" preview={coverPreview} help="Banner ou fachada, até 15 MB" onFile={file => pickFile(file, "background", setCoverFile)} onClear={coverFile ? () => setCoverFile(null) : undefined} />
        <div className="sx-upload"><span>Galeria</span><label className="sx-button sx-secondary">Adicionar fotos<input hidden type="file" accept="image/*" multiple onChange={event => { addGallery(event.target.files); event.currentTarget.value = ""; }} /></label><small>{galleryFiles.length}/{MAX_GALLERY} fotos</small>{galleryFiles.length > 0 && <button className="sx-link" onClick={() => setGalleryFiles([])}>Remover todas</button>}</div>
      </div>
    </section>}

    {step === 2 && segment && <section aria-labelledby="step-template"><h2 id="step-template" className="sx-step-title">Escolha o modelo de {segment.label.toLowerCase()}</h2>
      <div className="sx-template-grid">{templates.map(item => <TemplateCard key={item.id} item={item} selected={templateId === item.id} onSelect={() => setTemplateId(item.id)} />)}</div></section>}

    {step === 3 && segment && blueprint && <section className="sx-form-card" aria-labelledby="step-generate"><h2 id="step-generate" className="sx-step-title">Revisar e gerar</h2>
      <dl className="sx-summary"><div><dt>Segmento</dt><dd>{segment.emoji} {segment.label}</dd></div><div><dt>Modelo</dt><dd>{blueprint.name}</dd></div><div><dt>Negócio</dt><dd>{input.name}</dd></div><div><dt>Endereço</dt><dd>/{input.slug}</dd></div><div><dt>Imagens</dt><dd>{[logoFile && "logo", coverFile && "foto principal", galleryFiles.length ? `${galleryFiles.length} da galeria` : ""].filter(Boolean).join(", ") || "Nenhuma"}</dd></div></dl>
      <p className="sx-note">O BioSite será criado como rascunho e aberto no editor. Nada fica público até você revisar e publicar.</p></section>}

    {step > 0 && <footer className="sx-wizard-actions"><button className="sx-button sx-ghost" disabled={creating} onClick={() => { setError(""); setStep(current => current - 1); }}>Voltar</button>{step < STEPS.length - 1 ? <button className="sx-button sx-primary" onClick={next}>Continuar</button> : <button className="sx-button sx-primary" disabled={creating || !blueprint} onClick={create}>{creating ? "Gerando…" : "Gerar BioSite"}</button>}</footer>}
  </div>;
}

function Field({ label, hint, required, wide, children }: { label: string; hint?: string; required?: boolean; wide?: boolean; children: ReactNode }) {
  return <label className={`sx-field ${wide ? "sx-wide" : ""}`}><span>{label}{required && <i aria-hidden="true"> *</i>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function UploadCard({ label, preview, help, onFile, onClear }: { label: string; preview: string; help: string; onFile: (file: File | undefined) => void; onClear?: () => void }) {
  return <div className="sx-upload"><span>{label}</span>{preview ? <img src={preview} alt={`Prévia: ${label}`} /> : <div className="sx-upload-empty" aria-hidden="true">+</div>}<label className="sx-button sx-secondary">{preview ? "Trocar" : "Escolher"}<input hidden type="file" accept="image/*" onChange={event => { onFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label><small>{help}</small>{onClear && <button className="sx-link" onClick={onClear}>Remover</button>}</div>;
}

function TemplateCard({ item, selected, onSelect }: { item: TemplateBlueprint; selected: boolean; onSelect: () => void }) {
  const { palette } = item;
  return <button className={`sx-template ${selected ? "is-active" : ""}`} aria-pressed={selected} onClick={onSelect}>
    <span className="sx-template-art" style={{ background: palette.background }} aria-hidden="true"><i style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }} /><b style={{ background: palette.button }} /><b style={{ background: palette.secondary, opacity: 0.45 }} /><b style={{ background: palette.primary, opacity: 0.16 }} /></span>
    <strong>{item.name}</strong><small>{item.description}</small>
  </button>;
}
