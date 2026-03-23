# Auditoría técnica: integración frontend-backend

**Proyecto:** indiana-next  
**Fecha:** 22 de marzo de 2025  
**Objetivo:** Diagnóstico y plan de refactor para una arquitectura profesional, mantenible y escalable.

---

## 1. Mapa real de arquitectura actual

### 1.1 Fuente de la base URL

La base URL del backend se resuelve en **5 implementaciones duplicadas** con la misma lógica:

| Archivo | Función | Prioridad |
|---------|---------|-----------|
| `src/lib/api/axiosInstance.js` | `getBaseURL()` | `API_URL` → `NEXT_PUBLIC_API_URL` → `"http://localhost:3001"` |
| `src/lib/services/authService.js` | `getBaseURL()` | Idem |
| `src/lib/services/vehiclesApi.server.js` | `getBaseURL()` | Idem |
| `src/app/api/photos/create/route.js` | `getBackendBaseURL()` | Idem |
| `src/app/api/photos/update/[id]/route.js` | `getBackendBaseURL()` | Idem |

**Inconsistencia:** `axiosInstance.js` y `authService.js` usan solo `NEXT_PUBLIC_API_TIMEOUT`. `vehiclesApi.server.js` acepta también `API_TIMEOUT` (server-only).

### 1.2 Flujo de requests

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CONSUMIDORES DEL BACKEND                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CLIENT COMPONENTS (browser)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ • useVehiclesList          → vehiclesApi.js → axiosInstance → BACKEND directo││
│  │ • useSimilarVehicles       → vehiclesApi.js → axiosInstance → BACKEND directo││
│  │ • usePriceRangeVehicles    → vehiclesApi.js → axiosInstance → BACKEND directo││
│  │ • admin page (getVehicleById) → vehiclesApi.js → axiosInstance → BACKEND     ││
│  │ • authService.login        → authAxiosInstance → BACKEND directo             ││
│  │ • vehiclesAdminService.deleteVehicle → authAxiosInstance → BACKEND directo   ││
│  │                                                                              ││
│  │ • vehiclesAdminService.createVehicle → fetch('/api/photos/create') → Next.js ││
│  │ • vehiclesAdminService.updateVehicle → fetch('/api/photos/update/[id]')      ││
│  │   → API Route hace proxy al BACKEND con optimización Sharp                   ││
│  │                                                                              ││
│  │ • RevalidateSection        → fetch('/api/revalidate') (no toca backend)      ││
│  │ • CareersForm              → fetch('/api/careers') (no toca backend)         ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  SERVER COMPONENTS (Node.js)                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ • page.jsx (home)           → vehiclesApi.server.js → fetch → BACKEND directo││
│  │ • usados/page.jsx           → vehiclesApi.server.js → fetch → BACKEND directo││
│  │ • usados/vehiculos/page.jsx → vehiclesApi.server.js → fetch → BACKEND directo││
│  │ • usados/[id]/page.jsx      → vehiclesApi.server.js → fetch → BACKEND directo││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  API ROUTES (Node.js)                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ • /api/photos/create   → getBackendBaseURL() → fetch → BACKEND (proxy)       ││
│  │ • /api/photos/update/[id] → getBackendBaseURL() → fetch → BACKEND (proxy)    ││
│  │ • /api/revalidate      → getSiteUrl() → warmup fetch al SITIO (no backend)   ││
│  │ • /api/careers         → NO llama al backend (TODO: integrar email)          ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Resumen de rutas del backend consumidas

| Endpoint | Client | Server | API Route | Método |
|----------|--------|--------|-----------|--------|
| `/user/loginuser` | authAxiosInstance | - | - | POST |
| `/photos/getallphotos` | axiosInstance | fetch (vehiclesApi.server) | - | GET |
| `/photos/getonephoto/:id` | axiosInstance | fetch (vehiclesApi.server) | - | GET |
| `/photos/create` | - | - | fetch (proxy + Sharp) | POST |
| `/photos/updatephoto/:id` | - | - | fetch (proxy + Sharp) | PUT |
| `/photos/deletephoto/:id` | authAxiosInstance | - | - | DELETE |

### 1.4 Auth, errores y timeouts

| Aspecto | Implementación actual |
|---------|------------------------|
| **Auth token** | localStorage `auth_token`, inyectado por `authAxiosInstance` interceptor (solo client) |
| **401 handling** | Interceptor limpia localStorage y emite `auth:unauthorized` |
| **Timeouts** | axios: 15s (configurable); photos/create: 120s fijo; photos/update: 180s fijo; vehiclesApi.server: 15s |
| **Errores** | Logging en dev, mensajes genéricos, algunos con mejoras (ECONNREFUSED) |

### 1.5 Entornos

- **site-url.js** tiene lógica completa: dev → localhost, preview → VERCEL_URL, production → error si falta config.
- **API URL** no tiene lógica de preview: depende 100% de variables. Si preview no tiene `NEXT_PUBLIC_API_URL` configurada, cae a `localhost:3001` (incorrecto).

---

## 2. Inventario exhaustivo de problemas

### Críticos

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| **C1** | **Admin filters rotos**: `backendFilters()` en `admin/page.jsx` retorna `{ marca: 'Toyota', anio: '1990,2024' }` (strings). `buildSearchParams()` espera `{ marca: ['Toyota'], año: [1990, 2024] }` (arrays). Los filtros del admin no se aplican nunca. | `src/app/admin/page.jsx` L51-68 | Los administradores ven todos los vehículos sin filtrar |
| **C2** | **`getBaseURL()` duplicada 5 veces**: Cualquier cambio de lógica (prioridad, fallbacks, preview) requiere tocar 5 archivos. Riesgo alto de divergencia. | 5 archivos (ver 1.1) | Mantenimiento frágil, bugs al cambiar estrategia de envs |
| **C3** | **API URL en Preview sin estrategia**: Si un deploy preview en Vercel no tiene `NEXT_PUBLIC_API_URL`, usará `localhost:3001`. El frontend en preview intentaría hablar con un backend inexistente. | Toda la app | Preview deployments no funcionarían correctamente |

### Importantes

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| **I1** | **Construcción de filtros duplicada**: `vehiclesApi.server.js` (L134-154) construye searchParams manualmente en lugar de usar `buildSearchParams()`. No aplica `FILTER_DEFAULTS` (omisión de params por defecto). | `src/lib/services/vehiclesApi.server.js` | Server puede enviar params distintos que client para los mismos filtros |
| **I2** | **Timeouts inconsistentes**: 15s (axios/server), 120s (create), 180s (update). Sin constantes compartidas. | axiosInstance, vehiclesApi.server, photos/create, photos/update | Comportamiento poco predecible, difícil de ajustar |
| **I3** | **`authAxiosInstance` no inyecta token en API Routes**: Create/Update van por fetch a `/api/photos/*`. El token va en headers manuales desde `vehiclesAdminService`. Correcto pero lógica de auth dispersa. | vehiclesAdminService, API routes | No hay un único lugar donde se defina “cómo se autentica” |
| **I4** | **Revalidate: secret manual en UI**: El usuario debe copiar `REVALIDATE_SECRET` del .env. En producción es inaceptable desde el punto de vista de seguridad y UX. | `RevalidateSection.jsx` | Deuda de seguridad reconocida en comentarios |
| **I5** | **`deleteMutation` retorna `response.data` pero create/update retornan JSON parseado**: Inconsistencia en contratos de `vehiclesAdminService`. | `useCarMutation.js` L176 vs L92-93, L142-143 | Puede causar errores si alguien asume estructura uniforme |

### Medios

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| **M1** | **`page` vs `cursor`**: `buildSearchParams` incluye `page` si existe. `vehiclesApi` usa `cursor`. El backend usa `cursor`. La URL tiene `page`, el backend recibe `cursor`. Redundancia pero no error. | filters.js L101-103, vehiclesApi.js L23 | Confusión, posible inconsistencia si el backend algún día usa `page` |
| **M2** | **Fallback hardcodeado `localhost:3001`** en 5 sitios. Útil en dev, pero en producción o staging mal configurado podría apuntar a localhost por error. | 5 archivos | Comportamiento silencioso incorrecto |
| **M3** | **Axios baseURL evaluado al crear instancia**: Se llama `getBaseURL()` en tiempo de import. En Next.js puede ejecutarse en contextos distintos. Podría haber edge cases. | `axiosInstance.js` L62-63, L144-145 | Potencial problema en SSR/ISR |
| **M4** | **`proxy.js` no usado**: Exporta `proxy()` pero Next.js busca `middleware`. `middleware-manifest.json` tiene `"middleware": {}`. Código muerto o migración incompleta. | `src/proxy.js` | Confusión, middleware de auth no activo |
| **M5** | **Credentials en UI (dev)**: Login muestra usuario/contraseña en desarrollo. Aceptable en dev, pero debería estar detrás de una variable o flag explícito. | `login/page.jsx` L80 | Riesgo menor si se deploya con NODE_ENV=development por error |

### Menores

| # | Problema | Ubicación | Impacto |
|---|----------|-----------|---------|
| **m1** | **`API_TIMEOUT` solo en server**: `axiosInstance` no lee `API_TIMEOUT`, solo `NEXT_PUBLIC_API_TIMEOUT`. | axiosInstance.js L51 | Server y client no pueden tener timeouts distintos de forma limpia |
| **m2** | **buildFiltersForBackend** es alias deprecado de buildSearchParams. Código legacy. | filters.js L118 | Ruido, puede eliminarse si no se usa |
| **m3** | **Logging excesivo en photos/create y photos/update**: Muchos `console.log` de FormData. Útil para debug, ruidoso en producción. | photos/create, photos/update | Logs verbosos |
| **m4** | **`.env.local` sin `REVALIDATE_SECRET`**: El README/.env.example lo menciona pero .env.local actual no lo tiene. Revalidate fallará hasta configurarlo. | .env.local vs .env.example | Setup incompleto para nueva instalación |

---

## 3. Riesgos funcionales y de mantenimiento

### Bugs posibles

1. **Admin filters**: Filtros de marca y año en el panel admin no funcionan (C1).
2. **Preview apuntando a localhost**: Deploys preview podrían fallar al consumir backend (C3).
3. **Divergencia server/client en filtros**: Misma búsqueda puede generar URLs distintas según server o client (I1).

### Escalabilidad

- Cada nuevo endpoint requiere decidir: ¿directo al backend o por API Route? No hay guía clara.
- Nuevos servicios tenderán a copiar `getBaseURL()` en vez de importarla.
- Sin capa de tipos/contratos, cambios en el backend pueden romper en varios puntos.

### Debug

- Errores de conexión pueden venir de 5 lugares distintos.
- Logs de API están dispersos (axios interceptor, vehiclesApi.server, API routes).
- `DEBUG_API=true` existe pero no está documentado en .env.example.

### Entornos

- No hay validación de envs al inicio: la app arranca y falla en runtime si falta config.
- Preview no tiene convención explícita para `NEXT_PUBLIC_API_URL` (staging vs production).

### Seguridad

- Revalidate con secret manual: el secret viaja por input y puede quedar en historial.
- Credenciales en UI en dev: bajo riesgo si el deploy es correcto, pero mejor evitar.
- Auth basada en localStorage: no validable en servidor, lo que limita protección de rutas.

---

## 4. Propuesta de arquitectura objetivo

### 4.1 Configuración centralizada

**Un único módulo de config:**

```
src/lib/config/api.js
```

- Exporta `getApiBaseUrl()`, `getApiTimeout()`, `getApiConfig()`.
- Resuelve: `API_URL` (server) → `NEXT_PUBLIC_API_URL` → fallback según entorno.
- En preview: `NEXT_PUBLIC_API_URL_PREVIEW` o convención (ej. `VERCEL_URL` para derivar staging).
- En production: sin fallback; lanzar error si falta config.
- En development: fallback `http://localhost:3001`.

### 4.2 Capa HTTP

| Uso | Tecnología | Razón |
|-----|------------|-------|
| Client Components (vehículos, auth) | Axios | Interceptors, cancelación, auth automático |
| Server Components | fetch nativo | Deduplicación y cache de Next.js |
| API Routes (proxy) | fetch nativo | Coherencia con runtime Node |

**Estructura:**

```
src/lib/http/
  client.js      # axiosInstance, authAxiosInstance (usan config centralizada)
  server.js      # fetch con timeout, cache, revalidate (usan config centralizada)
```

### 4.3 Requests: directo vs API Routes

| Operación | Destino | Motivo |
|-----------|---------|--------|
| GET vehículos (lista, detalle) | Backend directo | Sin transformación, cache en server |
| Login | Backend directo | JSON simple |
| Delete vehículo | Backend directo | Sin body complejo |
| Create vehículo | API Route → Backend | Optimización de imágenes con Sharp |
| Update vehículo | API Route → Backend | Idem |

### 4.4 Client vs server

- **Client**: `vehiclesApi.js` (usa `client.js`), solo para componentes con `'use client'`.
- **Server**: `vehiclesApi.server.js` (usa `server.js`), solo para Server Components.
- Misma interfaz pública (`getVehicles`, `getVehicleById`), implementaciones distintas.
- Un solo builder de filtros: `buildSearchParams()` de `filters.js`.

### 4.5 Entornos

| Entorno | API URL | Estrategia |
|---------|---------|------------|
| development | `NEXT_PUBLIC_API_URL` o `http://localhost:3001` | Fallback permitido |
| preview | `NEXT_PUBLIC_API_URL` o `NEXT_PUBLIC_API_URL_PREVIEW` | Sin fallback a localhost |
| production | `NEXT_PUBLIC_API_URL` o `API_URL` | Obligatorio, error si falta |

### 4.6 Errores, timeouts, utilidades

- Constantes de timeout en `config/api.js`: `DEFAULT_TIMEOUT`, `CREATE_TIMEOUT`, `UPDATE_TIMEOUT`.
- Error handling en un helper: `handleApiError(error)` con mensajes y logging.
- Filtros: solo `buildSearchParams()` desde `filters.js`; `vehiclesApi.server` lo importa y usa.

---

## 5. Plan de refactor por etapas

### Fase 0: Diagnóstico y preparación

**Objetivo:** Establecer baseline y tests mínimos.

**Archivos:** Ninguno (solo docs y checklist).

**Tareas:**
- Documentar flujos actuales (ya hecho en este documento).
- Definir checklist manual para: login, lista, detalle, create, update, delete, revalidate.
- Decidir si agregar tests E2E o al menos smoke tests.

**Criterios:** Checklist definido, decisión sobre tests.

---

### Fase 1: Centralizar configuración

**Objetivo:** Una única fuente de verdad para API URL y timeout.

**Archivos a crear:**
- `src/lib/config/api.js` (nuevo)

**Archivos a modificar:**
- `src/lib/api/axiosInstance.js` → importar desde `config/api`
- `src/lib/services/authService.js` → eliminar `getBaseURL`, importar config
- `src/lib/services/vehiclesApi.server.js` → eliminar `getBaseURL`, importar config
- `src/app/api/photos/create/route.js` → eliminar `getBackendBaseURL`, importar config
- `src/app/api/photos/update/[id]/route.js` → idem

**Cambios:**
- Crear `getApiBaseUrl()`, `getApiTimeout()`, opcionalmente `getApiConfig()`.
- Añadir lógica de preview (sin fallback a localhost).
- Reemplazar las 5 implementaciones por import.

**Riesgos:** Bajo. Cambio de ubicación de lógica, no de comportamiento.

**Criterios:** Las 5 capas usan `config/api`; mismo comportamiento que antes.

---

### Fase 2: Unificar capa API (http)

**Objetivo:** Unificar axios y fetch detrás de módulos claros.

**Archivos a crear:**
- `src/lib/http/client.js` (refactor de `axiosInstance.js`)
- `src/lib/http/server.js` (wrapper de fetch con timeout y opciones)

**Archivos a modificar:**
- `src/lib/api/axiosInstance.js` → mover contenido a `http/client.js` o re-exportar desde ahí
- `src/lib/services/vehiclesApi.server.js` → usar `http/server.js` en lugar de `fetchWithTimeout` local

**Cambios:**
- `client.js`: crear instancias axios usando `config/api`.
- `server.js`: `fetchWithTimeout(url, options)` que use `getApiBaseUrl()` y `getApiTimeout()`.

**Riesgos:** Medio. Cambios en flujo de requests.

**Criterios:** Mismo comportamiento; server y client usan módulos compartidos.

---

### Fase 3: Refactor de services

**Objetivo:** Services limpios y consistentes.

**Archivos a modificar:**
- `src/lib/services/vehiclesApi.server.js` → usar `buildSearchParams()` de filters.js
- `src/app/admin/page.jsx` → corregir `backendFilters()` para formato `{ marca: [], año: [min,max] }`

**Cambios:**
- Eliminar construcción manual de searchParams en `vehiclesApi.server.js`.
- Importar `buildSearchParams` y aplicarlo a `filters` antes de armar la URL.
- Ajustar paginación: `buildSearchParams` puede no incluir `cursor`; agregarlo después.
- En admin: `backendFilters` debe retornar `{ marca: filters.marca, año: filters.año }` (arrays).

**Riesgos:** Medio. Corrige el bug de admin (C1).

**Criterios:** Admin filtra correctamente; server y client envían los mismos params para mismos filtros.

---

### Fase 4: Limpiar API Routes

**Objetivo:** Código más simple y mantenible.

**Archivos a modificar:**
- `src/app/api/photos/create/route.js`
- `src/app/api/photos/update/[id]/route.js`

**Cambios:**
- Usar config centralizada (ya en Fase 1).
- Extraer constantes de timeout (120s, 180s) a `config/api`.
- Reducir logging en producción (solo en dev o con flag).
- Revisar manejo de errores para reutilizar helper común si existe.

**Riesgos:** Bajo.

**Criterios:** Rutas más cortas, configuración centralizada, logs controlados.

---

### Fase 5: Unificar filtros y query params

**Objetivo:** Una sola fuente de verdad para filtros.

**Archivos a modificar:**
- `src/lib/services/vehiclesApi.server.js` (ya en Fase 3)
- `src/utils/filters.js` — validar que `cursor`/`page` estén bien documentados

**Cambios:**
- Documentar que `buildSearchParams` no incluye `cursor` (se agrega en el service).
- Eliminar `buildFiltersForBackend` si no se usa.
- Revisar si `page` en buildSearchParams tiene sentido o se debe quitar.

**Riesgos:** Bajo.

**Criterios:** Sin duplicación de lógica de filtros.

---

### Fase 6: Validar entornos

**Objetivo:** Estrategia clara para dev, preview y production.

**Archivos a modificar:**
- `src/lib/config/api.js` (creado en Fase 1)
- `.env.example` — documentar `NEXT_PUBLIC_API_URL_PREVIEW`, `DEBUG_API`
- README — sección de setup por entorno

**Cambios:**
- Implementar reglas de preview en `getApiBaseUrl()`.
- Validación opcional al inicio (ej. en `instrumentation.js` o página de health) que falle rápido si falta config en producción.

**Riesgos:** Bajo.

**Criterios:** Preview usa URL correcta; documentación actualizada.

---

### Fase 7: Tests y QA manual

**Objetivo:** Verificar que nada se rompió.

**Tareas:**
- Ejecutar checklist manual.
- Probar dev local con backend en 3001.
- Probar build de producción.
- Si hay preview en Vercel, validar con backend staging.

**Criterios:** Todas las operaciones críticas funcionan en cada entorno.

---

## 6. Propuesta de estructura final de archivos

```
src/
├── lib/
│   ├── config/
│   │   └── api.js              # getApiBaseUrl, getApiTimeout, getApiConfig
│   │
│   ├── http/
│   │   ├── client.js           # axiosInstance, authAxiosInstance
│   │   └── server.js           # fetchWithTimeout, fetchVehicles, etc.
│   │
│   ├── services/
│   │   ├── vehiclesApi.js      # Client: usa client.js
│   │   ├── vehiclesApi.server.js # Server: usa server.js, buildSearchParams
│   │   ├── vehiclesAdminService.js
│   │   └── authService.js
│   │
│   ├── site-url.js             # Sin cambios (ya está bien)
│   └── mappers/
│       └── vehicleMapper.js
│
├── utils/
│   └── filters.js              # buildSearchParams, parseFilters (única fuente)
│
├── config/
│   └── auth.js
│
├── app/
│   ├── api/
│   │   ├── photos/
│   │   │   ├── create/route.js
│   │   │   └── update/[id]/route.js
│   │   ├── revalidate/route.js
│   │   └── careers/route.js
│   └── ...
│
└── ...
```

**Eliminar o deprecar:**
- `src/lib/api/axiosInstance.js` — reemplazado por `lib/http/client.js`
- `src/proxy.js` — evaluar si se migra a `middleware.js` o se elimina

---

## 7. Recomendaciones específicas para este proyecto

### Next.js App Router

- Mantener Server Components para datos iniciales (lista, detalle) y usar fetch con `next: { revalidate, tags }`.
- Client Components para interacción: filtros, paginación, admin, usando axios con interceptors.
- Evitar importar `vehiclesApi.server` en client y `vehiclesApi` en server.

### Server/Client separation

- `vehiclesApi.server.js`: solo en Server Components y API Routes.
- `vehiclesApi.js`: solo en Client Components.
- Nombres explícitos (`.server`) reducen errores de importación.

### Variables de entorno

- `API_URL` / `API_TIMEOUT`: solo servidor, sin `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_TIMEOUT`: servidor y cliente.
- En producción no usar fallbacks; fallar pronto si falta config.

### Vercel preview y production

- Preview: configurar `NEXT_PUBLIC_API_URL` en Vercel para el proyecto (staging o producción según estrategia).
- Production: `NEXT_PUBLIC_API_URL` apuntando al backend final.
- Considerar `VERCEL_ENV` para elegir URL en runtime si se necesitan dos backends.

### Backend externo

- Endpoints GET: directo desde client y server.
- Create/Update con FormData e imágenes: mantener proxy en API Routes para Sharp.
- Delete: directo con auth.

### Admin y revalidación

- Migrar revalidación a auth server-side (cookies/sesión) y eliminar input manual del secret.
- Mientras tanto, no exponer el secret en la UI; usar server action o API Route que lea `REVALIDATE_SECRET` y sea llamada desde el admin con auth.

### Revalidación (ISR)

- Mantener `revalidateTag` y warmup en `/api/revalidate`.
- Warmup sobre URLs del sitio (getSiteUrl), no del backend.
- Tags: `vehicles-list`, `vehicle:{id}` como ya están.

---

## 8. Resultado final ejecutivo

### Diagnóstico general

La integración frontend-backend funciona en escenarios básicos pero tiene deuda técnica significativa: configuración duplicada, un bug en filtros de admin, estrategia de entornos incompleta y falta de centralización. No hay errores bloqueantes en flujo principal, pero la mantenibilidad y la escalabilidad son frágiles.

### Nivel de madurez

**Aproximadamente 5/10.** Hay separación server/client, uso de fetch en server y axios en client, y documentación de envs. Faltan: configuración centralizada, consistencia en filtros, estrategia de preview y un plan claro para auth/revalidación.

### Qué está bien

- Separación entre `vehiclesApi.js` (client) y `vehiclesApi.server.js` (server).
- `buildSearchParams` y `parseFilters` en un solo módulo (aunque el server no los usa).
- `site-url.js` con lógica clara para dev/preview/production.
- Uso de API Routes como proxy para create/update con optimización de imágenes.
- Documentación en `.env.example`.
- Cache y revalidación con tags en server.

### Qué está mal

- `getBaseURL` duplicada en 5 archivos.
- Filtros del admin no funcionan por formato incorrecto.
- `vehiclesApi.server` no usa `buildSearchParams`.
- Sin estrategia de API URL para preview.
- Timeouts dispersos y sin constantes.
- Secret de revalidación manual en la UI.

### Qué es urgente

1. Corregir filtros del admin (C1).
2. Centralizar configuración de API (C2).
3. Definir y aplicar estrategia de API URL para preview (C3).

### Qué hacer primero

1. Fase 1: centralizar config (bajo riesgo, base para el resto).
2. Fase 3: corregir admin filters y unificar buildSearchParams en server (corrige bug y duplicación).
3. Fase 2: unificar capa http (orden y mantenibilidad).

### Arquitectura recomendada

- Un único módulo de config (`lib/config/api.js`).
- Capa HTTP explícita: `lib/http/client.js` y `lib/http/server.js`.
- Services que usan esa capa y `buildSearchParams` como única fuente de filtros.
- Estrategia de envs definida para dev, preview y production.
- Plan de migración de revalidación hacia auth server-side.

---

*Documento generado a partir del análisis del código en el repositorio. Todas las referencias a archivos y líneas corresponden al estado del proyecto al momento de la auditoría.*
