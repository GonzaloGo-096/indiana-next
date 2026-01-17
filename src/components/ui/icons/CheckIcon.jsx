/**
 * CheckIcon - Ícono de verificación/check
 * 
 * Útil para: selección, confirmación, validación.
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

export const CheckIcon = ({ 
  size = 16, 
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
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default CheckIcon

