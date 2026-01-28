/**
 * FilterIcon - Icono de filtro reutilizable
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { memo } from 'react';

/**
 * Icono de filtro
 * @param {Object} props
 * @param {number} props.size - Tamaño del icono (default: 16)
 * @param {string} props.color - Color del icono (default: "currentColor")
 * @param {Object} props.rest - Props adicionales para el SVG
 */
export const FilterIcon = memo(({ 
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
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
  </svg>
));

FilterIcon.displayName = 'FilterIcon';

export default FilterIcon;


