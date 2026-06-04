/**
 * API Route: POST /api/careers
 *
 * Recibe FormData con: puesto, nombreApellido, email, telefono?, mensaje?, cv (archivo)
 * Valida server-side. Por ahora responde { ok: true } y loguea de forma segura.
 *
 * TODO: Integrar envío de email aquí. Estructurar el payload para que el backend real
 * envíe el CV y los datos al responsable de RRHH. Evitar hardcodear cuenta de email.
 *
 * @author Indiana Peugeot
 */

import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("careers");

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    if (!ALLOWED_TYPES.includes(cvFile.type)) {
      return NextResponse.json(
        { ok: false, error: "Solo se aceptan archivos PDF o JPG" },
        { status: 400 }
      );
    }
    if (cvFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "El archivo no debe superar 5 MB" },
        { status: 400 }
      );
    }

    // Log seguro (sin volcar el archivo completo)
    log.debug("Postulación recibida:", {
      puesto,
      nombreApellido,
      email,
      telefono: telefono || "(no indicado)",
      mensaje: mensaje ? `${mensaje.substring(0, 50)}...` : "(vacío)",
      cvName: cvFile.name,
      cvSize: cvFile.size,
    });

    // TODO: Enviar email con los datos de la postulación.
    // Estructura sugerida para el backend:
    // - Destinatario: variable de entorno (ej. CAREERS_EMAIL) para no hardcodear
    // - Asunto: "Postulación: [puesto] - [nombreApellido]"
    // - Cuerpo: texto con nombre, email, teléfono, mensaje
    // - Adjunto: cvFile (buffer o stream según proveedor)
    // Ejemplo: await sendCareersEmail({ puesto, nombreApellido, email, telefono, mensaje, cvBuffer })

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("Error:", error);
    return NextResponse.json(
      { ok: false, error: "Error al procesar la postulación" },
      { status: 500 }
    );
  }
}
