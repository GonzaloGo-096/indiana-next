# Análisis: Lista principal de usados y sistema de caché

Documento para revisión con IA (GPT u otra) y preparación para producción. **No se ha modificado código**; solo se describe el estado actual y los puntos a mejorar.

---

## 1. Resumen ejecutivo

- **Lista principal de usados**: hay dos rutas relevantes:
  - **`/usados`**: página de entrada con carrusel de 8 vehículos (solo Server Component).
  - **`/usados/vehiculos`**: listado completo con filtros, paginación e infinite scroll (Server Component + `VehiculosClient`).
- **Caché**: Next.js Data Cache (fetch con ISR) en servidor; en cliente no hay librería de caché (SWR/React Query) para la lista pública.
- **Fuente de verdad**: la URL (`searchParams`) para filtros, página y orden; el estado local en `VehiculosClient` refleja esos datos y los resultados del fetch.

---

## 2. Arquitectura por capas

### 2.1 Rutas y componentes

| Ruta | Componente principal | ¿Client? | Origen de datos |
|------|----------------------|----------|------------------|
| `/usados` | `page.jsx` | No | `vehiclesService.getVehicles()` en servidor, 8 ítems, cursor 1 |
| `/usados/vehiculos` | `page.jsx` → `VehiculosClient` | Sí (hijo) | Server: fetch inicial con `searchParams`; Client: refetch al cambiar filtros/página y “cargar más” |
| `/usados/[id]` | `page.jsx` (detalle) | No (con hijo client para UI) | `vehiclesService.getVehicleById(id)` en servidor |

- **`UsadosClient.jsx`**: existe pero **no se usa** en ninguna ruta. La lista real está en `VehiculosClient.jsx` bajo `/usados/vehiculos`. Conviene eliminar o integrar para no mantener código muerto.

### 2.2 Servicios de datos

- **Server (`vehiclesApi.server.js`)**: solo para Server Components. Usa `fetch` nativo con:
  - Timeout vía `AbortController`.
  - En **desarrollo**: `cache: 'no-store'` (sin caché).
  - En **producción**: `cache: undefined` y `next: { revalidate: 21600, tags: ['vehicles-list'] }` (lista) o `tags: ['vehicle-detail', 'vehicle:{id}']` (detalle). ISR 6 horas y revalidación por tags.
- **Client (`vehiclesApi.js`)**: para Client Components. Usa **axios** (`axiosInstance`). Sin caché: cada llamada va al backend. No hay deduplicación ni retry a nivel de lista.

La construcción de query params para la lista está **duplicada**:
- En **servidor**: `vehiclesApi.server.js` arma a mano `marca`, `caja`, `combustible`, `anio`, `precio`, `km`, `limit`, `cursor`.
- En **cliente**: `buildSearchParams(filters)` en `utils/filters.js`.
Si se agrega un filtro en uno y no en el otro, hay riesgo de divergencia. Recomendación: que el servidor use la misma función o un módulo compartido (p. ej. params que el backend entienda) para construir la query.

---

## 3. Flujo de la lista principal (`/usados/vehiculos`)

### 3.1 Primera carga (Server)

1. `VehiculosPage` (Server) recibe `searchParams` (en Next 15 puede ser Promise, se hace `await`).
2. `parseFilters(resolvedSearchParams)` → objeto `filters`.
3. `page` = `searchParams.page` o 1; `cursor` = page.
4. `vehiclesService.getVehicles({ filters, limit: 8, cursor })` → fetch al backend con caché/ISR.
5. `mapVehiclesPage(backendData, cursor)` → `{ vehicles, total, hasNextPage, nextPage, ... }`.
6. Se pasa `initialData`, `initialFilters`, `initialPage` a `VehiculosClient` dentro de `<Suspense>`.

### 3.2 Interactividad (Client)

- **Estado en `VehiculosClient`**:
  - `data` = `useState(initialData)` (lista, total, paginación).
  - `currentFilters`, `currentPage`, `currentSort` derivados de `useSearchParams()` vía `useMemo`.
- **Al aplicar filtros**: `handleApplyFilters(newFilters)` → `updateURL(newFilters, 1, currentSort)` (URL) + fetch con `vehiclesService.getVehicles()` (axios) y `setData(mappedData)`. No se reutiliza el resultado del Server Component; se hace un segundo request.
- **Al “Cargar más”**: `handleLoadMore()` usa `data.nextPage` y hace fetch con el mismo `vehiclesService.getVehicles()` (cursor = nextPage), luego concatena vehículos y evita duplicados por `id`.
- **Ordenación**: el `sort` está en la URL; el orden se aplica en cliente con `sortVehicles(data.vehicles, currentSort)` (no vuelve a pedir al backend).

Efecto: en la misma sesión, si el usuario cambia filtros o página, **siempre** hay al menos un request desde el cliente (axios). El dato inicial del servidor solo se usa en la primera pintada; después la fuente de verdad de la lista es el estado local + refetch.

---

## 4. Caché en detalle

### 4.1 Next.js Data Cache (servidor)

- **Lista** (`getVehicles`):
  - Producción: `next: { revalidate: 21600, tags: ['vehicles-list'] }`.
  - La URL del fetch incluye filtros + limit + cursor, así que **cada combinación (filtros, página) es una entrada de caché distinta**. Con muchos filtros/páginas se generan muchas entradas.
- **Detalle** (`getVehicleById`):
  - `next: { revalidate: 21600, tags: ['vehicle-detail', 'vehicle:{id}'] }`.
- **Desarrollo**: `cache: 'no-store'` en el primer intento de `fetchWithTimeout`; en el fallback a `127.0.0.1` siempre se usa `cache: 'no-store'` (correcto para dev).

La opción `next` se pasa en `options` a `fetchWithTimeout` y se reenvía con `...options` al `fetch`, por lo que en producción el comportamiento ISR y tags es el esperado.

### 4.2 Revalidación manual

- **Ruta**: `POST /api/revalidate`.
- **Autenticación**: header `x-revalidate-secret` (valor en `REVALIDATE_SECRET`). No hay auth de usuario; solo el secret.
- **Body**: `{ vehicleIds: string[], revalidateList: boolean, warmup: boolean }`.
- **Acciones**: `revalidateTag('vehicles-list')` y `revalidateTag('vehicle:' + id)` por cada id; luego opcionalmente warmup de `/usados/vehiculos` y `/usados/[id]`.
- **Uso**: desde el admin, sección “Publicación / Cache” (`RevalidateSection.jsx`), el usuario pega el secret y dispara la revalidación. Los IDs “sucios” se trackean en mutaciones (p. ej. `useCarMutation`) para poder revalidar después de crear/editar/eliminar.

No hay revalidación automática al publicar (p. ej. webhook del backend); todo es manual vía ese endpoint.

### 4.3 Cliente (navegador)

- **Lista pública**: no hay SWR, React Query ni similar. Solo `useState(initialData)` y refetch con axios. No hay caché en memoria ni por clave (filtros + página).
- **Consecuencias**: mismo filtro/página en la misma sesión puede generar varios requests idénticos; no hay deduplicación ni “stale-while-revalidate” en cliente.

---

## 5. Paginación y mapeo

- **Backend**: se asume algo tipo `allPhotos: { docs, totalDocs, hasNextPage, nextPage }`.
- **Mapper** (`vehicleMapper.js`):
  - `mapVehiclesPage(backendPage, currentCursor)` devuelve `nextPage` validado: si el backend envía un `nextPage` inválido (≤ currentCursor), se corrige a `currentCursor + 1`.
  - `totalPages` se calcula como `Math.ceil(totalDocs / 12)` (**valor fijo 12**), mientras que en la app el `limit` de la lista es **8** (`VEHICLE_CONSTANTS.LIST_PAGE_SIZE`). Si el backend devuelve `totalDocs` para esa página de 8, `totalPages` queda incoherente. Recomendación: pasar el `limit` al mapper o usar un constante compartido para el cálculo de `totalPages`.

---

## 6. Scroll y sessionStorage

Se usan dos keys en `storageKeys.js`:

- **`VEHICLES_LIST_SCROLL`** = `'vehicles_list_scroll'`: guardar al ir al detalle un objeto `{ position, path: '/usados/vehiculos', timestamp }`. Lo escriben `CardAuto.jsx` y `CardSimilar.jsx` con `STORAGE_KEYS.VEHICLES_LIST_SCROLL`.
- **`VEHICLES_SCROLL_POSITION`** = `'vehiculos_scroll_position'`: solo número (posición). Se usa al hacer “Volver a lista principal” para restaurar scroll después de limpiar filtros.

**Bug detectado**: en `VehiculosClient.jsx` línea ~89 se **lee** con la clave hardcodeada `"scroll_vehicles-list"` en lugar de `STORAGE_KEYS.VEHICLES_LIST_SCROLL` (`'vehicles_list_scroll'`). Por tanto:
- La lectura de la posición al volver del detalle **nunca** encuentra los datos (guardados en `vehicles_list_scroll`).
- El `removeItem` sí usa `STORAGE_KEYS.VEHICLES_LIST_SCROLL`, así que se limpia la key correcta pero después de no haber restaurado nada.

**Acción**: usar `sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL)` (y parsear el JSON) donde ahora se usa `"scroll_vehicles-list"`.

---

## 7. Preload de imágenes (usados)

- **Hook** `usePreloadUsados.js`: precalienta imágenes de los vehículos (por defecto 6 iniciales, luego batches de 4). Usa propiedades `imagenPrincipal?.url` o `imagen`; en el mapper los vehículos tienen `fotoPrincipal`, `fotoHover`, `imagen`. Hay que confirmar que los nombres de propiedades coincidan con lo que realmente recibe el componente que usa el hook (p. ej. carrusel en `/usados`), para que el preload no quede vacío.

---

## 8. Constantes y tamaños de página

- **`VEHICLE_CONSTANTS.LIST_PAGE_SIZE`** = 8: usado en `VehiculosClient` para fetch de filtros y para “cargar más”.
- **Página de lista (Server)** en `vehiculos/page.jsx`: también `limit: 8`.
- **Mapper**: `totalPages` con divisor 12. Unificar con `LIST_PAGE_SIZE` (8) o con lo que realmente use el backend.

---

## 9. Checklist para producción (resumen)

1. **Scroll**: Corregir key de sessionStorage en `VehiculosClient.jsx` (`scroll_vehicles-list` → `STORAGE_KEYS.VEHICLES_LIST_SCROLL`).
2. **Código muerto**: Decidir qué hacer con `UsadosClient.jsx` (no referenciado).
3. **Filtros**: Unificar construcción de query params entre servidor y cliente (p. ej. reutilizar `buildSearchParams` o un módulo compartido).
4. **Paginación**: Alinear `totalPages` en el mapper con el `limit` real (8 o constante compartida).
5. **Caché cliente**: Valorar SWR o React Query para la lista en `/usados/vehiculos` (deduplicación, menos refetch innecesarios, posible revalidación en foco).
6. **Revalidación**: Mantener `REVALIDATE_SECRET` seguro; valorar revalidación automática (webhook o cron) si el backend publica cambios.
7. **Preload**: Verificar que las propiedades de imagen en `usePreloadUsados` coincidan con el formato de vehículos que recibe (mapper + componente).
8. **Errores**: Revisar que todas las rutas de lista/detalle manejen bien error del backend (mensaje, retry, no romper layout).

Este documento sirve como base para que, trabajando con IA (p. ej. GPT), se prioricen y apliquen estos cambios de forma ordenada hasta dejar el flujo de lista de usados y caché listos para producción.
