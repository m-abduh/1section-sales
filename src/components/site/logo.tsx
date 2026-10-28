import type { CSSProperties } from "react";

const maskStyle: CSSProperties = {
  WebkitMaskImage: "url(/1section.svg)",
  maskImage: "url(/1section.svg)",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
};

export function Logo({
  className = "h-6 w-[98px]",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={maskStyle}
    />
  );
}
