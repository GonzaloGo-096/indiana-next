/**
 * axiosInstance.js - Configuración de Axios para Next.js
 * 
 * Características:
 * - Configuración centralizada
 * - Compatible con Server y Client Components
 * - Manejo de errores centralizado
 * - Timeouts configurables
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

import axios from "axios";

/**
 * Obtener base URL del API
 * - Server Components: process.env.API_URL (sin NEXT_PUBLIC_)
 * - Client Components: process.env.NEXT_PUBLIC_API_URL
 * 
 * @returns {string} Base URL del API
 */
const getBaseURL = () => {
  // En Server Components (Node.js)
  if (typeof process !== "undefined" && process.env) {
    // Prioridad: API_URL (server-only) o NEXT_PUBLIC_API_URL
    return (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001"
    );
  }

  // En Client Components (browser)
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001"
    );
  }

  // Fallback
  return "http://localhost:3001";
};

/**
 * Obtener timeout configurado
 * @returns {number} Timeout en milisegundos
 */
const getTimeout = () => {
  const timeout = process.env.NEXT_PUBLIC_API_TIMEOUT || "15000";
  return parseInt(timeout, 10) || 15000;
};

/**
 * Instancia principal de Axios para vehículos
 * 
 * Compatible con:
 * - Server Components (fetch desde servidor)
 * - Client Components (fetch desde cliente)
 */
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: getTimeout(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor de request con timestamp para medir duración
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof performance !== "undefined") {
      config.metadata = { start: performance.now() };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response con logging de errores
axiosInstance.interceptors.response.use(
  (response) => {
    if (response?.config?.metadata?.start && typeof performance !== "undefined") {
      response.config.metadata.durationMs = Math.round(
        performance.now() - response.config.metadata.start
      );
    }
    return response;
  },
  (error) => {
    // Logging de errores (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      const cfg = error.config || {};
      const method = (cfg.method || "GET").toUpperCase();
      const path = cfg.url || "";
      const base = cfg.baseURL || "";
      const url = `${base}${path}` || "unknown";
      const status = error.response?.status;
      const durationMs =
        cfg.metadata?.start && typeof performance !== "undefined"
          ? Math.round(performance.now() - cfg.metadata.start)
          : undefined;

      // Ignorar cancelaciones benignas
      const code = error.code;
      const name = error.name;
      const isCanceled =
        code === "ERR_CANCELED" || name === "CanceledError";

      if (!isCanceled) {
        if (status >= 500 || !status) {
          console.error("[API Error]", {
            method,
            url,
            status,
            durationMs,
            message: error.message,
          });
        } else if (status >= 400) {
          console.warn("[API Warning]", {
            method,
            url,
            status,
            durationMs,
            message: error.message,
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Instancia de Axios para requests autenticados
 * 
 * Incluye interceptor automático para agregar token de autorización
 */
const authAxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: getTimeout(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor de request: agregar token automáticamente
authAxiosInstance.interceptors.request.use(
  (config) => {
    // Solo en cliente (browser)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response: manejar 401 (token expirado)
authAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el token expiró, limpiar localStorage
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      // Emitir evento global para que la UI decida navegar
      try {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      } catch (_) {
        // no-op
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { authAxiosInstance };

