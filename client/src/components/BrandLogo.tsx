export function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const mark = inverse ? "/plak-mark-light.png" : "/plak-mark.png";
  const wordmark = inverse ? "/plak-wordmark-light.png" : "/plak-wordmark.png";

  return (
    <div className="inline-flex items-center gap-2.5" aria-label="PLAK" role="img">
      <img
        src={mark}
        alt=""
        aria-hidden="true"
        className={compact ? "h-9 w-9 object-contain" : "h-10 w-10 object-contain"}
      />
      {!compact && (
        <img
          src={wordmark}
          alt=""
          aria-hidden="true"
          className="h-[17px] w-auto object-contain sm:h-[19px]"
        />
      )}
    </div>
  );
}
