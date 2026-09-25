/**
 * @vitest-environment jsdom
 *
 * Estados en la lista del panel: etiqueta y filtro.
 *
 * - Los autos no disponibles muestran su etiqueta ("Vendido", "Pausado"); los
 *   disponibles, ninguna.
 * - El filtro cuenta cuántos hay en cada estado y muestra solo esos.
 * - Filtrar es solo de vista: no llama a nada.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AdminInventorySection from "../AdminInventorySection";
import { toAdminListItem } from "@/mappers/admin/toAdminListItem";

afterEach(cleanup);

const autos = [
  { _id: "a1", marca: "Peugeot", modelo: "208", estado: "ACTIVO" },
  { _id: "a2", marca: "Ford", modelo: "Ka" }, // sin estado → Disponible
  { _id: "v1", marca: "Toyota", modelo: "Corolla", estado: "VENDIDO" },
  { _id: "p1", marca: "Fiat", modelo: "Cronos", estado: "PAUSADO" },
].map(toAdminListItem);

const montar = () =>
  render(<AdminInventorySection items={autos} onEdit={() => {}} onDelete={() => {}} />);

const tarjetas = () => screen.getAllByRole("listitem");
const boton = (nombre) => screen.getByRole("button", { name: new RegExp(`^${nombre}`) });

describe("lista del panel: estados", () => {
  it("muestra la etiqueta solo en los autos no disponibles", () => {
    montar();
    const etiquetas = tarjetas().map((li) => li.querySelector("[data-estado]")?.textContent ?? null);
    expect(etiquetas).toEqual([null, null, "Vendido", "Pausado"]);
  });

  it("el filtro cuenta cuántos hay en cada estado", () => {
    montar();
    expect(boton("Todos").textContent).toBe("Todos4");
    expect(boton("Disponible").textContent).toBe("Disponible2");
    expect(boton("Vendido").textContent).toBe("Vendido1");
    expect(boton("Pausado").textContent).toBe("Pausado1");
  });

  it("al elegir un estado muestra solo esos, y el contador de unidades acompaña", () => {
    montar();
    fireEvent.click(boton("Pausado"));

    expect(tarjetas()).toHaveLength(1);
    expect(tarjetas()[0].textContent).toContain("Fiat");
    expect(screen.getByText("1 unidades")).toBeTruthy();
    expect(boton("Pausado").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(boton("Todos"));
    expect(tarjetas()).toHaveLength(4);
  });

  it("un estado sin autos dice cuál está vacío", () => {
    render(
      <AdminInventorySection items={autos.filter((a) => a.estado !== "PAUSADO")} onEdit={() => {}} onDelete={() => {}} />
    );
    fireEvent.click(boton("Pausado"));
    expect(screen.getByText('No hay vehículos en estado "Pausado"')).toBeTruthy();
  });
});
