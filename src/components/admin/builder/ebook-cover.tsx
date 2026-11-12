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
                "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.18) 32%, rgba(0,0,0,0.8) 100%)",
            }}
          />
        </>
      ) : null}

      <CoverTexture dark={ink.fg === "#FFFFFF"} image={Boolean(imageUrl)} />

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

function CoverTexture({ dark, image }: { dark: boolean; image: boolean }) {
  const noise =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")";

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: noise,
        backgroundSize: "180px 180px",
        opacity: image ? 0.08 : dark ? 0.18 : 0.12,
        mixBlendMode: dark ? "soft-light" : "multiply",
      }}
    />
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
        <div className="mb-7 flex items-center gap-3">
          <span className="h-[3px] w-14 rounded-full" style={{ background: accent }} />
          <span className="h-px flex-1" style={{ background: ink.line }} />
        </div>
        <h1
          className="font-semibold tracking-[-0.045em]"
          style={{
            fontSize: titleSize(title, 90),
            lineHeight: 1.12,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
      </div>
      <div>
        {showDescription && description ? (
          <p
            className="max-w-[660px] text-[22px] font-light leading-[1.65]"
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
    <div className="flex h-full flex-col px-[92px] py-[96px]">
      <Eyebrow brand={brand} niche={niche} accent={accent} color={ink.fg} />
      <div className="my-auto">
        <div className="mb-10 h-px w-20" style={{ background: ink.line }} />
        <h1
          className="font-light tracking-[-0.02em]"
          style={{
            fontSize: titleSize(title, 82),
            lineHeight: 1.18,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
      </div>
      <div>
        {showDescription && description ? (
          <p
            className="max-w-[620px] text-[20px] italic leading-[1.7]"
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
    <div className="flex h-full flex-col px-[88px] py-[92px]">
      <Eyebrow brand={brand} niche={niche} accent={accent} color={ink.fg} />
      <div className="my-auto">
        <div className="mb-7 h-px w-14" style={{ background: accent }} />
          <h1
            className="font-semibold tracking-[-0.03em]"
            style={{
              fontSize: titleSize(title, 88),
              lineHeight: 1.15,
              ...clampLines(5),
            }}
          >
          {title}
        </h1>
        <div className="mt-7 h-px w-28" style={{ background: ink.line }} />
      </div>
      <div>
        {showDescription && description ? (
          <p
            className="max-w-[640px] text-[21px] leading-[1.65]"
            style={{ color: ink.muted, ...clampLines(3) }}
          >
            {description}
          </p>
        ) : null}
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
      <div className="my-auto">
        <h1
          className="font-extrabold uppercase tracking-[-0.02em]"
          style={{
            fontSize: titleSize(title, 96),
            lineHeight: 1.08,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
        <div className="mt-8 h-[4px] w-24 rounded-full" style={{ background: accent }} />
      </div>
      <div>
        {showDescription && description ? (
          <p
            className="max-w-[640px] text-[20px] font-medium uppercase tracking-[0.04em] leading-[1.6]"
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
        <h1
          className="font-medium tracking-[-0.015em]"
          style={{
            fontSize: titleSize(title, 86),
            lineHeight: 1.15,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
      </div>
      <div>
        {showDescription && description ? (
          <>
            <div className="mb-5 h-px w-full max-w-[420px]" style={{ background: ink.line }} />
            <p
              className="max-w-[660px] text-[21px] leading-[1.7]"
              style={{ color: ink.muted, ...clampLines(3) }}
            >
              {description}
            </p>
          </>
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
