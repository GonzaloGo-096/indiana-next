/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { buildUrlCleanSnippet, urlSinDatosPersonales } from "../urlLimpia";

const BASE = "http://localhost:3000";
const CASOS = [
  ["/?utm_source=x&fname=Juan&lname=Perez&name=Juan&cel=3815551234&correo=a%40b.com&whatsapp=381&tel=381#email=a@b.com", "/?utm_source=x"],
  ["/postventa?utm_source=mail&email=juan@x.com&gclid=G1&telefono=381", "/postventa?utm_source=mail&gclid=G1"],
  ["/usados/vehiculos?marca=Peugeot&user_email=a%40b.com&nombreApellido=Juan", "/usados/vehiculos?marca=Peugeot"],
  ["/usados/vehiculos?utm_campaign=hola%20mundo&marca=peugeot,fiat#arriba", "/usados/vehiculos?utm_campaign=hola%20mundo&marca=peugeot,fiat#arriba"],
  ["/?utm_content=hotel&utm_term=nombre_campania_sin_datos", "/?utm_content=hotel&utm_term=nombre_campania_sin_datos"],
  ["/0km/208", "/0km/208"],
];

beforeEach(() => window.history.replaceState({}, "", "/"));

describe("limpieza de datos personales en la dirección", () => {
  it.each(CASOS)("%s → %s", (entrada, esperado) => {
    expect(urlSinDatosPersonales(BASE + entrada)).toBe(BASE + esperado);
  });

  it.each(CASOS)("el script de la barra del navegador hace lo mismo: %s", (entrada, esperado) => {
    window.history.replaceState({ x: 1 }, "", entrada);
    new Function(buildUrlCleanSnippet())();
    expect(window.location.href).toBe(BASE + esperado);
    expect(window.history.state).toEqual({ x: 1 }); // no pisa el estado del router
  });

  it("no toca utm, gclid, fbclid ni los filtros", () => {
    const u = `${BASE}/usados/vehiculos?utm_source=a&utm_medium=email&gclid=1&fbclid=2&gbraid=3&marca=Ford&caja=Manual`;
    expect(urlSinDatosPersonales(u)).toBe(u);
  });
});
