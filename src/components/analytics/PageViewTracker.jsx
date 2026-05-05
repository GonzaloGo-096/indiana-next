"use client";

import { usePageViewTracker } from "@/hooks/usePageViewTracker";

/**
 * Client component que dispara page_view + scroll_depth.
 * DEBE montarse dentro de <Suspense fallback={null}> en el árbol cliente
 * (useSearchParams suspende en prerender).
 */
export default function PageViewTracker() {
  usePageViewTracker();
  return null;
}
