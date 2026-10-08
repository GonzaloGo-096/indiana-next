import { describe, it, expect } from "vitest";
import { locationFromPathname } from "../locationFromPath";
import { LOCATIONS } from "../events";

describe("locationFromPathname", () => {
  it.each([
    ["/", "home"],
    [null, "home"],
    ["/0km", "okm_list"],
    ["/0km/208", "okm_detail"],
    ["/usados", "usados_list"],
    ["/usados/vehiculos", "usados_list"],
    ["/usados/peugeot-208-2021-699e2aa373f578ed9ede40cf", "usados_detail"],
    ["/planes", "planes_list"],
    ["/planes/easy", "plan_detail"],
    ["/postventa", "postventa"],
    ["/trabaja-con-nosotros", "careers"],
    ["/no-existe", "other"],
    ["/admin/vehiculos", "other"],
  ])("%s → %s", (ruta, esperado) => {
    expect(locationFromPathname(ruta)).toBe(esperado);
  });

  it("toda sección que devuelve existe en LOCATIONS (nunca undefined)", () => {
    const valores = new Set(Object.values(LOCATIONS));
    for (const r of ["/", "/0km", "/x", "/usados/a", "/planes/b", "/postventa", "/trabaja-con-nosotros"]) {
      expect(valores.has(locationFromPathname(r)), r).toBe(true);
    }
  });
});
