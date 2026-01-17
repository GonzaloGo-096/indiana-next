/**
 * KmIcon - Icono de Kilometraje (Velocímetro)
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

export const KmIcon = ({ className = "", size = 24, color = "currentColor" }) => {
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
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
};

export default KmIcon;

