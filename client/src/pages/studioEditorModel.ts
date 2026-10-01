export type EditorKind = "text" | "rect" | "circle" | "line" | "image";

export interface EditorItem {
  id: string;
  kind: EditorKind;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  fill: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  src?: string;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  italic?: boolean;
  underline?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  groupId?: string;
  cropLeft?: number;
  cropTop?: number;
  cropRight?: number;
  cropBottom?: number;
}

export interface EditorDoc { name: string; width: number; height: number; background: string; items: EditorItem[] }
export interface GuideLines { x?: number; y?: number }

export function rotateVector(dx: number, dy: number, degrees: number) {
  const angle = -degrees * Math.PI / 180;
  return { x: dx * Math.cos(angle) - dy * Math.sin(angle), y: dx * Math.sin(angle) + dy * Math.cos(angle) };
}

export function resizeFromPointer(item: EditorItem, dx: number, dy: number, handle: string, keepRatio = false) {
  const local = rotateVector(dx, dy, item.rotation);
  let x = item.x, y = item.y, w = item.w, h = item.h;
  if (handle.includes("e")) w = Math.max(24, item.w + local.x);
  if (handle.includes("s")) h = Math.max(24, item.h + local.y);
  if (handle.includes("w")) { w = Math.max(24, item.w - local.x); x = item.x + item.w - w; }
  if (handle.includes("n")) { h = Math.max(24, item.h - local.y); y = item.y + item.h - h; }
  if (keepRatio && item.w > 0 && item.h > 0) {
    const ratio = item.w / item.h;
    if (Math.abs(local.x) >= Math.abs(local.y)) h = Math.max(24, w / ratio);
    else w = Math.max(24, h * ratio);
    if (handle.includes("n")) y = item.y + item.h - h;
    if (handle.includes("w")) x = item.x + item.w - w;
  }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

export function groupItems(items: EditorItem[], selectedIds: string[], groupId: string) {
  const selected = new Set(selectedIds);
  return items.map(item => selected.has(item.id) ? { ...item, groupId } : item);
}

export function ungroupItems(items: EditorItem[], selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return items.map(item => selected.has(item.id) ? { ...item, groupId: undefined } : item);
}

export function selectionForItem(items: EditorItem[], item: EditorItem, additive = false, current: string[] = []) {
  const ids = item.groupId ? items.filter(candidate => candidate.groupId === item.groupId).map(candidate => candidate.id) : [item.id];
  if (!additive) return ids;
  const next = new Set(current);
  ids.forEach(id => next.has(id) ? next.delete(id) : next.add(id));
  return Array.from(next);
}

function escapeXml(value: string) { return value.replace(/[<>&'\"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character] || character)); }
function crop(item: EditorItem) { return { left: item.cropLeft || 0, top: item.cropTop || 0, right: item.cropRight || 0, bottom: item.cropBottom || 0 }; }

export function itemToSvg(item: EditorItem, index: number) {
  if (item.hidden) return "";
  const common = `transform="translate(${item.x} ${item.y}) rotate(${item.rotation} ${item.w / 2} ${item.h / 2})" opacity="${(item.opacity ?? 100) / 100}"`;
  if (item.kind === "image" && item.src) {
    const insets = crop(item);
    const clipId = `crop-${index}`;
    return `<defs><clipPath id="${clipId}"><rect x="${item.w * insets.left / 100}" y="${item.h * insets.top / 100}" width="${item.w * (100 - insets.left - insets.right) / 100}" height="${item.h * (100 - insets.top - insets.bottom) / 100}"/></clipPath></defs><image href="${item.src}" x="0" y="0" width="${item.w}" height="${item.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" ${common}/>`;
  }
  if (item.kind === "text") {
    const lines = (item.text || "").split(/\r?\n/);
    const size = item.fontSize || 24;
    const lineHeight = (item.lineHeight || 1.2) * size;
    const anchor = item.align === "center" ? "middle" : item.align === "right" ? "end" : "start";
    const x = item.align === "center" ? item.w / 2 : item.align === "right" ? item.w : 0;
    const tspans = lines.map((line, lineIndex) => `<tspan x="${x}" dy="${lineIndex === 0 ? 0 : lineHeight}">${escapeXml(line) || "&#8203;"}</tspan>`).join("");
    return `<text x="0" y="${size}" ${common} fill="${item.color || "#222"}" font-family="${escapeXml(item.fontFamily || "Arial")}" font-size="${size}" font-weight="${item.fontWeight || 400}" font-style="${item.italic ? "italic" : "normal"}" text-decoration="${item.underline ? "underline" : "none"}" letter-spacing="${item.letterSpacing || 0}px" text-anchor="${anchor}">${tspans}</text>`;
  }
  if (item.kind === "circle") return `<ellipse cx="${item.w / 2}" cy="${item.h / 2}" rx="${item.w / 2}" ry="${item.h / 2}" fill="${item.fill}" ${common}/>`;
  if (item.kind === "line") return `<line x1="0" y1="${item.h / 2}" x2="${item.w}" y2="${item.h / 2}" stroke="${item.fill}" stroke-width="${Math.max(1, item.h)}" ${common}/>`;
  return `<rect x="0" y="0" width="${item.w}" height="${item.h}" fill="${item.fill}" rx="${Math.min(18, item.w / 8)}" ${common}/>`;
}

export function documentToSvg(doc: EditorDoc) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="0 0 ${doc.width} ${doc.height}"><rect width="100%" height="100%" fill="${doc.background}"/>${doc.items.map(itemToSvg).join("")}</svg>`;
}

export function guidesFor(item: EditorItem, others: EditorItem[], threshold = 6): GuideLines {
  const xCandidates = [item.x, item.x + item.w / 2, item.x + item.w];
  const yCandidates = [item.y, item.y + item.h / 2, item.y + item.h];
  let x: number | undefined;
  let y: number | undefined;
  for (const other of others) {
    if (other.id === item.id || other.hidden) continue;
    const ox = [other.x, other.x + other.w / 2, other.x + other.w];
    const oy = [other.y, other.y + other.h / 2, other.y + other.h];
    const matchX = xCandidates.find(candidate => ox.some(value => Math.abs(candidate - value) <= threshold));
    const matchY = yCandidates.find(candidate => oy.some(value => Math.abs(candidate - value) <= threshold));
    if (matchX !== undefined && x === undefined) x = ox.reduce((best, value) => Math.abs(value - matchX) < Math.abs(best - matchX) ? value : best, ox[0]);
    if (matchY !== undefined && y === undefined) y = oy.reduce((best, value) => Math.abs(value - matchY) < Math.abs(best - matchY) ? value : best, oy[0]);
  }
  return { x, y };
}
