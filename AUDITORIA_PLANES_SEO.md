# 📊 AUDITORÍA PROFESIONAL — SECCIÓN `/planes` (Next.js App Router)

**Fecha:** 2025-01-XX  
**Objetivo:** Aprovechar Next.js correctamente (Server Components, SSG/ISR, SEO, structured data, imágenes optimizadas)  
**Alcance:** `/planes` (listado) y `/planes/[planId]` (detalle)

---

## A) ESTADO REAL ACTUAL (EVIDENCIA CONCRETA)

### 📁 **1. `/planes` (Listado) - `src/app/planes/page.jsx`**

#### ✅ **Server Component**
- **Evidencia:** Línea 60 — `export default function PlanesPage()` sin `'use client'`
- **Estado:** ✅ Server Component correcto
- **Procesamiento:** Líneas 61-79 — Agrupación de planes por modelo en server-side
- **Datos:** `getAllPlanes()` desde `src/data/planes.js` (síncrono, sin fetch)

#### 🔄 **Client Components Identificados**

| Componente | Ubicación | Justificación | Estado |
|------------|-----------|---------------|--------|
| `PlanesClient` | `src/app/planes/PlanesClient.jsx:11` | Scroll interactivo (`scrollIntoView`, `useRef`) | ✅ **Justificado** |
| `ModeloSection` | `src/components/planes/ModeloSection.jsx:103` | Carrusel interactivo (scroll, botones, dots) | ✅ **Justificado** |
| `PlanCard` | `src/components/planes/PlanCard.jsx:60` | Solo renderiza estático (memo) | ⚠️ **Podría ser Server** |

**Evidencia:**
- `PlanesClient.jsx:1` — `"use client"` (línea 1)
- `PlanesClient.jsx:16-21` — `scrollToModelo()` usa `scrollIntoView` y `useRef`
- `ModeloSection.jsx:1` — `"use client"` (línea 1)
- `ModeloSection.jsx:144-179` — `useEffect` con listeners de scroll/resize

#### 📊 **SSG vs Dinámico**

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| `fetch()` | ❌ No existe | Sin llamadas a APIs externas |
| `searchParams` | ❌ No existe | No usa `searchParams` en función |
| `headers()` | ❌ No existe | Sin acceso a headers |
| `cookies()` | ❌ No existe | Sin acceso a cookies |
| `revalidate` | ❌ No existe | Sin `export const revalidate` |
| `generateStaticParams` | ❌ No aplica | No es ruta dinámica `[planId]` |

**Conclusión:** ✅ **SSG puro** (generado en build time, sin revalidación)

#### 🔍 **SEO / Metadata**

| Aspecto | Estado | Evidencia | Problema |
|---------|--------|-----------|----------|
| `generateMetadata` | ✅ Existe | Línea 9 — `export async function generateMetadata()` | ✅ Correcto |
| `title` | ✅ Configurado | Línea 14 | ✅ Correcto |
| `description` | ✅ Configurado | Línea 15-16 | ✅ Correcto |
| `keywords` | ✅ Configurado | Línea 17-18 | ✅ Correcto |
| `canonical` | ⚠️ Usa `getSiteUrl()` | Línea 44 — `${baseUrl}/planes` | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:url` | ⚠️ Usa `getSiteUrl()` | Línea 23 — `${baseUrl}/planes` | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:image` | ⚠️ URL absoluta manual | Línea 29 — `${baseUrl}/assets/...` | ⚠️ **Funciona pero inconsistente** |
| `twitter:images` | ⚠️ URL absoluta manual | Línea 41 — `${baseUrl}/assets/...` | ⚠️ **Funciona pero inconsistente** |
| JSON-LD | ❌ No existe | Sin `<script type="application/ld+json">` | ❌ **Falta structured data** |

**Código actual (líneas 9-54):**
```javascript
export async function generateMetadata() {
  try {
    const baseUrl = getSiteUrl(); // ⚠️ Debería usar absoluteUrl()
    
    return {
      // ...
      openGraph: {
        url: `${baseUrl}/planes`, // ⚠️ Construcción manual
        images: [{ url: `${baseUrl}/assets/...` }], // ⚠️ Construcción manual
      },
      alternates: {
        canonical: `${baseUrl}/planes`, // ⚠️ Construcción manual
      },
    };
  }
}
```

#### 🖼️ **Imágenes**

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| `<img>` nativos | ❌ No existen | No hay imágenes en la página principal |
| `next/image` | ❌ No se usa | No hay imágenes en esta página |
| `sizes` | ❌ No aplica | No hay imágenes |
| `priority` | ❌ No aplica | No hay imágenes |

**Conclusión:** No hay imágenes en `/planes` (listado).

#### ⚡ **Performance / JS Cliente**

| Componente | JS Estimado (gzipped) | Motivo |
|------------|----------------------|--------|
| `PlanesClient` | ~5-8 KB | Scroll interactivo, refs |
| `ModeloSection` | ~15-20 KB | Carrusel completo (scroll, dots, arrows) |
| `PlanCard` | ~3-5 KB | Render estático con memo (innecesario) |
| **Total estimado** | **~23-33 KB** | ⚠️ `PlanCard` podría ser Server Component |

---

### 📁 **2. `/planes/[planId]` (Detalle) - `src/app/planes/[planId]/page.jsx`**

#### ✅ **Server Component con SSG**
- **Evidencia:** Línea 92 — `export default async function PlanDetallePage({ params })` sin `'use client'`
- **Estado:** ✅ Server Component correcto
- **Datos:** `getPlanPorId(planId)` desde `src/data/planes.js` (síncrono, sin fetch)

#### 📊 **generateStaticParams**

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| `generateStaticParams` | ✅ Existe | Líneas 11-27 |
| Cobertura | ✅ Completa | Mapea todos los planes desde `getAllPlanes()` |
| Error handling | ✅ Correcto | Try/catch con return `[]` |

**Código (líneas 11-27):**
```javascript
export async function generateStaticParams() {
  try {
    const planes = getAllPlanes();
    if (!Array.isArray(planes) || planes.length === 0) {
      console.warn("No se encontraron planes...");
      return [];
    }
    return planes.map((plan) => ({ planId: plan.id }));
  } catch (error) {
    console.error("Error generating static params...", error);
    return [];
  }
}
```

**✅ Correcto:** Genera slugs de todos los planes disponibles.

#### 🔍 **SEO / Metadata Dinámica**

| Aspecto | Estado | Evidencia | Problema |
|---------|--------|-----------|----------|
| `generateMetadata` | ✅ Existe | Línea 32 — `export async function generateMetadata({ params })` | ✅ Correcto |
| `title` dinámico | ✅ Correcto | Línea 45 — `Plan ${plan.plan} - Peugeot 0km...` | ✅ Correcto |
| `description` dinámica | ✅ Correcto | Línea 46 — Usa `formatPrice(plan.cuotas_desde)` | ✅ Correcto |
| `keywords` dinámico | ✅ Correcto | Línea 47 — Incluye nombre del plan | ✅ Correcto |
| `canonical` | ⚠️ Usa `getSiteUrl()` | Línea 76 — `${baseUrl}/planes/${planId}` | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:url` | ⚠️ Usa `getSiteUrl()` | Línea 56 — `${baseUrl}/planes/${planId}` | ⚠️ **Debería usar `absoluteUrl()`** |
| `og:image` | ⚠️ URL absoluta manual | Línea 62 — `${baseUrl}/assets/...` | ⚠️ **Funciona pero inconsistente** |
| `twitter:images` | ⚠️ URL absoluta manual | Línea 73 — `${baseUrl}/assets/...` | ⚠️ **Funciona pero inconsistente** |
| JSON-LD | ❌ No existe | Sin `<script type="application/ld+json">` | ❌ **Falta structured data** |

**Código actual (líneas 32-86):**
```javascript
export async function generateMetadata({ params }) {
  try {
    const { planId } = await params;
    const plan = getPlanPorId(planId);
    const baseUrl = getSiteUrl(); // ⚠️ Debería usar absoluteUrl()
    
    return {
      // ...
      openGraph: {
        url: `${baseUrl}/planes/${planId}`, // ⚠️ Construcción manual
        images: [{ url: `${baseUrl}/assets/...` }], // ⚠️ Construcción manual
      },
      alternates: {
        canonical: `${baseUrl}/planes/${planId}`, // ⚠️ Construcción manual
      },
    };
  }
}
```

#### 🖼️ **Imágenes**

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| `<img>` nativos | ❌ No existen | No hay imágenes en la página de detalle |
| `next/image` | ❌ No se usa | No hay imágenes en esta página |
| `sizes` | ❌ No aplica | No hay imágenes |
| `priority` | ❌ No aplica | No hay imágenes |

**Conclusión:** No hay imágenes en `/planes/[planId]` (detalle).

#### ⚡ **Performance / JS Cliente**

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| Client Components | ❌ No hay | La página es 100% Server Component |
| JS enviado | ✅ Mínimo | Solo HTML renderizado en server |

**✅ Excelente:** Página completamente server-side, sin JS innecesario.

---

### 📁 **3. Fuente de Datos - `src/data/planes.js`**

#### 📊 **Estructura de Datos**

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| Tipo de datos | ✅ Hardcodeados | Array estático `PLANES` (línea 132) |
| Fuente | ✅ Local (síncrono) | `export const PLANES = [...]` |
| Fetch externo | ❌ No existe | Sin llamadas a APIs |
| SearchParams | ❌ No aplica | No usa parámetros de búsqueda |
| Headers/Cookies | ❌ No aplica | No usa autenticación |

**Estructura de cada plan:**
```javascript
{
  id: "2008-allure-t200",
  plan: "2008 ALLURE T200",
  modelos: ["Nuevo 2008 Allure T200 AM26"],
  cuotas_desde: 477782,
  valor_movil_con_imp: 48760000,
  valor_movil_sin_imp: 40297521,
  caracteristicas: { /* ... */ }
}
```

**Conclusión:** ✅ **Datos 100% hardcodeados en código** (no hay backend/API).

---

## B) PROBLEMAS / OPORTUNIDADES (CON IMPACTO)

### 🔴 **PRIORIDAD ALTA**

#### 1. **URLs no usan `absoluteUrl()` helper**
- **Problema:** Canonical y og:url se construyen manualmente con `${baseUrl}/planes/...`
- **Impacto:** Inconsistencia, riesgo de localhost en producción si `getSiteUrl()` falla
- **Archivos:** 
  - `src/app/planes/page.jsx` (líneas 23, 29, 41, 44)
  - `src/app/planes/[planId]/page.jsx` (líneas 44, 56, 62, 73, 76)
- **Solución:** Usar `absoluteUrl()` en lugar de construcción manual

#### 2. **Falta JSON-LD (Structured Data) en `/planes`**
- **Problema:** No hay structured data para mejorar SEO
- **Impacto:** Menor visibilidad en rich snippets de Google
- **Archivo:** `src/app/planes/page.jsx`
- **Solución:** Agregar `ItemList` JSON-LD con todos los planes

#### 3. **Falta JSON-LD (Structured Data) en `/planes/[planId]`**
- **Problema:** No hay structured data para Product/Offer/FinancialProduct
- **Impacto:** Menor visibilidad en rich snippets, especialmente para financiación
- **Archivo:** `src/app/planes/[planId]/page.jsx`
- **Solución:** Agregar `FinancialProduct` o `Product` con `Offer` JSON-LD (sin inventar precios)

---

### 🟡 **PRIORIDAD MEDIA**

#### 4. **`PlanCard` es Client Component innecesario**
- **Problema:** `PlanCard` usa `'use client'` y `memo()` pero solo renderiza contenido estático
- **Impacto:** ~3-5 KB de JS innecesario por card
- **Archivo:** `src/components/planes/PlanCard.jsx`
- **Evidencia:** 
  - Línea 1 — `"use client"`
  - Líneas 60-176 — Solo renderiza props, sin interactividad
  - Línea 179 — `memo()` innecesario en Server Components
- **Solución:** Convertir a Server Component (eliminar `'use client'` y `memo()`)

#### 5. **Metadata podría mejorarse con datos del plan**
- **Problema:** `og:image` usa logo genérico en lugar de imagen específica del plan/modelo
- **Impacto:** Bajo (solo mejora visual en redes sociales)
- **Archivo:** `src/app/planes/[planId]/page.jsx` (líneas 60-67)
- **Solución:** Opcional — Usar imagen del modelo si está disponible

---

### 🟢 **PRIORIDAD BAJA**

#### 6. **No hay `export const revalidate` (no es problema)**
- **Estado:** ✅ Correcto para SSG puro
- **Justificación:** Datos hardcodeados no requieren revalidación
- **Recomendación:** Mantener SSG puro (sin `revalidate`)

---

## C) PLAN PRIORIZADO (ALTA/MEDIA/BAJA)

### 🔴 **PRIORIDAD ALTA**

#### **1. Reemplazar construcción manual de URLs por `absoluteUrl()`**

**Impacto:** Alto (consistencia, seguridad)  
**Esfuerzo:** Bajo (solo cambiar imports y URLs)  
**Riesgo:** Bajo (cambios mínimos, fácil de revertir)

**Archivos a modificar:**
- `src/app/planes/page.jsx`
- `src/app/planes/[planId]/page.jsx`

**Código sugerido:**

`src/app/planes/page.jsx`:
```javascript
// Cambiar import
import { absoluteUrl } from "../../lib/site-url"; // Agregar absoluteUrl

// En generateMetadata (línea 9):
export async function generateMetadata() {
  try {
    return {
      // ...
      openGraph: {
        url: absoluteUrl("/planes"), // ✅ En lugar de `${baseUrl}/planes`
        images: [{
          url: absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"), // ✅
        }],
      },
      alternates: {
        canonical: absoluteUrl("/planes"), // ✅
      },
    };
  }
}
```

`src/app/planes/[planId]/page.jsx`:
```javascript
// Cambiar import
import { absoluteUrl } from "../../../lib/site-url"; // Agregar absoluteUrl

// En generateMetadata (línea 32):
export async function generateMetadata({ params }) {
  try {
    const { planId } = await params;
    const plan = getPlanPorId(planId);
    
    return {
      // ...
      openGraph: {
        url: absoluteUrl(`/planes/${planId}`), // ✅
        images: [{
          url: absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"), // ✅
        }],
      },
      alternates: {
        canonical: absoluteUrl(`/planes/${planId}`), // ✅
      },
    };
  }
}
```

---

#### **2. Agregar JSON-LD `ItemList` en `/planes`**

**Impacto:** Alto (SEO, rich snippets)  
**Esfuerzo:** Medio (crear helper + script)  
**Riesgo:** Bajo (solo agregar, no modificar)

**Archivos a modificar:**
- `src/app/planes/page.jsx`

**Código sugerido:**

Agregar helper antes de `generateMetadata`:
```javascript
import { absoluteUrl } from "../../lib/site-url"; // Agregar

/**
 * Helper para generar Structured Data (JSON-LD) del listado de planes
 * Usa Schema.org ItemList
 */
function getPlanesListJsonLd(planes) {
  if (!planes || !Array.isArray(planes) || planes.length === 0) {
    return null;
  }

  const itemListElement = planes.map((plan, index) => {
    return {
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/planes/${plan.id}`),
      name: `Plan ${plan.plan}`,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Planes de Financiación Peugeot 0km",
    itemListElement: itemListElement.length > 0 ? itemListElement : undefined,
    numberOfItems: itemListElement.length,
  };

  // Limpiar undefined
  Object.keys(jsonLd).forEach((key) => {
    if (jsonLd[key] === undefined) {
      delete jsonLd[key];
    }
  });

  return jsonLd;
}
```

En el componente (línea 60+):
```javascript
export default function PlanesPage() {
  const allPlanes = getAllPlanes();
  // ... código existente ...

  // Generar JSON-LD
  const jsonLd = getPlanesListJsonLd(allPlanes);

  return (
    <div className={styles.planesPage}>
      {/* Structured Data (JSON-LD) para SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* ... resto del JSX ... */}
    </div>
  );
}
```

---

#### **3. Agregar JSON-LD `FinancialProduct` o `Product` en `/planes/[planId]`**

**Impacto:** Alto (SEO, rich snippets para financiación)  
**Esfuerzo:** Medio (crear helper + script, validar schema)  
**Riesgo:** Bajo-Medio (requiere validar que no inventamos datos)

**Archivos a modificar:**
- `src/app/planes/[planId]/page.jsx`

**Código sugerido:**

Agregar helper antes de `generateMetadata`:
```javascript
import { absoluteUrl } from "../../../lib/site-url"; // Agregar

/**
 * Helper para generar Structured Data (JSON-LD) del plan de financiación
 * Usa Schema.org FinancialProduct o Product con Offer
 */
function getPlanJsonLd({ plan, canonicalUrl }) {
  if (!plan) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct", // O "Product" si FinancialProduct no es soportado
    name: `Plan ${plan.plan}`,
    description: `Plan de financiación ${plan.plan} para modelos Peugeot 0km. Cuota desde ${formatPrice(plan.cuotas_desde)}.`,
    url: canonicalUrl,
    // NO incluir price/offers si no hay precio único real
    // Los planes tienen múltiples valores (cuotas_desde, valor_movil_con_imp, etc.)
  };

  // Opcional: Agregar category si es relevante
  jsonLd.category = "Automotive Financing";

  // Limpiar undefined
  Object.keys(jsonLd).forEach((key) => {
    if (jsonLd[key] === undefined) {
      delete jsonLd[key];
    }
  });

  return jsonLd;
}
```

En el componente (línea 92+):
```javascript
export default async function PlanDetallePage({ params }) {
  const { planId } = await params;
  const plan = getPlanPorId(planId);
  
  if (!plan) {
    notFound();
  }

  // Generar JSON-LD
  const canonicalUrl = absoluteUrl(`/planes/${planId}`);
  const jsonLd = getPlanJsonLd({ plan, canonicalUrl });

  return (
    <div className={styles.container}>
      {/* Structured Data (JSON-LD) para SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* ... resto del JSX ... */}
    </div>
  );
}
```

**⚠️ NOTA:** `FinancialProduct` puede no estar completamente soportado en todos los validadores. Alternativa: usar `Product` con `category: "Automotive Financing"`.

---

### 🟡 **PRIORIDAD MEDIA**

#### **4. Convertir `PlanCard` a Server Component**

**Impacto:** Medio (reduce JS en cliente ~3-5 KB)  
**Esfuerzo:** Bajo (eliminar `'use client'` y `memo()`)  
**Riesgo:** Bajo (solo renderiza props, sin interactividad)

**Archivos a modificar:**
- `src/components/planes/PlanCard.jsx`

**Cambios:**
1. Eliminar línea 1: `"use client"`
2. Eliminar línea 179: `memo()` wrapper
3. Cambiar `const PlanCardComponent = ({ ... }) => {` a `export function PlanCard({ ... }) {`

**Verificación:** Confirmar que no usa hooks ni `window`/`document`.

---

## D) LISTA EXACTA DE ARCHIVOS A MODIFICAR

### 🔴 **Prioridad Alta:**

| Archivo | Cambios |
|---------|---------|
| `src/app/planes/page.jsx` | 1) Agregar `absoluteUrl` import<br>2) Reemplazar `${baseUrl}/planes` por `absoluteUrl("/planes")`<br>3) Agregar helper `getPlanesListJsonLd()`<br>4) Agregar script JSON-LD en JSX |
| `src/app/planes/[planId]/page.jsx` | 1) Agregar `absoluteUrl` import<br>2) Reemplazar `${baseUrl}/planes/${planId}` por `absoluteUrl(\`/planes/${planId}\`)`<br>3) Agregar helper `getPlanJsonLd()`<br>4) Agregar script JSON-LD en JSX |

### 🟡 **Prioridad Media:**

| Archivo | Cambios |
|---------|---------|
| `src/components/planes/PlanCard.jsx` | 1) Eliminar `"use client"`<br>2) Eliminar `memo()` wrapper<br>3) Convertir a función Server Component |

---

## E) DECISIÓN SSG vs ISR

### ✅ **Recomendación: SSG PURO (sin `revalidate`)**

**Justificación:**

1. **Datos 100% hardcodeados:**
   - Fuente: Array estático `PLANES` en `src/data/planes.js`
   - No hay fetch externo
   - No hay backend/API

2. **Cambios requieren deploy:**
   - Para modificar planes, se edita `planes.js` y se hace deploy
   - No hay posibilidad de cambios sin rebuild

3. **Beneficios de SSG puro:**
   - ✅ Build más rápido (sin revalidación)
   - ✅ Máxima performance (HTML estático pre-generado)
   - ✅ Compatible con CDN edge caching
   - ✅ Sin límites de revalidación (ISR tiene límites de tiempo)

4. **Cuándo usar ISR:**
   - ❌ Solo si en el futuro hay backend/API para planes
   - ❌ Solo si se requiere actualización sin deploy
   - ❌ Si hubiera planes que cambian frecuentemente

**Conclusión:** Mantener SSG puro (sin agregar `export const revalidate`).

---

## F) CHECKLIST DE VALIDACIÓN

### ✅ **Build Output**

```bash
npm run build
```

**Validaciones:**
- ✅ `/planes` aparece en build output como estático
- ✅ `/planes/[planId]` aparece como rutas generadas (ej: `/planes/2008-allure-t200`)
- ✅ No hay warnings de metadata
- ✅ No hay errores de TypeScript/ESLint

**Output esperado:**
```
Route (app)                              Size     First Load JS
┌ ○ /planes                              5.42 kB        85.3 kB
└ ○ /planes/[planId]                     7.89 kB        87.8 kB
  ├ /planes/2008-allure-t200
  ├ /planes/2008-active-t200
  ├ /planes/expert-carga
  ├ /planes/partner-hdi
  ├ /planes/plus-at
  └ /planes/plus-208
```

---

### ✅ **View Source (HTML)**

**URLs a verificar:**
- `http://localhost:3000/planes` (o producción)
- `http://localhost:3000/planes/2008-allure-t200` (o producción)

**Validaciones:**

#### **1. Metadata en `<head>`:**

```html
<!-- /planes -->
<title>Financiá tu Peugeot 0km | Planes en Tucumán | Indiana Peugeot</title>
<meta name="description" content="Planes de financiación flexibles...">
<link rel="canonical" href="https://peugeotindiana.com.ar/planes">
<meta property="og:url" content="https://peugeotindiana.com.ar/planes">
<meta property="og:image" content="https://peugeotindiana.com.ar/assets/logos/...">

<!-- /planes/[planId] -->
<title>Plan 2008 ALLURE T200 - Peugeot 0km | Indiana Peugeot</title>
<meta name="description" content="Detalles del plan...">
<link rel="canonical" href="https://peugeotindiana.com.ar/planes/2008-allure-t200">
<meta property="og:url" content="https://peugeotindiana.com.ar/planes/2008-allure-t200">
```

**❌ Problemas actuales:**
- URLs pueden mostrar `http://localhost:3000` si `getSiteUrl()` no está configurado
- URLs construidas manualmente (no usan `absoluteUrl()`)

**✅ Después de cambios:**
- URLs siempre absolutas usando `absoluteUrl()`
- No localhost en producción

---

#### **2. JSON-LD Scripts:**

**`/planes`:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Planes de Financiación Peugeot 0km",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://peugeotindiana.com.ar/planes/2008-allure-t200",
      "name": "Plan 2008 ALLURE T200"
    },
    ...
  ],
  "numberOfItems": 6
}
</script>
```

**`/planes/[planId]`:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": "Plan 2008 ALLURE T200",
  "description": "Plan de financiación...",
  "url": "https://peugeotindiana.com.ar/planes/2008-allure-t200",
  "category": "Automotive Financing"
}
</script>
```

**❌ Estado actual:** No existe (falta agregar)

**✅ Después de cambios:** Scripts presentes y válidos

---

### ✅ **Schema Validator**

**Herramientas:**
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

**Validaciones:**

1. **JSON-LD `/planes`:**
   - ✅ Tipo `ItemList` válido
   - ✅ Todos los `ListItem` tienen `position`, `url`, `name`
   - ✅ `url` son absolutas (no relativas)

2. **JSON-LD `/planes/[planId]`:**
   - ✅ Tipo `FinancialProduct` o `Product` válido
   - ✅ `name`, `description`, `url` presentes
   - ✅ No inventa `offers/price` si no hay precio único real

**Errores comunes a evitar:**
- ❌ `url` relativas (debe ser absoluta)
- ❌ `offers` sin `price` (mejor no incluir si no hay precio único)
- ❌ Campos requeridos faltantes

---

### ✅ **Producción - Sin Localhost**

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

### ✅ **Performance Audit (Lighthouse)**

**URLs a auditar:**
- `/planes`
- `/planes/2008-allure-t200`

**Métricas esperadas:**
- ✅ SEO: 100/100
- ✅ Performance: 90+ (depende de JS de carruseles)
- ✅ Structured Data: Detectado y válido

**Mejoras esperadas:**
- JSON-LD mejorará SEO score
- URLs absolutas mejorarán validación de metadata

---

## G) RESUMEN EJECUTIVO

### ✅ **Fortalezas Actuales:**
1. ✅ Server Components correctos (páginas son Server Components)
2. ✅ SSG puro bien implementado (sin fetch, sin revalidate)
3. ✅ `generateStaticParams` correcto en detalle
4. ✅ Metadata básica presente
5. ✅ Client Components justificados (carruseles con scroll)

### ⚠️ **Oportunidades de Mejora:**
1. 🔴 URLs no usan `absoluteUrl()` (inconsistencia)
2. 🔴 Falta JSON-LD en ambos endpoints (SEO perdido)
3. 🟡 `PlanCard` es Client Component innecesario (~3-5 KB JS)

### 📊 **Métricas Estimadas Post-Mejoras:**
- **SEO:** +5-10 puntos (JSON-LD + URLs consistentes)
- **JS reducido:** ~3-5 KB (convirtiendo `PlanCard`)
- **Consistencia:** 100% URLs absolutas usando `absoluteUrl()`

---

## 🚀 **PRÓXIMOS PASOS**

1. **Esperar aprobación del reporte**
2. **Implementar prioridad ALTA #1:** Reemplazar URLs por `absoluteUrl()`
3. **Implementar prioridad ALTA #2:** Agregar JSON-LD `ItemList` en `/planes`
4. **Implementar prioridad ALTA #3:** Agregar JSON-LD `FinancialProduct` en `[planId]`
5. **Validar con checklist de validación**
6. **Considerar prioridad MEDIA #4:** Convertir `PlanCard` a Server Component

---

**Fin del Reporte** ✅

