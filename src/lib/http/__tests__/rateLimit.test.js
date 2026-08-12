import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { crearRateLimit, getClientIp } from "@/lib/http/rateLimit";

/** Request mínimo: al limitador solo le interesan las cabeceras. */
function pedido(headers = {}) {
  const normalizadas = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    headers: {
      get: (nombre) => normalizadas[String(nombre).toLowerCase()] ?? null,
    },
  };
}

const desde = (ip) => pedido({ "x-forwarded-for": ip });

describe("getClientIp", () => {
  it("toma la primera IP de x-forwarded-for", () => {
    expect(getClientIp(pedido({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
  });

  it("recorta espacios", () => {
    expect(getClientIp(pedido({ "x-forwarded-for": "  9.9.9.9  , 2.2.2.2" }))).toBe("9.9.9.9");
  });

  it("cae a x-real-ip cuando no hay x-forwarded-for", () => {
    expect(getClientIp(pedido({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
  });

  it("no explota cuando no viene ninguna cabecera", () => {
    expect(getClientIp(pedido())).toBe("desconocida");
  });
});

describe("crearRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deja pasar hasta el máximo y corta el siguiente", () => {
    const limitar = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 3 });

    expect(limitar(desde("1.1.1.1")).ok).toBe(true);
    expect(limitar(desde("1.1.1.1")).ok).toBe(true);
    expect(limitar(desde("1.1.1.1")).ok).toBe(true);

    const cuarto = limitar(desde("1.1.1.1"));
    expect(cuarto.ok).toBe(false);
    expect(cuarto.retryAfter).toBeGreaterThan(0);
  });

  it("cada IP lleva su propia cuenta", () => {
    const limitar = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 2 });

    limitar(desde("1.1.1.1"));
    limitar(desde("1.1.1.1"));
    expect(limitar(desde("1.1.1.1")).ok).toBe(false);

    // Otra IP arranca de cero.
    expect(limitar(desde("2.2.2.2")).ok).toBe(true);
  });

  it("vuelve a permitir cuando la ventana pasó", () => {
    const limitar = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 2 });

    limitar(desde("1.1.1.1"));
    limitar(desde("1.1.1.1"));
    expect(limitar(desde("1.1.1.1")).ok).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(limitar(desde("1.1.1.1")).ok).toBe(true);
  });

  it("la ventana es deslizante, no un bloque que se resetea entero", () => {
    const limitar = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 2 });

    limitar(desde("1.1.1.1")); // t=0
    vi.advanceTimersByTime(50_000);
    limitar(desde("1.1.1.1")); // t=50s
    expect(limitar(desde("1.1.1.1")).ok).toBe(false);

    // A los 61s vence el primero pero el segundo sigue vivo: entra uno solo.
    vi.advanceTimersByTime(11_000);
    expect(limitar(desde("1.1.1.1")).ok).toBe(true);
    expect(limitar(desde("1.1.1.1")).ok).toBe(false);
  });

  it("retryAfter dice cuánto falta para que se libere un lugar", () => {
    const limitar = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 1 });

    limitar(desde("1.1.1.1"));
    vi.advanceTimersByTime(20_000);

    // Pasaron 20s de los 60: faltan 40.
    expect(limitar(desde("1.1.1.1")).retryAfter).toBe(40);
  });

  it("nunca devuelve un retryAfter de 0 segundos", () => {
    const limitar = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 1 });

    limitar(desde("1.1.1.1"));
    vi.advanceTimersByTime(59_999);

    expect(limitar(desde("1.1.1.1")).retryAfter).toBeGreaterThanOrEqual(1);
  });

  it("dos limitadores no se roban intentos entre sí", () => {
    const unaRuta = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 1 });
    const otraRuta = crearRateLimit({ ventanaMs: 60_000, maxIntentos: 1 });

    expect(unaRuta(desde("1.1.1.1")).ok).toBe(true);
    expect(unaRuta(desde("1.1.1.1")).ok).toBe(false);

    // La otra ruta no se enteró.
    expect(otraRuta(desde("1.1.1.1")).ok).toBe(true);
  });

  it("no acumula IPs vencidas para siempre", () => {
    const limitar = crearRateLimit({
      ventanaMs: 1_000,
      maxIntentos: 5,
      maxIpsEnMemoria: 10,
    });

    for (let i = 0; i < 12; i++) limitar(desde(`10.0.0.${i}`));

    // Todas vencidas: la próxima llamada dispara la limpieza y ninguna queda.
    vi.advanceTimersByTime(2_000);
    for (let i = 0; i < 12; i++) {
      expect(limitar(desde(`10.0.0.${i}`)).ok).toBe(true);
    }
  });

  it("rechaza una configuración sin sentido", () => {
    expect(() => crearRateLimit({ ventanaMs: 0, maxIntentos: 5 })).toThrow();
    expect(() => crearRateLimit({ ventanaMs: 1000, maxIntentos: 0 })).toThrow();
  });
});
