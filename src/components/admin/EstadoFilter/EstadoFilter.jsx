'use client'

import { ESTADOS, ETIQUETAS_ESTADO } from '@/utils/vehicleEstado'
import styles from './EstadoFilter.module.css'

export const TODOS = 'TODOS'

const OPCIONES = [TODOS, ESTADOS.ACTIVO, ESTADOS.VENDIDO, ESTADOS.PAUSADO]

/**
 * Filtro por estado de la lista del panel: Todos / Disponible / Vendido /
 * Pausado, cada uno con cuántos autos hay.
 *
 * @param {Object} props
 * @param {string} props.value - TODOS o uno de ESTADOS
 * @param {(estado: string) => void} props.onChange
 * @param {{ACTIVO: number, VENDIDO: number, PAUSADO: number}} props.cuentas
 */
export default function EstadoFilter({ value, onChange, cuentas }) {
  const total = cuentas[ESTADOS.ACTIVO] + cuentas[ESTADOS.VENDIDO] + cuentas[ESTADOS.PAUSADO]

  return (
    <div className={styles.grupo} role="group" aria-label="Filtrar por estado">
      {OPCIONES.map((opcion) => {
        const activo = value === opcion
        return (
          <button
            key={opcion}
            type="button"
            className={styles.opcion}
            data-estado={opcion}
            aria-pressed={activo}
            onClick={() => onChange(opcion)}
          >
            {opcion === TODOS ? 'Todos' : ETIQUETAS_ESTADO[opcion]}
            <span className={styles.cuenta}>{opcion === TODOS ? total : cuentas[opcion]}</span>
          </button>
        )
      })}
    </div>
  )
}
