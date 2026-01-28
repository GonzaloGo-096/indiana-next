/**
 * carouselActiveIndex.js
 * Helpers reutilizables para carruseles con scroll horizontal.
 * - Calcula el índice activo por ítem (no por página) según la posición del scroll.
 * - Permite hacer scroll hacia un ítem por índice.
 */

/**
 * Devuelve el índice del hijo cuya "center line" está más cerca del centro visible del contenedor.
 * @param {HTMLElement|null} container
 * @returns {number}
 */
export function getClosestChildIndex(container) {
  if (!container || !container.children || container.children.length === 0) return 0;

  const targetCenter = container.scrollLeft + container.clientWidth / 2;
  let bestIndex = 0;
  let bestDist = Infinity;

  // HTMLCollection -> iteración simple
  for (let i = 0; i < container.children.length; i++) {
    const child = container.children[i];
    if (!child) continue;
    const childCenter = child.offsetLeft + child.offsetWidth / 2;
    const dist = Math.abs(childCenter - targetCenter);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Scroll hacia el hijo en index (alineando su inicio).
 * @param {HTMLElement|null} container
 * @param {number} index
 */
export function scrollToChildIndex(container, index) {
  if (!container || !container.children || container.children.length === 0) return;
  const i = Math.max(0, Math.min(container.children.length - 1, index));
  const child = container.children[i];
  if (!child) return;
  container.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
}



