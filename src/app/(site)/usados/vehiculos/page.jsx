/**
 * /usados/vehiculos - Página de lista de vehículos usados (Server Component)
 * 
 * ✅ ARQUITECTURA:
 * - Server Component: fetch inicial con searchParams
 * - Pasa datos a VehiculosClient para interactividad
 * - URL es la fuente de verdad para filtros
 * - Estructura idéntica a React
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { vehiclesService } from "@/lib/services/vehiclesApi.server";
import { mapVehiclesPage } from "@/lib/mappers/vehicleMapper";
import { parseFilters } from "@/utils/filters";
import { getSiteUrl, tryAbsoluteUrl } from "@/lib/site-url";
import { buildVehicleDetailUrl } from "@/utils/vehicleSlug";
import { createLogger } from "@/lib/logger";
import { LIST_ERROR_MESSAGE, VEHICLE_CONSTANTS } from "@/constants/vehicles";
import { vendidosAlFinal } from "@/utils/vehicleEstado";
import VehiculosClient from "./VehiculosClient";
import { serializeJsonLd } from "@/lib/seo/jsonLd";

const log = createLogger("usados:listado");

/**
 * Metadata dinámica para SEO
 */
/**
 * Filtros indexables para SEO (permitidos en canonical)
 * Estos filtros son valiosos para indexación y pueden estar en el canonical
 */
const INDEXABLE_PARAMS = [
  "marca",
  "modelo",
  "anio",
  "anioDesde",
  "anioHasta",
  "combustible",
  "transmision",
  "caja",
  "precioDesde",
  "precioHasta",
];

/**
 * Filtros NO indexables (no deben ir en canonical)
 * Estos parámetros indican ordenamiento, paginación, o UX y no deben indexarse
 */
const NON_INDEXABLE_PARAMS = [
  "page",
  "pagina",
  "sort",
  "order",
  "orden",
  "view",
  "layout",
];

/**
 * Extraer solo parámetros indexables de searchParams
 * 
 * ✅ SEO: Solo incluir filtros "valiosos" en canonical (marca, modelo, año, etc.)
 * ✅ Orden alfabético estable para URLs consistentes
 * ✅ Sanitizar valores (trim, ignorar vacíos, no duplicados)
 */
function pickIndexableParams(searchParams) {
  if (!searchParams || typeof searchParams !== "object") {
    return {};
  }

  const indexable = {};
  const keysSorted = Object.keys(searchParams).filter((key) =>
    INDEXABLE_PARAMS.includes(key)
  ).sort(); // Orden alfabético estable

  for (const key of keysSorted) {
    const value = searchParams[key];
    if (value === null || value === undefined) continue;

    // Normalizar: convertir arrays a strings, trim valores
    let normalizedValue = "";
    if (Array.isArray(value)) {
      // Si hay múltiples, tomar el primero (no incluir arrays múltiples)
      normalizedValue = String(value[0] || "").trim();
    } else {
      normalizedValue = String(value).trim();
    }

    // Ignorar valores vacíos
    if (!normalizedValue) continue;

    indexable[key] = normalizedValue;
  }

  return indexable;
}

/**
 * Verificar si hay parámetros no-indexables en searchParams
 * 
 * ✅ SEO: Si hay page/sort/etc, usar noindex para evitar indexar URLs temporales
 */
function hasNonIndexableParams(searchParams) {
  if (!searchParams || typeof searchParams !== "object") {
    return false;
  }

  const allKeys = Object.keys(searchParams);

  // Verificar parámetros conocidos no-indexables
  if (allKeys.some((key) => NON_INDEXABLE_PARAMS.includes(key))) {
    return true;
  }

  // Verificar parámetros desconocidos (no están en INDEXABLE ni NON_INDEXABLE)
  const unknownKeys = allKeys.filter(
    (key) => !INDEXABLE_PARAMS.includes(key) && !NON_INDEXABLE_PARAMS.includes(key)
  );

  return unknownKeys.length > 0;
}

/**
 * Construir URL canonical con solo parámetros indexables
 * 
 * ✅ SEO: Canonical debe ser URL absoluta y solo incluir filtros valiosos
 * ✅ Orden alfabético estable de query params
 */
function buildCanonicalUrl(searchParams) {
  const indexableParams = pickIndexableParams(searchParams);
  const hasIndexable = Object.keys(indexableParams).length > 0;

  if (!hasIndexable) {
    return (
      tryAbsoluteUrl("/usados/vehiculos") ?? "/usados/vehiculos"
    );
  }

  const params = new URLSearchParams();
  const keysSorted = Object.keys(indexableParams).sort();

  for (const key of keysSorted) {
    params.set(key, indexableParams[key]);
  }

  const queryString = params.toString();
  const path = `/usados/vehiculos?${queryString}`;
  return tryAbsoluteUrl(path) ?? path;
}

/**
 * Helper para generar Structured Data (JSON-LD) del listado de vehículos
 * Usa Schema.org ItemList
 */
function getVehiclesListJsonLd(vehicles) {
  if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
    return null;
  }

  let siteBase;
  try {
    siteBase = getSiteUrl();
  } catch (error) {
    // Sin base no se puede armar el JSON-LD. Degradar es correcto, pero en
    // silencio significaba perder structured data en produccion sin senal.
    log.warn("Sin site URL: se omite el JSON-LD del listado.", error?.message || error);
    return null;
  }

  const toAbs = (path) => {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${siteBase}${p}`;
  };

  const itemListElement = vehicles.map((vehicle, index) => {
    const vehicleName = vehicle.marca && vehicle.modelo
      ? `${vehicle.marca} ${vehicle.modelo}`
      : vehicle.marca || vehicle.modelo || "Vehículo usado";
    const vehicleYear = vehicle.anio ? ` ${vehicle.anio}` : "";

    const detailPath = (() => {
      try {
        return buildVehicleDetailUrl(vehicle);
      } catch {
        return `/usados/${vehicle.id || ""}`;
      }
    })();

    return {
      "@type": "ListItem",
      position: index + 1,
      url: toAbs(detailPath),
      name: `${vehicleName}${vehicleYear}`,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catálogo de Vehículos Usados Multimarca",
    itemListElement,
    numberOfItems: itemListElement.length,
  };
}

export async function generateMetadata({ searchParams }) {
  try {
    const resolvedSearchParams = await searchParams;
    const filters = parseFilters(resolvedSearchParams || {});
    const hasFilters = Object.keys(filters).length > 0;

    const canonicalUrl = buildCanonicalUrl(resolvedSearchParams || {});

    const hasNonIndexable = hasNonIndexableParams(resolvedSearchParams || {});

    const title = hasFilters
      ? "Vehículos Usados Filtrados"
      : "Vehículos Usados Multimarca";
    const description = hasFilters
      ? "Encontrá el vehículo usado que buscás con nuestros filtros. Consultá disponibilidad y contacto comercial con Peugeot Indiana."
      : "Explorá vehículos usados multimarca en Tucumán. Consultá disponibilidad, características y contacto comercial con Peugeot Indiana.";

    const robots = hasNonIndexable
      ? { index: false, follow: true }
      : undefined;

    const ogImage =
      tryAbsoluteUrl(
        "/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"
      ) ?? null;

    return {
      title,
      description,
      robots,
      openGraph: {
        title: `${title} | Peugeot Indiana`,
        description,
        url: canonicalUrl,
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: ogImage
          ? [
              {
                url: ogImage,
                alt: `${title} - Peugeot Indiana`,
                width: 1200,
                height: 630,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Peugeot Indiana`,
        description,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (err) {
    unstable_rethrow(err);
    log.error("generateMetadata falló, usando fallback:", err?.message || err);
    return {
      title: "Vehículos Usados Multimarca",
      description:
        "Explorá vehículos usados multimarca en Tucumán. Peugeot Indiana.",
      alternates: { canonical: "/usados/vehiculos" },
    };
  }
}

/**
 * No usar force-dynamic: obligaba a renderizar cada request en Vercel (TTFB alto y sensación de lag).
 * Esta ruta ya es dinámica por searchParams. Los autos se piden sin caché de Next
 * ('no-store' en vehiclesApi.server): el caché de esos datos es del backend.
 */

/**
 * Página principal de vehículos
 * 
 * @param {Object} props
 * @param {Object} props.searchParams - Parámetros de URL (Next.js)
 */
export default async function VehiculosPage({ searchParams }) {
  // ✅ IMPORTANTE: En Next.js 15+, searchParams es una Promise
  const resolvedSearchParams = await searchParams;

  try {
    // Parsear filtros desde URL (única fuente de verdad).
    // ⚠️ NO mergear con FILTER_DEFAULTS acá: agregar precio/km al filtro hace
    // que `buildSearchParams` los mande al backend (con includeDefaultRanges:true)
    // y el backend filtra autos que no tengan esos campos o estén fuera del rango.
    // Si el usuario no filtró explícitamente, dejamos los filtros "ralos" para
    // que el servicio (mergeDefaults:false por default) no los inyecte.
    const filters = parseFilters(resolvedSearchParams || {});

    // Todos los autos que cumplen el filtro en un solo pedido: la paginación
    // es en pantalla (useVehiclesList), para que los vendidos queden al final
    // de todo el listado. Ver LIST_FETCH_LIMIT.
    const backendData = await vehiclesService.getVehicles({
      filters,
      limit: VEHICLE_CONSTANTS.LIST_FETCH_LIMIT,
      cursor: 1,
    });
    const mappedData = mapVehiclesPage(backendData, 1);
    if (mappedData.hasNextPage) {
      log.warn(
        `El inventario filtrado supera ${VEHICLE_CONSTANTS.LIST_FETCH_LIMIT} autos: ` +
          "los vendidos quedan al final solo de lo recibido.",
      );
    }

    let jsonLdHtml = null;
    try {
      const jsonLd = getVehiclesListJsonLd(vendidosAlFinal(mappedData.vehicles || []));
      if (jsonLd) {
        jsonLdHtml = serializeJsonLd(jsonLd);
      }
    } catch (jsonErr) {
      log.error("JSON-LD omitido:", jsonErr?.message || jsonErr);
    }

    return (
      <>
        {jsonLdHtml ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
          />
        ) : null}
        {/* ✅ Suspense boundary para useSearchParams() */}
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] w-full items-center justify-center px-4 text-center text-sm text-neutral-600">
              Cargando…
            </div>
          }
        >
          <VehiculosClient
            initialData={mappedData}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    unstable_rethrow(error);
    // Cualquier falla (backend, red, timeout, respuesta inválida) se muestra
    // igual: el listado con su pantalla de error y "Reintentar". Nunca
    // notFound(): la ruta /usados/vehiculos existe aunque el backend falle, y
    // un 404 con noindex la sacaría de Google. El detalle queda en el log.
    log.error("Error renderizando el listado:", error?.message || error);
    return (
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] w-full items-center justify-center px-4 text-center text-sm text-neutral-600">
            Cargando…
          </div>
        }
      >
        <VehiculosClient
          initialData={{
            vehicles: [],
            total: 0,
            hasNextPage: false,
            nextPage: null,
          }}
          error={LIST_ERROR_MESSAGE}
        />
      </Suspense>
    );
  }
}

