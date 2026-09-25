import { ESTADOS, ETIQUETAS_ESTADO } from '@/utils/vehicleEstado'
import styles from './EstadoPublicacion.module.css'

// Qué pasa en la web con cada estado, dicho para quien lo elige.
const OPCIONES = [
  {
    valor: ESTADOS.ACTIVO,
    detalle: 'Se publica normal, a la venta.',
  },
  {
    valor: ESTADOS.VENDIDO,
    detalle: 'Sigue en la web al final del listado, con la banda "Vendido". Sale de los carruseles.',
  },
  {
    valor: ESTADOS.PAUSADO,
    detalle: 'Desaparece de la web (señado, en taller). Acá en el panel lo seguís viendo.',
  },
]

/**
 * Estado comercial del auto en el formulario de edición. Se guarda con una
 * operación aparte del backend (ver useAdminVehicleModal), no con el resto
 * de los datos.
 */
export default function EstadoPublicacion({ register, disabled }) {
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>Estado de publicación</legend>
      <div className={styles.opciones}>
        {OPCIONES.map(({ valor, detalle }) => (
          <label key={valor} className={styles.opcion} data-estado={valor}>
            <input type="radio" value={valor} {...register('estado')} />
            <span>
              <strong className={styles.titulo}>{ETIQUETAS_ESTADO[valor]}</strong>
              <span className={styles.detalle}>{detalle}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
