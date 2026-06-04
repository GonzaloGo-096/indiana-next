/**
 * Tests del logger gateado por entorno.
 *
 * Reglas verificadas:
 *   - debug/info: solo se imprimen en dev, o en prod con API_DEBUG=true
 *   - warn/error: siempre se imprimen
 *   - prefijo de scope se respeta
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createLogger } from "../logger";

describe("createLogger", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiDebug = process.env.API_DEBUG;

  let logSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalApiDebug === undefined) delete process.env.API_DEBUG;
    else process.env.API_DEBUG = originalApiDebug;
  });

  describe("en desarrollo", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      delete process.env.API_DEBUG;
    });

    it("imprime debug e info", () => {
      const log = createLogger("test");
      log.debug("hola");
      log.info("mundo");
      expect(logSpy).toHaveBeenCalledTimes(2);
    });

    it("imprime warn y error", () => {
      const log = createLogger("test");
      log.warn("cuidado");
      log.error("boom");
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("en producción sin API_DEBUG", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      delete process.env.API_DEBUG;
    });

    it("silencia debug e info", () => {
      const log = createLogger("test");
      log.debug("oculto");
      log.info("oculto");
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("sigue imprimiendo warn y error", () => {
      const log = createLogger("test");
      log.warn("visible");
      log.error("visible");
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("en producción con API_DEBUG=true", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      process.env.API_DEBUG = "true";
    });

    it("vuelve a imprimir debug e info", () => {
      const log = createLogger("test");
      log.debug("visible bajo flag");
      log.info("visible bajo flag");
      expect(logSpy).toHaveBeenCalledTimes(2);
    });

    it("no se activa con valores distintos a 'true' (case-sensitive)", () => {
      process.env.API_DEBUG = "1";
      const log = createLogger("test");
      log.debug("no debería verse");
      expect(logSpy).not.toHaveBeenCalled();

      process.env.API_DEBUG = "TRUE";
      log.debug("tampoco");
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe("scope y prefijo", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("antepone [scope] en cada llamada", () => {
      const log = createLogger("photos/create");
      log.debug("msg", { foo: 1 });
      expect(logSpy).toHaveBeenCalledWith("[photos/create]", "msg", { foo: 1 });
    });

    it("acepta scope vacío sin romper", () => {
      const log = createLogger();
      log.warn("sin scope");
      expect(warnSpy).toHaveBeenCalledWith("", "sin scope");
    });
  });

  describe("reactividad a cambios en runtime de env vars", () => {
    it("respeta cambios de API_DEBUG después de crear el logger", () => {
      process.env.NODE_ENV = "production";
      delete process.env.API_DEBUG;

      const log = createLogger("rt");
      log.debug("oculto");
      expect(logSpy).not.toHaveBeenCalled();

      process.env.API_DEBUG = "true";
      log.debug("ahora sí");
      expect(logSpy).toHaveBeenCalledTimes(1);
    });
  });
});
