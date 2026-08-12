/**
 * @vitest-environment jsdom
 *
 * Tests del guardado de autos desde el panel.
 *
 * Es lo único del sitio que ESCRIBE datos reales: alta, edición y baja. Un
 * error acá no se ve en pantalla, se descubre después mirando el catálogo.
 *
 * Lo que se cubre no es "llama al backend" sino lo que pasa alrededor: que no
 * se envíe nada sin credencial, que se refresque el sitio público después de
 * guardar, y que si ese refresco falla el auto quede anotado como pendiente en
 * vez de perderse en silencio.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

const m = vi.hoisted(() => ({
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  revalidatePublicCache: vi.fn(),
  addDirtyVehicleId: vi.fn(),
  removeDirtyVehicleId: vi.fn(),
}));

vi.mock("@/lib/services/vehiclesAdminService", () => ({
  default: {
    createVehicle: (...a) => m.createVehicle(...a),
    updateVehicle: (...a) => m.updateVehicle(...a),
    deleteVehicle: (...a) => m.deleteVehicle(...a),
  },
}));

vi.mock("@/lib/admin/revalidatePublicCache", () => ({
  revalidatePublicCache: (...a) => m.revalidatePublicCache(...a),
}));

vi.mock("@/utils/dirtyVehicleIds", () => ({
  addDirtyVehicleId: (...a) => m.addDirtyVehicleId(...a),
  removeDirtyVehicleId: (...a) => m.removeDirtyVehicleId(...a),
}));

const { useCarMutation } = await import("@/hooks/admin/useCarMutation");

const ID = "6a4c11e6d45c59d8d59ab12a";

function montar() {
  const cliente = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const envoltorio = ({ children }) =>
    createElement(QueryClientProvider, { client: cliente }, children);
  return { ...renderHook(() => useCarMutation(), { wrapper: envoltorio }), cliente };
}

function formData() {
  const fd = new FormData();
  fd.append("marca", "Peugeot");
  return fd;
}

beforeEach(() => {
  localStorage.clear();
  Object.values(m).forEach((fn) => fn.mockReset());
  m.revalidatePublicCache.mockResolvedValue(true);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const conCredencial = () => localStorage.setItem("auth_token", "un-token");

describe("no se envía nada sin credencial", () => {
  it("el alta ni siquiera llama al servicio", async () => {
    const { result } = montar();
    await act(async () => {
      await expect(result.current.createMutation.mutateAsync(formData())).rejects.toThrow(
        /token de autorización/,
      );
    });
    expect(m.createVehicle).not.toHaveBeenCalled();
  });

  it("la edición tampoco", async () => {
    const { result } = montar();
    await act(async () => {
      await expect(
        result.current.updateMutation.mutateAsync({ id: ID, formData: formData() }),
      ).rejects.toThrow(/token de autorización/);
    });
    expect(m.updateVehicle).not.toHaveBeenCalled();
  });

  it("la baja tampoco", async () => {
    const { result } = montar();
    await act(async () => {
      await expect(result.current.deleteMutation.mutateAsync(ID)).rejects.toThrow(
        /token de autorización/,
      );
    });
    expect(m.deleteVehicle).not.toHaveBeenCalled();
  });
});

describe("no se envía cualquier cosa", () => {
  it("el alta rechaza algo que no sea un formulario", async () => {
    conCredencial();
    const { result } = montar();
    await act(async () => {
      await expect(
        result.current.createMutation.mutateAsync({ marca: "Peugeot" }),
      ).rejects.toThrow(/se esperaba FormData/);
    });
    expect(m.createVehicle).not.toHaveBeenCalled();
  });

  it("la edición también", async () => {
    conCredencial();
    const { result } = montar();
    await act(async () => {
      await expect(
        result.current.updateMutation.mutateAsync({ id: ID, formData: "texto" }),
      ).rejects.toThrow(/se esperaba FormData/);
    });
    expect(m.updateVehicle).not.toHaveBeenCalled();
  });
});

describe("alta de un auto", () => {
  it("envía el formulario y devuelve lo que contestó el backend", async () => {
    conCredencial();
    m.createVehicle.mockResolvedValue({ _id: ID, marca: "Peugeot" });

    const { result } = montar();
    const fd = formData();
    let salida;
    await act(async () => {
      salida = await result.current.createMutation.mutateAsync(fd);
    });

    expect(m.createVehicle).toHaveBeenCalledWith(fd);
    expect(salida).toEqual({ _id: ID, marca: "Peugeot" });
  });

  it("refresca el sitio público con el id del auto nuevo", async () => {
    conCredencial();
    m.createVehicle.mockResolvedValue({ _id: ID });

    const { result } = montar();
    await act(async () => {
      await result.current.createMutation.mutateAsync(formData());
    });

    await waitFor(() =>
      expect(m.revalidatePublicCache).toHaveBeenCalledWith({
        vehicleIds: [ID],
        revalidateList: true,
        warmup: true,
      }),
    );
  });

  it("si el backend no devuelve el id, igual refresca el listado", async () => {
    conCredencial();
    // Pasa de verdad: el backend puede responder 200 con la cadena "true".
    m.createVehicle.mockResolvedValue("true");

    const { result } = montar();
    await act(async () => {
      await result.current.createMutation.mutateAsync(formData());
    });

    await waitFor(() =>
      expect(m.revalidatePublicCache).toHaveBeenCalledWith({
        vehicleIds: [],
        revalidateList: true,
        warmup: true,
      }),
    );
    // Sin id no hay nada que anotar como pendiente.
    expect(m.addDirtyVehicleId).not.toHaveBeenCalled();
  });

  it("un fallo del backend se propaga y no refresca nada", async () => {
    conCredencial();
    m.createVehicle.mockRejectedValue(new Error("Error de validación"));

    const { result } = montar();
    await act(async () => {
      await expect(result.current.createMutation.mutateAsync(formData())).rejects.toThrow(
        "Error de validación",
      );
    });
    expect(m.revalidatePublicCache).not.toHaveBeenCalled();
  });
});

describe("edición de un auto", () => {
  it("manda el id y el formulario por separado", async () => {
    conCredencial();
    m.updateVehicle.mockResolvedValue({ _id: ID });

    const { result } = montar();
    const fd = formData();
    await act(async () => {
      await result.current.updateMutation.mutateAsync({ id: ID, formData: fd });
    });

    expect(m.updateVehicle).toHaveBeenCalledWith(ID, fd);
  });

  it("refresca usando el id que se editó, no el que devuelva el backend", async () => {
    conCredencial();
    // El backend podría contestar otra cosa; manda el id que se pidió editar.
    m.updateVehicle.mockResolvedValue({ _id: "otro-id-distinto" });

    const { result } = montar();
    await act(async () => {
      await result.current.updateMutation.mutateAsync({ id: ID, formData: formData() });
    });

    await waitFor(() =>
      expect(m.revalidatePublicCache).toHaveBeenCalledWith({
        vehicleIds: [ID],
        revalidateList: true,
        warmup: true,
      }),
    );
  });
});

describe("baja de un auto", () => {
  it("devuelve lo que contestó el backend", async () => {
    conCredencial();
    m.deleteVehicle.mockResolvedValue({ error: null, msg: "Auto eliminado" });

    const { result } = montar();
    let salida;
    await act(async () => {
      salida = await result.current.deleteMutation.mutateAsync(ID);
    });

    // Antes acá se devolvía `undefined`: el servicio ya entrega el JSON del
    // backend y el hook le volvía a pedir `.data`.
    expect(salida).toEqual({ error: null, msg: "Auto eliminado" });
  });

  it("refresca el sitio público después de borrar", async () => {
    conCredencial();
    m.deleteVehicle.mockResolvedValue({ error: null });

    const { result } = montar();
    await act(async () => {
      await result.current.deleteMutation.mutateAsync(ID);
    });

    await waitFor(() => expect(m.revalidatePublicCache).toHaveBeenCalled());
  });
});

describe("cuando el refresco del sitio público falla", () => {
  it("el auto queda anotado como pendiente, no se pierde", async () => {
    conCredencial();
    m.createVehicle.mockResolvedValue({ _id: ID });
    m.revalidatePublicCache.mockResolvedValue(false);

    const { result } = montar();
    await act(async () => {
      await result.current.createMutation.mutateAsync(formData());
    });

    await waitFor(() => expect(m.addDirtyVehicleId).toHaveBeenCalledWith(ID));
    expect(m.removeDirtyVehicleId).not.toHaveBeenCalled();
  });

  it("si sale bien, se saca de pendientes", async () => {
    conCredencial();
    m.createVehicle.mockResolvedValue({ _id: ID });
    m.revalidatePublicCache.mockResolvedValue(true);

    const { result } = montar();
    await act(async () => {
      await result.current.createMutation.mutateAsync(formData());
    });

    await waitFor(() => expect(m.removeDirtyVehicleId).toHaveBeenCalledWith(ID));
    expect(m.addDirtyVehicleId).not.toHaveBeenCalled();
  });

  it("que falle el refresco NO hace fallar el guardado", async () => {
    conCredencial();
    m.updateVehicle.mockResolvedValue({ _id: ID });
    m.revalidatePublicCache.mockResolvedValue(false);

    const { result } = montar();
    let salida;
    await act(async () => {
      salida = await result.current.updateMutation.mutateAsync({ id: ID, formData: formData() });
    });

    // El auto se guardó: lo que falló es solo el refresco de la caché.
    expect(salida).toEqual({ _id: ID });
    expect(result.current.updateMutation.isError).toBe(false);
  });
});

describe("el listado del panel se entera de los cambios", () => {
  it("después de un alta se invalida la lista de vehículos", async () => {
    conCredencial();
    m.createVehicle.mockResolvedValue({ _id: ID });

    const { result, cliente } = montar();
    const invalidar = vi.spyOn(cliente, "invalidateQueries");

    await act(async () => {
      await result.current.createMutation.mutateAsync(formData());
    });

    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["vehicles"] });
  });

  it("después de una edición se invalida también la ficha de ese auto", async () => {
    conCredencial();
    m.updateVehicle.mockResolvedValue({ _id: ID });

    const { result, cliente } = montar();
    const invalidar = vi.spyOn(cliente, "invalidateQueries");

    await act(async () => {
      await result.current.updateMutation.mutateAsync({ id: ID, formData: formData() });
    });

    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["vehicles"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["vehicle", ID] });
  });

  it("después de una baja se saca la ficha de la caché", async () => {
    conCredencial();
    m.deleteVehicle.mockResolvedValue({ error: null });

    const { result, cliente } = montar();
    const quitar = vi.spyOn(cliente, "removeQueries");

    await act(async () => {
      await result.current.deleteMutation.mutateAsync(ID);
    });

    expect(quitar).toHaveBeenCalledWith({ queryKey: ["vehicle", ID] });
  });
});
