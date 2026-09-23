/**
 * @vitest-environment jsdom
 *
 * Qué ve el visitante al enviar su postulación.
 *
 * Lo sensible: el "¡Gracias! ... enviada" y el lead en Analytics solo pueden
 * aparecer si la API confirmó { ok: true }. Cualquier otra respuesta, incluida
 * una que no es JSON (el 413 de Vercel), termina en un error legible.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const analytics = {
  trackFormStart: vi.fn(),
  trackFormSubmit: vi.fn(),
  trackLead: vi.fn(),
};
vi.mock("@/hooks/useAnalytics", () => ({ useAnalytics: () => analytics }));

const { default: CareersForm } = await import("../CareersForm");

function responder(cuerpo, { status = 200, contentType = "application/json" } = {}) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(cuerpo, { status, headers: { "content-type": contentType } })
  );
}

async function completarYEnviar() {
  render(<CareersForm />);
  fireEvent.change(screen.getByLabelText(/puesto/i), { target: { value: "otro" } });
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Ana Pérez" } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ana@correo.com" } });
  const cv = new File(["%PDF-1.7"], "cv.pdf", { type: "application/pdf" });
  fireEvent.change(screen.getByLabelText(/cv/i), { target: { files: [cv] } });
  fireEvent.click(screen.getByRole("button", { name: /enviar/i }));
  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("CareersForm: respuesta de la API", () => {
  it("con { ok: true } muestra el agradecimiento y registra el lead", async () => {
    responder(JSON.stringify({ ok: true }));
    await completarYEnviar();

    expect(await screen.findByText(/fue enviada correctamente/)).toBeTruthy();
    expect(analytics.trackLead).toHaveBeenCalledTimes(1);
  });

  it("con el 503 de 'no disponible' muestra el mensaje de la API y no cuenta un lead", async () => {
    const error = "Por el momento no podemos recibir postulaciones desde la web.";
    responder(JSON.stringify({ ok: false, error }), { status: 503 });
    await completarYEnviar();

    expect((await screen.findByRole("alert")).textContent).toBe(error);
    expect(screen.queryByText(/fue enviada correctamente/)).toBeNull();
    expect(analytics.trackLead).not.toHaveBeenCalled();
    expect(analytics.trackFormSubmit).not.toHaveBeenCalled();
  });

  it("con el 413 de Vercel (no es JSON) explica el tamaño máximo", async () => {
    responder("Request Entity Too Large", { status: 413, contentType: "text/plain" });
    await completarYEnviar();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "El archivo es demasiado grande. El máximo es 4 MB."
    );
  });

  it("con un 200 que no confirma el envío tampoco dice que se envió", async () => {
    responder("<html>ok</html>", { contentType: "text/html" });
    await completarYEnviar();

    expect((await screen.findByRole("alert")).textContent).toBe("Error al enviar. Intentá de nuevo.");
    expect(analytics.trackLead).not.toHaveBeenCalled();
  });
});
