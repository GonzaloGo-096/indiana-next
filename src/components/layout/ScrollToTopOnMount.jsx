"use client";

/**
 * ScrollToTopOnMount - Componente para asegurar scroll al top al cargar página
 * 
 * Problema resuelto:
 * - Cuando la página carga, el scroll puede estar en posición incorrecta
 * - Los skeletons aparecen mientras el scroll está abajo
 * - Esto causa una mala experiencia de usuario
 * 
 * Solución:
 * - Scroll inmediato al top ANTES de que se renderice cualquier contenido
 * - Se ejecuta PRIMERO, antes que cualquier lógica de restauración de scroll
 * - Orden correcto: Scroll al top → Skeleton → Contenido
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTopOnMount() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const hasInitialScrollRef = useRef(false);

  // ✅ PRIORIDAD 1: Scroll al top en mount inicial (lo más temprano posible)
  useEffect(() => {
    if (!hasInitialScrollRef.current && typeof window !== "undefined") {
      // ✅ Scroll inmediato al top ANTES de cualquier contenido
      // Usar 'instant' para que sea inmediato, sin animación
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
      hasInitialScrollRef.current = true;
    }
  }, []); // Solo en mount inicial

  // ✅ PRIORIDAD 2: Scroll al top cuando cambia la ruta (nueva página)
  // ✅ EXCEPCIÓN: Si hay posición guardada para esta ruta, restaurar en lugar de ir al top
  //    Esto cubre el caso de cache hit de Next.js donde useEffect([]) no corre en VehiculosClient
  useEffect(() => {
    const isNewRoute = pathnameRef.current !== pathname;
    pathnameRef.current = pathname;

    if (!isNewRoute || typeof window === "undefined") return;

    try {
      const savedScrollRaw = sessionStorage.getItem("vehicles_list_scroll");
      if (savedScrollRaw) {
        const savedScroll = JSON.parse(savedScrollRaw);
        const isRecent = savedScroll.timestamp &&
          (Date.now() - savedScroll.timestamp) < 5 * 60 * 1000;

        if (savedScroll.path === pathname && isRecent && savedScroll.position > 0) {
          // No scrollear al top — VehiculosClient lo maneja si está montado.
          // Si no está montado (cache hit), restauramos aquí después de un delay.
          setTimeout(() => {
            // Solo restaurar si VehiculosClient no lo hizo ya (clave aún presente)
            if (sessionStorage.getItem("vehicles_list_scroll")) {
              window.scrollTo({ top: savedScroll.position, behavior: "instant" });
              sessionStorage.removeItem("vehicles_list_scroll");
              sessionStorage.removeItem("vehicles_list_data");
            }
          }, 350);
          return; // No scrollear al top
        }
      }
    } catch {}

    // ✅ Scroll inmediato al top cuando cambia la ruta
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null; // Componente sin UI
}

