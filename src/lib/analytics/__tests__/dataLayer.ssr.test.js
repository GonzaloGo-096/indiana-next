/**
 * @vitest-environment node
 *
 * Propuesto: en el servidor (sin window) nada del módulo de medición lanza ni
 * guarda estado. Los componentes cliente también se prerenderizan en el server.
 */
import { describe, it, expect } from "vitest";
import { track, pushGtagCommand } from "@/lib/analytics/dataLayer";
import { setPageItem, getPageItem } from "@/lib/analytics/pageItem";

describe("sin window", () => {
  it("track y pushGtagCommand no hacen nada y no lanzan", () => {
    expect(() => track("page_view", { a: 1 })).not.toThrow();
    expect(() => pushGtagCommand("consent", "default", {})).not.toThrow();
  });

  it("pageItem no devuelve un auto en el server (getter protegido)", () => {
    setPageItem({ item_id: "x" });
    expect(getPageItem()).toBeNull();
  });
});
