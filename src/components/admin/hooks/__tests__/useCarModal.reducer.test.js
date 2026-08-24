/**
 * Tests del estado del modal de carga/edición del panel admin.
 *
 * Función pura, sin React: acá se decide si el formulario abre en modo alta o
 * edición, con qué datos, y cómo se muestran carga y error.
 */

import { describe, it, expect } from "vitest";
import {
  carModalReducer,
  initialCarModalState,
  openCreateForm,
  openEditForm,
  closeModal,
  setLoading,
  setError,
  clearError,
} from "@/components/admin/hooks/useCarModal.reducer";

const inicial = () => ({ ...initialCarModalState });

describe("estado inicial", () => {
  it("empieza cerrado, en alta y sin error", () => {
    expect(initialCarModalState).toEqual({
      isOpen: false,
      mode: "create",
      initialData: null,
      loading: false,
      error: null,
    });
  });
});

describe("abrir para dar de alta", () => {
  it("abre en modo alta y sin datos previos", () => {
    const s = carModalReducer(inicial(), openCreateForm());
    expect(s).toMatchObject({ isOpen: true, mode: "create", initialData: null });
  });

  it("limpia los datos de una edición anterior", () => {
    const previo = { ...inicial(), mode: "edit", initialData: { id: "abc", marca: "Peugeot" } };
    const s = carModalReducer(previo, openCreateForm());
    expect(s.initialData).toBeNull();
    expect(s.mode).toBe("create");
  });

  it("limpia el error de un intento anterior", () => {
    const previo = { ...inicial(), error: "Falló el guardado", loading: true };
    const s = carModalReducer(previo, openCreateForm());
    expect(s.error).toBeNull();
    expect(s.loading).toBe(false);
  });
});

describe("abrir para editar", () => {
  it("abre en modo edición con los datos del auto", () => {
    const auto = { id: "6a4c11e6d45c59d8d59ab12a", marca: "Toyota", modelo: "208" };
    const s = carModalReducer(inicial(), openEditForm(auto));
    expect(s).toMatchObject({ isOpen: true, mode: "edit", initialData: auto });
  });

  it("pasa los datos tal cual, sin copiarlos ni recortarlos", () => {
    const auto = { id: "x", anidado: { color: "azul" } };
    const s = carModalReducer(inicial(), openEditForm(auto));
    expect(s.initialData).toBe(auto);
  });

  it("editar después de un error arranca limpio", () => {
    const previo = { ...inicial(), error: "Error de red", loading: true };
    const s = carModalReducer(previo, openEditForm({ id: "x" }));
    expect(s.error).toBeNull();
    expect(s.loading).toBe(false);
  });
});

describe("cerrar", () => {
  it("vuelve exactamente al estado inicial", () => {
    const previo = {
      isOpen: true,
      mode: "edit",
      initialData: { id: "x" },
      loading: true,
      error: "algo",
    };
    expect(carModalReducer(previo, closeModal())).toEqual(initialCarModalState);
  });

  it("no deja los datos del auto colgados después de cerrar", () => {
    const previo = { ...inicial(), isOpen: true, mode: "edit", initialData: { id: "x" } };
    expect(carModalReducer(previo, closeModal()).initialData).toBeNull();
  });
});

describe("carga y error", () => {
  it("marcar carga limpia el error anterior", () => {
    const previo = { ...inicial(), error: "Falló antes" };
    const s = carModalReducer(previo, setLoading());
    expect(s).toMatchObject({ loading: true, error: null });
  });

  it("un error corta la carga y guarda el mensaje", () => {
    const previo = { ...inicial(), loading: true };
    const s = carModalReducer(previo, setError("El backend no respondió"));
    expect(s).toMatchObject({ loading: false, error: "El backend no respondió" });
  });

  it("el error no cierra el modal: el usuario tiene que poder reintentar", () => {
    const previo = { ...inicial(), isOpen: true, mode: "edit", initialData: { id: "x" } };
    const s = carModalReducer(previo, setError("Falló"));
    expect(s.isOpen).toBe(true);
    expect(s.mode).toBe("edit");
    expect(s.initialData).toEqual({ id: "x" });
  });

  it("limpiar el error no toca nada más", () => {
    const previo = { ...inicial(), isOpen: true, mode: "edit", loading: true, error: "x" };
    const s = carModalReducer(previo, clearError());
    expect(s).toMatchObject({ isOpen: true, mode: "edit", loading: true, error: null });
  });
});

describe("acción desconocida", () => {
  it("devuelve el mismo estado, sin copiarlo", () => {
    const s = inicial();
    expect(carModalReducer(s, { type: "NO_EXISTE" })).toBe(s);
  });
});

describe("los creadores de acción arman lo que el reductor espera", () => {
  it("cada uno lleva su tipo y su dato", () => {
    expect(openCreateForm()).toEqual({ type: "OPEN_CREATE_FORM" });
    expect(openEditForm({ id: "x" })).toEqual({
      type: "OPEN_EDIT_FORM",
      payload: { id: "x" },
    });
    expect(closeModal()).toEqual({ type: "CLOSE_MODAL" });
    expect(setLoading()).toEqual({ type: "SET_LOADING" });
    expect(setError("m")).toEqual({ type: "SET_ERROR", payload: "m" });
    expect(clearError()).toEqual({ type: "CLEAR_ERROR" });
  });
});

describe("recorrido completo de una edición", () => {
  it("abrir, guardar, fallar, reintentar y cerrar", () => {
    const auto = { id: "6a4c11e6d45c59d8d59ab12a", marca: "Honda" };

    let s = carModalReducer(initialCarModalState, openEditForm(auto));
    expect(s.isOpen).toBe(true);

    s = carModalReducer(s, setLoading());
    expect(s.loading).toBe(true);

    s = carModalReducer(s, setError("Se cortó la conexión"));
    expect(s).toMatchObject({ loading: false, error: "Se cortó la conexión", isOpen: true });

    // El auto sigue cargado: se puede reintentar sin volver a abrir.
    expect(s.initialData).toBe(auto);

    s = carModalReducer(s, setLoading());
    expect(s.error).toBeNull();

    s = carModalReducer(s, closeModal());
    expect(s).toEqual(initialCarModalState);
  });
});
