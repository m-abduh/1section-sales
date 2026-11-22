"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function isAdminContext(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host.startsWith("admin.");
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function isSameSiteHost(targetHost: string, currentHost: string): boolean {
  const th = targetHost.toLowerCase();
  const ch = currentHost.toLowerCase();
  if (th === ch) return true;
  for (const b of ["localhost", "lvh.me"]) {
    if ((th === b || th.endsWith(`.${b}`)) && (ch === b || ch.endsWith(`.${b}`))) return true;
  }
  const t = th.split(".");
  const c = ch.split(".");
  if (t.length >= 2 && c.length >= 2 && t.slice(-2).join(".") === c.slice(-2).join(".")) return true;
  return false;
}

function shouldHandleLink(anchor: HTMLAnchorElement, event: MouseEvent): boolean {
  if (isModifiedClick(event)) return false;
  if (anchor.hasAttribute("download")) return false;
  const target = anchor.getAttribute("target");
  if (target && target.toLowerCase() === "_blank") return false;
  if (anchor.getAttribute("aria-disabled") === "true") return false;
  if (anchor.dataset.noLoading !== undefined || anchor.closest("[data-no-loading]")) return false;
  const hrefAttr = anchor.getAttribute("href");
  if (!hrefAttr || hrefAttr.startsWith("#") || hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:") || hrefAttr.startsWith("javascript:")) return false;
  try {
    const url = new URL(anchor.href, window.location.href);
    const cur = new URL(window.location.href);
    if (!isSameSiteHost(url.hostname, cur.hostname)) return false;
    if (url.origin === cur.origin && url.pathname === cur.pathname && url.search === cur.search) return false;
  } catch {
    return false;
  }
  return true;
}

function shouldHandleButton(button: HTMLButtonElement | HTMLInputElement, event: MouseEvent): boolean {
  if (isModifiedClick(event)) return false;
  if (button.disabled) return false;
  if (button.getAttribute("aria-disabled") === "true") return false;
  if (button.dataset.noLoading !== undefined || button.closest("[data-no-loading]")) return false;
  if (button.dataset.loadingActive === "1") return false;
  return true;
}

function createSpinner(): HTMLSpanElement {
  const wrap = document.createElement("span");
  wrap.setAttribute("data-auto-spinner", "1");
  wrap.className = "inline-flex shrink-0 items-center justify-center";
  wrap.innerHTML = '<svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';
  return wrap;
}

function isSubmitControl(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement) return el.type === "submit";
  if (el instanceof HTMLButtonElement) return el.type !== "button" && el.type !== "reset";
  return false;
}

function applyLoading(el: HTMLElement, revertAfter?: number) {
  if (el.dataset.loadingActive === "1") return;
  const submit = isSubmitControl(el);
  el.dataset.loadingActive = "1";
  el.setAttribute("aria-busy", "true");
  if (!submit) {
    el.setAttribute("aria-disabled", "true");
    el.classList.add("pointer-events-none", "opacity-70");
    if ((el instanceof HTMLButtonElement || el instanceof HTMLInputElement) && !el.disabled) {
      el.dataset.autoDisabled = "1";
      el.disabled = true;
    }
  }
  if (!(el instanceof HTMLInputElement) && !el.querySelector('[data-auto-spinner="1"]')) {
    const spinner = createSpinner();
    if (el.firstChild) el.insertBefore(spinner, el.firstChild);
    else el.appendChild(spinner);
  }
  if (revertAfter && revertAfter > 0) {
    window.setTimeout(() => {
      if (!el.isConnected || el.dataset.loadingActive !== "1") return;
      el.dataset.loadingActive = "0";
      el.removeAttribute("aria-busy");
      el.removeAttribute("aria-disabled");
      el.classList.remove("pointer-events-none", "opacity-70");
      if ((el instanceof HTMLButtonElement || el instanceof HTMLInputElement) && el.dataset.autoDisabled === "1") {
        el.disabled = false;
        delete el.dataset.autoDisabled;
      }
      el.querySelectorAll('[data-auto-spinner="1"]').forEach((n) => n.remove());
    }, revertAfter);
  }
}

export function InteractionLoadingEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    if (isAdminContext(pathname)) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as Element | null;
      if (!target) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (anchor) {
        if (shouldHandleLink(anchor, event)) {
          applyLoading(anchor);
        }
        return;
      }

      const button = target.closest('button, input[type="submit"], input[type="button"], [role="button"]') as HTMLElement | null;
      if (button) {
        if (button instanceof HTMLButtonElement || button instanceof HTMLInputElement) {
          if (!shouldHandleButton(button, event)) return;
        } else {
          if (button.getAttribute("aria-disabled") === "true" || button.dataset.noLoading !== undefined) return;
        }
        // Revert after delay for non-navigating actions; navigations will unmount
        applyLoading(button, 4000);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}