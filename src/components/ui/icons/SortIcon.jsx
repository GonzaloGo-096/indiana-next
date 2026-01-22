/**
 * SortIcon - Icono de ordenamiento reutilizable
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { memo } from 'react';

/**
 * Icono de ordenamiento
 * @param {Object} props
 * @param {number} props.size - Tamaño del icono (default: 16)
 * @param {string} props.color - Color del icono (default: "currentColor")
 * @param {Object} props.rest - Props adicionales para el SVG
 */
export const SortIcon = memo(({ 
  size = 16, 
  color = "currentColor",
  strokeWidth = 2,
  ...rest 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth}
    {...rest}
  >
    <path d="M3 6h18"></path>
    <path d="M6 12h12"></path>
    <path d="M9 18h6"></path>
  </svg>
));

SortIcon.displayName = 'SortIcon';

export default SortIcon;

