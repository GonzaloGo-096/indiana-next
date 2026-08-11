/**
 * /usados/[slug] - Detalle de vehículo usado (Server Component)
 *
 * Soporta:
 * - URL vieja: /usados/699e2aa373f578ed9ede40cf → redirect 301 a canónica
 * - URL nueva: /usados/peugeot-208-allure-2021-699e2aa373f578ed9ede40cf
 * - Slug incorrecto: /usados/cualquier-cosa-699e2aa3... → redirect 301 a canónica
 *
 * @author Indiana Peugeot
 * @version 2.0.0 - Slug + id
 */

import { notFound, permanentRedirect } from "next/navigation";
import { vehiclesService } from "../../../../lib/services/vehiclesApi.server";
import { mapVehicle } from "../../../../lib/mappers/vehicleMapper";
import { absoluteUrl } from "../../../../lib/site-url";
import {
  buildVehicleDetailUrl,
  parseVehicleSlugParam,
} from "@/utils/vehicleSlug";
import { serializeVehicleForClient } from "@/utils/serializeVehicleForClient";
import VehicleDetailClient from "./VehicleDetailClient";
import ItemViewTracker from "@/components/analytics/ItemViewTracker";
import { LOCATIONS, SOURCES } from "@/lib/analytics/events";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";
import { createLogger } from "@/lib/logger";

const log = createLogger("usados:detalle");

function formatPrecioForMeta(precio) {
  if (precio == null || precio === "") return "";
  if (typeof precio === "number" && Number.isFinite(precio)) {
    try {
      return precio.toLocaleString("es-AR");
    } catch {
      return String(precio);
    }
  }
  if (typeof precio === "string") return precio;
  return "";
}

function fotoPrincipalString(vehicle) {
  const fp = vehicle?.fotoPrincipal;
  return typeof fp === "string" && fp.trim() !== "" ? fp.trim() : "";
}

/**
 * Helper para generar Structured Data (JSON-LD) del vehículo
 * Usa Schema.org Product (con category Automotive)
 */
function getVehicleJsonLd({ vehicle, canonicalUrl }) {
  if (!vehicle) return null;

  const productName =
    vehicle.marca && vehicle.modelo
      ? `${vehicle.marca} ${vehicle.modelo}`
      : vehicle.marca || vehicle.modelo || "Vehículo usado";
  const productDescription = vehicle.anio
    ? `Vehículo usado ${productName} ${vehicle.anio}`
    : `Vehículo usado ${productName}`;

  const principal = fotoPrincipalString(vehicle);
  const images = principal
    ? [
        principal.startsWith("http") || principal.startsWith("//")
          ? principal
          : principal.startsWith("/")
            ? absoluteUrl(principal)
            : absoluteUrl(`/${principal}`),
      ]
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: productDescription,
    category: "Automotive",
    image: images.length > 0 ? images : undefined,
    url: canonicalUrl,
  };

  // Agregar año si existe
  if (vehicle.anio) {
    jsonLd.model = String(vehicle.anio);
  }

  // NO incluir offers/price si no hay precio real disponible
  // (los planes de financiación no son "price" único)

  // Limpiar undefined
  Object.keys(jsonLd).forEach((key) => {
    if (jsonLd[key] === undefined) {
      delete jsonLd[key];
    }
  });

  return jsonLd;
}

/**
 * Metadata dinámica para SEO
 */
export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const param = resolvedParams.slug ?? resolvedParams.id;
    const { id } = parseVehicleSlugParam(param);

    if (!id) {
      return {
        title: "Vehículo no disponible",
        description: "El vehículo solicitado no está disponible.",
      };
    }

    const backendVehicle = await vehiclesService.getVehicleById(id);
    const vehicle = mapVehicle(backendVehicle);

    if (!vehicle) {
      return {
        title: "Vehículo no disponible",
        description: "El vehículo solicitado no está disponible.",
      };
    }

    const canonicalPath = buildVehicleDetailUrl(vehicle);
    const canonicalUrl = absoluteUrl(canonicalPath);
    const title = vehicle.anio
      ? `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} Usado`
      : `${vehicle.marca} ${vehicle.modelo} Usado`;
    const precioMeta = formatPrecioForMeta(vehicle.precio);
    const description = `${vehicle.marca} ${vehicle.modelo}${vehicle.anio ? ` ${vehicle.anio}` : ""} usado en Tucumán. Consultá disponibilidad y precio con Peugeot Indiana.${precioMeta ? ` Precio: ${precioMeta}.` : ""}`;

    const fp = fotoPrincipalString(vehicle);
    const ogImageUrl = fp
      ? fp.startsWith("http") || fp.startsWith("//")
        ? fp
        : fp.startsWith("/")
          ? absoluteUrl(fp)
          : absoluteUrl(`/${fp}`)
      : null;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Peugeot Indiana`,
        description,
        url: canonicalUrl,
        siteName: "Indiana Peugeot",
        images: ogImageUrl
          ? [
              {
                url: ogImageUrl,
                alt: `${title} | Peugeot Indiana`,
                width: 1200,
                height: 630,
              },
            ]
          : [],
        locale: "es_AR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Peugeot Indiana`,
        description,
        images: ogImageUrl ? [ogImageUrl] : [],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch {
    return {
      title: "Vehículo no disponible",
      description: "Error al cargar la información del vehículo.",
    };
  }
}

/**
 * Generar paths estáticos (opcional, para SSG)
 */
export async function generateStaticParams() {
  return [];
}

/**
 * Página de detalle de vehículo
 */
export default async function VehicleDetailPage({ params }) {
  let resolvedParams;
  try {
    resolvedParams = await params;
  } catch {
    notFound();
  }

  const param = resolvedParams.slug ?? resolvedParams.id;
  const { id, needsRedirect } = parseVehicleSlugParam(param);

  if (!id) notFound();

  let payload = null;
  let caughtError = null;

  try {
    const backendVehicle = await vehiclesService.getVehicleById(id);

    if (!backendVehicle) notFound();

    const vehicle = mapVehicle(backendVehicle);

    if (!vehicle) notFound();

    const canonicalPath = buildVehicleDetailUrl(vehicle);
    const expectedSegment = canonicalPath.replace(/^\/usados\/?/, "");
    const willRedirect = needsRedirect || param !== expectedSegment;

    if (process.env.NODE_ENV === "development") {
      console.log("[slug] REDIRECT DIAGNOSTIC:", {
        param,
        expectedSegment,
        canonicalPath,
        needsRedirect,
        willRedirect,
        slugMatch: param === expectedSegment,
        vehicle: {
          id: vehicle.id ?? vehicle._id,
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          version: vehicle.version,
          anio: vehicle.anio ?? vehicle.año,
        },
      });
    }

    if (willRedirect) {
      permanentRedirect(canonicalPath);
    }

    const canonicalUrl = absoluteUrl(canonicalPath);
    const jsonLd = getVehicleJsonLd({ vehicle, canonicalUrl });

    const clientVehicle = serializeVehicleForClient(vehicle);
    let jsonLdHtml = null;
    if (jsonLd) {
      try {
        jsonLdHtml = JSON.stringify(jsonLd);
      } catch (stringifyErr) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[VehicleDetailPage] JSON-LD omitido:", stringifyErr);
        }
      }
    }

    payload = { clientVehicle, jsonLdHtml };
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    if (error?.digest === "NEXT_NOT_FOUND") throw error;

    log.error("Error renderizando el detalle:", error?.message || error);

    const msg = typeof error?.message === "string" ? error.message : "";
    if (msg.includes("not found") || msg.includes("404")) {
      notFound();
    }

    caughtError = error;
  }

  if (caughtError) {
    const msg = typeof caughtError?.message === "string" ? caughtError.message : "";
    const isApiFailure =
      msg.includes("API error:") ||
      msg.includes("No se pudo conectar") ||
      msg.includes("Request timeout") ||
      msg.includes("respuesta inválida");

    return (
      <div style={{ padding: "2rem", textAlign: "center", maxWidth: "36rem", margin: "0 auto" }}>
        <h1>Error al cargar vehículo</h1>
        <p>{msg || "Error desconocido"}</p>
        {isApiFailure ? (
          <p style={{ marginTop: "1rem", color: "#555", fontSize: "0.95rem" }}>
            El detalle de usados pide al backend{" "}
            <code style={{ fontSize: "0.85em" }}>GET /photos/getonephoto/&lt;id&gt;</code> desde el
            servidor (Vercel). Revisá que{" "}
            <code style={{ fontSize: "0.85em" }}>NEXT_PUBLIC_API_URL</code> o{" "}
            <code style={{ fontSize: "0.85em" }}>API_URL</code> apunten al API público en{" "}
            <strong>https</strong> y que el backend responda bien a ese ID.
          </p>
        ) : null}
      </div>
    );
  }

  if (!payload?.clientVehicle) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Error al cargar vehículo</h1>
        <p>No se pudo preparar los datos del vehículo.</p>
      </div>
    );
  }

  return (
    <>
      {payload.jsonLdHtml ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: payload.jsonLdHtml }}
        />
      ) : null}
      <ItemViewTracker
        item={buildItemParamsFromUsado(payload.clientVehicle)}
        location={LOCATIONS.USADOS_DETAIL}
        source={SOURCES.INLINE}
        componentId="detail_page"
      />
      <VehicleDetailClient vehicle={payload.clientVehicle} />
    </>
  );
}
