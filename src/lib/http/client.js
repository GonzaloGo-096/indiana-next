/**
 * client.js - Cliente HTTP para Client Components
 *
 * Instancias de Axios configuradas para consumir el backend.
 * Solo para uso en cliente (browser); en server usar lib/http/server.js
 *
 * @author Indiana Peugeot
 * @version 1.0.0 - Fase 2 refactor
 */

import axios from "axios";
import { getApiBaseUrl, getApiTimeout } from "@/lib/config/api";

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: getApiTimeout(),
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

const authAxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: getApiTimeout(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

authAxiosInstance.interceptors.request.use(
  (config) => {
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

authAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
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
