/**
 * Contrato de la ficha: "no existe" y "falló" son cosas distintas.
 *
 * - El servicio devuelve null → notFound() (página 404 con noindex).
 * - El servicio o el mapeo fallan → el error sube a app/error.jsx. Nunca un
 *   404: un 404 con noindex sobre un auto real lo saca de Google.
 *
 * Qué significa null (404 del backend, { getOnePhoto: null }) y qué es un
 * error (500, red, timeout, respuesta inválida) lo prueba
 * vehiclesApi.server.test.js. Acá se mockea el servicio y se usan los
 * notFound/permanentRedirect reales de Next: se verifica por su digest.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const m = vi.hoisted(() => ({
  getVehicleById: vi.fn(),
  mapVehicle: null,
}));

vi.mock("@/lib/services/vehiclesApi.server", () => ({
  vehiclesService: { getVehicleById: (...a) => m.getVehicleById(...a) },
}));

// Passthrough al mapper real; un test lo reemplaza para simular un bug.
vi.mock("@/lib/mappers/vehicleMapper", async (importOriginal) => {
  const real = await importOriginal();
  m.mapVehicle = real.mapVehicle;
  return { ...real, mapVehicle: (...a) => m.mapVehicle(...a) };
});

vi.mock("../VehicleDetailClient", () => ({ default: () => null }));
vi.mock("@/components/analytics/ItemViewTracker", () => ({ default: () => null }));

const { default: VehicleDetailPage, generateMetadata } = await import("../page");
const { mapVehicle: realMapVehicle } = await vi.importActual("@/lib/mappers/vehicleMapper");

const ID = "699e2aa373f578ed9ede40cf";
const AUTO = { _id: ID, marca: "Peugeot", modelo: "208", version: "Allure", anio: 2021 };
const CANONICA = `peugeot-208-allure-2021-${ID}`;
const SITE = "https://www.indiana.com.ar";
const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const props = (slug) => ({ params: Promise.resolve({ slug }) });

/** Ejecuta la página y devuelve el error que lanzó (o null si renderizó). */
async function errorDe(fn) {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

const esNotFound = (error) => error?.digest === "NEXT_HTTP_ERROR_FALLBACK;404";

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE;
  m.getVehicleById.mockReset();
  m.mapVehicle = realMapVehicle;
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("ficha: auto inexistente", () => {
  it("si el servicio devuelve null, la página da notFound", async () => {
    m.getVehicleById.mockResolvedValue(null);

    expect(esNotFound(await errorDe(() => VehicleDetailPage(props(CANONICA))))).toBe(true);
  });

  it("un slug sin id válido da notFound sin consultar al backend", async () => {
    expect(esNotFound(await errorDe(() => VehicleDetailPage(props("cualquier-cosa"))))).toBe(true);
    expect(m.getVehicleById).not.toHaveBeenCalled();
  });

  it("la metadata dice 'no disponible'", async () => {
    m.getVehicleById.mockResolvedValue(null);

    const meta = await generateMetadata(props(CANONICA));
    expect(meta.title).toBe("Vehículo no disponible");
  });
});

describe("ficha: una falla nunca es un 404", () => {
  it("si el servicio falla, el error sube tal cual", async () => {
    const falla = new Error("API error: 500 Internal Server Error");
    m.getVehicleById.mockRejectedValue(falla);

    const error = await errorDe(() => VehicleDetailPage(props(CANONICA)));
    expect(error).toBe(falla);
    expect(esNotFound(error)).toBe(false);
  });

  it("si el mapeo falla, el error sube: no es 'auto inexistente'", async () => {
    m.getVehicleById.mockResolvedValue(AUTO);
    m.mapVehicle = () => {
      throw new Error("bug de mapeo");
    };

    const error = await errorDe(() => VehicleDetailPage(props(CANONICA)));
    expect(error?.message).toBe("bug de mapeo");
    expect(esNotFound(error)).toBe(false);
  });

  it("la metadata tampoco disfraza la falla de 'no disponible'", async () => {
    m.getVehicleById.mockRejectedValue(new Error("Request timeout: 15000ms"));

    await expect(generateMetadata(props(CANONICA))).rejects.toThrow("Request timeout");
  });
});

describe("ficha: auto existente", () => {
  it("con la URL canónica renderiza", async () => {
    m.getVehicleById.mockResolvedValue(AUTO);

    expect(await errorDe(() => VehicleDetailPage(props(CANONICA)))).toBeNull();
  });

  it("una URL vieja (solo el id) redirige permanente a la canónica", async () => {
    m.getVehicleById.mockResolvedValue(AUTO);

    const error = await errorDe(() => VehicleDetailPage(props(ID)));
    expect(error?.digest).toBe(`NEXT_REDIRECT;replace;/usados/${CANONICA};308;`);
  });

  it("la metadata usa la URL canónica", async () => {
    m.getVehicleById.mockResolvedValue(AUTO);

    const meta = await generateMetadata(props(ID));
    expect(meta.title).toBe("Peugeot 208 2021 Usado");
    expect(meta.alternates.canonical).toBe(`${SITE}/usados/${CANONICA}`);
  });
});
