/**
 * @vitest-environment jsdom
 *
 * Carga de la foto principal del carrusel de la ficha.
 *
 * "Cargada" se deriva de QUÉ foto terminó de cargar, no de un booleano que un
 * efecto resetea. Lo que se fija es lo que ve el visitante:
 * - mientras la foto actual no cargó, está el shimmer (clase "cargando");
 * - cuando carga, aparece;
 * - al pasar a otra foto vuelve el shimmer hasta que esa carga;
 * - al volver a una ya cargada no queda en blanco esperando un onLoad que no llega.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

// next/image llama a onLoad de forma asíncrona (espera img.decode()). Se lo
// reemplaza por un <img> que pasa los eventos directo, como en el resto de
// los tests de componentes: lo que se prueba es el carrusel, no next/image.
vi.mock("next/image", () => ({
  default: ({ src, alt, className, onLoad, onError }) => (
    <img src={src} alt={alt} className={className} onLoad={onLoad} onError={onError} />
  ),
}));

const { ImageCarousel } = await import("../ImageCarousel");

afterEach(cleanup);

const FOTOS = ["https://img.test/a.jpg", "https://img.test/b.jpg", "https://img.test/c.jpg"];

const contenedor = () => document.querySelector('[class*="mainImageContainer"]');
const foto = () => contenedor().querySelector("img");
const conShimmer = () => /mainImageLoading/.test(contenedor().className);
const visible = () => /mainImageLoaded/.test(foto().className);

// jsdom no descarga imágenes: `complete` y `naturalWidth` se simulan para el
// caso "ya estaba en caché" (el onLoad no llega nunca).
function marcarEnCache(img) {
  Object.defineProperty(img, "complete", { value: true, configurable: true });
  Object.defineProperty(img, "naturalWidth", { value: 800, configurable: true });
}

const unFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r())));

describe("ImageCarousel: carga de la foto principal", () => {
  it("arranca con shimmer y la foto aparece cuando carga", () => {
    render(<ImageCarousel images={FOTOS} />);
    expect(conShimmer()).toBe(true);
    expect(visible()).toBe(false);

    fireEvent.load(foto());

    expect(conShimmer()).toBe(false);
    expect(visible()).toBe(true);
  });

  it("al pasar a la siguiente vuelve el shimmer hasta que esa carga", () => {
    render(<ImageCarousel images={FOTOS} />);
    fireEvent.load(foto());

    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(conShimmer()).toBe(true);
    expect(visible()).toBe(false);

    fireEvent.load(foto());
    expect(visible()).toBe(true);
  });

  it("si la foto ya estaba en caché (sin onLoad), aparece igual en el frame siguiente", async () => {
    render(<ImageCarousel images={FOTOS} />);
    marcarEnCache(foto());

    await unFrame();

    expect(visible()).toBe(true);
  });

  it("una foto que dio error no queda en shimmer para siempre", () => {
    render(<ImageCarousel images={FOTOS} />);
    fireEvent.error(foto());
    expect(conShimmer()).toBe(false);
  });
});
