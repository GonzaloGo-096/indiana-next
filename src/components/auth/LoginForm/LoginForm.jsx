/**
 * LoginForm - Formulario de inicio de sesión
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Next.js compatible
 */

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/schemas/loginSchema'
import styles from './LoginForm.module.css'

const LoginForm = ({ onSubmit, isSubmitting, errors: externalErrors }) => {
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    setError,
    clearErrors
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  })

  // Si hay errores externos, los mostramos
  useEffect(() => {
    if (externalErrors) {
      Object.entries(externalErrors).forEach(([field, message]) => {
        setError(field, { type: 'server', message })
      })
    } else {
      clearErrors()
    }
  }, [externalErrors, setError, clearErrors])

  // Combinamos errores del formulario con errores externos
  const errors = { ...formErrors.errors, ...externalErrors }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Usuario</label>
        <input
          type="text"
          {...register('username')}
          className={styles.input}
          disabled={isSubmitting}
          placeholder="Ingresa tu usuario"
        />
        {errors.username && (
          <span className={styles.error}>{errors.username.message}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Contraseña</label>
        <input
          type="password"
          {...register('password')}
          className={styles.input}
          disabled={isSubmitting}
          placeholder="Ingresa tu contraseña"
        />
        {errors.password && (
          <span className={styles.error}>{errors.password.message}</span>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  )
}

export default LoginForm



