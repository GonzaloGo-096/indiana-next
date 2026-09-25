/**
 * API Route: POST /api/careers
 *
 * Recibe la postulación del formulario "Trabajá con nosotros" y se la pasa al
 * backend (POST /jobs/apply), que manda el mail a RRHH con el CV adjunto.
 * Contrato del backend verificado el 2026-09-24 (rama preview, da06ce2).
 *
 * El navegador no le habla directo al backend: pasa por acá, igual que el
 * catálogo y el panel. Acá se hace lo barato (campos obligatorios, email,
 * tipo y tamaño del CV, anti-spam); lo que decide si la postulación es válida
 * (incluido el contenido real del archivo) es el backend, y su mensaje llega
 * tal cual al postulante.
 *
 * Nunca se responde { ok: true } sin que el backend haya confirmado el envío.
 * Si el backend todavía no tiene /jobs/apply (producción antes de publicarlo),
 * la respuesta es 503 con un mensaje honesto, y queda registrado.
 *
 * Logs sin datos personales: puesto, tamaño del CV y estado, nunca nombre,
 * email, teléfono ni mensaje.
 */

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/api";
import { createLogger } from "@/lib/logger";
import { esRutaInexistente } from "@/lib/http/rutaInexistente";
import { jobPositions } from "@/lib/careers.data";
import { CAMPO_TRAMPA } from "@/lib/careers/campoTrampa";
import { CV_TIPOS_LABEL, MAX_CV_BYTES, MAX_CV_LABEL, esCvAceptado } from "@/lib/careers/cvFile";

const log = createLogger("careers");

const TIMEOUT_MS = 20000; // el backend manda el mail antes de responder

const MENSAJES = {
  noDisponible:
    "Por el momento no podemos recibir postulaciones desde la web. Intentá de nuevo más adelante.",
  fallo: "No pudimos enviar tu postulación. Intentá de nuevo en unos minutos.",
};

const respuesta = (status, cuerpo) => NextResponse.json(cuerpo, { status });
const error = (status, mensaje) => respuesta(status, { ok: false, error: mensaje });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El formulario manda el id del puesto; el mail tiene que decir el nombre. */
function nombreDelPuesto(id) {
  if (id === "otro") return "Otro";
  return jobPositions.find((p) => p.value === id)?.label ?? id;
}

const texto = (formData, campo) => formData.get(campo)?.toString().trim() ?? "";

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return error(400, "Content-Type debe ser multipart/form-data");
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return error(400, "No se pudo leer el formulario");
  }

  // Un bot que completó el campo trampa recibe un "ok" y no se envía nada:
  // avisarle que lo detectamos solo le enseña a esquivarlo.
  if (texto(formData, CAMPO_TRAMPA)) {
    log.warn("Postulación descartada: completó el campo trampa");
    return respuesta(200, { ok: true });
  }

  const puesto = texto(formData, "puesto");
  const nombreApellido = texto(formData, "nombreApellido");
  const email = texto(formData, "email");
  const cv = formData.get("cv");

  if (!puesto) return error(400, "El puesto es obligatorio");
  if (nombreApellido.length < 2) return error(400, "Nombre y apellido inválido");
  if (!EMAIL.test(email)) return error(400, "Email inválido");
  if (!(cv instanceof File)) return error(400, "El CV es obligatorio");
  if (!esCvAceptado(cv)) return error(400, `Solo se aceptan archivos ${CV_TIPOS_LABEL}`);
  if (cv.size > MAX_CV_BYTES) return error(400, `El archivo no debe superar ${MAX_CV_LABEL}`);

  const puestoNombre = nombreDelPuesto(puesto);
  const aLosLogs = { puesto: puestoNombre, cvBytes: cv.size };

  // Exactamente los campos que espera el backend (acepta 5 + el archivo).
  const alBackend = new FormData();
  alBackend.set("puesto", puestoNombre);
  alBackend.set("nombreApellido", nombreApellido);
  alBackend.set("email", email);
  alBackend.set("telefono", texto(formData, "telefono"));
  alBackend.set("mensaje", texto(formData, "mensaje"));
  alBackend.set("cv", cv, cv.name);

  let res;
  try {
    res = await fetch(`${getApiBaseUrl()}/jobs/apply`, {
      method: "POST",
      body: alBackend,
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    log.error("No se pudo contactar al backend para enviar una postulación", {
      ...aLosLogs,
      motivo: e?.name === "TimeoutError" ? "timeout" : e?.message,
    });
    return error(502, MENSAJES.fallo);
  }

  const tipo = res.headers.get("content-type") || "";
  const cuerpoTexto = await res.text();

  if (res.status === 404 && esRutaInexistente(tipo, cuerpoTexto)) {
    log.error("Postulación NO enviada: el backend no tiene /jobs/apply", aLosLogs);
    return error(503, MENSAJES.noDisponible);
  }

  let cuerpo = null;
  try {
    cuerpo = JSON.parse(cuerpoTexto);
  } catch {
    // cuerpo queda en null: se trata como respuesta inválida abajo
  }

  if (res.ok && cuerpo && cuerpo.error === null) {
    log.info("Postulación enviada", aLosLogs);
    return respuesta(200, { ok: true });
  }

  // 400 (datos o archivo inválidos), 429 (demasiados intentos), 503 (no se
  // pudo mandar el mail): el backend explica qué pasó, y se le muestra eso.
  if ([400, 429, 503].includes(res.status) && typeof cuerpo?.msg === "string") {
    log.warn(`El backend rechazó una postulación (${res.status})`, aLosLogs);
    return error(res.status, cuerpo.msg);
  }

  log.error(`Respuesta inesperada del backend al enviar una postulación (${res.status})`, aLosLogs);
  return error(502, MENSAJES.fallo);
}
