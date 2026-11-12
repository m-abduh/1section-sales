"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { EbookContent, EbookCover } from "@/lib/ebook/types";
import {
  COVER_HEIGHT,
  COVER_WIDTH,
  coverBackgroundCss,
  readableInk,
  type CoverInk,
} from "@/lib/ebook/cover";

export function EbookCoverDesign({
  content,
  cover,
}: {
  content: EbookContent;
  cover: EbookCover;
}) {
  const ink = readableInk(cover.background);
  const brand = content.brand.trim();
  const niche = content.niche.trim();
  const title = content.title.trim() || "Judul ebook";
  const description = content.description.trim();
  const imageUrl =
    cover.background.type === "image" ? cover.background.url : null;

  return (
    <div
      className="relative overflow-hidden font-montserrat"
      style={{
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
        background: coverBackgroundCss(cover.background),
        color: ink.fg,
      }}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 size-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.16) 28%, rgba(0,0,0,0.78) 100%)",
            }}
          />
        </>
      ) : null}

      <CoverTexture dark={ink.fg === "#FFFFFF"} />

      <div className="relative flex h-full flex-col">
        {cover.template === "signature" ? (
          <SignatureCover
            brand={brand}
            niche={niche}
            title={title}
            description={description}
            accent={cover.accent}
            ink={ink}
            showDescription={cover.showDescription}
          />
        ) : null}
        {cover.template === "minimal" ? (
          <MinimalCover
            brand={brand}
            niche={niche}
            title={title}
            description={description}
            accent={cover.accent}
            ink={ink}
            showDescription={cover.showDescription}
          />
        ) : null}
        {cover.template === "editorial" ? (
          <EditorialCover
            brand={brand}
            niche={niche}
            title={title}
            description={description}
            accent={cover.accent}
            ink={ink}
            showDescription={cover.showDescription}
          />
        ) : null}
        {cover.template === "bold" ? (
          <BoldCover
            brand={brand}
            niche={niche}
            title={title}
            description={description}
            accent={cover.accent}
            ink={ink}
            showDescription={cover.showDescription}
          />
        ) : null}
        {cover.template === "gradient" ? (
          <GradientCover
            brand={brand}
            niche={niche}
            title={title}
            description={description}
            accent={cover.accent}
            ink={ink}
            showDescription={cover.showDescription}
          />
        ) : null}
      </div>
    </div>
  );
}

export function ScaledCover({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / COVER_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden ${className ?? ""}`}
      style={{ aspectRatio: `${COVER_WIDTH} / ${COVER_HEIGHT}` }}
    >
      <div
        style={{
          width: COVER_WIDTH,
          height: COVER_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

type LayoutProps = {
  brand: string;
  niche: string;
  title: string;
  description: string;
  accent: string;
  ink: CoverInk;
  showDescription: boolean;
};

function CoverTexture({ dark }: { dark: boolean }) {
  const noise =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: dark
            ? `radial-gradient(ellipse at 18% 0%, rgba(255,255,255,0.10), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(255,255,255,0.06), transparent 45%), ${noise}`
            : `radial-gradient(ellipse at 18% 0%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.05), transparent 45%), ${noise}`,
          backgroundSize: "100% 100%, 100% 100%, 140px 140px",
          mixBlendMode: dark ? "soft-light" : "multiply",
          opacity: dark ? 0.55 : 0.16,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: dark
            ? "inset 0 0 180px rgba(0,0,0,0.35)"
            : "inset 0 0 160px rgba(31,36,33,0.07)",
        }}
      />
    </>
  );
}

function Eyebrow({
  brand,
  niche,
  accent,
  color,
}: {
  brand: string;
  niche: string;
  accent: string;
  color?: string;
}) {
  if (!brand && !niche) return null;
  const textColor = color ?? "currentColor";
  return (
    <div className="flex flex-wrap items-center gap-3">
      {brand ? (
        <span
          className="text-[18px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: textColor }}
        >
          {brand}
        </span>
      ) : null}
      {brand && niche ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent, opacity: 0.9 }}
        />
      ) : null}
      {niche ? (
        <span
          className="text-[16px] font-medium uppercase tracking-[0.22em]"
          style={{ color: textColor, opacity: 0.78 }}
        >
          {niche}
        </span>
      ) : null}
    </div>
  );
}

function SignatureCover({
  brand,
  niche,
  title,
  description,
  accent,
  ink,
  showDescription,
}: LayoutProps) {
  return (
    <div className="flex h-full flex-col px-[88px] py-[92px]">
      <Eyebrow brand={brand} niche={niche} accent={accent} color={ink.fg} />
      <div className="my-auto">
        <div className="mb-8 h-[3px] w-16 rounded-full" style={{ background: accent }} />
        <h1
          className="font-semibold tracking-[-0.04em]"
          style={{
            fontSize: titleSize(title, 88),
            lineHeight: 1.0,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
        {showDescription && description ? (
          <p
            className="mt-8 max-w-[640px] text-[23px] leading-[1.6]"
            style={{ color: ink.muted, ...clampLines(3) }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MinimalCover({
  brand,
  niche,
  title,
  description,
  accent,
  ink,
  showDescription,
}: LayoutProps) {
  return (
    <div className="flex h-full flex-col px-[84px] py-[90px]">
      <Eyebrow brand={brand} niche={niche} accent={accent} color={ink.fg} />
      <div className="mt-10 h-px w-full" style={{ background: ink.line }} />
      <div className="flex flex-1 flex-col justify-center">
        <h1
          className="font-semibold tracking-[-0.035em]"
          style={{
            fontSize: titleSize(title, 82),
            lineHeight: 1.02,
            ...clampLines(6),
          }}
        >
          {title}
        </h1>
      </div>
      <div className="mt-auto pt-10">
        <div className="h-px w-full" style={{ background: ink.line }} />
        {showDescription && description ? (
          <p
            className="mt-7 max-w-[660px] text-[22px] leading-[1.58]"
            style={{ color: ink.muted, ...clampLines(3) }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EditorialCover({
  brand,
  niche,
  title,
  description,
  accent,
  ink,
  showDescription,
}: LayoutProps) {
  return (
    <div className="flex h-full">
      <div
        className="h-full w-[10px] shrink-0"
        style={{ background: accent }}
      />
      <div className="flex flex-1 flex-col px-[76px] py-[88px]">
        <Eyebrow brand={brand} niche={niche} accent={accent} color={ink.fg} />
        <div className="my-auto">
          <h1
            className="font-semibold tracking-[-0.04em]"
            style={{
              fontSize: titleSize(title, 92),
              lineHeight: 0.98,
              ...clampLines(5),
            }}
          >
            {title}
          </h1>
          {showDescription && description ? (
            <p
              className="mt-8 max-w-[620px] text-[22px] leading-[1.58]"
              style={{ color: ink.muted, ...clampLines(3) }}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BoldCover({
  brand,
  niche,
  title,
  description,
  accent,
  ink,
  showDescription,
}: LayoutProps) {
  return (
    <div className="flex h-full flex-col px-[88px] py-[92px]">
      <Eyebrow brand={brand} niche={niche} accent={accent} color={ink.fg} />
      <div className="flex flex-1 flex-col justify-center">
        <h1
          className="font-bold uppercase tracking-[-0.03em]"
          style={{
            fontSize: titleSize(title, 96),
            lineHeight: 0.96,
            ...clampLines(6),
          }}
        >
          {title}
        </h1>
        <div
          className="mt-10 h-[4px] w-20 rounded-full"
          style={{ background: accent }}
        />
        {showDescription && description ? (
          <p
            className="mt-8 max-w-[620px] text-[21px] leading-[1.58]"
            style={{ color: ink.muted, ...clampLines(3) }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GradientCover({
  brand,
  niche,
  title,
  description,
  accent,
  ink,
  showDescription,
}: LayoutProps) {
  return (
    <div className="flex h-full flex-col px-[88px] py-[92px]">
      <Eyebrow brand={brand} niche={niche} accent={accent} color={ink.fg} />
      <div className="my-auto">
        <div className="mb-8 h-[3px] w-16 rounded-full" style={{ background: accent }} />
        <h1
          className="font-semibold tracking-[-0.04em]"
          style={{
            fontSize: titleSize(title, 88),
            lineHeight: 1.0,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
        {showDescription && description ? (
          <p
            className="mt-8 max-w-[640px] text-[23px] leading-[1.6]"
            style={{ color: ink.muted, ...clampLines(3) }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function titleSize(title: string, base: number): number {
  if (title.length > 130) return Math.round(base * 0.56);
  if (title.length > 100) return Math.round(base * 0.64);
  if (title.length > 80) return Math.round(base * 0.74);
  if (title.length > 60) return Math.round(base * 0.82);
  if (title.length > 40) return Math.round(base * 0.9);
  return base;
}

function clampLines(lines: number): CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}
