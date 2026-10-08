import { segmentEmoji, segmentLabel } from "./segments";
import type { Business, SegmentId } from "./types";

export type DisplayStage = "published" | "review" | "editing" | "inactive";

export function stageOf(business: Pick<Business, "status" | "features">): DisplayStage {
  if (business.status === "published") return "published";
  if (business.status === "inactive") return "inactive";
  return business.features?.meta?.workflow === "review" ? "review" : "editing";
}

export const STAGE_LABEL: Record<DisplayStage, string> = { published: "Publicado", review: "Revisão", editing: "Em edição", inactive: "Inativo" };

export function categoryOf(business: Pick<Business, "features">) {
  const segment: SegmentId | undefined = business.features?.meta?.segment;
  return { label: segmentLabel(segment), emoji: segmentEmoji(segment) };
}
