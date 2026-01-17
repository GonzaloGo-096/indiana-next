/**
 * Alert - Componente de alerta reutilizable
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Next.js compatible
 */

'use client'

import styles from './Alert.module.css'

export const Alert = ({ 
  children, 
  variant = 'info', 
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const alertClasses = [
    styles.alert,
    styles[variant],
    dismissible && styles.dismissible,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={alertClasses}>
      {children}
      {dismissible && (
        <button 
          type="button" 
          className={styles.closeButton} 
          onClick={onDismiss}
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  )
}

