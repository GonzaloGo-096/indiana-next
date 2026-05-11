"use client";

import { useEffect } from "react";
import { STORAGE_KEYS } from "../../../../constants/storageKeys";
import { VEHICLE_CONSTANTS } from "../../../../constants/vehicles";
import { debugIngest } from "../../../../lib/debugIngestClient";

/**
 * Guarda datos acumulados en sessionStorage y los restaura (junto con la
 * posición de scroll) al volver desde una página de detalle.
 *
 * @param {Object} opts
 * @param {Object}   opts.data                      - Datos actuales de la lista
 * @param {Function} opts.setData                   - Setter de datos
 * @param {string}   opts.searchParamsFingerprint    - QS string para validar contexto
 */
export function useScrollRestore({ data, setData, searchParamsFingerprint }) {
  // --- Guardar datos acumulados ---------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!data.vehicles || data.vehicles.length === 0) return;
    if (sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL)) return;
    try {
      const payload = { ...data, _fp: searchParamsFingerprint };
      sessionStorage.setItem(
        STORAGE_KEYS.VEHICLES_LIST_DATA,
        JSON.stringify(payload),
      );
    } catch {
      /* cuota */
    }
  }, [data, searchParamsFingerprint]);

  // --- Restaurar al volver --------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    debugIngest({
      hypothesisId: "E",
      location: "useScrollRestore:mount",
      message: "checking scroll restore",
      data: {
        scrollY: window.scrollY,
        savedScroll: sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL),
        savedDataKeys: sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_DATA)
          ? "present"
          : "absent",
        t: Date.now(),
      },
    });

    const restoreScrollAndData = () => {
      try {
        const savedScrollRaw = sessionStorage.getItem(
          STORAGE_KEYS.VEHICLES_LIST_SCROLL,
        );
        if (!savedScrollRaw) return;

        const scrollData = JSON.parse(savedScrollRaw);
        const isRecent =
          scrollData.timestamp &&
          Date.now() - scrollData.timestamp <
            VEHICLE_CONSTANTS.SCROLL_DATA_MAX_AGE;

        if (scrollData.path !== "/usados/vehiculos" || !isRecent) {
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_DATA);
          return;
        }

        let dataRestored = false;
        const savedListRaw = sessionStorage.getItem(
          STORAGE_KEYS.VEHICLES_LIST_DATA,
        );
        if (savedListRaw) {
          try {
            const savedList = JSON.parse(savedListRaw);
            const currentFp = new URLSearchParams(
              window.location.search,
            ).toString();
            const savedFp = savedList?._fp ?? "";
            if (savedList?.vehicles?.length > 0 && savedFp === currentFp) {
              debugIngest({
                hypothesisId: "E",
                location: "useScrollRestore:restoreData",
                message: "restaurando lista de vehículos",
                data: {
                  vehiculosGuardados: savedList.vehicles.length,
                  vehiculosActuales: data.vehicles?.length,
                  scrollTarget: scrollData.position,
                },
              });
              const { _fp, ...cleanData } = savedList;
              setData(cleanData);
              dataRestored = true;
            }
          } catch {
            /* parse error */
          }
        }

        const scrollDelay = dataRestored ? 600 : 300;

        setTimeout(() => {
          debugIngest({
            hypothesisId: "E",
            location: "useScrollRestore:scrollTo",
            message: "ejecutando scrollTo",
            data: {
              targetPosition: scrollData.position,
              pageHeight: document.body.scrollHeight,
              dataRestored,
              scrollDelay,
            },
          });
          window.scrollTo({ top: scrollData.position, behavior: "instant" });
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_DATA);
        }, scrollDelay);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error al restaurar scroll:", err);
        }
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_DATA);
      }
    };

    const timeoutId = setTimeout(
      restoreScrollAndData,
      VEHICLE_CONSTANTS.SCROLL_RESTORE_TIMEOUT,
    );
    return () => clearTimeout(timeoutId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
