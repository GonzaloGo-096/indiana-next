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
import VehicleDetailClient from "./VehicleDetailClient";
import ItemViewTracker from "@/components/analytics/ItemViewTracker";
import { LOCATIONS, SOURCES } from "@/lib/analytics/events";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";

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

/** URL absoluta de la foto principal (la usan og:image y el JSON-LD), o null. */
function mainImageUrl(vehicle) {
  const foto = typeof vehicle.fotoPrincipal === "string" ? vehicle.fotoPrincipal.trim() : "";
  if (!foto) return null;
  if (foto.startsWith("http") || foto.startsWith("//")) return foto;
  return absoluteUrl(foto.startsWith("/") ? foto : `/${foto}`);
}

/**
 * Structured data (schema.org Product) de la ficha, listo para el <script>.
 * Sin offers/price a propósito: los planes de financiación no son un precio
 * único.
 */
function buildJsonLdHtml(vehicle, canonicalUrl) {
  const name =
    vehicle.marca && vehicle.modelo
      ? `${vehicle.marca} ${vehicle.modelo}`
      : vehicle.marca || vehicle.modelo || "Vehículo usado";
  const image = mainImageUrl(vehicle);

  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: vehicle.anio ? `Vehículo usado ${name} ${vehicle.anio}` : `Vehículo usado ${name}`,
    category: "Automotive",
    ...(image ? { image: [image] } : {}),
    url: canonicalUrl,
    ...(vehicle.anio ? { model: String(vehicle.anio) } : {}),
  });
}

const NOT_AVAILABLE_METADATA = {
  title: "Vehículo no disponible",
  description: "El vehículo solicitado no está disponible.",
};

/**
 * Metadata dinámica para SEO.
 *
 * Sin try/catch, igual que la página: un error del backend tiene que ser un
 * error (app/error.jsx), no un título de "Vehículo no disponible" sobre una
 * página que en realidad falló.
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { id } = parseVehicleSlugParam(slug);
  if (!id) return NOT_AVAILABLE_METADATA;

  const backendVehicle = await vehiclesService.getVehicleById(id);
  if (!backendVehicle) return NOT_AVAILABLE_METADATA;
  const vehicle = mapVehicle(backendVehicle);

  const canonicalUrl = absoluteUrl(buildVehicleDetailUrl(vehicle));
  const title = vehicle.anio
    ? `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} Usado`
    : `${vehicle.marca} ${vehicle.modelo} Usado`;
  const precioMeta = formatPrecioForMeta(vehicle.precio);
  const description = `${vehicle.marca} ${vehicle.modelo}${vehicle.anio ? ` ${vehicle.anio}` : ""} usado en Tucumán. Consultá disponibilidad y precio con Peugeot Indiana.${precioMeta ? ` Precio: ${precioMeta}.` : ""}`;

  const ogImageUrl = mainImageUrl(vehicle);

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
  // falla real (backend, red, timeout, respuesta inválida o mapeo) la muestra
  // app/error.jsx. Si el auto existe lo decide solo el servicio.
  const backendVehicle = await vehiclesService.getVehicleById(id);
  if (!backendVehicle) notFound();
  const vehicle = mapVehicle(backendVehicle);

  const canonicalPath = buildVehicleDetailUrl(vehicle);
  const canonicalSegment = canonicalPath.replace(/^\/usados\/?/, "");
  if (needsRedirect || slug !== canonicalSegment) {
    permanentRedirect(canonicalPath);
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
        item={buildItemParamsFromUsado(vehicle)}
        location={LOCATIONS.USADOS_DETAIL}
        source={SOURCES.INLINE}
        componentId="detail_page"
      />
      {/* vehicle es JSON plano (sale de JSON.parse en el servicio): se puede
          pasar al cliente tal cual, sin clonarlo. */}
      <VehicleDetailClient vehicle={vehicle} />
    </>
  );
}
