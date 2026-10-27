# Pendientes que necesitan a Gonzalo

Decisiones o acciones que solo podés hacer vos. Cada una tiene su lugar en `docs/PLAN.md`;
acá está el detalle. Lo resuelto se borra de esta lista (la historia queda en git).

Revisada el 2026-10-27. Se sacaron, por resueltas: los agentes de revisión (se usan en cada
cierre), la prueba de carga de un auto en el panel (confirmada el 2026-08-12), el archivo sin
uso del inicio (ya no existe), el chequeo de calidad (`npm run check` corre lint y da verde), el
log viejo (ya no está en el repo), la revisión visual de agosto (lleva dos meses publicada) y
dos pedidos al backend que dejaron de hacer falta (el panel ya no depende de su CORS ni verifica
la sesión borrando un auto). También se sacó "Tailwind sin usar": era un error, el cartel de
cookies lo usa.

---

## 1. ¿Dónde querés que lleguen los avisos de error? (PLAN D6)

Cuando algo se rompe en el sitio, queda anotado en un registro de Vercel que hay que ir a
buscar a mano. Lo normal es un servicio que te mande un mail.

- **Sentry**: lo más usado, gratis para este tamaño. Creás la cuenta y me pasás una clave.
  Suma unos 30 KB al sitio.
- **Dejarlo como está**: cero costo, hay que ir a mirar Vercel.

La cañería ya está puesta: el día que decidas es un cambio de 10 líneas.
**Recomendación:** Sentry, sin apuro.

---

## 2. Página de mantenimiento y TypeScript (PLAN F5 y F6)

- **Modo mantenimiento:** existe una página de "sitio en mantenimiento" que no se puede
  activar porque nunca se conectó. ¿La conectamos o la borramos?
- **TypeScript:** está a medio poner (2 archivos). O se adopta en serio, o se saca lo que sobra.

Se decide cuando la limpieza llegue a esas partes.

---

## 3. Pedido al backend: guardar la sesión de forma más segura (PLAN G3)

Hoy el panel guarda la sesión en el navegador y la da por buena si existe. Lo seguro es una
cookie que maneje el servidor. Es el pedido más grande y es a futuro.

---

## 4. Pedido al backend: campo `estado` por auto (PLAN G2)

**Para qué:** marcar un auto como vendido desde el panel y que en el listado público aparezca
con un cartel de VENDIDO. También poder pausarlo sin borrarlo.

**Por qué no se puede hacer sin ellos:** verificado el 2026-08-13, el backend no devuelve ni
guarda ningún campo de estado. Los que hay por auto son marca, modelo, anio, precio,
precioOferta, oferta, descuento, caja, kilometraje y las fotos. Si el dato no se guarda en algún
lado compartido, el cartel solo lo vería quien lo marcó, en su propio navegador.

**Qué pedir, textual:**

> Agregar al modelo de autos un campo `estado`, de texto, con solo tres valores
> permitidos: `activo`, `pausado`, `vendido`. Por defecto `activo`, para que los
> autos que ya están cargados no cambien. Que se pueda enviar al crear y al
> editar, y que venga incluido en la respuesta del listado y del detalle.

**Por qué un campo de estado y no un booleano `vendido`:** un booleano no alcanza para
"pausado", y un segundo booleano permite combinaciones sin sentido (vendido y pausado a la vez).

**Qué hacemos de este lado cuando exista:** casilla en el panel, el listado público filtra los
pausados, y las fichas vendidas salen con cartel.

---

## 5. Pedido de Gonzalo: el desplazamiento suave, en toda la página (PLAN G4)

El 2026-08-13: *"me encantó la suavidad del scroll, quiero así en demás lugares de la página"*.
Se refiere al carrusel de usados (desplazamiento suave con puntos de anclaje).

**Dónde replicarlo:** los otros carruseles (0km, promociones, marcas, galería de fotos) y el
desplazamiento general de las páginas largas.

**Cuidado:** respetar la opción del sistema "reducir movimiento"
(`@media (prefers-reduced-motion: reduce)`), como ya hace el carrusel de usados.
