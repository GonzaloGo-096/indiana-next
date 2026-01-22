# 📊 AUDITORÍA PROFESIONAL — SECCIÓN `/usados` (Next.js App Router)

**Fecha:** 2025-01-XX  
**Objetivo:** Auditoría SEO + Performance + Caching para `/usados`  
**Alcance:** `/usados`, `/usados/vehiculos`, `/usados/[id]`

---

## A) TABLA DE RUTAS Y MODO DE RENDER

| Ruta | Modo | Evidencia | Justificación |
|------|------|-----------|---------------|
| `/usados` | **Static (SSG)** | `page.jsx:50` — No usa `searchParams`, `fetch`, `headers`, `cookies` | Página estática con metadata, sin datos dinámicos |
| `/usados/vehiculos` | **Dynamic (SSR)** | `page.jsx:24` — `generateMetadata({ searchParams })`, `page.jsx:66` — `async function({ searchParams })`, `page.jsx:79` — `await vehiclesService.getVehicles()` | Usa `searchParams` + `fetch` dinámico, no puede pre-renderizarse |
| `/usados/[id]` | **ISR** | `page.jsx:88` — `async function({ params })`, `page.jsx:93` — `await vehiclesService.getVehicleById()`, `vehiclesApi.server.js:299` — `next: { revalidate: 21600 }` | Fetch con `revalidate: 21600` (6h), sin `generateStaticParams` |

---

## B) EVIDENCIA DETALLADA POR RUTA

### 📁 **1. `/usados` - `src/app/usados/page.jsx`**

#### ✅ **Modo de Render: Static (SSG)**
- **Línea 50:** `export default function UsadosPage()` — No `async`, no `searchParams`
- **Sin fetch:** No hay llamadas a APIs o servicios externos
- **Sin searchParams:** No usa `searchParams` en función ni metadata
- **Sin headers/cookies:** No accede a `headers()` o `cookies()`
- **Conclusión:** ✅ **SSG puro** (pre-renderizado en build time)

#### 🔍 **Metadata Actual**

| Aspecto | Estado | Líneas | Problema |
|---------|--------|--------|----------|
| `generateMetadata` | ✅ Existe | 19-44 | ✅ Correcto |
| `title` | ✅ Configurado | 21 | ✅ Correcto |
| `description` | ✅ Configurado | 22-23 | ✅ Correcto |
| `canonical` | ⚠️ **Usa `getSiteUrl()`** | 42 | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:url` | ⚠️ **Usa `getSiteUrl()`** | 31 | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:image` | ❌ No existe | - | ❌ **Falta OpenGraph image** |
| `twitter:images` | ❌ No existe | - | ❌ **Falta Twitter image** |
| JSON-LD | ❌ No existe | - | ❌ **Falta structured data** |

**Código actual (líneas 19-44):**
```javascript
export async function generateMetadata() {
  const baseUrl = getSiteUrl(); // ⚠️ Construcción manual
  return {
    // ...
    openGraph: {
      url: `${baseUrl}/usados`, // ⚠️ Construcción manual
      // ❌ No hay images
    },
    alternates: {
      canonical: `${baseUrl}/usados`, // ⚠️ Construcción manual
    },
  };
}
```

#### 🖼️ **Imágenes**
- ❌ No hay imágenes en esta página (solo contenido textual)

---

### 📁 **2. `/usados/vehiculos` - `src/app/usados/vehiculos/page.jsx`**

#### ✅ **Modo de Render: Dynamic (SSR)**
- **Línea 24:** `export async function generateMetadata({ searchParams })` — Usa `searchParams`
- **Línea 66:** `export default async function VehiculosPage({ searchParams })` — `async` + `searchParams`
- **Línea 79:** `await vehiclesService.getVehicles()` — Fetch dinámico con filtros
- **Conclusión:** ✅ **Dynamic SSR** (se renderiza en cada request con filtros diferentes)

#### 🔍 **Metadata Actual**

| Aspecto | Estado | Líneas | Problema |
|---------|--------|--------|----------|
| `generateMetadata` | ✅ Existe | 24-58 | ✅ Correcto |
| `title` dinámico | ✅ Correcto | 31-33 | ✅ Cambia según filtros |
| `description` dinámico | ✅ Correcto | 34-36 | ✅ Cambia según filtros |
| `canonical` | ⚠️ **Fijo, no incluye filtros** | 55 | ⚠️ **Siempre `/usados/vehiculos`, debería incluir filtros en query string** |
| `og:url` | ⚠️ **Usa `getSiteUrl()`** | 44 | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:image` | ❌ No existe | - | ❌ **Falta OpenGraph image** |
| `twitter:images` | ❌ No existe | - | ❌ **Falta Twitter image** |
| JSON-LD | ❌ No existe | - | ❌ **Falta `ItemList` structured data** |

**Código actual (líneas 24-58):**
```javascript
export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams || {});
  const baseUrl = getSiteUrl(); // ⚠️ Construcción manual
  
  return {
    // ...
    openGraph: {
      url: `${baseUrl}/usados/vehiculos`, // ⚠️ Siempre fijo, no incluye filtros
      // ❌ No hay images
    },
    alternates: {
      canonical: `${baseUrl}/usados/vehiculos`, // ⚠️ Siempre fijo, no incluye filtros
    },
  };
}
```

**⚠️ PROBLEMA CRÍTICO:** El canonical y `og:url` no incluyen los filtros de la URL. Si un usuario visita `/usados/vehiculos?marca=Peugeot`, el canonical sigue siendo `/usados/vehiculos` (perderá SEO de URLs filtradas).

#### 🖼️ **Imágenes**
- ✅ Usa `next/image` en `ListAutos` (componente client)
- ⚠️ Imágenes en cards: no hay `priority` para las primeras 4-6 cards (LCP)

#### 📊 **Caching/ISR**

| Aspecto | Estado | Evidencia | Problema |
|---------|--------|-----------|----------|
| `fetch` con `revalidate` | ✅ Correcto | `vehiclesApi.server.js:180-184` — `next: { revalidate: 21600, tags: ['vehicles-list'] }` | ✅ **ISR correcto** (6h) |
| `revalidateTag` | ✅ Correcto | `/api/revalidate/route.js:146` — `revalidateTag('vehicles-list')` | ✅ **Revalidación manual correcta** |

**Conclusión:** ✅ El fetch usa ISR correctamente con tag `vehicles-list`.

---

### 📁 **3. `/usados/[id]` - `src/app/usados/[id]/page.jsx`**

#### ✅ **Modo de Render: ISR**
- **Línea 88:** `export default async function VehicleDetailPage({ params })` — `async` + `params`
- **Línea 93:** `await vehiclesService.getVehicleById(id)` — Fetch con revalidate
- **Línea 79:** `export async function generateStaticParams()` — Retorna `[]` (sin pre-renderizado)
- **`vehiclesApi.server.js:299`:** `next: { revalidate: 21600, tags: ['vehicle-detail', 'vehicle:${id}'] }`
- **Conclusión:** ✅ **ISR** (Incremental Static Regeneration cada 6h)

#### 🔍 **Metadata Actual**

| Aspecto | Estado | Líneas | Problema |
|---------|--------|--------|----------|
| `generateMetadata` | ✅ Existe | 17-74 | ✅ Correcto |
| `title` dinámico | ✅ Correcto | 32 | ✅ Usa datos del vehículo |
| `description` dinámico | ✅ Correcto | 33-35 | ✅ Usa precio si existe |
| `canonical` | ⚠️ **Usa `getSiteUrl()`** | 65 | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:url` | ⚠️ **Usa `getSiteUrl()`** | 43 | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:image` | ✅ Dinámico | 45-54 | ✅ Usa `fotoPrincipal` del vehículo |
| `twitter:images` | ✅ Dinámico | 62 | ✅ Usa `fotoPrincipal` del vehículo |
| JSON-LD | ❌ No existe | - | ❌ **Falta `Product`/`Vehicle` structured data** |

**Código actual (líneas 17-74):**
```javascript
export async function generateMetadata({ params }) {
  const { id } = await params;
  const vehicle = await vehiclesService.getVehicleById(id);
  const baseUrl = getSiteUrl(); // ⚠️ Construcción manual
  
  return {
    // ...
    openGraph: {
      url: `${baseUrl}/usados/${id}`, // ⚠️ Construcción manual
      images: vehicle.fotoPrincipal ? [{ url: vehicle.fotoPrincipal }] : [], // ✅ Dinámico
    },
    alternates: {
      canonical: `${baseUrl}/usados/${id}`, // ⚠️ Construcción manual
    },
  };
}
```

#### 🖼️ **Imágenes**
- ✅ `og:image` y `twitter:images` usan `fotoPrincipal` del vehículo (dinámico)
- ⚠️ Verificar si imágenes usan `next/image` con `sizes`/`priority` en `CardDetalle`

#### 📊 **Caching/ISR**

| Aspecto | Estado | Evidencia | Problema |
|---------|--------|-----------|----------|
| `fetch` con `revalidate` | ✅ Correcto | `vehiclesApi.server.js:299` — `next: { revalidate: 21600, tags: ['vehicle-detail', 'vehicle:${id}'] }` | ✅ **ISR correcto** (6h) |
| `revalidateTag` | ✅ Correcto | `/api/revalidate/route.js:150-154` — `revalidateTag('vehicle:${id}')` | ✅ **Revalidación manual correcta** |

**Conclusión:** ✅ El fetch usa ISR correctamente con tags específicos por vehículo.

---

## C) ANÁLISIS DE BAILOUT A CLIENT-SIDE RENDERING

### ✅ **No hay riesgo de BAILOUT para SEO**

**Evidencia:**
1. **`/usados/page.jsx`:** Server Component puro, sin `'use client'`
2. **`/usados/vehiculos/page.jsx`:** Server Component con fetch inicial, pasa datos a `VehiculosClient` (Client Component aislado)
3. **`/usados/[id]/page.jsx`:** Server Component con fetch inicial, pasa datos a `VehicleDetailClient` (Client Component aislado)

**Client Components aislados correctamente:**
- `VehiculosClient.jsx` (línea 1: `"use client"`) — Solo interactividad
- `VehicleDetailClient.jsx` (línea 1: `"use client"`) — Solo interactividad
- No hay `'use client'` en páginas principales

**Conclusión:** ✅ **No hay riesgo de BAILOUT** — Client Components están correctamente aislados.

---

## D) CACHING/ISR — VERIFICACIÓN

### ✅ **Configuración Correcta**

| Servicio | Revalidate | Tags | Archivo | Línea |
|----------|------------|------|---------|-------|
| `getVehicles()` | `21600` (6h) | `['vehicles-list']` | `vehiclesApi.server.js` | 180-184 |
| `getVehicleById()` | `21600` (6h) | `['vehicle-detail', 'vehicle:${id}']` | `vehiclesApi.server.js` | 299-302 |
| `/api/revalidate` | N/A | `vehicles-list`, `vehicle:${id}` | `route.js` | 146, 150-154 |

### 📊 **Recomendación de `revalidate`**

**Actual:** Ambas rutas usan `revalidate: 21600` (6h).

**Recomendación:**
- **Lista (`/usados/vehiculos`):** `revalidate: 3600` (1h) — Más frecuente, hay más cambios (nuevos vehículos, filtros)
- **Detalle (`/usados/[id]`):** `revalidate: 21600` (6h) — Menos frecuente, cambios menos críticos

**Justificación:**
- La lista cambia más (nuevos vehículos, actualizaciones)
- El detalle cambia menos (precio, disponibilidad, pero menos frecuente)
- 1h para lista sigue siendo razonable para backend

**⚠️ DECISIÓN:** Mantener 6h por ahora (ya está configurado). Cambiar a 1h si hay necesidad de actualizaciones más frecuentes.

---

## E) PROBLEMAS / OPORTUNIDADES (PRIORIZADAS)

### 🔴 **PRIORIDAD 1 (P1) — ALTO IMPACTO, BAJO RIESGO**

#### **1. Reemplazar `getSiteUrl()` manual por `absoluteUrl()`**
- **Archivos:** `src/app/usados/page.jsx`, `src/app/usados/vehiculos/page.jsx`, `src/app/usados/[id]/page.jsx`
- **Impacto:** Alto (consistencia, evitar localhost en producción)
- **Esfuerzo:** Bajo (solo cambiar imports y URLs)
- **Riesgo:** Bajo

#### **2. Agregar JSON-LD `ItemList` en `/usados/vehiculos`**
- **Archivo:** `src/app/usados/vehiculos/page.jsx`
- **Impacto:** Alto (SEO, rich snippets)
- **Esfuerzo:** Medio (crear helper + script)
- **Riesgo:** Bajo (solo agregar, no modificar)

#### **3. Agregar JSON-LD `Product`/`Vehicle` en `/usados/[id]`**
- **Archivo:** `src/app/usados/[id]/page.jsx`
- **Impacto:** Alto (SEO, rich snippets para vehículos)
- **Esfuerzo:** Medio (crear helper + script, validar schema)
- **Riesgo:** Bajo-Medio (no inventar datos)

#### **4. Agregar `og:image` y `twitter:images` en `/usados` y `/usados/vehiculos`**
- **Archivos:** `src/app/usados/page.jsx`, `src/app/usados/vehiculos/page.jsx`
- **Impacto:** Medio (mejora compartido en redes sociales)
- **Esfuerzo:** Bajo (agregar imágenes estáticas o logo)
- **Riesgo:** Bajo

---

### 🟡 **PRIORIDAD 2 (P2) — MEDIO IMPACTO**

#### **5. Incluir filtros en canonical de `/usados/vehiculos`**
- **Archivo:** `src/app/usados/vehiculos/page.jsx`
- **Impacto:** Medio (mejor SEO para URLs filtradas)
- **Esfuerzo:** Medio (construir query string desde filtros)
- **Riesgo:** Bajo

**Ejemplo:**
```javascript
// Si hay filtros, incluir en canonical:
// /usados/vehiculos?marca=Peugeot&precio=1000000,5000000
const canonicalUrl = hasFilters 
  ? absoluteUrl(`/usados/vehiculos?${new URLSearchParams(resolvedSearchParams).toString()}`)
  : absoluteUrl("/usados/vehiculos");
```

---

### 🟢 **PRIORIDAD 3 (P3) — BAJO IMPACTO**

#### **6. Optimizar `revalidate` para lista (1h vs 6h)**
- **Archivo:** `src/lib/services/vehiclesApi.server.js`
- **Impacto:** Bajo-Medio (mejor frescura de datos)
- **Esfuerzo:** Bajo (cambiar número)
- **Riesgo:** Bajo (pero requiere validar backend)

#### **7. Agregar `priority` a imágenes above-the-fold en listado**
- **Archivo:** `src/components/vehicles/List/ListAutos` (o similar)
- **Impacto:** Medio (mejor LCP)
- **Esfuerzo:** Bajo (agregar `priority={index < 6}`)
- **Riesgo:** Bajo

---

## F) CHECKLIST DE VALIDACIÓN

### ✅ **Build Output**

```bash
npm run build
```

**Output esperado:**
```
Route (app)
├ ○ /usados (Static)
├ ƒ /usados/vehiculos (Dynamic)
└ ● /usados/[id] (ISR)
```

**Validaciones:**
- ✅ `/usados` aparece como `○` (Static)
- ✅ `/usados/vehiculos` aparece como `ƒ` (Dynamic)
- ✅ `/usados/[id]` aparece como `●` (ISR)
- ✅ No hay warnings de metadata
- ✅ No hay errores de TypeScript/ESLint

---

### ✅ **View Source (HTML)**

#### **1. `/usados`**

**URLs a verificar:**
- `http://localhost:3000/usados` (o producción)

**Buscar en HTML:**
```html
<!-- Metadata -->
<title>Vehículos Usados Multimarca | Indiana Peugeot</title>
<meta name="description" content="Amplia selección...">

<!-- Canonical -->
<link rel="canonical" href="https://peugeotindiana.com.ar/usados">

<!-- OpenGraph -->
<meta property="og:url" content="https://peugeotindiana.com.ar/usados">
<meta property="og:image" content="https://peugeotindiana.com.ar/assets/...">

<!-- JSON-LD (si se implementa) -->
<script type="application/ld+json">...</script>
```

**❌ Estado actual:**
- Canonical usa `getSiteUrl()` manual
- No hay `og:image`
- No hay JSON-LD

---

#### **2. `/usados/vehiculos`**

**URLs a verificar:**
- `http://localhost:3000/usados/vehiculos` (o producción)

**Buscar en HTML:**
```html
<!-- Metadata -->
<title>Vehículos Usados Multimarca | Indiana Peugeot</title>

<!-- Canonical -->
<link rel="canonical" href="https://peugeotindiana.com.ar/usados/vehiculos">

<!-- JSON-LD ItemList -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://peugeotindiana.com.ar/usados/123",
      "name": "Peugeot 208 2020"
    },
    ...
  ]
}
</script>
```

**❌ Estado actual:**
- Canonical usa `getSiteUrl()` manual
- Canonical no incluye filtros (siempre `/usados/vehiculos`)
- No hay `og:image`
- No hay JSON-LD

---

#### **3. `/usados/[id]`**

**URLs a verificar:**
- `http://localhost:3000/usados/123` (o producción)

**Buscar en HTML:**
```html
<!-- Metadata -->
<title>Peugeot 208 2020 | Indiana Peugeot</title>

<!-- Canonical -->
<link rel="canonical" href="https://peugeotindiana.com.ar/usados/123">

<!-- OpenGraph -->
<meta property="og:url" content="https://peugeotindiana.com.ar/usados/123">
<meta property="og:image" content="https://...fotoPrincipal.jpg">

<!-- JSON-LD Product/Vehicle (si se implementa) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Peugeot 208 2020",
  "image": ["https://...fotoPrincipal.jpg"],
  "url": "https://peugeotindiana.com.ar/usados/123"
}
</script>
```

**❌ Estado actual:**
- Canonical usa `getSiteUrl()` manual
- `og:image` existe pero URL relativa (debe ser absoluta)
- No hay JSON-LD

---

### ✅ **Network — Detección de Cache**

**Cómo verificar si está usando cache:**

1. **Primera carga:**
   - Abrir DevTools → Network
   - Filtrar por "Fetch/XHR"
   - Visitar `/usados/vehiculos`
   - **Esperado:** Request a `/photos/getallphotos?...` con `Cache-Control` header

2. **Segunda carga (dentro de 6h):**
   - Recargar la página
   - **Esperado:** No debería haber request al backend (cache de Next.js)

3. **Después de revalidación:**
   - Llamar a `/api/revalidate` con `revalidateList: true`
   - Recargar `/usados/vehiculos`
   - **Esperado:** Request al backend (cache invalidado)

---

### ✅ **Producción — Sin Localhost**

**Validación:**
```bash
NODE_ENV=production npm run build
```

**Verificar:**
- ✅ Canonical URLs no contienen `localhost:3000`
- ✅ OG URLs no contienen `localhost:3000`
- ✅ JSON-LD URLs no contienen `localhost:3000`

**Si falta `NEXT_PUBLIC_SITE_URL`:**
- ✅ `getSiteUrl()` lanza error explícito (hardening ya implementado)
- ✅ Build falla con mensaje claro

---

## G) PLAN DE IMPLEMENTACIÓN (P1)

### ✅ **Cambios a Implementar (P1)**

1. **Reemplazar `getSiteUrl()` por `absoluteUrl()`** en los 3 archivos
2. **Agregar JSON-LD `ItemList`** en `/usados/vehiculos`
3. **Agregar JSON-LD `Product`** en `/usados/[id]` (sin inventar precios)
4. **Agregar `og:image`** en `/usados` y `/usados/vehiculos`

---

**Fin del Reporte** ✅


