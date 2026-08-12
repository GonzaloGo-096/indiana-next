/**
 * Tests de serializeJsonLd.
 *
 * Lo importante acá no es que el helper exista, sino que efectivamente frene
 * el ataque: hay un test que arma el payload real de escape de etiqueta y
 * verifica que ya no puede cerrar el <script>.
 */

import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "../jsonLd";

describe("serializeJsonLd — bloqueo del escape de etiqueta", () => {
  it("un valor con </script> NO puede cerrar la etiqueta", () => {
    const malicioso = {
      "@type": "Vehicle",
      marca: '</script><script>window.robado=document.cookie</script>',
    };

    const salida = serializeJsonLd(malicioso);

    // Lo que importa: no queda ninguna etiqueta que el navegador pueda cerrar.
    expect(salida).not.toContain("</script>");
    expect(salida).not.toContain("<script>");
    expect(salida).not.toContain("<");
    expect(salida).not.toContain(">");
  });

  it("así se veía el agujero: JSON.stringify solo NO alcanza", () => {
    // Este test documenta por qué existe el helper. Si algún día alguien
    // vuelve a usar JSON.stringify directo, acá está la razón.
    const malicioso = { marca: "</script><script>alert(1)</script>" };
    expect(JSON.stringify(malicioso)).toContain("</script>");
    expect(serializeJsonLd(malicioso)).not.toContain("</script>");
  });

  it("escapa también los separadores de línea que rompen JavaScript", () => {
    const salida = serializeJsonLd({ nota: "linea\u2028siguiente\u2029otra" });
    expect(salida).not.toContain("\u2028");
    expect(salida).not.toContain("\u2029");
    expect(salida).toContain("\\u2028");
  });

  it("escapa el ampersand", () => {
    expect(serializeJsonLd({ marca: "Peugeot & Citroën" })).not.toContain("&");
  });
});

describe("serializeJsonLd — el structured data sigue siendo válido", () => {
  it("lo escapado se vuelve a parsear al objeto original", () => {
    // Clave: para cualquier parser JSON, \\u003c y "<" son el mismo carácter.
    // Google lee exactamente lo mismo; solo cambia lo que ve el navegador.
    const original = {
      "@context": "https://schema.org",
      "@type": "Vehicle",
      marca: "Peugeot",
      modelo: "208 <GT>",
      precio: 10000000,
    };

    expect(JSON.parse(serializeJsonLd(original))).toEqual(original);
  });

  it("conserva acentos y eñes", () => {
    const data = { marca: "Citroën", modelo: "Año 2021", desc: "ñandú" };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("maneja objetos anidados y arrays", () => {
    const data = {
      "@type": "ItemList",
      itemListElement: [
        { position: 1, name: "Peugeot <208>" },
        { position: 2, name: "Toyota" },
      ],
    };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});

describe("serializeJsonLd — entradas que no sirven", () => {
  it("devuelve null si no hay datos", () => {
    expect(serializeJsonLd(null)).toBeNull();
    expect(serializeJsonLd(undefined)).toBeNull();
  });

  it("devuelve null ante una referencia circular en vez de explotar", () => {
    const circular = { a: 1 };
    circular.self = circular;
    expect(serializeJsonLd(circular)).toBeNull();
  });
});
