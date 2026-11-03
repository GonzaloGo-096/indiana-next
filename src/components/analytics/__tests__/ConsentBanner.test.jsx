/**
 * @vitest-environment jsdom
 *
 * La elección de cookies la toma solo la persona, con un botón. Antes Escape
 * en cualquier parte de la página (cerrar la galería, un menú) guardaba
 * "rechazado", y con identidad por dispositivo esa visita desaparecía de GA4.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import ConsentBanner from "../ConsentBanner";
import { CONSENT_STORAGE_KEY } from "@/lib/analytics/consent";

function guardado() {
  return JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) || "null");
}

beforeEach(() => {
  window.localStorage.clear();
  window.dataLayer = [];
});

afterEach(cleanup);

describe("ConsentBanner", () => {
  it("Escape no decide nada: el banner sigue y no se guarda elección", () => {
    const { getByRole } = render(<ConsentBanner />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(getByRole("dialog")).toBeTruthy();
    expect(guardado()).toBeNull();
  });

  it("el foco va al aviso, no a un botón: Enter o Espacio no aceptan sin querer", async () => {
    const { getByRole, getByText } = render(<ConsentBanner />);
    await new Promise((r) => setTimeout(r, 100));
    expect(document.activeElement).not.toBe(getByText("Aceptar todas"));
    expect(document.activeElement).toBe(getByRole("dialog"));
  });

  it("Rechazar guarda las dos categorías en no", () => {
    const { getByText, queryByRole } = render(<ConsentBanner />);
    fireEvent.click(getByText("Rechazar"));
    expect(guardado()).toMatchObject({ analytics: false, ads: false });
    expect(queryByRole("dialog")).toBeNull();
  });

  it("Aceptar todas guarda las dos categorías en sí", () => {
    const { getByText, queryByRole } = render(<ConsentBanner />);
    fireEvent.click(getByText("Aceptar todas"));
    expect(guardado()).toMatchObject({ analytics: true, ads: true });
    expect(queryByRole("dialog")).toBeNull();
  });
});
