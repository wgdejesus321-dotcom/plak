import { Radio } from "lucide-react";

export function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const ink = inverse ? "text-white" : "text-[#172027]";
  const line = inverse ? "border-white" : "border-[#172027]";
  return <div className={`flex items-center gap-3 ${inverse ? "text-white" : "text-[#172027]"}`} aria-label="Plak">
    <span className={`relative grid h-9 w-9 place-items-center border-2 ${line}`}>
      <span className={`absolute -left-1 -top-1 h-3.5 w-3.5 border-l-2 border-t-2 ${line}`} />
      <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 border-b-2 border-r-2 ${line}`} />
      <span className={`font-display text-[24px] font-bold leading-none ${ink}`}>P</span>
      <Radio className={`absolute right-0 top-0 h-3 w-3 ${ink}`} strokeWidth={2.4} />
    </span>
    {!compact && <span className="font-display text-[19px] font-bold tracking-[.16em]">PLAK</span>}
  </div>;
}
