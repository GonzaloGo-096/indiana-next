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

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { vehiclesService } from "../../../../lib/services/vehiclesApi.server";
import { mapVehiclesPage } from "../../../../lib/mappers/vehicleMapper";
import { parseFilters } from "../../../../utils/filters";
import { getSiteUrl, tryAbsoluteUrl } from "../../../../lib/site-url";
import { buildVehicleDetailUrl } from "@/utils/vehicleSlug";
import VehiculosClient from "./VehiculosClient";

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
  } catch {
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
      ? "Vehículos Usados Filtrados | Indiana Peugeot"
      : "Vehículos Usados Multimarca | Indiana Peugeot";
    const description = hasFilters
      ? "Encontrá el vehículo usado que buscás con nuestros filtros avanzados. Amplia selección con garantía y financiación."
      : "Amplia selección de vehículos usados multimarca en Indiana Peugeot. Garantía incluida, financiación disponible y servicio postventa profesional.";

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
        title,
        description,
        url: canonicalUrl,
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: ogImage
          ? [
              {
                url: ogImage,
                alt: "Vehículos Usados Multimarca - Indiana Peugeot",
                width: 1200,
                height: 630,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (err) {
    const msg = err?.message || String(err);
    if (
      msg.includes("Dynamic server usage") ||
      msg.includes("couldn't be rendered statically")
    ) {
      throw err;
    }
    console.error("[usados/vehiculos] generateMetadata:", msg);
    return {
      title: "Vehículos Usados | Indiana Peugeot",
      description:
        "Vehículos usados multimarca en Indiana Peugeot, Tucumán.",
      alternates: { canonical: "/usados/vehiculos" },
    };
  }
}

/**
 * No usar force-dynamic: obligaba a renderizar cada request en Vercel (TTFB alto y sensación de lag).
 * Esta ruta ya es dinámica por searchParams; el fetch usa Data Cache (revalidate en vehiclesApi.server).
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
    // Parsear filtros desde URL (única fuente de verdad)
    const filters = parseFilters(resolvedSearchParams || {});

    // Extraer página desde searchParams (default: 1)
    const page = Number(resolvedSearchParams?.page) || 1;
    const cursor = page; // Backend usa cursor = página

    // Fetch inicial en Server Component (aprovecha caching de Next.js)
    const backendData = await vehiclesService.getVehicles({
      filters,
      limit: 8,
      cursor,
    });

    // Mapear datos del backend al formato frontend
    const mappedData = mapVehiclesPage(backendData, cursor);

    let jsonLdHtml = null;
    try {
      const jsonLd = getVehiclesListJsonLd(mappedData.vehicles || []);
      if (jsonLd) {
        jsonLdHtml = JSON.stringify(jsonLd);
      }
    } catch (jsonErr) {
      console.error("[VehiculosPage] JSON-LD omitido:", jsonErr?.message || jsonErr);
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
            initialFilters={filters}
            initialPage={page}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    console.error("[VehiculosPage] Error:", error?.message || error);

    // Si es error 404, usar notFound()
    if (error.message?.includes("not found") || error.message?.includes("404")) {
      notFound();
    }

    // Mensaje de error más amigable
    let errorMessage = "Error al cargar vehículos";
    if (error.message?.includes("No se pudo conectar") || error.message?.includes("fetch failed")) {
      errorMessage = "No se pudo conectar con el backend. Por favor, verifica que el servidor esté corriendo y que la variable NEXT_PUBLIC_API_URL esté configurada correctamente.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Para otros errores, pasar error a Client Component para manejo
    // ✅ IMPORTANTE: Envolver en Suspense también en caso de error
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
          initialFilters={parseFilters(resolvedSearchParams || {})}
          initialPage={Number(resolvedSearchParams?.page) || 1}
          error={errorMessage}
        />
      </Suspense>
    );
  }
}

