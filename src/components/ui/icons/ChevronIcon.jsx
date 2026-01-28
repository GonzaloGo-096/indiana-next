/**
 * ChevronIcon - Ícono de flecha direccional
 * 
 * Soporta 4 direcciones mediante prop `direction`.
 * Útil para: dropdowns, acordeones, carruseles, navegación.
 * 
 * @author Indiana Usados
 * @version 1.0.0
 */

const rotations = {
  down: 0,
  up: 180,
  left: 90,
  right: -90,
};

export const ChevronIcon = ({
  direction = "down",
  size = 20,
  color = "currentColor",
  className = "",
}) => {
  const rotation = rotations[direction] || 0;

  return (
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
      style={rotation !== 0 ? { transform: `rotate(${rotation}deg)` } : undefined}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
};

export default ChevronIcon;



