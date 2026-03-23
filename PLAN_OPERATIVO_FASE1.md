# Plan operativo: Fase 1 — Centralización de configuración API

**Basado en:** AUDITORIA_FRONTEND_BACKEND.md  
**Alcance:** Solo Fase 1. Sin mezclar con Fases 2 ni 3.  
**Estado:** Plan listo para ejecución — cambios NO aplicados.

---

## 1. Orden exacto de ejecución (refactor completo)

Prioridad: **menor riesgo → mayor impacto → menor probabilidad de romper flujos críticos**

| Orden | Fase | Razón |
|-------|------|-------|
| **1º** | **Fase 1: Centralizar config** | Riesgo muy bajo. Solo movemos lógica a un módulo; comportamiento idéntico. Base para todo lo demás. |
| 2º | Fase 3: Admin filters + buildSearchParams en server | Corrige bug real (filtros admin rotos). Depende de config ya centralizada. |
| 3º | Fase 2: Unificar capa HTTP | Refactor estructural. Más invasivo; conviene hacerlo con config ya estable. |
| 4º | Fase 4: Limpiar API Routes | Reduce ruido en routes. Depende de Fase 1. |
| 5º | Fase 5: Unificar filtros | Refinamiento. Bajo impacto. |
| 6º | Fase 6: Validar entornos | Estrategia preview/production. Documentación. |
| 7º | Fase 7: QA manual | Validación final. |

**Fase 1 primero porque:** Es el cambio más seguro, no altera flujos ni contratos, y desbloquea el resto del refactor.

---

## 2. Fase 1 detallada

### 2.1 Objetivo exacto

Tener una **única fuente de verdad** para la URL base del backend y el timeout de requests, eliminando las 5 implementaciones duplicadas actuales.

**Criterio de éxito:** Mismo comportamiento que hoy. Cero cambio funcional. Todas las requests van al mismo backend con los mismos timeouts.

### 2.2 Archivos exactos

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| **CREAR** | `src/lib/config/api.js` | Nuevo módulo con `getApiBaseUrl()` y `getApiTimeout()` |
| **MODIFICAR** | `src/lib/api/axiosInstance.js` | Eliminar `getBaseURL` y `getTimeout`; importar desde config |
| **MODIFICAR** | `src/lib/services/authService.js` | Eliminar `getBaseURL` y `getTimeout`; importar desde config |
| **MODIFICAR** | `src/lib/services/vehiclesApi.server.js` | Eliminar `getBaseURL` y `getTimeout`; importar desde config |
| **MODIFICAR** | `src/app/api/photos/create/route.js` | Eliminar `getBackendBaseURL`; importar desde config |
| **MODIFICAR** | `src/app/api/photos/update/[id]/route.js` | Eliminar `getBackendBaseURL`; importar desde config |

**NO crear, NO modificar, NO eliminar:** Nada más. No se toca `lib/http/`, no se reestructura nada.

### 2.3 Dependencias entre archivos

```
src/lib/config/api.js          ← NUEVO (sin dependencias internas del proyecto)
       │
       ├── src/lib/api/axiosInstance.js
       ├── src/lib/services/authService.js
       ├── src/lib/services/vehiclesApi.server.js
       ├── src/app/api/photos/create/route.js
       └── src/app/api/photos/update/[id]/route.js
```

**Orden de edición recomendado:**

1. Crear `api.js` (nada depende de él todavía)
2. Modificar `axiosInstance.js` (consumido por vehiclesApi, authService, vehiclesAdminService)
3. Modificar `authService.js`
4. Modificar `vehiclesApi.server.js`
5. Modificar `photos/create/route.js`
6. Modificar `photos/update/[id]/route.js`

### 2.4 Riesgos de la fase

- **Riesgo global:** Bajo.
- **Mitigación:** La lógica de `api.js` será **idéntica** a la actual. Solo cambia la ubicación.
- **Rollback:** Si algo falla, revertir el commit y las 5 implementaciones locales vuelven.

---

## 3. Propuesta concreta de implementación

### 3.1 Contenido de `src/lib/config/api.js` (NUEVO)

```javascript
/**
 * api.js - Configuración centralizada del API backend
 *
 * Única fuente de verdad para:
 * - URL base del backend (getApiBaseUrl)
 * - Timeout de requests (getApiTimeout)
 *
 * Variables de entorno:
 * - API_URL: server-only, prioridad alta
 * - NEXT_PUBLIC_API_URL: client + server
 * - API_TIMEOUT: server-only (opcional)
 * - NEXT_PUBLIC_API_TIMEOUT: client + server (opcional)
 *
 * @author Indiana Peugeot
 * @version 1.0.0 - Fase 1 refactor
 */

const DEFAULT_API_URL = "http://localhost:3001";
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Obtener URL base del API backend
 * Compatible con Server Components, Client Components y API Routes
 *
 * @returns {string} URL base sin trailing slash (ej: "http://localhost:3001")
 */
export function getApiBaseUrl() {
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      DEFAULT_API_URL
    );
  }
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  }
  return DEFAULT_API_URL;
}

/**
 * Obtener timeout de requests en milisegundos
 * API_TIMEOUT es server-only; NEXT_PUBLIC_API_TIMEOUT en client
 *
 * @returns {number} Timeout en ms
 */
export function getApiTimeout() {
  const raw =
    process.env.API_TIMEOUT ||
    process.env.NEXT_PUBLIC_API_TIMEOUT ||
    String(DEFAULT_TIMEOUT_MS);
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}
```

### 3.2 Cambios por archivo

#### `src/lib/api/axiosInstance.js`

**Eliminar (líneas 16-51):**
- Toda la función `getBaseURL`
- Toda la función `getTimeout`

**Agregar al inicio (después de `import axios`):**
```javascript
import { getApiBaseUrl, getApiTimeout } from "@/lib/config/api";
```

**Reemplazar usos:**
- `getBaseURL()` → `getApiBaseUrl()`
- `getTimeout()` → `getApiTimeout()`

**Ubicaciones exactas:**
- L62: `baseURL: getApiBaseUrl(),`
- L63: `timeout: getApiTimeout(),`
- L145: `baseURL: getApiBaseUrl(),`
- L146: `timeout: getApiTimeout(),`

#### `src/lib/services/authService.js`

**Eliminar (líneas 13-38):**
- Toda la función `getBaseURL`
- Toda la función `getTimeout`

**Agregar (junto con los imports existentes):**
```javascript
import { getApiBaseUrl, getApiTimeout } from "@/lib/config/api";
```

**Reemplazar usos:**
- L65: `const baseURL = getApiBaseUrl();`
- L66: `const timeout = getApiTimeout();`
- L101: `getTimeout()` → `getApiTimeout()` (en el mensaje de error)
- L108: `getBaseURL()` → `getApiBaseUrl()` (en el mensaje de error)

#### `src/lib/services/vehiclesApi.server.js`

**Eliminar (líneas 16-37):**
- Toda la función `getBaseURL`
- Toda la función `getTimeout`

**Agregar al inicio (después del comentario de cabecera, antes de fetchWithTimeout):**
```javascript
import { getApiBaseUrl, getApiTimeout } from "@/lib/config/api";
```

**Reemplazar usos:**
- L50: `getTimeout()` → `getApiTimeout()` (dentro de fetchWithTimeout)
- L80: `getTimeout()` → `getApiTimeout()` (fallback timeout)
- L99: `getTimeout()` → `getApiTimeout()` (fallback abort)
- L132: `getBaseURL()` → `getApiBaseUrl()`
- L215: `getBaseURL()` → `getApiBaseUrl()` (en errorDetails)
- L283: `getBaseURL()` → `getApiBaseUrl()`

#### `src/app/api/photos/create/route.js`

**Eliminar (líneas 34-43):**
- Toda la función `getBackendBaseURL`

**Agregar (junto con los imports existentes):**
```javascript
import { getApiBaseUrl } from "@/lib/config/api";
```

**Reemplazar usos:**
- L265: `getBackendBaseURL()` → `getApiBaseUrl()` (en `const backendBaseURL = getApiBaseUrl()`)
- La variable puede seguir llamándose `backendBaseURL` internamente.

#### `src/app/api/photos/update/[id]/route.js`

**Eliminar (líneas 35-45):**
- Toda la función `getBackendBaseURL`

**Agregar (junto con los imports existentes):**
```javascript
import { getApiBaseUrl } from "@/lib/config/api";
```

**Reemplazar usos:**
- L288: `getBackendBaseURL()` → `getApiBaseUrl()` (en `const backendBaseURL = getApiBaseUrl()`)

### 3.3 Funciones que quedan obsoletas (eliminadas, no deprecadas)

| Archivo | Función eliminada | Reemplazo |
|---------|-------------------|-----------|
| axiosInstance.js | `getBaseURL` | `getApiBaseUrl` desde config |
| axiosInstance.js | `getTimeout` | `getApiTimeout` desde config |
| authService.js | `getBaseURL` | `getApiBaseUrl` desde config |
| authService.js | `getTimeout` | `getApiTimeout` desde config |
| vehiclesApi.server.js | `getBaseURL` | `getApiBaseUrl` desde config |
| vehiclesApi.server.js | `getTimeout` | `getApiTimeout` desde config |
| photos/create | `getBackendBaseURL` | `getApiBaseUrl` desde config |
| photos/update | `getBackendBaseURL` | `getApiBaseUrl` desde config |

### 3.4 Compatibilidad

- **Exportaciones:** `api.js` solo exporta `getApiBaseUrl` y `getApiTimeout`. No hay cambios en los exports de axiosInstance, authService, etc.
- **Comportamiento:** Idéntico. Misma prioridad de env vars, mismos fallbacks.
- **Importaciones externas:** `vehiclesApi.js`, `vehiclesAdminService.js` siguen importando desde `@/lib/api/axiosInstance`. No se tocan.

---

## 4. Riesgos técnicos por archivo

| Archivo | Riesgo | Qué podría romperse | Mitigación |
|---------|--------|---------------------|------------|
| `src/lib/config/api.js` | **Bajo** | Ninguno si la lógica es idéntica. | Copiar exactamente la lógica actual. Probar en dev antes de commit. |
| `src/lib/api/axiosInstance.js` | **Bajo** | Axios podría no recibir baseURL/timeout si el import falla. | Verificar que el path `@/lib/config/api` resuelve (usar mismo alias que el resto del proyecto). |
| `src/lib/services/authService.js` | **Bajo** | Mensajes de error con URL/timeout incorrectos. | Solo se usan en catch; no afectan flujo exitoso. |
| `src/lib/services/vehiclesApi.server.js` | **Medio** | Server Components (home, usados, vehiculos, detalle) podrían fallar al cargar. | Es el que más consume la app. Probar todas las páginas que hacen fetch server-side. |
| `src/app/api/photos/create/route.js` | **Medio** | Crear vehículo desde admin podría fallar si la URL es incorrecta. | Probar create con backend levantado. |
| `src/app/api/photos/update/[id]/route.js` | **Medio** | Editar vehículo podría fallar. | Probar update con backend levantado. |

**Riesgo alto:** Ninguno, si la lógica se replica correctamente.

---

## 5. Checklist funcional post-Fase 1

### 5.1 Pre-requisitos

- [ ] Backend corriendo en `http://localhost:3001`
- [ ] `.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3001` (o vacío para usar fallback)
- [ ] `npm run dev` ejecutándose

### 5.2 Pruebas por pantalla

| # | Pantalla | Acción | Request esperado | Resultado esperado |
|---|----------|--------|------------------|--------------------|
| 1 | `/` (Home) | Cargar página | `GET .../photos/getallphotos?limit=6&cursor=1` | Se muestran 6 vehículos usados en la sección |
| 2 | `/usados` | Cargar página | `GET .../photos/getallphotos?limit=8&cursor=1` | Carrusel de usados visible |
| 3 | `/usados/vehiculos` | Cargar página | `GET .../photos/getallphotos?limit=8&cursor=1` | Lista de vehículos con filtros |
| 4 | `/usados/vehiculos?marca=Peugeot` | Aplicar filtro | `GET .../photos/getallphotos?marca=Peugeot&limit=8&cursor=1` | Solo Peugeot |
| 5 | `/usados/[id]` (ej: primer vehículo) | Cargar detalle | `GET .../photos/getonephoto/{id}` | Detalle del vehículo visible |
| 6 | `/admin/login` | Login con credenciales válidas | `POST .../user/loginuser` | Redirección a /admin |
| 7 | `/admin` | Cargar dashboard | `GET .../photos/getallphotos?limit=1000&cursor=1` | Lista de vehículos en admin |
| 8 | `/admin` | Crear vehículo (FormData) | `POST /api/photos/create` → proxy → `POST .../photos/create` | Vehículo creado, mensaje de éxito |
| 9 | `/admin` | Editar vehículo existente | `PUT /api/photos/update/{id}` → proxy → `PUT .../photos/updatephoto/{id}` | Vehículo actualizado |
| 10 | `/admin` | Eliminar vehículo | `DELETE .../photos/deletephoto/{id}` | Vehículo eliminado |

### 5.3 Revisión en Network (DevTools)

- [ ] Todas las requests al backend usan la misma base URL (la de `NEXT_PUBLIC_API_URL` o localhost:3001)
- [ ] No hay 404 por base URL incorrecta
- [ ] No hay errores de CORS ni "Failed to fetch" por URL mal formada

### 5.4 Casos edge

| # | Caso | Cómo probar | Esperado |
|---|------|-------------|----------|
| 11 | Sin backend levantado | Detener backend, cargar / | Mensaje de error "No se pudo conectar" (o similar), no crash |
| 12 | Variable vacía | En .env.local poner `NEXT_PUBLIC_API_URL=` (vacío) | Debe usar fallback localhost:3001 |
| 13 | Build producción | `npm run build` | Build exitoso sin errores |

### 5.5 Criterio de éxito

Si **todas** las pruebas pasan y el comportamiento es idéntico al anterior a la Fase 1, la migración es correcta.

---

## 6. Qué NO tocar en Fase 1

| Área | Qué NO hacer | Razón |
|------|--------------|-------|
| **Estructura de carpetas** | No crear `lib/http/`, no mover `axiosInstance.js` | Pertenece a Fase 2 |
| **vehiclesApi.server** | No cambiar a `buildSearchParams()`, no tocar la lógica de filtros | Pertenece a Fase 3 |
| **admin/page.jsx** | No corregir `backendFilters()` | Pertenece a Fase 3 |
| **site-url.js** | No modificarlo, no reutilizar su `getEnvironment` | Evitar acoplamiento innecesario en Fase 1 |
| **Timeouts de photos/create y update** | No extraer 120s/180s a constantes | Pertenece a Fase 4 |
| **proxy.js, middleware** | No tocar | Fuera de alcance |
| **.env.example, README** | No actualizar documentación de envs | Pertenece a Fase 6 |
| **Estrategia preview** | No implementar lógica de VERCEL_ENV para API URL | Pertenece a Fase 6 |
| **Cualquier otro service** | vehiclesApi.js, vehiclesAdminService.js: no modificar | No usan getBaseURL directamente; usan axiosInstance |

---

## 7. Resultado esperado tras Fase 1

### 7.1 Arquitectura después de Fase 1

```
src/lib/
├── config/
│   └── api.js              ← NUEVO: getApiBaseUrl(), getApiTimeout()
├── api/
│   └── axiosInstance.js    ← MODIFICADO: importa desde config
├── services/
│   ├── authService.js      ← MODIFICADO: importa desde config
│   └── vehiclesApi.server.js ← MODIFICADO: importa desde config
└── ...
```

Las API Routes `photos/create` y `photos/update` también importan desde `config/api`.

### 7.2 Lo que queda igual

- `axiosInstance.js` sigue en `lib/api/`, no se mueve
- `vehiclesApi.js`, `vehiclesAdminService.js` no se modifican
- Rutas, componentes, hooks: sin cambios
- Flujos de datos: sin cambios
- Variables de entorno: mismas que hoy

### 7.3 Lo que cambia (solo internamente)

- **Antes:** 5 archivos con su propia `getBaseURL`/`getTimeout`/`getBackendBaseURL`
- **Después:** 1 archivo `config/api.js` que exporta `getApiBaseUrl` y `getApiTimeout`; 5 archivos importan desde ahí

### 7.4 Beneficio inmediato

- Una sola definición de URL y timeout
- Cualquier cambio futuro (prioridad de envs, fallbacks, preview) se hace en un solo lugar
- Base lista para Fases 2, 4 y 6

---

*Documento listo para ejecución. Aplicar cambios en el orden indicado y validar con el checklist antes de dar por cerrada la Fase 1.*
