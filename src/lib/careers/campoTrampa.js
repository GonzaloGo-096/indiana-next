/**
 * Campo trampa (honeypot) del formulario de postulación.
 *
 * Es un campo invisible para las personas (fuera de pantalla, sin foco con
 * Tab, sin autocompletar). Los bots que llenan todo lo completan, y
 * /api/careers descarta esas postulaciones sin avisar. No molesta a nadie,
 * a diferencia de un captcha.
 *
 * Lo comparten el formulario y la API para que el nombre no se desincronice.
 */
export const CAMPO_TRAMPA = "sitioWeb";
