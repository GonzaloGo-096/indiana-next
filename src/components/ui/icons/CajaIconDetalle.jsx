/**
 * CajaIconDetalle - Icono de Caja (Palanca de cambios)
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

export const CajaIconDetalle = ({ className = "", size = 24, color = "currentColor" }) => {
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
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 1h5a3.5 3.5 0 0 1 0 7h-5a3.5 3.5 0 0 0 0 7H17"></path>
    </svg>
  );
};

export default CajaIconDetalle;

