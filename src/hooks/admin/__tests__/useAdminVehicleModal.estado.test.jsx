/**
 * @vitest-environment jsdom
 *
 * Guardar una edición con cambio de estado (Disponible ⇄ Vendido).
 *
 * Lo que se fija:
 * - El estado va por su operación y ANTES que el guardado de datos: el
 *   guardado borra el caché del backend y así cubre también el estado.
 * - Si el estado no cambió, no se llama a esa operación.
 * - Si falla el estado, no se guarda nada; si falla el guardado después, el
 *   mensaje dice que el estado sí quedó cambiado.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const ID = "6ab26f0973c7ebf8ffbe4285";

const getVehicleById = vi.fn();
vi.mock("@/lib/services/vehiclesApi", () => ({ default: { getVehicleById } }));

const { useAdminVehicleModal } = await import("../useAdminVehicleModal");

function montar({ estadoActual = "ACTIVO", statusFalla, updateFalla } = {}) {
  getVehicleById.mockResolvedValue({
    getOnePhoto: { _id: ID, marca: "Peugeot", modelo: "208", estado: estadoActual },
  });
  const orden = [];
  const statusMutation = {
    mutateAsync: vi.fn(async (v) => {
      orden.push(["estado", v]);
      if (statusFalla) throw statusFalla;
    }),
  };
  const updateMutation = {
    mutateAsync: vi.fn(async (v) => {
      orden.push(["datos", v.id]);
      if (updateFalla) throw updateFalla;
    }),
  };
  const refetch = vi.fn();
  const { result } = renderHook(() =>
    useAdminVehicleModal({ createMutation: {}, updateMutation, statusMutation, refetch }),
  );
  return { result, orden, statusMutation, updateMutation, refetch };
}

async function editarYGuardar(result, estado) {
  await act(() => result.current.openEdit({ _id: ID }));
  await act(() => result.current.submitFormData(new FormData(), { estado }));
}

beforeEach(() => vi.clearAllMocks());

describe("editar con cambio de estado", () => {
  it("abre el formulario con el estado actual del auto", async () => {
    const { result } = montar({ estadoActual: "VENDIDO" });
    await act(() => result.current.openEdit({ _id: ID }));
    expect(result.current.modalState.initialData.estado).toBe("VENDIDO");
  });

  it("un auto sin estado (backend de producción) abre como Disponible", async () => {
    const { result } = montar({ estadoActual: undefined });
    await act(() => result.current.openEdit({ _id: ID }));
    expect(result.current.modalState.initialData.estado).toBe("ACTIVO");
  });

  it("marcar como vendido: primero el estado, después los datos, y cierra", async () => {
    const { result, orden, refetch } = montar();
    await editarYGuardar(result, "VENDIDO");

    expect(orden).toEqual([
      ["estado", { id: ID, estado: "VENDIDO" }],
      ["datos", ID],
    ]);
    expect(refetch).toHaveBeenCalled();
    expect(result.current.modalState.isOpen).toBe(false);
  });

  it("volver a Disponible funciona igual", async () => {
    const { result, orden } = montar({ estadoActual: "VENDIDO" });
    await editarYGuardar(result, "ACTIVO");
    expect(orden[0]).toEqual(["estado", { id: ID, estado: "ACTIVO" }]);
  });

  it("si el estado no cambió, solo se guardan los datos", async () => {
    const { result, statusMutation, updateMutation } = montar({ estadoActual: "VENDIDO" });
    await editarYGuardar(result, "VENDIDO");

    expect(statusMutation.mutateAsync).not.toHaveBeenCalled();
    expect(updateMutation.mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("si falla el estado no se guarda nada y se explica por qué", async () => {
    const falla = Object.assign(new Error("Request failed with status code 501"), {
      response: { data: { msg: "El backend todavía no permite cambiar el estado de un auto." } },
    });
    const { result, updateMutation } = montar({ statusFalla: falla });
    await editarYGuardar(result, "VENDIDO");

    expect(updateMutation.mutateAsync).not.toHaveBeenCalled();
    expect(result.current.modalState.error).toBe(
      "No se pudo cambiar el estado. No se guardó ningún cambio: El backend todavía no permite cambiar el estado de un auto.",
    );
    expect(result.current.modalState.isOpen).toBe(true);
  });

  it("si el estado se cambió pero fallan los datos, lo dice y refresca la lista", async () => {
    const { result, refetch } = montar({ updateFalla: new Error("HTTP 500") });
    await editarYGuardar(result, "VENDIDO");

    expect(result.current.modalState.error).toBe(
      'El auto quedó como "Vendido", pero no se pudieron guardar los demás cambios: HTTP 500',
    );
    expect(refetch).toHaveBeenCalled();
  });
});
