/**
 * @vitest-environment jsdom
 *
 * El buscador del selector arranca vacío cada vez que se abre.
 *
 * Antes lo limpiaba un efecto al cerrar; ahora se limpia en el click que abre
 * (así el efecto solo enfoca, sin cambiar estado por su cuenta). Lo que se fija
 * es lo que ve el usuario: escribir, cerrar, volver a abrir → buscador vacío y
 * todas las opciones de nuevo.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import MultiSelect from "../MultiSelect";

afterEach(cleanup);

const OPCIONES = ["Peugeot", "Ford", "Toyota"];

function montar() {
  render(<MultiSelect label="Marca" options={OPCIONES} value={[]} onChange={() => {}} searchable />);
  return screen.getByRole("button", { name: "Marca selector" });
}

describe("MultiSelect con buscador", () => {
  it("al abrir muestra el buscador vacío y todas las opciones", () => {
    fireEvent.click(montar());

    expect(screen.getByRole("searchbox", { name: "Buscar…" }).value).toBe("");
    for (const marca of OPCIONES) expect(screen.getByText(marca)).toBeTruthy();
  });

  it("filtra mientras se escribe", () => {
    fireEvent.click(montar());
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar…" }), { target: { value: "peu" } });

    expect(screen.getByText("Peugeot")).toBeTruthy();
    expect(screen.queryByText("Ford")).toBeNull();
  });

  it("al cerrar y volver a abrir, el buscador arranca vacío otra vez", () => {
    const boton = montar();
    fireEvent.click(boton);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar…" }), { target: { value: "peu" } });

    fireEvent.click(boton); // cierra
    fireEvent.click(boton); // abre

    expect(screen.getByRole("searchbox", { name: "Buscar…" }).value).toBe("");
    expect(screen.getByText("Ford")).toBeTruthy();
  });
});
