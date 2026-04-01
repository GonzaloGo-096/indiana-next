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
import { vehiclesService } from "../../../lib/services/vehiclesApi.server";
import { mapVehicle } from "../../../lib/mappers/vehicleMapper";
import { absoluteUrl } from "../../../lib/site-url";
import {
  buildVehicleDetailUrl,
  parseVehicleSlugParam,
} from "@/utils/vehicleSlug";
import { serializeVehicleForClient } from "@/utils/serializeVehicleForClient";
import VehicleDetailClient from "./VehicleDetailClient";

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
        title: "Vehículo no encontrado | Indiana Peugeot",
        description: "El vehículo solicitado no está disponible.",
      };
    }

    const backendVehicle = await vehiclesService.getVehicleById(id);
    const vehicle = mapVehicle(backendVehicle);

    if (!vehicle) {
      return {
        title: "Vehículo no encontrado | Indiana Peugeot",
        description: "El vehículo solicitado no está disponible.",
      };
    }

    const canonicalPath = buildVehicleDetailUrl(vehicle);
    const canonicalUrl = absoluteUrl(canonicalPath);
    const title = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio || ""} | Indiana Peugeot`;
    const precioMeta = formatPrecioForMeta(vehicle.precio);
    const description = `Vehículo usado: ${vehicle.marca} ${vehicle.modelo} ${
      vehicle.anio || ""
    }.${precioMeta ? ` Precio: ${precioMeta}` : ""}`;

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
        title,
        description,
        url: canonicalUrl,
        siteName: "Indiana Peugeot",
        images: ogImageUrl
          ? [
              {
                url: ogImageUrl,
                alt: title,
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
        title,
        description,
        images: ogImageUrl ? [ogImageUrl] : [],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch {
    return {
      title: "Error | Indiana Peugeot",
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
 * force-dynamic requerido: el layout raíz llama a headers() para detectar modo mantenimiento,
 * lo que obliga a que toda la cadena de render sea dinámica. Sin esta declaración, Next.js
 * intenta regenerar la página estáticamente cuando el cache ISR expira (cada 6h) y lanza
 * DYNAMIC_SERVER_USAGE → 500. Los fetch individuales conservan su revalidate a nivel de
 * fetch-cache, por lo que los datos siguen siendo cacheados en el servidor.
 */
export const dynamic = "force-dynamic";

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
    if (!clientVehicle) {
      return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Error al cargar vehículo</h1>
          <p>No se pudo preparar los datos del vehículo.</p>
        </div>
      );
    }

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

    return (
      <>
        {jsonLdHtml ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
          />
        ) : null}
        <VehicleDetailClient vehicle={clientVehicle} />
      </>
    );
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    if (error?.digest === "NEXT_NOT_FOUND") throw error;

    console.error("[VehicleDetailPage] Error:", error?.message || error);

    if (
      error.message?.includes("not found") ||
      error.message?.includes("404")
    ) {
      notFound();
    }

    const isApiFailure =
      error.message?.includes("API error:") ||
      error.message?.includes("No se pudo conectar") ||
      error.message?.includes("Request timeout") ||
      error.message?.includes("respuesta inválida");

    return (
      <div style={{ padding: "2rem", textAlign: "center", maxWidth: "36rem", margin: "0 auto" }}>
        <h1>Error al cargar vehículo</h1>
        <p>{error.message || "Error desconocido"}</p>
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
}
