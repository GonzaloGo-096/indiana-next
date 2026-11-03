import { LEAD_COMPAT } from "../events";

/**
 * El dataLayer sin el aviso de compatibilidad generate_lead (que tiene sus
 * propios tests en dataLayer.test.js y contrato-gtm.test.jsx). Para los tests
 * que miran "el primer evento" o "cuántos eventos" de un clic.
 */
export const sinCompat = () => window.dataLayer.filter((e) => e.event !== LEAD_COMPAT.event);
