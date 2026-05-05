"use client";

/**
 * Dispara `page_view` al dataLayer en cada cambio de ruta del App Router.
 * Next App Router NO emite page_view automáticamente al navegar SPA — este hook lo cubre.
 *
 * También dispara `scroll_depth` a 25/50/75/90% una vez por pathname.
 *
 * Requiere ser usado dentro de un componente envuelto en <Suspense> porque
 * useSearchParams suspende durante prerender.
 */

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

const SCROLL_THRESHOLDS = [25, 50, 75, 90];

export function usePageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = searchParams ? searchParams.toString() : "";
    const fullKey = `${pathname}?${search}`;
    if (lastTrackedRef.current === fullKey) return;
    lastTrackedRef.current = fullKey;

    pushDataLayer(EVENTS.PAGE_VIEW, {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      page_search: search,
    });
  }, [pathname, searchParams]);

  // Scroll depth: reset por pathname, dispara una vez por threshold.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fired = new Set();
    let frame = 0;

    const compute = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.min(100, (window.scrollY / scrollable) * 100);
      for (const t of SCROLL_THRESHOLDS) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          pushDataLayer(EVENTS.SCROLL_DEPTH, {
            percent: t,
            page_path: pathname,
          });
        }
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(compute);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);
}
