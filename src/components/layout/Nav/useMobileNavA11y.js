import { useEffect, useRef } from "react";
import { getFocusableElements } from "./navFocus";

/**
 * Cuando el menú móvil está abierto:
 * - Enfoca el primer elemento enfocable del panel.
 * - Atrapa Tab / Shift+Tab dentro del panel.
 * Al cerrar: devuelve el foco al botón que abrió el menú.
 *
 * @param {boolean} isOpen
 * @param {React.RefObject<HTMLElement | null>} panelRef
 * @param {React.RefObject<HTMLElement | null>} triggerRef
 */
export function useMobileNavA11y(isOpen, panelRef, triggerRef) {
  const focusBeforeOpenRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const panel = panelRef.current;
    const trigger = triggerRef.current;

    if (!panel) {
      return undefined;
    }

    focusBeforeOpenRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const runFocusFirst = () => {
      const focusables = getFocusableElements(panel);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else if (panel) {
        panel.focus();
      }
    };

    const id = window.requestAnimationFrame(runFocusFirst);

    const onKeyDown = (event) => {
      if (event.key !== "Tab" || !panel) return;

      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKeyDown, true);

      if (trigger && typeof trigger.focus === "function") {
        trigger.focus();
      } else if (
        focusBeforeOpenRef.current &&
        typeof focusBeforeOpenRef.current.focus === "function"
      ) {
        focusBeforeOpenRef.current.focus();
      }
    };
  }, [isOpen, panelRef, triggerRef]);
}
