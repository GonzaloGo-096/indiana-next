/**
 * @vitest-environment jsdom
 *
 * Tests de la sesión del panel admin.
 *
 * Es el camino que acabamos de arreglar (el login pasó a salir por nuestro
 * servidor) y no tenía ninguna prueba. Acá se decide si alguien entra, si sigue
 * adentro, y cuándo se lo saca.
 *
 * Se prueba el hook montado de verdad, no la lógica suelta: lo delicado no son
 * las cuentas sino el orden de las cosas — qué queda guardado, cuándo se limpia
 * y cuándo se redirige.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

/**
 * El router tiene que ser SIEMPRE el mismo objeto.
 *
 * useAuth encadena logout -> checkAuthStatus -> useEffect por identidad de
 * referencia. Devolver `{ push }` nuevo en cada render hace que el efecto se
 * dispare en bucle hasta tumbar el proceso (pasó: 156 segundos y el worker
 * muerto). El useRouter real de Next devuelve un objeto estable, así que la
 * simulación tiene que hacer lo mismo para probar la situación real.
 */
const { push, router } = vi.hoisted(() => {
  const push = vi.fn();
  return { push, router: { push } };
});

vi.mock("next/navigation", () => ({ useRouter: () => router }));

const login = vi.fn();
const clearLocalStorage = vi.fn(() => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
});
vi.mock("@/lib/services/authService", () => ({
  authService: {
    login: (...a) => login(...a),
    clearLocalStorage: (...a) => clearLocalStorage(...a),
  },
}));

const { useAuth } = await import("@/hooks/useAuth");

/** Arma un token con la fecha de vencimiento que se le pida. */
function token(segundosDesdeAhora) {
  const exp = Math.floor(Date.now() / 1000) + segundosDesdeAhora;
  const payload = Buffer.from(JSON.stringify({ exp, id: "u1" })).toString("base64");
  return `cabecera.${payload}.firma`;
}

const VIGENTE = () => token(3600);
const VENCIDO = () => token(-3600);
const USUARIO = { username: "indiana-preview", role: "user" };

function sesionGuardada(t = VIGENTE(), u = USUARIO) {
  localStorage.setItem("auth_token", t);
  localStorage.setItem("auth_user", JSON.stringify(u));
}

beforeEach(() => {
  localStorage.clear();
  push.mockClear();
  login.mockReset();
  clearLocalStorage.mockClear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Monta el hook y espera a que termine la comprobación inicial. */
async function montar() {
  const vista = renderHook(() => useAuth());
  await waitFor(() => expect(vista.result.current.isLoading).toBe(false));
  return vista;
}

describe("al abrir el panel", () => {
  it("sin sesión guardada queda afuera, sin error", async () => {
    const { result } = await montar();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("con sesión vigente la recupera sin volver a pedir la clave", async () => {
    sesionGuardada();
    const { result } = await montar();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(USUARIO);
    expect(login).not.toHaveBeenCalled();
  });

  it("con la sesión vencida la cierra y manda al login", async () => {
    sesionGuardada(VENCIDO());
    const { result } = await montar();

    expect(result.current.isAuthenticated).toBe(false);
    expect(clearLocalStorage).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/admin/login");
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("con los datos del usuario corruptos también cierra la sesión", async () => {
    localStorage.setItem("auth_token", VIGENTE());
    localStorage.setItem("auth_user", "{no es json");

    const { result } = await montar();
    expect(result.current.isAuthenticated).toBe(false);
    expect(push).toHaveBeenCalledWith("/admin/login");
  });

  it("un token con formato inválido se trata como vencido", async () => {
    sesionGuardada("no-es-un-token");
    const { result } = await montar();
    expect(result.current.isAuthenticated).toBe(false);
    expect(push).toHaveBeenCalledWith("/admin/login");
  });

  it("token sin usuario guardado: no entra", async () => {
    localStorage.setItem("auth_token", VIGENTE());
    const { result } = await montar();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe("entrar", () => {
  it("con credenciales correctas guarda la sesión y entra", async () => {
    login.mockResolvedValue({
      success: true,
      data: { token: VIGENTE(), user: USUARIO },
    });

    const { result } = await montar();

    let salida;
    await act(async () => {
      salida = await result.current.login({ username: "x", password: "y" });
    });

    expect(salida).toEqual({ success: true, data: USUARIO });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(USUARIO);
    expect(JSON.parse(localStorage.getItem("auth_user"))).toEqual(USUARIO);
    expect(localStorage.getItem("auth_token")).toBeTruthy();
  });

  it("con credenciales incorrectas muestra el error y no guarda nada", async () => {
    login.mockResolvedValue({ success: false, message: "invalid credentials" });

    const { result } = await montar();
    let salida;
    await act(async () => {
      salida = await result.current.login({ username: "x", password: "mal" });
    });

    expect(salida).toEqual({ success: false, error: "invalid credentials" });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe("invalid credentials");
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("si el servidor manda un token ya vencido, no lo acepta", async () => {
    login.mockResolvedValue({
      success: true,
      data: { token: VENCIDO(), user: USUARIO },
    });

    const { result } = await montar();
    let salida;
    await act(async () => {
      salida = await result.current.login({ username: "x", password: "y" });
    });

    expect(salida.success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("si el servicio explota, devuelve el error en vez de romper la pantalla", async () => {
    login.mockRejectedValue(new Error("No se pudo conectar con el servidor"));

    const { result } = await montar();
    let salida;
    await act(async () => {
      salida = await result.current.login({ username: "x", password: "y" });
    });

    expect(salida).toEqual({
      success: false,
      error: "No se pudo conectar con el servidor",
    });
    expect(result.current.error).toBe("No se pudo conectar con el servidor");
  });

  it("un intento nuevo limpia el error del anterior", async () => {
    login.mockResolvedValue({ success: false, message: "mal" });
    const { result } = await montar();

    await act(async () => {
      await result.current.login({ username: "x", password: "1" });
    });
    expect(result.current.error).toBe("mal");

    login.mockResolvedValue({ success: true, data: { token: VIGENTE(), user: USUARIO } });
    await act(async () => {
      await result.current.login({ username: "x", password: "2" });
    });
    expect(result.current.error).toBeNull();
  });

  it("deja de cargar aunque el login falle", async () => {
    login.mockRejectedValue(new Error("caída"));
    const { result } = await montar();

    await act(async () => {
      await result.current.login({ username: "x", password: "y" });
    });
    expect(result.current.isLoading).toBe(false);
  });
});

describe("salir", () => {
  it("limpia la sesión y manda al login", async () => {
    sesionGuardada();
    const { result } = await montar();
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(push).toHaveBeenCalledWith("/admin/login");
  });

  it("si la redirección falla, la sesión igual queda cerrada", async () => {
    push.mockImplementationOnce(() => {
      throw new Error("router caído");
    });
    sesionGuardada();
    const { result } = await montar();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe("el backend rechaza la credencial mientras se navega", () => {
  it("el aviso de no autorizado cierra la sesión", async () => {
    sesionGuardada();
    const { result } = await montar();
    expect(result.current.isAuthenticated).toBe(true);

    // Lo emite el interceptor de axios ante un 401.
    await act(async () => {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(push).toHaveBeenCalledWith("/admin/login");
  });

  it("deja de escuchar al desmontarse, sin quedar colgado", async () => {
    sesionGuardada();
    const { result, unmount } = await montar();
    unmount();

    // Si el listener siguiera vivo, esto intentaría actualizar un hook muerto.
    expect(() => {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }).not.toThrow();
    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe("getToken", () => {
  it("devuelve el token cuando está vigente", async () => {
    const t = VIGENTE();
    sesionGuardada(t);
    const { result } = await montar();
    expect(result.current.getToken()).toBe(t);
  });

  it("devuelve null si está vencido, para no mandarlo al backend", async () => {
    const { result } = await montar();
    localStorage.setItem("auth_token", VENCIDO());
    expect(result.current.getToken()).toBeNull();
  });

  it("devuelve null si no hay ninguno", async () => {
    const { result } = await montar();
    expect(result.current.getToken()).toBeNull();
  });
});

describe("clearError", () => {
  it("borra el error sin tocar la sesión", async () => {
    login.mockResolvedValue({ success: false, message: "mal" });
    sesionGuardada();
    const { result } = await montar();

    await act(async () => {
      await result.current.login({ username: "x", password: "y" });
    });
    expect(result.current.error).toBe("mal");

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
