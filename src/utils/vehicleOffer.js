import { formatPrice } from "./formatters";

/**
 * Datos de precio cuando el vehículo tiene descuento.
 * Misma regla en toda la app (cards, detalle, listados).
 *
 * La oferta se detecta por `precioOferta < precio`: el backend ya calcula
 * `precioOferta` a partir del descuento { valor, tipo } (monto fijo o %).
 * NO depende del flag `oferta` (el backend lo deja en false). Funciona igual
 * para los autos viejos, que también traen `precioOferta`.
 */
export function getVehicleOfferDisplay(auto) {
  if (!auto) {
    return { hasOffer: false, descuento: 0, priceOriginal: "", priceOffer: "" };
  }

  const precio = Number(auto.precio) || 0;
  const precioOfertaRaw = Number(auto.precioOferta);
  const precioOferta =
    Number.isFinite(precioOfertaRaw) && precioOfertaRaw > 0
      ? precioOfertaRaw
      : precio;

  const hasOffer = precio > 0 && precioOferta > 0 && precioOferta < precio;
  if (!hasOffer) {
    return { hasOffer: false, descuento: 0, priceOriginal: "", priceOffer: "" };
  }

  // % de ahorro equivalente (para consumidores que lo usen)
  const descuento = Math.round((1 - precioOferta / precio) * 100);

  return {
    hasOffer: true,
    descuento,
    priceOriginal: formatPrice(precio),
    priceOffer: formatPrice(precioOferta),
  };
}
