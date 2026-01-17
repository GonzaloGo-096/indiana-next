/**
 * loginSchema - Esquema de validación para login
 * 
 * @author Indiana Usados
 * @version 1.0.0
 */

import { z } from 'zod'

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede tener más de 50 caracteres')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'El usuario solo puede contener letras, números, guiones y guiones bajos'
    )
    .trim(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede tener más de 100 caracteres')
})

