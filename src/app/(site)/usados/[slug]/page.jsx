/**
 * /usados/[slug] - Detalle de vehículo usado (Server Component)
 *
 * Soporta:
 * - URL vieja: /usados/699e2aa373f578ed9ede40cf → redirect permanente a canónica
 * - URL nueva: /usados/peugeot-208-allure-2021-699e2aa373f578ed9ede40cf
 * - Slug incorrecto: /usados/cualquier-cosa-699e2aa3... → redirect permanente a canónica
 * - Auto borrado o inexistente → notFound() (página 404 con noindex)
 * - Falla del backend → se lanza y la muestra app/error.jsx
 *
 * Como la ruta tiene loading.jsx, la respuesta se transmite por streaming: el
 * status HTTP sale 200 antes de saber el resultado. El 404 llega como página
 * con noindex y el redirect como meta refresh (comportamiento documentado de
 * Next, ver loading.md "Status Codes").
 */

import { notFound, permanentRedirect } from "next/navigation";
import { vehiclesService } from "@/lib/services/vehiclesApi.server";
import { mapVehicle } from "@/lib/mappers/vehicleMapper";
import { absoluteUrl } from "@/lib/site-url";
import { serializeJsonLd } from "@/lib/seo/jsonLd";
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

/** Script JSON-LD listo para inyectar, o null si no se pudo armar. */
function buildJsonLdHtml(vehicle, canonicalUrl) {
  const jsonLd = getVehicleJsonLd({ vehicle, canonicalUrl });
  if (!jsonLd) return null;
  try {
    return serializeJsonLd(jsonLd);
  } catch (error) {
    // Sin JSON-LD la ficha sigue sirviendo; solo se pierde el dato para Google.
    log.warn("JSON-LD omitido:", error?.message || error);
    return null;
  }
}

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
    const { slug } = await params;
    const { id } = parseVehicleSlugParam(slug);

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
    // No se registra acá: la página hace el mismo pedido (compartido por
    // cache() en el servicio), lanza el error y ese sí queda registrado.
    return {
      title: "Vehículo no disponible",
      description: "Error al cargar la información del vehículo.",
    };
  }
}

// Sin generateStaticParams a propósito. Devolver [] activaba ISR: cada ficha
// quedaba guardada como HTML la primera vez que alguien la visitaba, y un auto
// ya borrado se seguía mostrando. La ficha se arma en cada visita con los
// datos del backend (ver vehiclesApi.server).

export default async function VehicleDetailPage({ params }) {
  const { slug } = await params;
  const { id, needsRedirect } = parseVehicleSlugParam(slug);
  if (!id) notFound();

  // Sin try/catch: notFound() y permanentRedirect() los resuelve Next, y una
  // falla real del backend la muestra app/error.jsx.
  const vehicle = mapVehicle(await vehiclesService.getVehicleById(id));
  if (!vehicle) notFound();

  const canonicalPath = buildVehicleDetailUrl(vehicle);
  const canonicalSegment = canonicalPath.replace(/^\/usados\/?/, "");
  if (needsRedirect || slug !== canonicalSegment) {
    permanentRedirect(canonicalPath);
  }

  const clientVehicle = serializeVehicleForClient(vehicle);
  if (!clientVehicle) {
    throw new Error(`No se pudo preparar la ficha del vehículo ${id}`);
  }
  const jsonLdHtml = buildJsonLdHtml(vehicle, absoluteUrl(canonicalPath));

  return (
    <>
      {jsonLdHtml ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
        />
      ) : null}
      <ItemViewTracker
        item={buildItemParamsFromUsado(clientVehicle)}
        location={LOCATIONS.USADOS_DETAIL}
        source={SOURCES.INLINE}
        componentId="detail_page"
      />
      <VehicleDetailClient vehicle={clientVehicle} />
    </>
  );
}
