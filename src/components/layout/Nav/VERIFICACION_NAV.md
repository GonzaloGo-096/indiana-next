# Verificación Nav (después de cambios en layout / globals / breakpoints)

Tras tocar `layout.js`, `globals.css`, `Nav.jsx`, `Nav.module.css` o variables de breakpoint, comprobar:

1. **Hamburger visible**  
   Viewport &lt; 768px: se ve el ícono hamburguesa y no el menú horizontal.

2. **Menú móvil al abrir**  
   Click en hamburguesa: panel desliza desde arriba, backdrop oscuro visible, enlaces clicables.

3. **Backdrop en 768px**  
   Con viewport exacto 768px y menú abierto: el backdrop debe verse (no ocultarse). Nav usa `769px` en el media (no variables) para que funcione en CSS Modules.

4. **Cerrar menú**  
   Click en backdrop o Escape: menú se cierra, backdrop desaparece.

5. **Scroll con menú cerrado**  
   Página hace scroll normal sin abrir el menú.

6. **Scroll con menú abierto**  
   Con menú abierto, la página no hace scroll; al cerrar, la posición de scroll se mantiene.

7. **Desktop (≥ 992px)**  
   Menú horizontal visible, sin hamburguesa ni panel móvil.
