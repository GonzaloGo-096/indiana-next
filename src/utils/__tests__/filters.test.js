/**
 * Tests de filters.js — el módulo de lógica pura más grande del repo (433 líneas)
 * y hasta ahora sin un solo test.
 *
 * Gobierna los filtros del listado de usados de punta a punta: arma la query
 * que va al backend, lee la URL de vuelta, decide si hay filtros activos y
 * ordena los resultados. Un error acá se ve como "el filtro no anda" o, peor,
 * como autos que no aparecen.
 */

import { describe, it, expect } from "vitest";
import {
  buildSearchParams,
  parseFilters,
  hasAnyFilter,
  sortVehicles,
  isValidSortOption,
  getActiveFilterChips,
  mergeDefaultRanges,
} from "../filters";
import { FILTER_DEFAULTS } from "@/constants/filterOptions";

const RANGO_COMPLETO = {
  año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
  precio: [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
  kilometraje: [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max],
};

describe("buildSearchParams — filtros simples", () => {
  it("une los valores con comas", () => {
    const p = buildSearchParams({ marca: ["Peugeot", "Toyota"] }, { mergeDefaults: false });
    expect(p.get("marca")).toBe("Peugeot,Toyota");
  });

  it("omite los arrays vacíos", () => {
    const p = buildSearchParams({ marca: [], combustible: [] }, { mergeDefaults: false });
    expect(p.get("marca")).toBeNull();
    expect(p.get("combustible")).toBeNull();
  });

  it('"Automática" se expande a las dos formas que usa el backend', () => {
    // El backend guardó unos autos con "Automática" y otros con "Automático".
    // Si se manda solo una, se pierden resultados.
    const p = buildSearchParams({ caja: ["Automática"] }, { mergeDefaults: false });
    expect(p.get("caja")).toBe("Automática,Automático");
  });

  it("no duplica si ya vienen las dos formas", () => {
    const p = buildSearchParams({ caja: ["Automática", "Automático"] }, { mergeDefaults: false });
    expect(p.get("caja")).toBe("Automática,Automático");
  });

  it("las cajas que no son automáticas pasan tal cual", () => {
    const p = buildSearchParams({ caja: ["Manual"] }, { mergeDefaults: false });
    expect(p.get("caja")).toBe("Manual");
  });
});

describe("buildSearchParams — rangos", () => {
  it("omite un rango que está en el valor por defecto (URL limpia)", () => {
    const p = buildSearchParams(RANGO_COMPLETO, { mergeDefaults: false });
    expect(p.get("anio")).toBeNull();
    expect(p.get("precio")).toBeNull();
    expect(p.get("km")).toBeNull();
  });

  it("incluye el rango cuando el usuario lo movió", () => {
    const p = buildSearchParams({ precio: [8000000, 20000000] }, { mergeDefaults: false });
    expect(p.get("precio")).toBe("8000000,20000000");
  });

  it("con includeDefaultRanges manda los rangos aunque sean los default", () => {
    // Es lo que se usa al pedirle al backend: ahí sí se mandan siempre.
    const p = buildSearchParams(RANGO_COMPLETO, {
      mergeDefaults: false,
      includeDefaultRanges: true,
    });
    expect(p.get("anio")).toBe(`${FILTER_DEFAULTS.AÑO.min},${FILTER_DEFAULTS.AÑO.max}`);
    expect(p.get("precio")).not.toBeNull();
    expect(p.get("km")).not.toBeNull();
  });

  it("ignora un rango mal formado", () => {
    const p = buildSearchParams({ precio: [8000000] }, { mergeDefaults: false });
    expect(p.get("precio")).toBeNull();
  });
});

describe("buildSearchParams — paginación y seguridad", () => {
  it("incluye la página cuando es válida", () => {
    expect(buildSearchParams({ page: 3 }, { mergeDefaults: false }).get("page")).toBe("3");
  });

  it("descarta páginas inválidas", () => {
    for (const page of [0, -1, "abc", null]) {
      expect(buildSearchParams({ page }, { mergeDefaults: false }).get("page")).toBeNull();
    }
  });

  it("codifica los valores: no se puede inyectar nada en la query", () => {
    // La auditoría de seguridad descartó la inyección por acá justamente
    // porque se usa URLSearchParams. Este test lo deja fijado.
    const p = buildSearchParams(
      { marca: ["Peu&geot=1", "To yo?ta"] },
      { mergeDefaults: false },
    );
    const s = p.toString();
    expect(s).not.toContain("&geot=1");
    expect(s).toContain("%26");
  });
});

describe("parseFilters", () => {
  it("lee desde URLSearchParams", () => {
    const f = parseFilters(new URLSearchParams("marca=Peugeot,Toyota&precio=8000000,20000000"));
    expect(f.marca).toEqual(["Peugeot", "Toyota"]);
    expect(f.precio).toEqual([8000000, 20000000]);
  });

  it("lee desde un objeto plano (lo que da Next en los Server Components)", () => {
    const f = parseFilters({ marca: "Honda", page: "2" });
    expect(f.marca).toEqual(["Honda"]);
    expect(f.page).toBe(2);
  });

  it("convierte los rangos a números, no los deja como texto", () => {
    const f = parseFilters(new URLSearchParams("anio=2015,2020&km=0,100000"));
    expect(f.año).toEqual([2015, 2020]);
    expect(f.kilometraje).toEqual([0, 100000]);
  });

  it('normaliza "Automático" a "Automática" al leer la URL', () => {
    const f = parseFilters(new URLSearchParams("caja=Automático,Manual"));
    expect(f.caja).toEqual(["Automática", "Manual"]);
  });

  it("descarta rangos con valores no numéricos", () => {
    const f = parseFilters(new URLSearchParams("precio=abc,def"));
    expect(f.precio).toBeUndefined();
  });

  it("descarta una página inválida", () => {
    expect(parseFilters(new URLSearchParams("page=0")).page).toBeUndefined();
    expect(parseFilters(new URLSearchParams("page=-3")).page).toBeUndefined();
  });

  it("tolera entradas basura sin explotar", () => {
    for (const entrada of [null, undefined, "texto suelto", 42]) {
      expect(parseFilters(entrada)).toEqual({});
    }
  });

  it("ida y vuelta: lo que arma buildSearchParams se puede volver a leer", () => {
    const original = { marca: ["Peugeot"], precio: [8000000, 20000000], page: 2 };
    const vuelta = parseFilters(buildSearchParams(original, { mergeDefaults: false }));
    expect(vuelta).toEqual(original);
  });
});

describe("hasAnyFilter", () => {
  it("sin filtros es false", () => {
    expect(hasAnyFilter({})).toBe(false);
    expect(hasAnyFilter()).toBe(false);
  });

  it("los rangos en su valor por defecto NO cuentan como filtro", () => {
    expect(hasAnyFilter(RANGO_COMPLETO)).toBe(false);
  });

  it("detecta un filtro simple", () => {
    expect(hasAnyFilter({ marca: ["Peugeot"] })).toBe(true);
    expect(hasAnyFilter({ caja: ["Manual"] })).toBe(true);
    expect(hasAnyFilter({ combustible: ["Nafta"] })).toBe(true);
  });

  it("detecta un rango movido", () => {
    expect(hasAnyFilter({ precio: [8000000, 20000000] })).toBe(true);
  });

  it("la página 1 no cuenta, la 2 sí", () => {
    expect(hasAnyFilter({ page: 1 })).toBe(false);
    expect(hasAnyFilter({ page: 2 })).toBe(true);
  });
});

describe("sortVehicles", () => {
  const autos = [
    { id: "a", precio: 10000000, kilometraje: 50000 },
    { id: "b", precio: 30000000, kilometraje: 10000 },
    // Con oferta: para ordenar vale el precio que ve el usuario (20M, no 40M)
    { id: "c", precio: 40000000, precioOferta: 20000000, kilometraje: 90000 },
  ];

  it("ordena por precio ascendente usando el precio con oferta", () => {
    expect(sortVehicles(autos, "precio_asc").map((v) => v.id)).toEqual(["a", "c", "b"]);
  });

  it("ordena por precio descendente", () => {
    expect(sortVehicles(autos, "precio_desc").map((v) => v.id)).toEqual(["b", "c", "a"]);
  });

  it("ordena por kilometraje", () => {
    expect(sortVehicles(autos, "km_asc").map((v) => v.id)).toEqual(["b", "a", "c"]);
    expect(sortVehicles(autos, "km_desc").map((v) => v.id)).toEqual(["c", "a", "b"]);
  });

  it("NO muta el array original", () => {
    const copia = [...autos];
    sortVehicles(autos, "precio_asc");
    expect(autos).toEqual(copia);
  });

  it("sin opción de orden devuelve la lista tal cual", () => {
    expect(sortVehicles(autos, null).map((v) => v.id)).toEqual(["a", "b", "c"]);
  });

  it("una opción desconocida no reordena", () => {
    expect(sortVehicles(autos, "vaya_a_saber").map((v) => v.id)).toEqual(["a", "b", "c"]);
  });

  it("tolera listas vacías o entradas que no son arrays", () => {
    expect(sortVehicles([], "precio_asc")).toEqual([]);
    expect(sortVehicles(null, "precio_asc")).toBeNull();
  });

  it("un precioOferta mayor al precio se ignora (dato incoherente)", () => {
    const raros = [
      { id: "x", precio: 10000000, precioOferta: 90000000 },
      { id: "y", precio: 20000000 },
    ];
    expect(sortVehicles(raros, "precio_asc").map((v) => v.id)).toEqual(["x", "y"]);
  });
});

describe("isValidSortOption", () => {
  it("acepta las cuatro opciones reales", () => {
    for (const o of ["precio_desc", "precio_asc", "km_desc", "km_asc"]) {
      expect(isValidSortOption(o)).toBe(true);
    }
  });

  it("rechaza cualquier otra cosa", () => {
    for (const o of ["", null, undefined, "precio", "DROP TABLE", 1]) {
      expect(isValidSortOption(o)).toBe(false);
    }
  });
});

describe("getActiveFilterChips", () => {
  it("sin filtros no hay chips", () => {
    expect(getActiveFilterChips({})).toEqual([]);
    expect(getActiveFilterChips()).toEqual([]);
  });

  it("un chip por cada marca elegida", () => {
    const chips = getActiveFilterChips({ marca: ["Peugeot", "Toyota"] });
    expect(chips.map((c) => c.label)).toEqual(["Peugeot", "Toyota"]);
    expect(chips.map((c) => c.id)).toEqual(["marca:Peugeot", "marca:Toyota"]);
  });

  it("cada chip trae el estado que queda al quitarlo", () => {
    // Es lo que usa la UI para armar el link de "quitar este filtro".
    const chips = getActiveFilterChips({ marca: ["Peugeot", "Toyota"] });
    expect(chips[0].nextFilters.marca).toEqual(["Toyota"]);
    expect(chips[1].nextFilters.marca).toEqual(["Peugeot"]);
  });

  it("al quitar el último de un grupo, el filtro desaparece en vez de quedar vacío", () => {
    const [chip] = getActiveFilterChips({ marca: ["Peugeot"] });
    expect(chip.nextFilters.marca).toBeUndefined();
  });

  it("etiqueta la caja y el combustible con su prefijo correspondiente", () => {
    expect(getActiveFilterChips({ caja: ["Manual"] })[0].label).toBe("Caja: Manual");
    expect(getActiveFilterChips({ combustible: ["Nafta"] })[0].label).toBe("Nafta");
  });

  it("los rangos en su valor por defecto NO generan chip", () => {
    expect(getActiveFilterChips(RANGO_COMPLETO)).toEqual([]);
  });

  it("un rango movido genera chip y al quitarlo se borra entero", () => {
    const chips = getActiveFilterChips({ año: [2015, 2020] });
    expect(chips).toHaveLength(1);
    expect(chips[0].id).toBe("año");
    expect(chips[0].label).toContain("2015");
    expect(chips[0].nextFilters.año).toBeUndefined();
  });

  it("los chips de precio y km traen el valor formateado", () => {
    const [precio] = getActiveFilterChips({ precio: [8000000, 20000000] });
    expect(precio.label).toMatch(/^Precio:/);
    expect(precio.label).toContain("$");

    const [km] = getActiveFilterChips({ kilometraje: [10000, 90000] });
    expect(km.label).toMatch(/^Km:/);
  });

  it("nunca arrastra la paginación al quitar un filtro", () => {
    // Si arrastrara `page`, quitar un filtro te dejaría en la página 5 de un
    // resultado que ahora tiene 2.
    const [chip] = getActiveFilterChips({ marca: ["Peugeot"], page: 5 });
    expect(chip.nextFilters.page).toBeUndefined();
  });

  it("acumula chips de varios grupos a la vez", () => {
    const chips = getActiveFilterChips({
      marca: ["Peugeot"],
      caja: ["Manual"],
      combustible: ["Nafta"],
      precio: [8000000, 20000000],
    });
    expect(chips).toHaveLength(4);
  });
});

describe("mergeDefaultRanges", () => {
  it("completa los rangos que faltan con los valores por defecto", () => {
    const r = mergeDefaultRanges({ marca: ["Peugeot"] });
    expect(r.precio).toEqual([FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max]);
    expect(r.año).toEqual([FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max]);
    expect(r.kilometraje).toEqual([
      FILTER_DEFAULTS.KILOMETRAJE.min,
      FILTER_DEFAULTS.KILOMETRAJE.max,
    ]);
  });

  it("no pisa un rango que el usuario ya eligió", () => {
    const r = mergeDefaultRanges({ precio: [8000000, 20000000] });
    expect(r.precio).toEqual([8000000, 20000000]);
  });

  it("conserva el resto de los filtros", () => {
    expect(mergeDefaultRanges({ marca: ["Peugeot"] }).marca).toEqual(["Peugeot"]);
  });

  it("tolera entrada vacía", () => {
    expect(mergeDefaultRanges()).toHaveProperty("precio");
  });
});

/**
 * El caso que reportó Gonzalo: mover SOLO el año y quedarse sin autos.
 *
 * El formulario guarda los tres rangos aunque el visitante no los toque. Si esos
 * rangos "sin tocar" viajan al backend, se aplica un filtro que nadie pidió, y
 * como los topes no coinciden con el inventario real, borran autos válidos.
 */
describe("mover un solo filtro no debe arrastrar los otros", () => {
  /** Lo que el formulario tiene en memoria cuando solo se movió el año. */
  const soloMoviElAnio = {
    marca: [],
    caja: [],
    combustible: [],
    año: [2022, 2026],
    precio: [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
    kilometraje: [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max],
  };

  it("manda el año y NADA más", () => {
    const p = buildSearchParams(soloMoviElAnio, { mergeDefaults: false });

    expect(p.get("anio")).toBe("2022,2026");
    // Estos dos son los que rompían: filtros invisibles que el visitante no pidió.
    expect(p.get("precio")).toBeNull();
    expect(p.get("km")).toBeNull();
  });

  it("con todo en su lugar inicial, no manda ningún filtro", () => {
    const sinTocarNada = {
      marca: [],
      caja: [],
      combustible: [],
      año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
      precio: [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
      kilometraje: [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max],
    };

    expect(buildSearchParams(sinTocarNada, { mergeDefaults: false }).toString()).toBe("");
  });

  it("si sí movió el precio, ese sí viaja", () => {
    const moviAmbos = { ...soloMoviElAnio, precio: [8000000, 20000000] };
    const p = buildSearchParams(moviAmbos, { mergeDefaults: false });

    expect(p.get("anio")).toBe("2022,2026");
    expect(p.get("precio")).toBe("8000000,20000000");
    expect(p.get("km")).toBeNull();
  });

  it("un filtro de lista tampoco arrastra los rangos", () => {
    const soloCaja = { ...soloMoviElAnio, año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max], caja: ["Manual"] };
    const p = buildSearchParams(soloCaja, { mergeDefaults: false });

    expect(p.get("caja")).toBe("Manual");
    expect(p.get("anio")).toBeNull();
    expect(p.get("precio")).toBeNull();
    expect(p.get("km")).toBeNull();
  });
});
