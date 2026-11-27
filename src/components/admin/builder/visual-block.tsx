"use client";

import { useMemo } from "react";
import type { EbookVisualSpec } from "@/lib/ebook/visual";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseNumeric(value?: string) {
  if (!value) return null;
  const m = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function VisualBlockSvg({
  spec,
  width = 960,
}: {
  spec: EbookVisualSpec;
  width?: number;
}) {
  const h = 280;
  const pad = 28;
  const accent = "#3B82F6";
  const bg = "#F8FAFC";
  const border = "#E2E8F0";
  const ink = "#0F172A";
  const muted = "#64748B";
  const items = spec.items.slice(0, 6);

  return (
    <svg
      viewBox={`0 0 ${width} ${h}`}
      width="100%"
      height={h}
      role="img"
      aria-label={spec.title}
      style={{ display: "block", maxWidth: "100%", height: "auto" }}
    >
      <rect x="0" y="0" width={width} height={h} rx="20" fill={bg} />
      <rect x="0.5" y="0.5" width={width - 1} height={h - 1} rx="20" fill="none" stroke={border} />
      <text x={pad} y={42} fill={ink} fontSize="24" fontWeight="700" fontFamily="Arial, sans-serif">
        {spec.title.slice(0, 70)}
      </text>
      {spec.subtitle ? (
        <text x={pad} y={66} fill={muted} fontSize="14" fontFamily="Arial, sans-serif">
          {spec.subtitle.slice(0, 100)}
        </text>
      ) : null}

      {spec.type === "key-points" ? <KeyPoints items={items} width={width} pad={pad} accent={accent} ink={ink} muted={muted} /> : null}
      {spec.type === "stat-row" ? <StatRow items={items} width={width} pad={pad} accent={accent} ink={ink} muted={muted} /> : null}
      {spec.type === "process" ? <Process items={items} width={width} pad={pad} accent={accent} ink={ink} muted={muted} /> : null}
      {spec.type === "comparison" ? <Comparison items={items} width={width} pad={pad} accent={accent} ink={ink} muted={muted} /> : null}
      {spec.type === "bar-chart" ? <BarChart items={items} width={width} pad={pad} accent={accent} ink={ink} muted={muted} /> : null}
    </svg>
  );
}

function KeyPoints({ items, width, pad, accent, ink, muted }: any) {
  const top = 92;
  const gap = 14;
  const cols = Math.max(1, Math.min(items.length, 3));
  const cardW = (width - pad * 2 - gap * (cols - 1)) / cols;
  return (
    <g>
      {items.slice(0, cols).map((it: any, i: number) => {
        const x = pad + i * (cardW + gap);
        return (
          <g key={i}>
            <rect x={x} y={top} width={cardW} height={150} rx="14" fill="#FFFFFF" stroke="#E2E8F0" />
            <circle cx={x + 22} cy={top + 28} r="14" fill={accent} opacity="0.12" />
            <text x={x + 22} y={top + 33} textAnchor="middle" fill={accent} fontSize="12" fontWeight="700" fontFamily="Arial, sans-serif">{i + 1}</text>
            <text x={x + 44} y={top + 33} fill={ink} fontSize="15" fontWeight="700" fontFamily="Arial, sans-serif">{it.label.slice(0, 26)}</text>
            <text x={x + 18} y={top + 64} fill={muted} fontSize="12" fontFamily="Arial, sans-serif">{(it.value || "").slice(0, 38)}</text>
            <text x={x + 18} y={top + 88} fill={muted} fontSize="12" fontFamily="Arial, sans-serif">{(it.detail || "").slice(0, 42)}</text>
            <text x={x + 18} y={top + 112} fill={muted} fontSize="12" fontFamily="Arial, sans-serif">{(it.detail && it.detail.length > 42 ? it.detail.slice(42, 84) : "").slice(0, 42)}</text>
          </g>
        );
      })}
    </g>
  );
}

function StatRow({ items, width, pad, accent, ink, muted }: any) {
  const top = 96;
  const gap = 16;
  const cols = Math.max(1, Math.min(items.length, 4));
  const cardW = (width - pad * 2 - gap * (cols - 1)) / cols;
  return (
    <g>
      {items.slice(0, cols).map((it: any, i: number) => {
        const x = pad + i * (cardW + gap);
        return (
          <g key={i}>
            <rect x={x} y={top} width={cardW} height={150} rx="14" fill="#FFFFFF" stroke="#E2E8F0" />
            <text x={x + 18} y={top + 44} fill={accent} fontSize="34" fontWeight="700" fontFamily="Arial, sans-serif">
              {(it.value || `${i + 1}`).slice(0, 10)}
            </text>
            <text x={x + 18} y={top + 74} fill={ink} fontSize="16" fontWeight="700" fontFamily="Arial, sans-serif">
              {it.label.slice(0, 28)}
            </text>
            <text x={x + 18} y={top + 100} fill={muted} fontSize="13" fontFamily="Arial, sans-serif">
              {(it.detail || "").slice(0, 40)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Process({ items, width, pad, accent, ink, muted }: any) {
  const top = 150;
  const count = Math.max(1, Math.min(items.length, 5));
  const usable = width - pad * 2;
  const step = usable / count;
  return (
    <g>
      <line x1={pad + 20} y1={top} x2={width - pad - 20} y2={top} stroke="#CBD5E1" strokeWidth="4" />
      {items.slice(0, count).map((it: any, i: number) => {
        const x = pad + step * i + step / 2;
        return (
          <g key={i}>
            <circle cx={x} cy={top} r="22" fill={accent} />
            <text x={x} y={top + 5} textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">
              {i + 1}
            </text>
            <text x={x} y={top + 52} textAnchor="middle" fill={ink} fontSize="13" fontWeight="700" fontFamily="Arial, sans-serif">
              {it.label.slice(0, 16)}
            </text>
            <text x={x} y={top + 72} textAnchor="middle" fill={muted} fontSize="11" fontFamily="Arial, sans-serif">
              {(it.value || it.detail || "").slice(0, 20)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Comparison({ items, width, pad, accent, ink, muted }: any) {
  const top = 96;
  const gap = 16;
  const cols = Math.max(2, Math.min(items.length, 3));
  const cardW = (width - pad * 2 - gap * (cols - 1)) / cols;
  const shown = items.slice(0, cols);
  return (
    <g>
      {shown.map((it: any, i: number) => {
        const x = pad + i * (cardW + gap);
        return (
          <g key={i}>
            <rect x={x} y={top} width={cardW} height={150} rx="14" fill={i === 0 ? "#EFF6FF" : "#FFFFFF"} stroke={i === 0 ? accent : "#E2E8F0"} />
            <text x={x + 18} y={top + 34} fill={i === 0 ? accent : muted} fontSize="12" fontWeight="700" fontFamily="Arial, sans-serif">
              {(it.value || `Option ${i + 1}`).slice(0, 24)}
            </text>
            <text x={x + 18} y={top + 64} fill={ink} fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif">
              {it.label.slice(0, 28)}
            </text>
            <text x={x + 18} y={top + 92} fill={muted} fontSize="12" fontFamily="Arial, sans-serif">
              {(it.detail || "").slice(0, 40)}
            </text>
            <text x={x + 18} y={top + 114} fill={muted} fontSize="12" fontFamily="Arial, sans-serif">
              {(it.detail && it.detail.length > 40 ? it.detail.slice(40, 80) : "").slice(0, 40)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function BarChart({ items, width, pad, accent, ink, muted }: any) {
  const top = 100;
  const chartH = 130;
  const baseY = top + chartH;
  const vals = items.slice(0, 5).map((it: any, i: number) => {
    const n = parseNumeric(it.value);
    return { ...it, n: n ?? (items.length - i) * 10 };
  });
  const max = Math.max(1, ...vals.map((v: any) => v.n));
  const gap = 20;
  const barW = (width - pad * 2 - gap * (vals.length - 1)) / Math.max(1, vals.length);
  return (
    <g>
      <line x1={pad} y1={baseY} x2={width - pad} y2={baseY} stroke="#CBD5E1" />
      {vals.map((it: any, i: number) => {
        const bh = clamp((it.n / max) * chartH, 8, chartH);
        const x = pad + i * (barW + gap);
        const y = baseY - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="10" fill={i % 2 === 0 ? accent : "#93C5FD"} />
            <text x={x + barW / 2} y={y - 8} textAnchor="middle" fill={ink} fontSize="12" fontWeight="700" fontFamily="Arial, sans-serif">
              {(it.value || String(it.n)).slice(0, 8)}
            </text>
            <text x={x + barW / 2} y={baseY + 24} textAnchor="middle" fill={muted} fontSize="12" fontFamily="Arial, sans-serif">
              {it.label.slice(0, 14)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
