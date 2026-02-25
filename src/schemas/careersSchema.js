/**
 * careersSchema - Esquema de validación para formulario de postulación
 *
 * @author Indiana Peugeot
 */

import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg"];

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
    .refine((files) => files?.length > 0, "Adjuntá tu CV (PDF o JPG)")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      "El archivo no debe superar 5 MB"
    )
    .refine(
      (files) => ACCEPTED_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan archivos PDF o JPG"
    ),
});
