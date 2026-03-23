# 🎓 Análisis Profundo del Código - Indiana Next

## Explicación para principiantes (paso a paso)

---

## PARTE 1: ¿QUÉ ES ESTE PROYECTO?

Imagina una **página web de una concesionaria de autos** (Indiana Peugeot en Tucumán). La web muestra:

1. **Autos 0km** (Peugeot nuevos: 208, 2008, 3008, etc.)
2. **Autos usados** (de muchas marcas)
3. **Planes de financiación**
4. **Servicios postventa** (service, chapa y pintura, repuestos)
5. **Empleos** (trabajá con nosotros)
6. **Panel de admin** para que los empleados suban/editen autos usados

Todo esto está construido con **Next.js 16** (un framework de React) y **React 19**.

---

## PARTE 2: LA ESTRUCTURA BÁSICA (como una casa)

```
📁 src/
├── app/          ← Las "habitaciones" (páginas)
├── components/   ← Los "muebles" (botones, cards, formularios)
├── hooks/        ← "Herramientas" reutilizables
├── lib/          ← Servicios que hablan con el backend
├── data/         ← Datos estáticos (modelos 0km, planes)
├── config/       ← Configuración (imágenes, auth)
├── utils/        ← Funciones auxiliares
├── constants/    ← Valores fijos (filtros, etc.)
└── styles/       ← Variables CSS globales
```

**Analogía:** `app` son las páginas (habitaciones), `components` son los elementos que ves (muebles), y `lib` es como el teléfono que llama al backend para traer datos.

---

## PARTE 3: ¿CÓMO FUNCIONA UNA PÁGINA? (El ciclo de vida)

### 3.1 El Layout (layout.js)

Es como el **esqueleto** de toda la web. Siempre está ahí:

```
┌─────────────────────────────────────┐
│  NAV (barra de arriba)               │
├─────────────────────────────────────┤
│                                     │
│  CONTENIDO DE LA PÁGINA ACTUAL      │  ← Aquí va page.jsx
│  (children)                         │
│                                     │
├─────────────────────────────────────┤
│  FOOTER                             │
└─────────────────────────────────────┘
```

- Usa **Poppins** y **Barlow Condensed** como fuentes
- Incluye `ClientOnlyComponents` (Analytics, ScrollToTop)
- El Footer se carga con `dynamic()` para no bloquear

### 3.2 Server vs Client Components

**Concepto clave:** En Next.js hay dos tipos:

| Tipo | ¿Dónde corre? | ¿Puede usar hooks? | ¿Puede hacer fetch? |
|------|---------------|-------------------|---------------------|
| **Server** | En el servidor (Node) | No | Sí (fetch nativo) |
| **Client** | En el navegador | Sí | Sí (axios, fetch) |

**Regla simple:** Si el componente necesita `useState`, `useEffect`, o interactividad → es **Client** (lleva `"use client"` arriba).

**Ejemplo:** La página Home (`page.jsx`) es Server: hace fetch de vehículos y los pasa a `UsadosSection`. El `VehiculosClient` es Client: maneja filtros, paginación, clics.

---

## PARTE 4: FLUJO DE DATOS - USADOS (el más importante)

Cuando entrás a `/usados/vehiculos`, pasa esto:

```
1. USUARIO entra a /usados/vehiculos?marca=Ford&page=2

2. SERVER (VehiculosPage):
   - Lee searchParams (marca=Ford, page=2)
   - Parsea con parseFilters() → { marca: ["Ford"], page: 2 }
   - Llama a vehiclesService.getVehicles() [vehiclesApi.server.js]
   - Backend: GET /photos/getallphotos?marca=Ford&limit=8&cursor=2
   - Recibe JSON con allPhotos: { docs: [...], hasNextPage, nextPage }
   - Mapea con mapVehiclesPage() → { vehicles, total, hasNextPage, nextPage }
   - Pasa initialData a VehiculosClient

3. CLIENT (VehiculosClient):
   - Recibe initialData
   - Estado local: data, isLoading, error
   - URL es la "fuente de verdad": currentFilters = parseFilters(searchParams)
   - Si el usuario aplica filtros → updateURL() → router.replace() → URL cambia
   - Si cambia la URL → el Server Component NO se re-ejecuta automáticamente
   - Por eso hace fetch ADICIONAL desde el cliente con vehiclesService.getVehicles()

4. INFINITE SCROLL (Cargar más):
   - handleLoadMore() usa data.nextPage
   - Fetch con cursor: nextPage
   - ACUMULA: setData(prev => ({ vehicles: [...prev.vehicles, ...newVehicles] }))
   - NO actualiza URL (para no hacer scroll hacia arriba)
```

**Resumen:** La URL guarda filtros y página. El Server hace el primer fetch. El Client hace fetches cuando el usuario cambia filtros o carga más.

---

## PARTE 5: LOS DOS SERVICIOS DE VEHÍCULOS (¡Cuidado!)

Hay **dos archivos** que traen vehículos:

| Archivo | ¿Dónde se usa? | ¿Qué usa? |
|---------|----------------|-----------|
| `vehiclesApi.server.js` | Server Components (Home, UsadosPage, VehiculosPage, detalle) | `fetch` nativo |
| `vehiclesApi.js` | Client Components (VehiculosClient, Admin) | `axios` |

**¿Por qué dos?** Porque en el servidor no podés usar axios con el token de localStorage (no existe). Y el servidor usa `fetch` que Next.js optimiza (cache, deduplicación).

**Backend esperado:**
- Lista: `GET /photos/getallphotos?marca=Ford,Renault&limit=8&cursor=2`
- Detalle: `GET /photos/getonephoto/123`

---

## PARTE 6: EL MAPPER (vehicleMapper.js)

El backend devuelve datos en un formato. El frontend espera otro. El **mapper** traduce.

**Backend devuelve:**
```json
{
  "allPhotos": {
    "docs": [
      {
        "_id": "abc123",
        "marca": "Ford",
        "modelo": "Focus",
        "fotoPrincipal": { "url": "https://..." },
        "precio": 15000000
      }
    ],
    "totalDocs": 50,
    "hasNextPage": true,
    "nextPage": 3
  }
}
```

**Frontend espera (después de mapVehiclesPage):**
```json
{
  "vehicles": [
    {
      "id": "abc123",
      "marca": "Ford",
      "modelo": "Focus",
      "fotoPrincipal": "https://...",
      "imagen": "https://...",
      "precio": 15000000,
      "title": "Ford Focus"
    }
  ],
  "total": 50,
  "hasNextPage": true,
  "nextPage": 3
}
```

**imageExtractors.js** ayuda: extrae URLs de objetos `{ url: "..." }` o strings. El backend a veces manda uno, a veces otro.

---

## PARTE 7: FILTROS (filters.js)

**Única fuente de verdad:** `buildSearchParams()` y `parseFilters()`.

- **parseFilters(searchParams)** → Convierte URL `?marca=Ford,Renault&anio=2015,2020` a objeto `{ marca: ["Ford","Renault"], año: [2015,2020] }`
- **buildSearchParams(filters)** → Convierte objeto a URLSearchParams para la URL o el backend

**Constantes (filterOptions.js):**
- Marcas: Toyota, Ford, Peugeot, etc.
- Combustible: Nafta, Diesel, Gas
- Caja: Manual, Automático, Secuencial
- Rangos por defecto: Año 1990-2024, Precio 5M-100M, Km 0-200000

---

## PARTE 8: PÁGINAS 0KM (datos estáticos)

Los modelos 0km **no vienen del backend**. Están en archivos JS:

- `data/modelos/peugeot208.js`
- `data/modelos/peugeot2008.js`
- etc.

Cada modelo tiene:
- `versiones` (Active, Allure, GT, etc.)
- `coloresPermitidos`
- `galeria` (imágenes)
- `heroImage`
- `features` (secciones de características)

**ModeloSelectorContext:** Un Context que comparte qué versión y color están seleccionados entre los tabs y la imagen del auto.

**generateStaticParams:** Next.js pre-genera las rutas `/0km/208`, `/0km/2008`, etc. en el build.

---

## PARTE 9: PLANES DE FINANCIACIÓN

En `data/planes.js`:
- Lista de planes con cuotas, modelos aplicables
- `getPlanesPorModelo(slug)` → planes para ese modelo
- `extraerModeloBase("Peugeot 208 Allure")` → `"208"`

Los planes se muestran solo para modelos que los tienen (208, 2008, Partner, Expert).

---

## PARTE 10: AUTENTICACIÓN Y ADMIN

### 10.1 Flujo de login

```
1. Usuario va a /admin/login
2. Ingresa usuario y contraseña
3. authService.login() → POST /user/loginuser al backend
4. Backend devuelve { token, user }
5. Guarda en localStorage: auth_token, auth_user
6. useAuth actualiza isAuthenticated = true
7. Redirige a /admin
```

### 10.2 useAuth (hook)

- `checkAuthStatus()`: Lee localStorage, valida token (decodifica JWT y revisa `exp`)
- Si token expirado → logout
- Intervalo cada 5 min para verificar expiración
- Escucha evento `auth:unauthorized` (cuando axios recibe 401)

### 10.3 authAxiosInstance

- Interceptor: agrega `Authorization: Bearer <token>` a cada request
- Si respuesta 401: limpia localStorage y dispara `auth:unauthorized`

### 10.4 RequireAuth

- Envuelve el Dashboard
- Si no está autenticado → redirige a /admin/login
- Mientras verifica → muestra "Verificando autenticación..."

### 10.5 Panel Admin - Crear/Editar vehículos

1. **useCarMutation**: Tres mutaciones (create, update, delete)
2. **vehiclesAdminService**:
   - Create/Update: Usan **API Route** `/api/photos/create` y `/api/photos/update/:id`
   - ¿Por qué? Porque esa ruta **optimiza imágenes con Sharp** antes de enviar al backend
   - Delete: Va directo al backend con authAxiosInstance
3. **useCarModal.reducer**: Estado del modal (abierto/cerrado, create/edit, loading, error)
4. **CarFormRHF**: Formulario con React Hook Form + Zod
5. **addDirtyVehicleId**: Cuando creas/editas/eliminas, guarda el ID en localStorage

### 10.6 Revalidación (RevalidateSection)

- Los IDs "sucios" se guardan en `dirtyVehicleIds` (localStorage)
- El admin hace clic en "Publicar Cambios"
- Envía POST a `/api/revalidate` con header `x-revalidate-secret`
- La API Route llama a `revalidateTag('vehicles-list')` y `revalidateTag('vehicle:123')`
- Hace "warmup": visita las URLs para regenerar el cache
- Si OK, limpia dirtyVehicleIds

---

## PARTE 11: API ROUTES (rutas del backend de Next.js)

### /api/photos/create

1. Recibe FormData del frontend (marca, modelo, fotos, etc.)
2. Recorre cada campo: si es imagen → Sharp la optimiza (redimensiona, WebP, quita metadata)
3. Reenvía el FormData al backend externo (`NEXT_PUBLIC_API_URL/photos/create`)
4. Copia el header Authorization
5. Devuelve la respuesta tal cual

### /api/revalidate

1. Valida header `x-revalidate-secret` (debe coincidir con `REVALIDATE_SECRET` en .env)
2. Recibe `{ vehicleIds, revalidateList, warmup }`
3. `revalidateTag('vehicles-list')` y `revalidateTag('vehicle:id')` para cada ID
4. Opcionalmente hace fetch a las URLs para "calentar" el cache
5. Devuelve `{ ok, tookMs, revalidated, warmed }`

---

## PARTE 12: HOOKS IMPORTANTES

### useVehiclesList

- **useInfiniteQuery** de TanStack Query
- Usado en Admin (con pageSize: 1000 para traer todos)
- queryKey: `['vehicles', { filters, limit }]`
- getNextPageParam: usa `lastPage.allPhotos.hasNextPage` y `nextPage`
- select: aplica mapVehiclesPage a cada página
- **Nota:** Usa vehiclesApi (axios), no vehiclesApi.server

### useAuth

- Estado: user, isAuthenticated, isLoading, error
- login(), logout(), checkAuthStatus(), getToken()
- Validación de JWT (solo lectura de exp, no verifica firma)

### useCarMutation

- createMutation, updateMutation, deleteMutation
- En success: invalidateQueries, addDirtyVehicleId

### useCarModal.reducer

- Estado: isOpen, mode (create|edit), initialData, loading, error
- Acciones: OPEN_CREATE_FORM, OPEN_EDIT_FORM, CLOSE_MODAL, SET_LOADING, SET_ERROR

---

## PARTE 13: COMPONENTES CLAVE

### CardAuto

- Recibe `auto` (objeto vehículo)
- Muestra imagen, marca, modelo, caja, km, año, precio
- Link a `/usados/[id]`
- Guarda scroll en sessionStorage antes de navegar
- Usa formatters (formatPrice, formatKilometraje, etc.)
- getBrandLogo() para el logo de la marca

### Nav

- Client component
- Menú hamburguesa en móvil con backdrop
- Scroll-lock: body.menu-open en globals.css
- Dropdown "Peugeot | 0 KM" con links a /0km y /planes

### FilterFormSimple

- Recibe currentFilters, onApplyFilters, isLoading
- MultiSelect para marca, caja, combustible
- RangeSlider para año, precio, kilometraje
- buildSearchParams para construir la URL

### AutosGrid (ListAutos)

- Grid de CardAuto
- Botón "Cargar más" si hasNextPage
- Skeleton mientras carga

---

## PARTE 14: SEO

Cada página tiene:
- `metadata` o `generateMetadata()`: title, description, openGraph, twitter, canonical
- JSON-LD (Schema.org): Organization, LocalBusiness, ItemList, Product
- `absoluteUrl()` y `getSiteUrl()` para URLs absolutas

En `/usados/vehiculos`:
- INDEXABLE_PARAMS: marca, anio, combustible, etc. → van al canonical
- NON_INDEXABLE_PARAMS: page, sort → si están, robots: noindex

---

## PARTE 15: ESTILOS Y DISEÑO

- **variables.css**: Colores (--color-brand-500: #061B9C), espaciados, breakpoints
- **globals.css**: Reset, .container, .main-content, body.menu-open
- Cada componente tiene su `.module.css` (CSS Modules, scoped)

---

## PARTE 16: VARIABLES DE ENTORNO

```
NEXT_PUBLIC_SITE_URL=     # URL del sitio (SEO)
NEXT_PUBLIC_API_URL=      # Backend (ej: http://localhost:3001)
REVALIDATE_SECRET=        # Para /api/revalidate (solo server)
```

---

## PARTE 17: RESUMEN DE FLUJOS

### Flujo: Ver lista de usados
```
Usuario → /usados/vehiculos 
→ Server fetch → mapVehiclesPage 
→ VehiculosClient (initialData) 
→ AutosGrid (CardAuto x N)
→ Click en card → guarda scroll → /usados/123
```

### Flujo: Ver detalle de usados
```
Usuario → /usados/123 
→ Server fetch getVehicleById 
→ mapVehicle 
→ VehicleDetailClient 
→ CardDetalle + SimilarVehiclesCarousel + PriceRangeCarousel
```

### Flujo: Admin crea vehículo
```
Admin → Clic "Agregar" 
→ openCreateForm() 
→ CarFormRHF (FormData) 
→ vehiclesAdminService.createVehicle 
→ /api/photos/create (Sharp optimiza) 
→ Backend /photos/create 
→ createMutation.onSuccess: addDirtyVehicleId, refetch
→ Admin hace "Publicar" 
→ /api/revalidate 
→ revalidateTag + warmup 
→ clearDirtyVehicleIds
```

---

## PARTE 18: PUNTOS CLAVE PARA MEJORAR (sin romper nada)

Recomendaciones priorizadas para **mantenibilidad**, **orden**, **performance** y **modularidad**. Todas son seguras y no requieren cambios disruptivos.

---

### 🟢 MANTENIBILIDAD

#### 1. **Unificar la construcción de filtros para el backend** ⭐ Prioridad alta

**Problema:** `vehiclesApi.server.js` construye los searchParams **manualmente** (líneas 134-152), mientras que `vehiclesApi.js` usa `buildSearchParams()` de `filters.js`. Si se agrega un filtro nuevo, hay que actualizar dos sitios.

**Solución:** Hacer que el server use `buildSearchParams()`:

```js
// vehiclesApi.server.js - REEMPLAZAR el bloque manual por:
import { buildSearchParams } from "../../utils/filters";

// Dentro de getVehicles:
const params = buildSearchParams(filters);
params.delete("page"); // El backend usa cursor, no page
params.set("limit", String(safeLimit));
params.set("cursor", String(safeCursor));
const endpoint = `${baseURL}/photos/getallphotos?${params.toString()}`;
```

**Riesgo:** Bajo. `buildSearchParams` ya contempla marca, caja, combustible, año, precio, kilometraje. Solo se unifica la lógica.

---

#### 2. **Estandarizar imports con el alias `@/`**

**Problema:** Hay mezcla de `@/lib/...` y `../../lib/...`. En archivos profundos se generan rutas como `../../../lib/...` que son frágiles al mover archivos.

**Solución:** Usar siempre `@/` para imports desde `src`:

```js
// En vez de:
import { mapVehiclesPage } from "../../../lib/mappers/vehicleMapper";

// Usar:
import { mapVehiclesPage } from "@/lib/mappers/vehicleMapper";
```

**Cómo:** Ir reemplazando en cada archivo que se toque. No es obligatorio hacerlo de golpe.

---

#### 3. **Exportar todos los hooks en `hooks/index.js`**

**Problema:** `useVehiclesList`, `useAuth`, `useCarMutation` no se exportan desde el índice. Quien importa debe conocer la ruta exacta.

**Solución:** Agregar al `hooks/index.js`:

```js
export { useMediaQuery, useIsDesktop } from "./useMediaQuery";
export { useVehiclesList } from "./useVehiclesList";
export { useAuth } from "./useAuth";
export { useCarMutation } from "./admin/useCarMutation";
```

Luego importar así: `import { useAuth, useVehiclesList } from "@/hooks"`.

---

#### 4. **Decidir qué hacer con `UsadosClient.jsx` (código muerto)**

**Problema:** `UsadosClient.jsx` no se importa en ninguna ruta. La lista real está en `VehiculosClient.jsx` en `/usados/vehiculos`.

**Opciones:**
- **A)** Eliminarlo si no hay planes de uso.
- **B)** Documentar que es legacy y marcarlo con comentario `// LEGACY - no usar`.
- **C)** Integrar su lógica en `VehiculosClient` si aporta algo distinto (por ahora parece redundante).

---

### 🟡 ORDEN DEL CÓDIGO

#### 5. **Centralizar constantes de API**

**Problema:** Endpoints como `/photos/getallphotos`, `/photos/getonephoto` están repetidos o hardcodeados.

**Solución:** Crear `constants/api.js`:

```js
export const API_ENDPOINTS = {
  VEHICLES_LIST: "/photos/getallphotos",
  VEHICLE_DETAIL: (id) => `/photos/getonephoto/${id}`,
  VEHICLE_CREATE: "/photos/create",
  VEHICLE_UPDATE: (id) => `/photos/update/${id}`,
  VEHICLE_DELETE: (id) => `/photos/deletephoto/${id}`,
  LOGIN: "/user/loginuser",
};
```

Y usarlos en los servicios. Facilita cambios de rutas y evita typos.

---

#### 6. **Extraer lógica de filtros del Admin**

**Problema:** En `Dashboard` (admin), `backendFilters()` repite la lógica de conversión filtro → params para el backend.

**Solución:** Crear `buildBackendFilters(filters)` en `utils/filters.js` que devuelva el objeto que el backend espera, o reutilizar `buildSearchParams` y adaptar. Así el Admin y el servicio comparten la misma lógica.

---

### 🔵 PERFORMANCE

#### 7. **Paginación o virtualización en el Admin** ⭐ Si hay muchos vehículos

**Problema:** El Admin usa `pageSize: 1000` en `useVehiclesList`. Con cientos de vehículos puede ser lento (fetch grande, lista larga, muchos re-renders).

**Soluciones (incrementales):**
- **A)** Reducir a 50–100 y agregar paginación con “Cargar más”.
- **B)** Mantener 1000 pero envolver la lista en un virtualizador (ej. `react-window`) si ya hay problemas de scroll.
- **C)** Si el volumen es bajo (<200), dejarlo como está y monitorear.

---

#### 8. **Verificar que `placeholderData` en useVehiclesList sea útil**

**Problema:** `placeholderData: (prev) => prev` evita parpadeos al recargar, pero conviene asegurarse de que no genere comportamientos raros con filtros cambiantes.

**Acción:** Revisar en uso real que al cambiar filtros no queden datos antiguos mostrándose de forma confusa. Si ocurre, considerar quitar `placeholderData` o ajustar la `queryKey`.

---

### 🟣 MODULARIDAD

#### 9. **Extraer hook `useScrollRestore`**

**Problema:** La lógica de guardar y restaurar scroll (sessionStorage, timeouts, etc.) está en `VehiculosClient` y en `CardAuto`. Hay duplicación conceptual.

**Solución:** Crear `useScrollRestore(storageKey, path, options)` que encapsule:
- Guardar posición al navegar.
- Restaurar al volver.
- Limpieza de datos antiguos.

Luego usarlo en `VehiculosClient` y donde haga falta.

---

#### 10. **Separar el input del secret en RevalidateSection**

**Problema:** `RevalidateSection` mezcla UI de publicación, manejo de errores y el input del secret. Dificulta tests y reutilización.

**Solución:** Extraer algo como `RevalidateSecretInput` que solo gestione el secret, o moverlo a un modal/configuración. `RevalidateSection` quedaría centrado en la lógica de publicación.

---

#### 11. **Agrupar mappers en un barrel**

**Problema:** Hay mappers en `lib/mappers/` y en `components/admin/mappers/`. Las rutas de import son largas.

**Solución:** Crear `lib/mappers/index.js` que reexporte todo:

```js
export * from "./vehicleMapper";
// Si hay más, agregarlos aquí
```

Y opcionalmente `@/mappers` como alias en jsconfig si se usa mucho.

---

### 📋 RESUMEN DE PRIORIDADES

| Prioridad | Mejora                         | Esfuerzo | Impacto |
|----------|---------------------------------|----------|---------|
| 🔴 Alta  | Unificar buildSearchParams en server | Bajo     | Alto    |
| 🔴 Alta  | Decidir sobre UsadosClient     | Bajo     | Medio   |
| 🟠 Media | Estandarizar imports @/        | Medio    | Medio   |
| 🟠 Media | Exportar hooks en index        | Bajo     | Medio   |
| 🟠 Media | Paginación Admin (si aplica)   | Medio    | Alto    |
| 🟢 Baja  | Constantes API                 | Bajo     | Medio   |
| 🟢 Baja  | useScrollRestore               | Medio    | Medio   |
| 🟢 Baja  | useBackendFilters en Admin     | Bajo     | Bajo    |

---

### ✅ Regla de oro

Hacer un cambio por vez, probar y hacer commit. Así se evita romper nada y se puede revertir con facilidad.

---

## GLOSARIO RÁPIDO

| Término | Significado |
|---------|-------------|
| **Server Component** | Se renderiza en el servidor, no tiene hooks |
| **Client Component** | Tiene "use client", corre en el navegador |
| **Mapper** | Transforma datos de un formato a otro |
| **ISR** | Incremental Static Regeneration: cache con revalidación periódica |
| **revalidateTag** | Invalida cache de Next.js para ese tag |
| **Cursor** | Número de página para paginación (backend usa "cursor" no "page") |
| **FormData** | Objeto para enviar archivos + campos en HTTP |
| **JWT** | Token de autenticación (header.payload.signature) |

---

*Documento generado para entender el código de Indiana Next en profundidad.*
