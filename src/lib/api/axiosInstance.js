/**
 * axiosInstance.js - Re-export del cliente HTTP
 *
 * Mantiene compatibilidad con imports existentes.
 * La implementación está en @/lib/http/client.js
 *
 * @author Indiana Peugeot
 * @version 2.0.0 - Fase 2 refactor
 */

export { default, authAxiosInstance } from "@/lib/http/client";
