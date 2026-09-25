# Estados de los autos usados

Cada auto usado tiene un **estado** comercial. Lo guarda el backend en el campo
`estado` y lo cambia el panel. Este documento es el contrato: qué significa cada
estado, quién lo decide y qué ve cada uno.

Vigente desde el 2026-09-24 (backend `main` 6d4a9d1, en producción).

## Los tres estados

| Estado | En pantalla | Qué ve el público | Qué ve el panel |
|---|---|---|---|
| `ACTIVO` | Disponible | Normal, a la venta | El auto, sin etiqueta |
| `VENDIDO` | Vendido | En el listado de usados, **al final** y con la banda "Vendido". **No** aparece en los carruseles. Su ficha se ve, con "Consultar por unidades similares" en lugar del contacto por ese auto | Etiqueta roja "Vendido" |
| `PAUSADO` | Pausado | **Nada.** No aparece en listados ni carruseles, y su ficha da "no encontrado" (también por link directo) | Etiqueta ámbar "Pausado" |

- Un auto **sin** estado, o con un valor desconocido, cuenta como `ACTIVO`. Es el
  lado seguro: esconder un auto que sí está a la venta cuesta plata.
- Para qué sirve cada uno: `VENDIDO` es vidriera (muestra que se vende) y
  `PAUSADO` es "no está a la venta por ahora" (señado, en taller) sin borrarlo.

## Quién decide qué

| Regla | Dónde vive |
|---|---|
| Qué estados existen y cuál es el default | Backend (`models/photosSchema.js`) |
| La lista pública no trae pausados | Backend (`GET /photos/getallphotos`) |
| La lista del panel trae todos, con credencial y sin caché | Backend (`GET /photos/getallphotos/private`) |
| Cambiar el estado, y borrar el caché al hacerlo | Backend (`PATCH /photos/updatestatus/:id`) |
| Cómo se nombra cada estado en pantalla | Frontend, `ETIQUETAS_ESTADO` en `src/utils/vehicleEstado.js` |
| Vendidos al final y fuera de los carruseles | Frontend, `vendidosAlFinal` y `sinVendidos` |
| La ficha de un pausado da "no encontrado" | Frontend, `getPublicVehicleById` en `src/lib/services/vehiclesApi.server.js` |

Toda la lógica de estados del frontend pasa por `src/utils/vehicleEstado.js`.
Ningún componente decide por su cuenta qué es "vendido" o "pausado".

## Cómo lo cambia el panel

En **Usados → Editar**, arriba del formulario, "Estado de publicación". Al
guardar, el estado va por su propia operación del backend **antes** que el resto
de los datos: si falla, no se guarda nada y el panel queda como estaba.

La lista del panel tiene un filtro Todos / Disponible / Vendido / Pausado.

Recorrido de los pedidos (el navegador nunca le habla directo al backend):

```
Panel → /api/admin/vehicles        → GET   /photos/getallphotos/private
Panel → /api/admin/vehicles/[id]   → PATCH /photos/updatestatus/:id
                                     DELETE /photos/deletephoto/:id
Web   → /api/catalogo/…             → GET   /photos/getallphotos, /photos/getonephoto/:id
```

## Pendiente del lado del backend

- `GET /photos/getonephoto/:id` devuelve un auto pausado a cualquiera que tenga
  el id. La web lo esconde (ver arriba), pero la API pública no. Mejora opcional:
  que responda 404 a los pausados sin credencial.
