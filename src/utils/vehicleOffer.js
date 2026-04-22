import { formatPrice } from "./formatters";

/**
 * Datos de precio cuando el vehículo está marcado como oferta.
 * Misma regla en toda la app (cards, detalle, listados).
 */
export function getVehicleOfferDisplay(auto) {
  if (!auto) {
    return { hasOffer: false, descuento: 0, priceOriginal: "", priceOffer: "" };
  }

  const oferta = auto.oferta === true || auto.oferta === "true";
  if (!oferta) {
    return { hasOffer: false, descuento: 0, priceOriginal: "", priceOffer: "" };
  }

  const precio = Number(auto.precio) || 0;
  const descuento = Math.min(100, Math.max(0, Number(auto.descuento) || 0));
  const precioOferta =
    auto.precioOferta != null && !Number.isNaN(Number(auto.precioOferta))
      ? Number(auto.precioOferta)
      : Math.round(precio * (1 - descuento / 100));

  return {
    hasOffer: true,
    descuento,
    priceOriginal: formatPrice(precio),
    priceOffer: formatPrice(precioOferta),
  };
}
