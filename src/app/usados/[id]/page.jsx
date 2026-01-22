/**
 * /usados/[id] - Detalle de vehículo usado (Server Component)
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { notFound } from "next/navigation";
import { vehiclesService } from "../../../lib/services/vehiclesApi.server";
import { mapVehicle } from "../../../lib/mappers/vehicleMapper";
import { absoluteUrl } from "../../../lib/site-url";
import VehicleDetailClient from "./VehicleDetailClient";

/**
 * Helper para generar Structured Data (JSON-LD) del vehículo
 * Usa Schema.org Product (con category Automotive)
 */
function getVehicleJsonLd({ vehicle, canonicalUrl }) {
  if (!vehicle) return null;

  const productName = vehicle.marca && vehicle.modelo
    ? `${vehicle.marca} ${vehicle.modelo}`
    : vehicle.marca || vehicle.modelo || "Vehículo usado";
  const productDescription = vehicle.anio
    ? `Vehículo usado ${productName} ${vehicle.anio}`
    : `Vehículo usado ${productName}`;

  // Imágenes: solo incluir si son absolutas o convertirlas a absolutas
  const images = vehicle.fotoPrincipal
    ? [
        vehicle.fotoPrincipal.startsWith("http") || vehicle.fotoPrincipal.startsWith("//")
          ? vehicle.fotoPrincipal
          : vehicle.fotoPrincipal.startsWith("/")
          ? absoluteUrl(vehicle.fotoPrincipal)
          : absoluteUrl(`/${vehicle.fotoPrincipal}`),
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
  const { id } = await params;

  try {
    const backendVehicle = await vehiclesService.getVehicleById(id);
    const vehicle = mapVehicle(backendVehicle);

    if (!vehicle) {
      return {
        title: "Vehículo no encontrado | Indiana Peugeot",
        description: "El vehículo solicitado no está disponible.",
      };
    }

    const canonicalUrl = absoluteUrl(`/usados/${id}`);
    const title = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio || ""} | Indiana Peugeot`;
    const description = `Vehículo usado: ${vehicle.marca} ${vehicle.modelo} ${
      vehicle.anio || ""
    }. ${vehicle.precio ? `Precio: ${vehicle.precio.toLocaleString()}` : ""}`;

    // Convertir fotoPrincipal a absoluta si es relativa
    const ogImageUrl = vehicle.fotoPrincipal
      ? vehicle.fotoPrincipal.startsWith("http") || vehicle.fotoPrincipal.startsWith("//")
        ? vehicle.fotoPrincipal
        : vehicle.fotoPrincipal.startsWith("/")
        ? absoluteUrl(vehicle.fotoPrincipal)
        : absoluteUrl(`/${vehicle.fotoPrincipal}`)
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
  } catch (error) {
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
  // Por ahora retornamos vacío (ISR)
  // En el futuro, podemos pre-renderizar los más populares
  return [];
}

/**
 * Página de detalle de vehículo
 */
export default async function VehicleDetailPage({ params }) {
  const { id } = await params;

  try {
    // Fetch del vehículo
    const backendVehicle = await vehiclesService.getVehicleById(id);

    if (!backendVehicle) {
      notFound();
    }

    // Mapear datos
    const vehicle = mapVehicle(backendVehicle);

    if (!vehicle) {
      notFound();
    }

    // Generar Structured Data (JSON-LD) para el vehículo
    const canonicalUrl = absoluteUrl(`/usados/${id}`);
    const jsonLd = getVehicleJsonLd({ vehicle, canonicalUrl });

    // Pasar a Client Component con JSON-LD
    return (
      <>
        {/* Structured Data (JSON-LD) para SEO */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <VehicleDetailClient vehicle={vehicle} />
      </>
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("[VehicleDetailPage] Error:", error);
    }

    // Si es 404, usar notFound()
    if (
      error.message?.includes("not found") ||
      error.message?.includes("404")
    ) {
      notFound();
    }

    // Para otros errores, mostrar error
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Error al cargar vehículo</h1>
        <p>{error.message || "Error desconocido"}</p>
      </div>
    );
  }
}

