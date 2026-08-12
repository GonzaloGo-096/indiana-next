/**
 * rateLimit.js - Freno al abuso por IP, en memoria
 *
 * Ventana deslizante: cuenta los intentos de una IP dentro de los últimos N
 * milisegundos y corta cuando pasan del máximo.
 *
 * QUÉ ES Y QUÉ NO ES
 * Es un freno al abuso, no un control de cuotas. No sobrevive a un reinicio ni
 * se comparte entre instancias serverless: cada instancia lleva su propia
 * cuenta. Alcanza de sobra para lo que protege (un panel que usa una persona) y
 * no necesita infraestructura extra. Si algún día hiciera falta algo estricto,
 * hay que mover el conteo a un almacén compartido.
 *
 * Estaba escrito adentro de /api/revalidate. Se sacó acá cuando el proxy del
 * panel necesitó lo mismo, para no tener dos copias que se desincronicen.
 *
 * @author Indiana Peugeot
 */

/**
 * IP del cliente, mirando primero las cabeceras que pone el proxy de Vercel.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "desconocida";
}

/**
 * Crea un limitador independiente. Cada uno lleva su propio conteo, así que dos
 * rutas distintas no se roban intentos entre sí.
 *
 * @param {object} opciones
 * @param {number} opciones.ventanaMs      Tamaño de la ventana.
 * @param {number} opciones.maxIntentos    Intentos permitidos dentro de la ventana.
 * @param {number} [opciones.maxIpsEnMemoria=500]  A partir de acá se limpian las IPs vencidas.
 * @returns {(request: Request) => { ok: true } | { ok: false, retryAfter: number }}
 */
export function crearRateLimit({ ventanaMs, maxIntentos, maxIpsEnMemoria = 500 }) {
  if (!(ventanaMs > 0) || !(maxIntentos > 0)) {
    throw new Error("crearRateLimit: ventanaMs y maxIntentos deben ser mayores a 0");
  }

  const intentosPorIp = new Map();

  return function checkRateLimit(request) {
    const ip = getClientIp(request);
    const ahora = Date.now();

    const previos = (intentosPorIp.get(ip) || []).filter(
      (t) => ahora - t < ventanaMs,
    );

    if (previos.length >= maxIntentos) {
      // El más viejo de la ventana es el que primero libera un lugar.
      const masViejo = previos[0];
      return {
        ok: false,
        retryAfter: Math.max(1, Math.ceil((ventanaMs - (ahora - masViejo)) / 1000)),
      };
    }

    previos.push(ahora);
    intentosPorIp.set(ip, previos);

    // Limpieza oportunista: sin esto el Map crece sin techo con IPs que no vuelven.
    if (intentosPorIp.size > maxIpsEnMemoria) {
      for (const [k, v] of intentosPorIp) {
        if (v.every((t) => ahora - t >= ventanaMs)) intentosPorIp.delete(k);
      }
    }

    return { ok: true };
  };
}
