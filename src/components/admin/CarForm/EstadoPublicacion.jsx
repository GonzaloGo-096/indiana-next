import { ESTADOS } from '@/utils/vehicleEstado'
import styles from './EstadoPublicacion.module.css'

// PAUSADO no se ofrece a propósito: el backend saca a los pausados de la única
// lista que existe, que es también la del panel, así que un auto pausado
// desaparecería del admin y no habría cómo reactivarlo. Se agrega cuando el
// backend tenga una lista del panel que los incluya.
const OPCIONES = [
  {
    valor: ESTADOS.ACTIVO,
    titulo: 'Disponible',
    detalle: 'Se publica normal, a la venta.',
  },
  {
    valor: ESTADOS.VENDIDO,
    titulo: 'Vendido',
    detalle: 'Sigue en la web al final del listado, con la banda "Vendido". Sale de los carruseles.',
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
        {OPCIONES.map(({ valor, titulo, detalle }) => (
          <label key={valor} className={styles.opcion} data-estado={valor}>
            <input type="radio" value={valor} {...register('estado')} />
            <span>
              <strong className={styles.titulo}>{titulo}</strong>
              <span className={styles.detalle}>{detalle}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
