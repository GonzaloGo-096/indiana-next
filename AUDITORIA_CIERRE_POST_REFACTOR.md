# Auditoría de cierre post-refactor: integración frontend-backend

**Fecha:** Post-refactor (Fases 1, 2, 3, 6)  
**Objetivo:** Evaluar si la etapa puede cerrarse o conviene una última tanda de ajustes.

---

## 1. Estado final de la arquitectura

### 1.1 Resolución de la API URL

**Fuente:** `src/lib/config/api.js` → `getApiBaseUrl()`

- **Prioridad:** `API_URL` (server) > `NEXT_PUBLIC_API_URL` (client+server)
- **Entornos:**
  - **development:** fallback `http://localhost:3001` si no hay config
  - **preview / production:** sin fallback; lanza `Error` si falta config
- **Detección:** `VERCEL_ENV` (Vercel) → `NODE_ENV` (resto)
- **Guard:** comprobación de `process` antes de leer env para evitar crash en cliente

### 1.2 Separación client/server

| Capa | Client | Server |
|------|--------|--------|
| **HTTP** | `lib/http/client.js` (axios) | `lib/http/server.js` (fetchWithTimeout) |
| **Services** | `vehiclesApi.js` → axiosInstance | `vehiclesApi.server.js` → fetchWithTimeout |
| **Imports** | `@/lib/api/axiosInstance` (re-export) | `@/lib/config/api`, `@/lib/http/server` |
| **Uso** | useVehiclesList, useSimilarVehicles, usePriceRangeVehicles, admin, auth | page.jsx, usados/*, usados/[id], vehiculos |

### 1.3 Consumo directo vs API Routes

| Operación | Destino | Tecnología |
|-----------|---------|------------|
| GET lista vehículos | Backend directo | fetch (server) / axios (client) |
| GET detalle vehículo | Backend directo | fetch (server) / axios (client) |
| POST login | Backend directo | authAxiosInstance |
| DELETE vehículo | Backend directo | authAxiosInstance |
| POST crear vehículo | `/api/photos/create` → backend | fetch (proxy + Sharp) |
| PUT actualizar vehículo | `/api/photos/update/[id]` → backend | fetch (proxy + Sharp) |
| POST revalidar | `/api/revalidate` (no backend) | fetch |
| POST careers | `/api/careers` (no backend) | fetch |

### 1.4 Capa HTTP

- **`lib/http/client.js`:** axiosInstance, authAxiosInstance; config desde `config/api`; interceptors (log, auth, 401).
- **`lib/http/server.js`:** `fetchWithTimeout` con timeout, fallback localhost→127.0.0.1.
- **`lib/api/axiosInstance.js`:** re-export de `lib/http/client` para compatibilidad.

### 1.5 Flujo de filtros

- **Fuente única:** `src/utils/filters.js` → `buildSearchParams()`
- **Uso:** `vehiclesApi.js` y `vehiclesApi.server.js` lo usan.
- **Admin:** `backendFilters()` devuelve `filters` sin transformar; `useVehiclesList` recibe formato esperado.
- **Paginación:** `limit` y `cursor` se añaden en cada service tras `buildSearchParams()`.

### 1.6 Estrategia de entornos

- **config/api.js:** detección con `VERCEL_ENV`/`NODE_ENV`, fallback solo en development.
- **.env.example:** estrategia documentada por entorno.
- **site-url.js:** sin cambios; sigue su propia lógica para SITE_URL.

---

## 2. Residuos técnicos

### 2.1 Funciones obsoletas

| Ubicación | Qué | Estado |
|-----------|-----|--------|
| `utils/filters.js` L118 | `buildFiltersForBackend` | Alias deprecado de `buildSearchParams`; no se usa en el proyecto |

### 2.2 Archivos puente o legacy

| Archivo | Rol | Valor |
|---------|-----|-------|
| `src/lib/api/axiosInstance.js` | Re-export de `lib/http/client` | Mantiene imports existentes; útil mantener |
| `src/proxy.js` | Exporta `proxy()` con matcher `/admin` | Next.js usa `middleware.js`, no `proxy.js`; **código muerto** |

### 2.3 Lógica duplicada

| Qué | Dónde | Detalle |
|-----|-------|---------|
| Detección de entorno | `config/api.js` y `site-url.js` | `getApiEnvironment()` vs `getEnvironment()`; lógica equivalente pero no compartida |
| Mensajes de error “puerto 3001” | `vehiclesApi.server.js` L132-134 | Hardcode en mensaje de ayuda; menor |

### 2.4 Contratos y naming

- **vehiclesAdminService:** create/update devuelven JSON parseado; delete devuelve `response.data`. Diferencia conocida pero aceptable.
- **Naming:** `backendFilters` en admin es un nombre histórico; hace `() => filters`; funcional.

### 2.5 Logs

- **filters.js:** `console.debug` en cada `buildSearchParams` (dev).
- **vehiclesApi.js:** `console.log` por request (dev).
- **vehiclesApi.server.js:** logs condicionados a `DEBUG_API=true` o errores.
- **photos/create, photos/update:** muchos `console.log` de FormData; útil para debug, ruidoso en producción (solo en dev).

### 2.6 Otros

- **getApiTimeout:** no tiene guard de `process`; en la práctica no es problema (client/server tienen `process`).
- **RevalidateSection:** secret manual en UI; deuda conocida, fuera del alcance del refactor de integración.

---

## 3. Riesgos remanentes

### 3.1 Preview / production

- **Riesgo bajo:** falta de `NEXT_PUBLIC_API_URL` provoca error explícito al cargar.
- **Caso:** deploy preview sin configurar la variable en Vercel; fallo esperado y claro.

### 3.2 Fallos silenciosos

- **authService catch:** si `!error.response`, usa `getApiBaseUrl()` en el mensaje. Si por algún motivo `getApiBaseUrl()` lanzara ahí, podría ocultar el error original. Escenario improbable; axios ya habría usado esa URL.

### 3.3 Edge cases

- **Build sin .env:** `npm run build` con producción y sin `NEXT_PUBLIC_API_URL` fallará en generación de páginas que usan el backend. Correcto.
- **Client en preview:** si `VERCEL_ENV` no está en el bundle, se usa `NODE_ENV`. Con `NODE_ENV=production` se evita fallback a localhost; comportamiento adecuado.

### 3.4 Inconsistencias

- **Timeouts:** 15s (config), 120s (photos/create), 180s (photos/update). No centralizados pero documentados.
- **proxy.js:** no usado; no aporta protección real a `/admin`; middleware real sería `middleware.js`.

### 3.5 Seguridad

- **RevalidateSection:** secret manual; riesgo moderado, ya documentado.
- **Auth:** localStorage; no validable en servidor; coherente con el diseño actual.

---

## 4. Calidad del refactor aplicado

### 4.1 Lo que quedó bien

- **config/api.js:** única fuente de URL y timeout; estrategia por entorno clara.
- **lib/http/:** separación client/server clara; `fetchWithTimeout` reutilizable.
- **buildSearchParams:** uso unificado en server y client.
- **Admin filters:** formato corregido; filtros funcionan.
- **Estrategia de entornos:** sin fallback peligroso en preview/production.
- **axiosInstance re-export:** compatibilidad sin cambios en consumidores.

### 4.2 Lo que quedó aceptable

- **authService:** importa `getApiBaseUrl` y `getApiTimeout` para mensajes; redundante pero correcto.
- **Mensajes de error en vehiclesApi.server:** hardcode de “puerto 3001” en texto; menor.
- **Logs en dev:** varios puntos; aceptable si se asume que es solo desarrollo.

### 4.3 Lo que quedó a medias

- **proxy.js:** archivo muerto; comentario sobre “Next.js 16 usa proxy” no refleja la realidad actual.
- **buildFiltersForBackend:** alias deprecado sin uso; ruido.
- **Detección de entorno duplicada:** `getApiEnvironment` vs `getEnvironment` en site-url; podría unificarse más adelante.

### 4.4 Lo que no conviene tocar más

- Capa HTTP.
- Estrategia de entornos.
- Filtros y `buildSearchParams`.
- Flujo create/update por API Routes.
- Estructura de services.

### 4.5 Lo que sí convendría ajustar

- Eliminar o corregir `proxy.js`.
- Eliminar `buildFiltersForBackend` si se confirma que no se usa.
- Revisar logs en photos/create y photos/update si molesta en desarrollo (opcional).

---

## 5. Lista priorizada de pendientes

### Urgente

*(Ninguno. No hay problemas bloqueantes.)*

### Recomendable

| # | Pendiente | Explicación | Impacto | Riesgo | ¿Ahora? |
|---|-----------|-------------|---------|--------|---------|
| 1 | Eliminar o aclarar `proxy.js` | Next.js no lo usa; puede generar confusión sobre protección de /admin | Claridad | Bajo | Sí |
| 2 | Eliminar `buildFiltersForBackend` | Alias deprecado sin referencias | Menos ruido | Muy bajo | Sí |

### Opcional

| # | Pendiente | Explicación | Impacto | Riesgo | ¿Ahora? |
|---|-----------|-------------|---------|--------|---------|
| 3 | Extraer detección de entorno compartida | Unificar `getApiEnvironment` y `getEnvironment` en un módulo | DRY | Bajo | No; no aporta mucho ahora |
| 4 | Centralizar constantes de timeout | 120s y 180s en photos/create y update | Consistencia | Bajo | No; fuera del alcance actual |
| 5 | Reducir logs en photos/create y update | Muchos `console.log` de FormData | Menos ruido en dev | Muy bajo | No; útil para debug |
| 6 | Migrar RevalidateSection a auth server-side | Eliminar secret manual | Seguridad | Medio (cambio de diseño) | No; otra fase |

---

## 6. Recomendación de cierre

### Opción B: conviene hacer una última tanda chica de limpieza

**Motivo:** El refactor está sólido, pero quedan dos residuos claros y fáciles de resolver: `proxy.js` (código muerto) y `buildFiltersForBackend` (alias sin uso). Son cambios de pocas líneas y bajo riesgo.

### Ajustes finales mínimos propuestos

1. **`src/proxy.js`:**  
   - Opción A: Eliminar si se confirma que no hay `middleware.js` que lo importe.  
   - Opción B: Añadir comentario tipo: `// NOTA: Next.js usa middleware.js. Este archivo no está en uso.` y dejarlo por si se migra después.

2. **`src/utils/filters.js`:**  
   - Eliminar el export `buildFiltersForBackend` y su alias (L115-118).  
   - Buscar referencias: `grep -r "buildFiltersForBackend" src`; si no hay usos, eliminar.

Estimación: ~5 minutos. Riesgo muy bajo.

---

## Resumen ejecutivo

| Aspecto | Estado |
|---------|--------|
| Config centralizada | ✅ |
| Capa HTTP ordenada | ✅ |
| Filtros unificados | ✅ |
| Estrategia entornos | ✅ |
| Residuos menores | 2 (proxy.js, buildFiltersForBackend) |
| Riesgos críticos | Ninguno |
| Riesgos moderados | RevalidateSection (secret manual); conocido |
| Conclusión | Etapa cerrable tras limpieza mínima (2 ajustes) |
