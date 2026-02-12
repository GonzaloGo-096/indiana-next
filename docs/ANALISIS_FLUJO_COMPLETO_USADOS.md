# Análisis profesional: Flujo completo de la lista de autos usados

**Documento para:** Indiana Peugeot - Sistema de vehículos usados  
**Fecha:** Febrero 2025  
**Alcance:** Ciclo de vida completo desde creación (admin) hasta renderizado (público)

---

## 1. Resumen ejecutivo

El sistema de autos usados sigue una arquitectura **Next.js App Router** con:

- **Backend externo** (API REST en `localhost:3001` por defecto)
- **Panel admin** (`/admin`) para CRUD de vehículos
- **API Routes de Next.js** como proxy para optimizar imágenes antes de enviarlas al backend
- **Tres vistas públicas**: landing (`/usados`), listado completo (`/usados/vehiculos`), detalle (`/usados/[id]`)

La fuente de verdad de los datos es **siempre el backend**. El frontend consume, transforma y presenta los datos.

---

## 2. Arquitectura de alto nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE DATOS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌─────────────────┐     ┌──────────────────────────┐  │
│  │   Admin      │────►│  Next.js API    │────►│  Backend externo         │  │
│  │  CarFormRHF  │     │  Routes         │     │  (REST API)              │  │
│  │  (FormData)  │     │  /api/photos/*  │     │  localhost:3001          │  │
│  └──────────────┘     │  + Sharp        │     └───────────┬──────────────┘  │
│                       └─────────────────┘                 │                 │
│                                                          │                 │
│                                                          ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  LECTURA (público)                                                    │ │
│  │  vehiclesApi.server.js (Server) / vehiclesApi.js (Client)             │ │
│  │  GET /photos/getallphotos  |  GET /photos/getonephoto/:id               │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                          │                 │
│                                                          ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  VISTAS PÚBLICAS                                                      │ │
│  │  /usados (carrusel 8)  |  /usados/vehiculos (lista)  |  /usados/[id]  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Creación de autos (admin)

### 3.1 Flujo de creación

```
Usuario → Dashboard → "+ Agregar Vehículo" → Modal → CarFormRHF
    → Completa formulario
    → Submit → handleCreateVehicle(formData)
    → useCarMutation.createMutation.mutateAsync(formData)
    → vehiclesAdminService.createVehicle(formData)
    → fetch('/api/photos/create', { method: 'POST', body: formData })
    → API Route optimiza imágenes
    → fetch(backendURL + '/photos/create') → Backend
    → refetch() lista admin
```

### 3.2 Componentes involucrados

| Componente | Responsabilidad |
|------------|-----------------|
| `DashboardPage` | Orquesta la UI: lista, modal, filtros, botones. `handleOpenCreateForm` abre el modal. |
| `CarFormRHF` | Formulario con React Hook Form. Construye `FormData` con datos + imágenes. |
| `useCarMutation` | React Query mutations. `createMutation` llama a `vehiclesAdminService.createVehicle(formData)`. |
| `vehiclesAdminService` | Usa `fetch` hacia `/api/photos/create` (Next.js API Route). No usa axios directamente. |
| `/api/photos/create/route.js` | Proxy: optimiza imágenes con Sharp, reenvía FormData al backend. |

### 3.3 Formulario CarFormRHF

**Estructura del FormData enviado:**

- **Obligatorios:** `marca`, `modelo`, `precio`, `anio`, `caja`, `kilometraje`, `fotoPrincipal`, `fotoHover`
- **Opcionales:** `version`, `color`, `combustible`, `segmento`, `cilindrada`, `traccion`, `HP`
- **Imágenes:** `fotoPrincipal`, `fotoHover`, `fotosExtra` (array de archivos)

**Validación:**

- Campos requeridos vía `register('campo', { required: '...' })`
- Validación adicional en `validateForm()` antes del submit
- Imágenes: JPG, PNG, WEBP
- Cilindrada: formato X.X (ej. 2.0, 3.5), rango 0.5–9.9

**Hook de imágenes:** `useImageReducer` maneja previews, archivos nuevos, fotos existentes (en modo edit) y eliminación/restauración.

### 3.4 API Route /api/photos/create

1. Lee `FormData` del request
2. Por cada campo: si es imagen → Sharp (resize max 1200px, WebP 85%, sin metadata)
3. Reconstruye FormData con los mismos nombres
4. Copia header `Authorization` al backend
5. `fetch(backendURL + '/photos/create', { body: processedFormData })`
6. Devuelve respuesta del backend tal cual (status + body)

---

## 4. Actualización y eliminación (admin)

### 4.1 Actualización

- **Flujo:** `handleUpdateVehicle(formData, vehicleId)` → `updateMutation.mutateAsync({ id, formData })` → `vehiclesAdminService.updateVehicle(id, formData)` → `fetch('/api/photos/update/[id]', { method: 'PUT', body: formData })` → API Route → backend `PUT /photos/updatephoto/:id`
- **Diferencias con create:** Las imágenes no son obligatorias. Solo se optimizan las que se envían. Se incluye `_id` en el FormData.

### 4.2 Eliminación

- **Flujo:** `handleDeleteVehicle(vehicleId)` → `deleteMutation.mutateAsync(id)` → `authAxiosInstance.delete('/photos/deletephoto/:id')`
- **Nota:** La eliminación va directo al backend vía axios (no pasa por API Route), porque no hay imágenes que procesar.

---

## 5. Lista de usados (vistas públicas)

### 5.1 Rutas y componentes

| Ruta | Componente principal | Origen de datos | Características |
|------|----------------------|-----------------|-----------------|
| `/usados` | `page.jsx` | Server: `vehiclesService.getVehicles({ limit: 8, cursor: 1 })` | Carrusel de 8 autos, link "Ver todos" |
| `/usados/vehiculos` | `page.jsx` → `VehiculosClient` | Server: fetch inicial; Client: refetch al cambiar filtros / cargar más | Filtros, infinite scroll, ordenamiento |
| `/usados/[id]` | `page.jsx` (detalle) | Server: `vehiclesService.getVehicleById(id)` | Detalle individual |

### 5.2 Servicios de lectura

**Server (`vehiclesApi.server.js`):**

- Usa `fetch` nativo (no axios)
- Construye query params manualmente: `marca`, `caja`, `combustible`, `anio`, `precio`, `km`, `limit`, `cursor`
- Endpoint: `GET /photos/getallphotos?marca=X&limit=8&cursor=1`
- Caché: en producción `next: { revalidate: 21600, tags: ['vehicles-list'] }` (ISR 6 horas)

**Client (`vehiclesApi.js`):**

- Usa `axiosInstance` → `GET /photos/getallphotos`
- Sin caché: cada llamada va al backend
- Misma base URL: `NEXT_PUBLIC_API_URL` o `localhost:3001`

**Inconsistencia:** El servidor arma params en `vehiclesApi.server.js` a mano; el cliente usa `buildSearchParams(filters)` de `utils/filters.js`. Si se agrega un filtro en uno y no en el otro, puede haber divergencia.

### 5.3 Transformación de datos (vehicleMapper)

**Entrada backend:**

```js
{
  allPhotos: {
    docs: [{ _id, marca, modelo, precio, anio, ... }],
    totalDocs: number,
    hasNextPage: boolean,
    nextPage: number
  }
}
```

**Salida mapeada:**

```js
{
  vehicles: [{ id, marca, modelo, fotoPrincipal, fotoHover, imagen, ... }],
  total,
  totalDocs,
  hasNextPage,
  nextPage,
  totalPages
}
```

El mapper usa `extractVehicleImageUrls` y `extractAllImageUrls` para normalizar las URLs de imágenes según la estructura del backend.

---

## 6. Renderizado de la lista

### 6.1 Página /usados (landing)

- **Server Component** puro
- Fetch de 8 vehículos en servidor
- `UsadosCarousel` recibe `vehicles` y los muestra en carrusel
- Link "Ver todos" → `/usados/vehiculos`

### 6.2 Página /usados/vehiculos (listado completo)

**Primera carga (Server):**

1. `VehiculosPage` recibe `searchParams`
2. `parseFilters(searchParams)` → objeto `filters`
3. `vehiclesService.getVehicles({ filters, limit: 8, cursor })` con caché ISR
4. `mapVehiclesPage(backendData, cursor)` → `{ vehicles, total, hasNextPage, nextPage }`
5. Pasa `initialData` a `VehiculosClient` dentro de `<Suspense>`

**Interactividad (Client):**

- Estado: `data` = `useState(initialData)`, filtros/página/sort desde `useSearchParams()`
- **Aplicar filtros:** `handleApplyFilters` → actualiza URL + fetch con axios → `setData(mappedData)`
- **Cargar más:** `handleLoadMore` → fetch con `cursor = data.nextPage` → concatena vehículos sin duplicados
- **Ordenamiento:** `sort` en URL; `sortVehicles(data.vehicles, currentSort)` en cliente (sin nuevo fetch)

**Componentes de UI:**

- `BrandsCarousel`: marcas para filtro rápido
- `FilterFormSimple`: filtros avanzados
- `ActionButtons`: botones de filtro y orden
- `AutosGrid` / `ListAutos`: grid de cards con infinite scroll

### 6.3 Card de vehículo

Cada vehículo se muestra con:

- `fotoPrincipal` o `imagen` como imagen principal
- `marca`, `modelo`, `version`
- `anio`, `kilometraje`, `caja`
- `precio` formateado
- Link a `/usados/[id]`

---

## 7. Caché y revalidación

| Capa | Comportamiento |
|------|----------------|
| **Next.js Data Cache (servidor)** | Lista: `revalidate: 21600`, tag `vehicles-list`. Detalle: tag `vehicle:{id}`. |
| **Cliente (lista pública)** | Sin SWR/React Query. Solo `useState` + refetch. Varias llamadas idénticas posibles. |
| **Admin (React Query)** | `queryKey: ['vehicles']`. `invalidateQueries` tras create/update/delete. |
| **Revalidación manual** | `POST /api/revalidate` con `x-revalidate-secret`. IDs "sucios" en `dirtyVehicleIds.js`. |

---

## 8. Diagrama de secuencia (creación → vista)

```
Admin                    Next.js API              Backend               Usuario
  |                          |                        |                     |
  |--[FormData]------------->|                        |                     |
  |                          |--[FormData optimizado]->|                    |
  |                          |<--[vehículo creado]-----|                    |
  |<--[JSON]-----------------|                        |                     |
  |                          |                        |                     |
  | refetch() ---------------|------------------------|--[GET getallphotos]->|
  |                          |                        |<--[lista]-----------|
  |                          |                        |                     |
  |                          |                        |     (Usuario visita /usados o /usados/vehiculos)
  |                          |                        |<--[GET getallphotos]-|
  |                          |                        |--[docs, totalDocs]->|
  |                          |                        |                     |
  |                          |                        |     mapVehiclesPage()
  |                          |                        |     UsadosCarousel / VehiculosClient
  |                          |                        |     → Renderizado
```

---

## 9. Puntos críticos y recomendaciones

### 9.1 Duplicación de construcción de filtros

- **Problema:** `vehiclesApi.server.js` arma params a mano; el cliente usa `buildSearchParams(filters)`.
- **Recomendación:** Unificar en un módulo compartido (ej. `buildVehicleQueryParams`) usado por servidor y cliente.

### 9.2 Código no utilizado

- `UsadosClient.jsx` existe pero no se referencia. La lista real está en `VehiculosClient.jsx`. Valorar eliminar o integrar.

### 9.3 Paginación

- El mapper calcula `totalPages` con divisor fijo 12, mientras que la app usa `limit: 8`. Corregir para usar el mismo valor (ej. constante compartida).

### 9.4 Scroll al volver del detalle

- En `VehiculosClient` se usa `"scroll_vehicles-list"` en lugar de `STORAGE_KEYS.VEHICLES_LIST_SCROLL` (`'vehicles_list_scroll'`). La restauración de scroll falla (ver `ANALISIS_LISTA_USADOS_Y_CACHE.md`).

### 9.5 Caché en cliente

- La lista pública no usa SWR ni React Query. Mismas combinaciones de filtros/página pueden generar múltiples requests. Evaluar introducir caché en cliente.

---

## 10. Conclusión

El flujo de autos usados está bien estructurado en capas:

1. **Admin:** Formulario → API Route (optimización imágenes) → Backend
2. **Lectura:** Backend → Servicios (server/client) → Mapper → Componentes
3. **Vistas:** Landing (carrusel 8) y listado completo (filtros, infinite scroll, ordenamiento)

Las mejoras prioritarias son: unificar construcción de filtros, corregir la key de scroll, alinear `totalPages` con el `limit` real y decidir qué hacer con `UsadosClient.jsx` y la caché en cliente.
