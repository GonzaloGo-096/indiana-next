/**
 * El <head> de TODAS las páginas pone el consentimiento en "denegado" antes
 * de que cargue cualquier etiqueta. Sin esto GTM arranca sin default y GA4
 * guarda cookies antes de que la persona elija.
 *
 * Se mira el código fuente y no el render: layout.js tiene JSX en un .js y
 * Vitest no lo transforma (la configuración solo habilita JSX en .jsx). Lo que
 * hace ConsentBootstrap ya lo cubre consentDefault.test.jsx; acá solo importa
 * que siga montado en el <head>.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const fuente = fs.readFileSync(path.resolve(process.cwd(), "src/app/layout.js"), "utf8");
// Sin comentarios JSX ({/* ... */}) para que un <ConsentBootstrap /> comentado no cuente.
const sinComentarios = fuente.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\/.*$/gm, "");

describe("layout raíz", () => {
  it("monta ConsentBootstrap dentro del <head>", () => {
    const head = sinComentarios.slice(sinComentarios.indexOf("<head>"), sinComentarios.indexOf("</head>"));
    expect(head).toMatch(/<ConsentBootstrap\s*\/>/);
  });

  it("el <head> no carga ningún <Script> ni etiqueta antes que el consentimiento", () => {
    const head = sinComentarios.slice(sinComentarios.indexOf("<head>"), sinComentarios.indexOf("</head>"));
    const antes = head.slice(0, head.indexOf("<ConsentBootstrap"));
    expect(antes).not.toMatch(/<Script|<script/);
  });
});
