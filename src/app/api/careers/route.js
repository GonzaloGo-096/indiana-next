/**
 * API Route: POST /api/careers
 *
 * Recibe FormData con: puesto, nombreApellido, email, telefono?, mensaje?, cv (archivo)
 * y la valida server-side (el tipo del CV, por su contenido: ver cvFile.js).
 *
 * El envío por email todavía no existe (ni acá ni en el backend). Hasta que
 * exista, la API responde 503: decir "enviada" sin enviar nada hacía que las
 * postulaciones se perdieran sin que nadie se enterara. Cada intento queda en
 * los logs (sin datos personales) para saber cuántos se pierden.
 */

import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import {
  ACCEPTED_CV_TYPES,
  MAX_CV_BYTES,
  MAX_CV_LABEL,
  detectCvType,
} from "@/lib/careers/cvFile";

const log = createLogger("careers");

const NOT_AVAILABLE_MESSAGE =
  "Por el momento no podemos recibir postulaciones desde la web. Intentá de nuevo más adelante.";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { ok: false, error: "Content-Type debe ser multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const puesto = formData.get("puesto")?.toString()?.trim();
    const nombreApellido = formData.get("nombreApellido")?.toString()?.trim();
    const email = formData.get("email")?.toString()?.trim();
    const telefono = formData.get("telefono")?.toString()?.trim() || null;
    const mensaje = formData.get("mensaje")?.toString()?.trim() || null;
    const cvFile = formData.get("cv");

    // Validación básica server-side
    if (!puesto || puesto.length === 0) {
      return NextResponse.json(
        { ok: false, error: "El puesto es obligatorio" },
        { status: 400 }
      );
    }
    if (!nombreApellido || nombreApellido.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Nombre y apellido inválido" },
        { status: 400 }
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      );
    }
    if (!cvFile || !(cvFile instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "El CV es obligatorio" },
        { status: 400 }
      );
    }
    if (!ACCEPTED_CV_TYPES.includes(cvFile.type)) {
      return NextResponse.json(
        { ok: false, error: "Solo se aceptan archivos PDF o JPG" },
        { status: 400 }
      );
    }
    if (cvFile.size > MAX_CV_BYTES) {
      return NextResponse.json(
        { ok: false, error: `El archivo no debe superar ${MAX_CV_LABEL}` },
        { status: 400 }
      );
    }
    const inicio = new Uint8Array(await cvFile.slice(0, 8).arrayBuffer());
    if (!detectCvType(inicio)) {
      return NextResponse.json(
        { ok: false, error: "El archivo no es un PDF o JPG válido" },
        { status: 400 }
      );
    }

    // TODO: Enviar email con los datos de la postulación.
    // - Destinatario: variable de entorno (ej. CAREERS_EMAIL) para no hardcodear
    // - Asunto: "Postulación: [puesto] - [nombreApellido]"
    // - Cuerpo: texto con nombre, email, teléfono, mensaje
    // - Adjunto: cvFile (buffer o stream según proveedor)
    // Cuando exista: await sendCareersEmail({ puesto, nombreApellido, email, telefono, mensaje, cvFile })
    // y recién ahí responder { ok: true }.
    log.error("Postulación válida NO enviada: el envío por email no está configurado", {
      puesto,
      cvSize: cvFile.size,
    });

    return NextResponse.json(
      { ok: false, error: NOT_AVAILABLE_MESSAGE },
      { status: 503 }
    );
  } catch (error) {
    log.error("Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error al procesar la postulación" },
      { status: 500 }
    );
  }
}
