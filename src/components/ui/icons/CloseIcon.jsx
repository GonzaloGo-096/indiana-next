/**
 * CloseIcon - Ícono de cerrar (X)
 * 
 * Útil para: modales, drawers, alertas, tags.
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

export const CloseIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export default CloseIcon


