/**
 * VehiclePrice - Bloque "desde: [precio tachado] [precio]" de las fichas.
 *
 * El mismo marcado estaba repetido tal cual en CardAuto, CardSimilar y
 * CardDetalle: la etiqueta, el contenedor del precio y la bifurcación entre
 * mostrar un precio o dos cuando hay oferta.
 *
 * Recibe el módulo CSS de cada ficha en vez de traer el suyo, a propósito: las
 * tres comparten el layout (flex, nowrap, el recorte del tachado) pero NO la
 * tipografía —el detalle usa fuente más grande, la del carrusel más chica—, así
 * que unificar las hojas cambiaría cómo se ven. Se consolida la estructura, no
 * la presentación.
 *
 * Es presentacional: recibe la oferta ya calculada porque las fichas también la
 * usan para el badge "Oportunidad", y no conviene calcularla dos veces.
 *
 * Clases que espera del módulo recibido:
 *   price_label_container · price_label · price_display · price_original · price_value
 *
 * @author Indiana Peugeot
 */

/**
 * @param {Object} props
 * @param {Object} props.styles        - Módulo CSS de la ficha
 * @param {Object} props.offer         - Salida de getVehicleOfferDisplay(auto)
 * @param {string} props.fallbackPrice - Precio ya formateado, para cuando no hay oferta
 * @param {string} [props.label="desde:"]
 */
export function VehiclePrice({ styles, offer, fallbackPrice, label = "desde:" }) {
  const hasOffer = Boolean(offer?.hasOffer);

  return (
    <>
      <div className={styles.price_label_container}>
        <span className={styles.price_label}>{label}</span>
      </div>

      <div className={styles.price_display}>
        {hasOffer ? (
          <>
            <span className={styles.price_original}>{offer.priceOriginal}</span>
            <span className={styles.price_value}>{offer.priceOffer}</span>
          </>
        ) : (
          <span className={styles.price_value}>{fallbackPrice}</span>
        )}
      </div>
    </>
  );
}

export default VehiclePrice;
