/**
 * Las URLs que salen de los datos de contacto, comparadas contra las que el
 * footer produce hoy.
 *
 * Es la mitad del contrato congelado del rewrite: si estas funciones arman una
 * URL distinta a la que el sitio viene publicando, el enlace cambia para gente
 * real. Los valores esperados no son inventados, están copiados de ejecutar la
 * configuración vieja.
 */

import { describe, it, expect } from "vitest";
import { SEDES } from "@/config/contacto";
import { urlWhatsApp, urlInstagram, urlMapa } from "@/lib/contacto/urls";

describe("urlWhatsApp", () => {
  it("arma las cuatro que publica el footer", () => {
    const base = "https://api.whatsapp.com/send?phone=543816295959";

    expect(urlWhatsApp(SEDES.peugeotSanMiguel.whatsapp)).toBe(
      `${base}&text=Hola%2C%20estoy%20interesado%20en%20veh%C3%ADculos%200KM%20-%20Sede%20San%20Miguel`,
    );
    expect(urlWhatsApp(SEDES.peugeotYerbaBuena.whatsapp)).toBe(
      `${base}&text=Hola%2C%20estoy%20interesado%20en%20veh%C3%ADculos%200KM%20-%20Sede%20Yerba%20Buena`,
    );
    expect(urlWhatsApp(SEDES.usados.whatsapp)).toBe(
      `${base}&text=Hola%2C%20estoy%20interesado%20en%20autos%20usados`,
    );
    expect(urlWhatsApp(SEDES.posventa.whatsapp)).toBe(
      `${base}&text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20servicios%20de%20postventa`,
    );
  });

  it("usa api.whatsapp.com y no wa.me", () => {
    // Está elegido: da mejor resultado con los mensajes precargados.
    expect(urlWhatsApp({ phone: "543816295959", mensaje: "hola" })).toContain(
      "api.whatsapp.com",
    );
  });

  it("omite el parámetro de texto cuando no hay mensaje", () => {
    expect(urlWhatsApp({ phone: "543816295959" })).toBe(
      "https://api.whatsapp.com/send?phone=543816295959",
    );
    expect(urlWhatsApp({ phone: "543816295959", mensaje: "   " })).toBe(
      "https://api.whatsapp.com/send?phone=543816295959",
    );
  });
});

describe("urlInstagram", () => {
  it("arma las cuentas de cada vertical", () => {
    expect(urlInstagram(SEDES.usados.instagram)).toBe(
      "https://instagram.com/usadosindiana",
    );
    expect(urlInstagram(SEDES.peugeotSanMiguel.instagram)).toBe(
      "https://instagram.com/peugeotindiana",
    );
  });
});

describe("urlMapa", () => {
  it("arma las cuatro direcciones que publica el footer", () => {
    expect(urlMapa(SEDES.peugeotSanMiguel.direccion)).toBe(
      "https://maps.google.com/maps?q=Salta%20160%2C%20San%20Miguel%20de%20Tucum%C3%A1n",
    );
    expect(urlMapa(SEDES.peugeotYerbaBuena.direccion)).toBe(
      "https://maps.google.com/maps?q=Av.%20Aconquija%20y%20Bascary%2C%20Yerba%20Buena",
    );
    expect(urlMapa(SEDES.usados.direccion)).toBe(
      "https://maps.google.com/maps?q=Santa%20Fe%202145%2C%20San%20Miguel%20de%20Tucum%C3%A1n",
    );
    expect(urlMapa(SEDES.posventa.direccion)).toBe(
      "https://maps.google.com/maps?q=Italia%202945%2C%20San%20Miguel%20de%20Tucum%C3%A1n",
    );
  });
});
