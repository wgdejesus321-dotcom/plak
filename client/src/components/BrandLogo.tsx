import { Radio } from "lucide-react";

export function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const ink = inverse ? "text-white" : "text-[#16262e]";
  const line = inverse ? "border-white" : "border-[#16262e]";
  return (
    <div className={`flex items-center gap-3 ${ink}`} aria-label="PLAK">
      <span className={`plak-mark relative grid h-10 w-10 place-items-center border-2 ${line}`}>
        <span className={`absolute -left-1.5 -top-1.5 h-4 w-4 border-l-2 border-t-2 ${line}`} />
        <span className={`absolute -bottom-1.5 -right-1.5 h-4 w-4 border-b-2 border-r-2 ${line}`} />
        <span className={`font-display text-[28px] font-black leading-none ${ink}`}>P</span>
        <Radio className={`absolute right-0.5 top-0.5 h-3 w-3 ${inverse ? "text-[#d8ee77]" : "text-[#8da934]"}`} strokeWidth={2.5} />
      </span>
      {!compact && <span className="font-display text-[20px] font-black tracking-[.14em]">PLAK</span>}
    </div>
  );
}
