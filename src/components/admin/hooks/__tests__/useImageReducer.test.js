/**
 * Tests del estado de imágenes del panel admin.
 *
 * Es la lógica más delicada del proyecto: de acá sale qué foto se sube, cuál se
 * conserva y cuál se borra en Cloudinary. Tenía 653 líneas y ninguna prueba.
 *
 * Se testea la función pura (imageReducer), no el hook: no hace falta React
 * para verificar transiciones de estado, y así la red de seguridad no depende
 * de montar componentes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  imageReducer,
  createInitialImageState,
  isImagePipelineBlocked,
  revokePreviewUrlsInState,
  IMAGE_ACTIONS,
  ALL_IMAGE_FIELDS,
} from "@/components/admin/hooks/useImageReducer";

const inicial = () => createInitialImageState();
const accion = (type, payload) => ({ type, payload });

describe("estado inicial", () => {
  it("arranca con las dos fotos principales vacías", () => {
    const s = inicial();
    expect(ALL_IMAGE_FIELDS).toEqual(["fotoPrincipal", "fotoHover"]);
    for (const k of ALL_IMAGE_FIELDS) {
      expect(s[k]).toMatchObject({
        existingUrl: "",
        file: null,
        remove: false,
        processStatus: "idle",
        previewUrl: null,
      });
    }
    expect(s.fotosExtra).toEqual([]);
    expect(s.existingExtras).toEqual([]);
  });

  it("cada llamada devuelve un objeto nuevo, no uno compartido", () => {
    const a = inicial();
    const b = inicial();
    expect(a).not.toBe(b);
    expect(a.fotoPrincipal).not.toBe(b.fotoPrincipal);
    expect(a.fotosExtra).not.toBe(b.fotosExtra);
  });
});

describe("alta de un auto (INIT_CREATE / RESET)", () => {
  it("INIT_CREATE limpia cualquier estado previo", () => {
    const sucio = {
      ...inicial(),
      fotoPrincipal: { ...inicial().fotoPrincipal, existingUrl: "https://x/a.webp" },
      fotosExtra: [{ file: {} }],
    };
    expect(imageReducer(sucio, accion(IMAGE_ACTIONS.INIT_CREATE))).toEqual(inicial());
  });

  it("RESET deja el mismo estado que el inicial", () => {
    const sucio = { ...inicial(), existingExtras: [{ url: "u", remove: true }] };
    expect(imageReducer(sucio, accion(IMAGE_ACTIONS.RESET))).toEqual(inicial());
  });
});

describe("edición de un auto (INIT_EDIT)", () => {
  it("acepta las fotos como texto plano", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.INIT_EDIT, {
        urls: { fotoPrincipal: "https://x/p.webp", fotoHover: "https://x/h.webp" },
      }),
    );
    expect(s.fotoPrincipal.existingUrl).toBe("https://x/p.webp");
    expect(s.fotoHover.existingUrl).toBe("https://x/h.webp");
    expect(s.fotoPrincipal.publicId).toBe("");
  });

  it("acepta las fotos como objeto de Cloudinary", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.INIT_EDIT, {
        urls: {
          fotoPrincipal: {
            url: "https://x/p.webp",
            public_id: "autos/p",
            original_name: "frente.jpg",
          },
        },
      }),
    );
    expect(s.fotoPrincipal).toMatchObject({
      existingUrl: "https://x/p.webp",
      publicId: "autos/p",
      originalName: "frente.jpg",
    });
  });

  it("usa secure_url cuando no viene url", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.INIT_EDIT, {
        urls: { fotoPrincipal: { secure_url: "https://seguro/p.webp" } },
      }),
    );
    expect(s.fotoPrincipal.existingUrl).toBe("https://seguro/p.webp");
  });

  it("junta las fotos extra viejas (fotoExtra1..8) en una lista", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.INIT_EDIT, {
        urls: {
          fotoExtra1: "https://x/1.webp",
          fotoExtra3: { url: "https://x/3.webp", public_id: "autos/3" },
          fotoExtra8: "https://x/8.webp",
        },
      }),
    );
    expect(s.existingExtras).toHaveLength(3);
    expect(s.existingExtras[0]).toMatchObject({ url: "https://x/1.webp", remove: false });
    expect(s.existingExtras[1]).toMatchObject({ url: "https://x/3.webp", publicId: "autos/3" });
  });

  it("saltea las extra que vienen vacías, sin dejar huecos", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.INIT_EDIT, {
        urls: { fotoExtra1: "", fotoExtra2: null, fotoExtra4: "https://x/4.webp" },
      }),
    );
    expect(s.existingExtras).toHaveLength(1);
    expect(s.existingExtras[0].url).toBe("https://x/4.webp");
  });

  it("un auto sin ninguna foto no rompe", () => {
    const s = imageReducer(inicial(), accion(IMAGE_ACTIONS.INIT_EDIT, { urls: {} }));
    expect(s.fotoPrincipal.existingUrl).toBe("");
    expect(s.existingExtras).toEqual([]);
  });

  it("un objeto de Cloudinary sin url queda vacío, no como 'undefined'", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.INIT_EDIT, { urls: { fotoPrincipal: { public_id: "x" } } }),
    );
    expect(s.fotoPrincipal.existingUrl).toBe("");
  });
});

describe("optimización de una foto principal", () => {
  it("al empezar limpia el archivo anterior y marca que está trabajando", () => {
    const previo = {
      ...inicial(),
      fotoPrincipal: {
        ...inicial().fotoPrincipal,
        file: { name: "viejo.jpg" },
        previewUrl: "blob:viejo",
        processError: "error anterior",
      },
    };
    const s = imageReducer(
      previo,
      accion(IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_START, { key: "fotoPrincipal" }),
    );
    expect(s.fotoPrincipal).toMatchObject({
      file: null,
      previewUrl: null,
      processStatus: "optimizing",
      processError: null,
    });
  });

  it("al terminar bien guarda el archivo y desmarca el borrado", () => {
    const archivo = { name: "frente.webp", size: 1234 };
    const previo = {
      ...inicial(),
      fotoPrincipal: { ...inicial().fotoPrincipal, remove: true, processStatus: "optimizing" },
    };
    const s = imageReducer(
      previo,
      accion(IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_SUCCESS, {
        key: "fotoPrincipal",
        file: archivo,
        previewUrl: "blob:nuevo",
      }),
    );
    expect(s.fotoPrincipal).toMatchObject({
      file: archivo,
      previewUrl: "blob:nuevo",
      processStatus: "ready",
      processError: null,
      remove: false,
    });
  });

  it("al fallar guarda el mensaje y no deja un archivo a medias", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_ERROR, {
        key: "fotoHover",
        message: "La imagen es demasiado grande",
      }),
    );
    expect(s.fotoHover).toMatchObject({
      file: null,
      previewUrl: null,
      processStatus: "error",
      processError: "La imagen es demasiado grande",
    });
  });

  it("tocar una foto no altera la otra", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_START, { key: "fotoPrincipal" }),
    );
    expect(s.fotoHover).toEqual(inicial().fotoHover);
  });

  it("conserva la url que ya estaba en el backend", () => {
    const previo = {
      ...inicial(),
      fotoPrincipal: { ...inicial().fotoPrincipal, existingUrl: "https://x/vieja.webp" },
    };
    const s = imageReducer(
      previo,
      accion(IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_SUCCESS, {
        key: "fotoPrincipal",
        file: { name: "n.webp" },
        previewUrl: "blob:n",
      }),
    );
    expect(s.fotoPrincipal.existingUrl).toBe("https://x/vieja.webp");
  });
});

describe("quitar y restaurar una foto principal", () => {
  it("quitar la marca para borrar y descarta lo que se había subido", () => {
    const previo = {
      ...inicial(),
      fotoPrincipal: {
        ...inicial().fotoPrincipal,
        file: { name: "x.webp" },
        previewUrl: "blob:x",
        processStatus: "ready",
      },
    };
    const s = imageReducer(
      previo,
      accion(IMAGE_ACTIONS.REMOVE_IMAGE, { key: "fotoPrincipal" }),
    );
    expect(s.fotoPrincipal).toMatchObject({
      file: null,
      previewUrl: null,
      remove: true,
      processStatus: "idle",
    });
  });

  it("restaurar deshace el borrado y vuelve a cero", () => {
    const previo = {
      ...inicial(),
      fotoHover: {
        ...inicial().fotoHover,
        remove: true,
        processStatus: "error",
        processError: "algo",
      },
    };
    const s = imageReducer(
      previo,
      accion(IMAGE_ACTIONS.RESTORE_PRINCIPAL_UPLOAD, { key: "fotoHover" }),
    );
    expect(s.fotoHover).toMatchObject({
      remove: false,
      file: null,
      previewUrl: null,
      processStatus: "idle",
      processError: null,
    });
  });

  it("quitar no borra la url del backend: eso lo decide el envío", () => {
    const previo = {
      ...inicial(),
      fotoPrincipal: { ...inicial().fotoPrincipal, existingUrl: "https://x/a.webp" },
    };
    const s = imageReducer(previo, accion(IMAGE_ACTIONS.REMOVE_IMAGE, { key: "fotoPrincipal" }));
    expect(s.fotoPrincipal.existingUrl).toBe("https://x/a.webp");
    expect(s.fotoPrincipal.remove).toBe(true);
  });
});

describe("fotos extra", () => {
  it("EXTRAS_SET_ALL reemplaza la lista entera", () => {
    const items = [{ file: { name: "1.webp" } }, { file: { name: "2.webp" } }];
    const s = imageReducer(inicial(), accion(IMAGE_ACTIONS.EXTRAS_SET_ALL, { items }));
    expect(s.fotosExtra).toEqual(items);
  });

  it("EXTRAS_SET_ALL sin lista deja el arreglo vacío, no undefined", () => {
    const s = imageReducer(inicial(), accion(IMAGE_ACTIONS.EXTRAS_SET_ALL, {}));
    expect(s.fotosExtra).toEqual([]);
  });

  it("marcar una extra existente para borrar no toca a las demás", () => {
    const previo = {
      ...inicial(),
      existingExtras: [
        { url: "a", remove: false },
        { url: "b", remove: false },
      ],
    };
    const s = imageReducer(previo, accion(IMAGE_ACTIONS.REMOVE_EXISTING_EXTRA, { index: 1 }));
    expect(s.existingExtras[0].remove).toBe(false);
    expect(s.existingExtras[1].remove).toBe(true);
  });

  it("restaurar una extra existente la devuelve a su lugar", () => {
    const previo = { ...inicial(), existingExtras: [{ url: "a", remove: true }] };
    const s = imageReducer(previo, accion(IMAGE_ACTIONS.RESTORE_EXISTING_EXTRA, { index: 0 }));
    expect(s.existingExtras[0].remove).toBe(false);
  });

  it("un índice que no existe no rompe ni inventa elementos", () => {
    const previo = { ...inicial(), existingExtras: [{ url: "a", remove: false }] };
    const s = imageReducer(previo, accion(IMAGE_ACTIONS.REMOVE_EXISTING_EXTRA, { index: 99 }));
    expect(s.existingExtras).toHaveLength(1);
    expect(s.existingExtras[0].remove).toBe(false);
  });

  it("no muta la lista original", () => {
    const original = [{ url: "a", remove: false }];
    const previo = { ...inicial(), existingExtras: original };
    imageReducer(previo, accion(IMAGE_ACTIONS.REMOVE_EXISTING_EXTRA, { index: 0 }));
    expect(original[0].remove).toBe(false);
  });
});

describe("imágenes por defecto (auto sin fotos)", () => {
  it("pone el mismo archivo en principal y hover, listos para enviar", () => {
    const archivo = { name: "logo.webp" };
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.SET_DEFAULT_IMAGES, {
        file: archivo,
        previewUrlPrincipal: "blob:p",
        previewUrlHover: "blob:h",
      }),
    );
    expect(s.fotoPrincipal).toMatchObject({
      file: archivo,
      previewUrl: "blob:p",
      processStatus: "ready",
      remove: false,
    });
    expect(s.fotoHover).toMatchObject({ file: archivo, previewUrl: "blob:h" });
  });
});

describe("acción desconocida", () => {
  it("devuelve el mismo estado, sin copiarlo", () => {
    const s = inicial();
    expect(imageReducer(s, { type: "NO_EXISTE" })).toBe(s);
  });
});

describe("isImagePipelineBlocked", () => {
  it("no bloquea cuando nada está procesando", () => {
    expect(isImagePipelineBlocked(inicial())).toBe(false);
  });

  it("bloquea si una principal está optimizando", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_START, { key: "fotoHover" }),
    );
    expect(isImagePipelineBlocked(s)).toBe(true);
  });

  it("bloquea si una extra está optimizando", () => {
    const s = { ...inicial(), fotosExtra: [{ processStatus: "optimizing" }] };
    expect(isImagePipelineBlocked(s)).toBe(true);
  });

  it("no bloquea por una que falló: eso se resuelve mostrando el error", () => {
    const s = imageReducer(
      inicial(),
      accion(IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_ERROR, { key: "fotoPrincipal", message: "x" }),
    );
    expect(isImagePipelineBlocked(s)).toBe(false);
  });

  it("sin estado no bloquea", () => {
    expect(isImagePipelineBlocked(null)).toBe(false);
    expect(isImagePipelineBlocked(undefined)).toBe(false);
  });
});

describe("revokePreviewUrlsInState", () => {
  let revoke;

  beforeEach(() => {
    revoke = vi.fn();
    globalThis.URL.revokeObjectURL = revoke;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("libera las previsualizaciones de principales y extra", () => {
    const s = {
      ...inicial(),
      fotoPrincipal: { ...inicial().fotoPrincipal, previewUrl: "blob:p" },
      fotoHover: { ...inicial().fotoHover, previewUrl: "blob:h" },
      fotosExtra: [{ previewUrl: "blob:e1" }, { previewUrl: "blob:e2" }],
    };
    revokePreviewUrlsInState(s);
    expect(revoke).toHaveBeenCalledTimes(4);
    expect(revoke.mock.calls.flat().sort()).toEqual(["blob:e1", "blob:e2", "blob:h", "blob:p"]);
  });

  it("ignora las que no tienen previsualización", () => {
    revokePreviewUrlsInState(inicial());
    expect(revoke).not.toHaveBeenCalled();
  });

  it("sin estado no rompe", () => {
    expect(() => revokePreviewUrlsInState(null)).not.toThrow();
  });

  it("si liberar una falla, sigue con el resto", () => {
    revoke.mockImplementationOnce(() => {
      throw new Error("ya liberada");
    });
    const s = { ...inicial(), fotosExtra: [{ previewUrl: "blob:1" }, { previewUrl: "blob:2" }] };
    expect(() => revokePreviewUrlsInState(s)).not.toThrow();
    expect(revoke).toHaveBeenCalledTimes(2);
  });
});
