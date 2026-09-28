import { Radio } from "lucide-react";

export function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${inverse ? "text-white" : "text-[#14252c]"}`} aria-label="Plak">
      <span className={`relative grid h-9 w-9 place-items-center rounded-xl border-2 ${inverse ? "border-[#d7f56c] text-[#d7f56c]" : "border-[#14252c] text-[#14252c]"}`}>
        <span className="font-display text-2xl font-black leading-none">P</span>
        <Radio className="absolute -right-1 -top-1 h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      {!compact && <span className="font-display text-xl font-black tracking-[.08em]">PLAK</span>}
    </div>
  );
}
