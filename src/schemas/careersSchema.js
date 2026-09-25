/**
 * careersSchema - Esquema de validación para formulario de postulación
 *
 * @author Indiana Peugeot
 */

import { z } from "zod";
import { CAMPO_TRAMPA } from "@/lib/careers/campoTrampa";
import { CV_TIPOS_LABEL, MAX_CV_BYTES, MAX_CV_LABEL, esCvAceptado } from "@/lib/careers/cvFile";

export const careersSchema = z.object({
  puesto: z
    .string()
    .min(1, "Seleccioná un puesto")
    .trim(),
  nombreApellido: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede superar 120 caracteres")
    .trim(),
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Ingresá un email válido")
    .trim(),
  telefono: z
    .string()
    .max(20, "El teléfono no puede superar 20 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  mensaje: z
    .string()
    .max(1000, "El mensaje no puede superar 1000 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),
  cv: z
    .any()
    .refine((files) => files?.length > 0, `Adjuntá tu CV (${CV_TIPOS_LABEL})`)
    .refine(
      (files) => files?.[0]?.size <= MAX_CV_BYTES,
      `El archivo no debe superar ${MAX_CV_LABEL}`
    )
    .refine(
      (files) => esCvAceptado(files?.[0]),
      `Solo se aceptan archivos ${CV_TIPOS_LABEL}`
    ),
  // Campo trampa: se valida en la API; acá solo se deja pasar.
  [CAMPO_TRAMPA]: z.string().optional(),
});
