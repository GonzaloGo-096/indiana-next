"use client";

/**
 * Hook de tracking. Azúcar tipado sobre pushDataLayer.
 * No mantiene estado: solo expone helpers estables vía useCallback.
 *
 * Convención de naming:
 * - **API JS**: camelCase (`componentId`).
 * - **Payload final al dataLayer**: snake_case (`component_id`).
 * La transformación ocurre acá, en un solo lugar. Para backwards-compat,
 * los métodos también aceptan `component_id` (snake_case) directo.
 *
 * Uso típico:
 *   const a = useAnalytics();
 *   a.track(EVENTS.CTA_CLICK, { source, location, component_id, label });
 *   a.trackLead({ leadSource: LEAD_SOURCES.WHATSAPP, source, location, componentId, item });
 */

import { useCallback, useRef } from "react";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { EVENTS, LEAD_SOURCES } from "@/lib/analytics/events";

/** componentId (camelCase) → component_id (snake_case), con fallback. */
function pickComponentId(params) {
  if (!params) return undefined;
  return params.componentId ?? params.component_id;
}

export function useAnalytics() {
  // Dedupe de form_start: una sola vez por formId mientras viva el componente.
  const formStartedRef = useRef(new Set());

  const track = useCallback((event, params = {}) => {
    pushDataLayer(event, params);
  }, []);

  const trackItemView = useCallback((itemParams, extra = {}) => {
    if (!itemParams) return;
    pushDataLayer(EVENTS.VIEW_ITEM, { ...itemParams, ...extra });
  }, []);

  const trackItemSelect = useCallback((itemParams, opts = {}) => {
    if (!itemParams) return;
    const { source, location, index } = opts;
    pushDataLayer(EVENTS.SELECT_ITEM, {
      ...itemParams,
      source,
      location,
      component_id: pickComponentId(opts),
      ...(typeof index === "number" ? { index } : {}),
    });
  }, []);

  const trackItemList = useCallback((items, { itemListName, location } = {}) => {
    if (!Array.isArray(items)) return;
    const normalized = items
      .filter(Boolean)
      .slice(0, 10)
      .map((it) => ({ ...it, item_list_name: it.item_list_name || itemListName }));
    pushDataLayer(EVENTS.VIEW_ITEM_LIST, {
      item_list_name: itemListName,
      items: normalized,
      location,
    });
  }, []);

  const trackSearch = useCallback((opts = {}) => {
    const { filters, resultsCount, location } = opts;
    const component_id = pickComponentId(opts);
    pushDataLayer(EVENTS.FILTER_APPLIED, {
      ...filters,
      location,
      component_id,
    });
    pushDataLayer(EVENTS.VIEW_SEARCH_RESULTS, {
      ...filters,
      results_count: typeof resultsCount === "number" ? resultsCount : null,
      location,
      component_id,
    });
  }, []);

  const trackLead = useCallback((opts = {}) => {
    const { leadSource, source, location, item, value } = opts;
    pushDataLayer(EVENTS.GENERATE_LEAD, {
      lead_source: leadSource || LEAD_SOURCES.WHATSAPP,
      source,
      location,
      component_id: pickComponentId(opts),
      ...(item || {}),
      ...(typeof value === "number" ? { value, currency: "ARS" } : {}),
    });
  }, []);

  const trackFormStart = useCallback((formId, { location } = {}) => {
    if (!formId) return;
    if (formStartedRef.current.has(formId)) return;
    formStartedRef.current.add(formId);
    pushDataLayer(EVENTS.FORM_START, { form_id: formId, location });
  }, []);

  const trackFormSubmit = useCallback(
    (formId, { location, success = true, ...safeMeta } = {}) => {
      if (!formId) return;
      pushDataLayer(EVENTS.FORM_SUBMIT, {
        form_id: formId,
        location,
        success,
        ...safeMeta,
      });
    },
    [],
  );

  const trackCta = useCallback((opts = {}) => {
    const { source, location, label, target_path, variant } = opts;
    pushDataLayer(EVENTS.CTA_CLICK, {
      source,
      location,
      component_id: pickComponentId(opts),
      label,
      target_path,
      cta_variant: variant,
    });
  }, []);

  return {
    track,
    trackItemView,
    trackItemSelect,
    trackItemList,
    trackSearch,
    trackLead,
    trackFormStart,
    trackFormSubmit,
    trackCta,
  };
}
