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

/**
 * Reusable A5 cover. The same component is used for the builder preview, the
 * template thumbnails, and the off-screen node that is rasterised into a
 * Cloudinary image for PDF/DOCX exports.
 */
export function EbookCoverDesign({
  content,
  cover,
}: {
  content: EbookContent;
  cover: EbookCover;
}) {
  const ink = readableInk(cover.background);
  const brand = content.brand.trim() || "1section";
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
                "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0.82) 100%)",
            }}
          />
        </>
      ) : null}

      <div className="relative flex h-full flex-col">
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
        {cover.template === "photo" ? (
          <PhotoCover
            brand={brand}
            niche={niche}
            title={title}
            description={description}
            accent={cover.accent}
            showDescription={cover.showDescription}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Scales the fixed-size cover down to whatever width the wrapper has. */
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

function MinimalCover({
  brand,
  niche,
  title,
  description,
  ink,
  showDescription,
}: LayoutProps) {
  return (
    <div className="flex h-full flex-col px-[76px] py-[78px]">
      <div className="text-center text-[19px] font-bold uppercase tracking-[0.24em]">
        {brand}
        {niche ? ` · ${niche}` : ""}
      </div>
      <div className="mt-7 h-px w-full" style={{ background: ink.line }} />

      <div className="flex flex-1 flex-col justify-center py-10">
        <h1
          className="font-bold tracking-[-0.03em]"
          style={{
            fontSize: titleSize(title, 74),
            lineHeight: 1.03,
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
            className="mt-7 text-[23px] leading-[1.55]"
            style={{ color: ink.muted, ...clampLines(4) }}
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
    <div className="flex h-full flex-col px-[76px] py-[78px]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p
            className="text-[13px] font-bold uppercase tracking-[0.24em]"
            style={{ color: accent }}
          >
            {brand}
          </p>
          <p
            className="mt-2 text-[13px] uppercase tracking-[0.18em]"
            style={{ color: ink.muted }}
          >
            {niche}
          </p>
        </div>
      </div>

      <div className="my-auto py-12">
        <div className="mb-8 h-[6px] w-24" style={{ background: accent }} />
        <h1
          className="font-bold tracking-[-0.035em]"
          style={{
            fontSize: titleSize(title, 84),
            lineHeight: 1.02,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
      </div>

      {showDescription && description ? (
        <p
          className="max-w-[640px] text-[22px] leading-[1.55]"
          style={{ color: ink.muted, ...clampLines(3) }}
        >
          {description}
        </p>
      ) : null}
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
    <div className="flex h-full flex-col items-center px-[70px] py-[84px] text-center">
      <div
        className="text-[14px] font-bold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        {brand}
      </div>

      <h1
        className="my-auto font-bold uppercase tracking-[-0.02em]"
        style={{
          fontSize: titleSize(title, 92),
          lineHeight: 0.98,
          ...clampLines(6),
        }}
      >
        {title}
      </h1>

      {showDescription && description ? (
        <p
          className="max-w-[620px] text-[21px] leading-[1.55]"
          style={{ color: ink.muted, ...clampLines(3) }}
        >
          {description}
        </p>
      ) : null}

      <div
        className="mt-8 text-[12px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: ink.muted }}
      >
        {niche}
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
    <div className="flex h-full flex-col px-[76px] py-[78px]">
      <div className="flex items-center justify-between gap-6">
        <span className="text-[13px] font-bold uppercase tracking-[0.26em]">
          {brand}
        </span>
        <span
          className="text-[12px] uppercase tracking-[0.2em]"
          style={{ color: ink.muted }}
        >
          {niche}
        </span>
      </div>

      <div className="my-auto">
        <h1
          className="font-bold tracking-[-0.03em]"
          style={{
            fontSize: titleSize(title, 80),
            lineHeight: 1.03,
            ...clampLines(6),
          }}
        >
          {title}
        </h1>
        {showDescription && description ? (
          <p
            className="mt-8 max-w-[620px] text-[22px] leading-[1.55]"
            style={{ color: ink.muted, ...clampLines(3) }}
          >
            {description}
          </p>
        ) : null}
      </div>

      <div className="h-[5px] w-28 rounded-full" style={{ background: accent }} />
    </div>
  );
}

function PhotoCover({
  brand,
  niche,
  title,
  description,
  accent,
  showDescription,
}: Omit<LayoutProps, "ink">) {
  return (
    <div className="flex h-full flex-col px-[76px] py-[78px] text-white">
      <div className="flex items-center justify-between gap-6">
        <span className="text-[13px] font-bold uppercase tracking-[0.26em]">
          {brand}
        </span>
      </div>

      <div className="mt-auto">
        <div
          className="mb-6 h-[5px] w-24 rounded-full"
          style={{ background: accent }}
        />
        <h1
          className="font-bold tracking-[-0.03em]"
          style={{
            fontSize: titleSize(title, 82),
            lineHeight: 1.02,
            ...clampLines(5),
          }}
        >
          {title}
        </h1>
        {showDescription && description ? (
          <p
            className="mt-7 max-w-[640px] text-[21px] leading-[1.55] text-white/80"
            style={clampLines(3)}
          >
            {description}
          </p>
        ) : null}
        <div className="mt-8 text-[12px] font-semibold uppercase tracking-[0.24em] text-white/70">
          {niche}
        </div>
      </div>
    </div>
  );
}

function titleSize(title: string, base: number): number {
  if (title.length > 110) return Math.round(base * 0.58);
  if (title.length > 80) return Math.round(base * 0.68);
  if (title.length > 55) return Math.round(base * 0.8);
  if (title.length > 36) return Math.round(base * 0.9);
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
