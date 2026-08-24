/**
 * Tests de getVehicleOfferDisplay.
 *
 * Decide si un auto se muestra en oferta y con qué precios. Lo consumen las
 * tres cards y el detalle, así que un error acá se ve en todo el sitio.
 *
 * La regla clave (fix "detectar oferta por precioOferta < precio"): la oferta
 * NO depende del flag `oferta`. El backend nuevo lo deja en false aunque haya
 * descuento, pero calcula bien `precioOferta`. Comparar los dos precios
 * funciona para monto fijo, porcentaje y también para los autos viejos.
 */

import { describe, it, expect } from "vitest";
import { getVehicleOfferDisplay } from "../vehicleOffer";
import { formatPrice } from "../formatters";

describe("getVehicleOfferDisplay — detección de la oferta", () => {
  it("hay oferta cuando precioOferta es menor que precio", () => {
    const r = getVehicleOfferDisplay({ precio: 10000000, precioOferta: 8000000 });
    expect(r.hasOffer).toBe(true);
    expect(r.priceOriginal).toBe(formatPrice(10000000));
    expect(r.priceOffer).toBe(formatPrice(8000000));
  });

  it("NO hay oferta si los precios son iguales", () => {
    expect(getVehicleOfferDisplay({ precio: 10000000, precioOferta: 10000000 }).hasOffer).toBe(
      false,
    );
  });

  it("NO hay oferta si precioOferta es mayor (dato incoherente del backend)", () => {
    expect(getVehicleOfferDisplay({ precio: 10000000, precioOferta: 12000000 }).hasOffer).toBe(
      false,
    );
  });

  it("NO hay oferta si falta precioOferta", () => {
    expect(getVehicleOfferDisplay({ precio: 10000000 }).hasOffer).toBe(false);
  });

  it("ignora el flag `oferta`: manda la comparación de precios", () => {
    // El backend nuevo deja oferta en false aunque haya descuento.
    const conFlagFalse = getVehicleOfferDisplay({
      precio: 10000000,
      precioOferta: 8000000,
      oferta: false,
    });
    expect(conFlagFalse.hasOffer).toBe(true);

    // Y al revés: el flag en true no inventa una oferta que no existe.
    const conFlagTrue = getVehicleOfferDisplay({
      precio: 10000000,
      precioOferta: 10000000,
      oferta: true,
    });
    expect(conFlagTrue.hasOffer).toBe(false);
  });
});

describe("getVehicleOfferDisplay — porcentaje de ahorro", () => {
  it("calcula el ahorro equivalente y lo redondea", () => {
    expect(getVehicleOfferDisplay({ precio: 100, precioOferta: 80 }).descuento).toBe(20);
    expect(getVehicleOfferDisplay({ precio: 1000, precioOferta: 750 }).descuento).toBe(25);
  });

  it("redondea al entero más cercano", () => {
    // 1 - 8500/10000 = 15% exacto; 1 - 8501/10000 = 14.99 → 15
    expect(getVehicleOfferDisplay({ precio: 10000, precioOferta: 8501 }).descuento).toBe(15);
  });

  it("sirve igual para monto fijo que para porcentaje: solo ve los dos precios", () => {
    // Monto fijo de 500.000 sobre 10.000.000 = 5%
    expect(getVehicleOfferDisplay({ precio: 10000000, precioOferta: 9500000 }).descuento).toBe(5);
  });
});

describe("getVehicleOfferDisplay — entradas rotas", () => {
  it("sin vehículo devuelve la forma vacía sin explotar", () => {
    for (const entrada of [null, undefined]) {
      expect(getVehicleOfferDisplay(entrada)).toEqual({
        hasOffer: false,
        descuento: 0,
        priceOriginal: "",
        priceOffer: "",
      });
    }
  });

  it("sin precio no hay oferta", () => {
    expect(getVehicleOfferDisplay({ precioOferta: 8000000 }).hasOffer).toBe(false);
    expect(getVehicleOfferDisplay({ precio: 0, precioOferta: 8000000 }).hasOffer).toBe(false);
  });

  it("acepta precios como string (así vienen del backend a veces)", () => {
    const r = getVehicleOfferDisplay({ precio: "10000000", precioOferta: "8000000" });
    expect(r.hasOffer).toBe(true);
    expect(r.descuento).toBe(20);
  });

  it("un precioOferta negativo o cero se ignora: no es una oferta", () => {
    expect(getVehicleOfferDisplay({ precio: 10000000, precioOferta: 0 }).hasOffer).toBe(false);
    expect(getVehicleOfferDisplay({ precio: 10000000, precioOferta: -5 }).hasOffer).toBe(false);
  });

  it("cuando no hay oferta, no devuelve precios formateados", () => {
    const r = getVehicleOfferDisplay({ precio: 10000000 });
    expect(r.priceOriginal).toBe("");
    expect(r.priceOffer).toBe("");
  });
});
