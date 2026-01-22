# 🔍 ANÁLISIS: PREPARACIÓN PARA ENTORNOS PREVIEW

**Fecha:** $(date)  
**Proyecto:** indiana-next  
**Objetivo:** Determinar si el código está preparado para manejar entornos preview (Vercel Preview Deployments)

---

## ❌ RESULTADO: **NO ESTÁ PREPARADO**

El código actual **NO está preparado** para manejar entornos preview. Solo diferencia entre `development` y `production`, pero no detecta ni maneja el entorno `preview` que Vercel genera automáticamente.

---

## 📊 ESTADO ACTUAL

### ✅ Lo que SÍ funciona
1. **`robots.ts`**: Detecta `VERCEL_ENV` pero solo para verificar si es `production`
2. **Variables de entorno**: Se usan `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_API_URL`
3. **Detección básica**: Se diferencia `NODE_ENV === 'development'` vs `production`

### ❌ Lo que NO funciona
1. **`site-url.js`**: No detecta `VERCEL_ENV === 'preview'` ni usa `VERCEL_URL`
2. **Configuración de entorno**: No hay helper centralizado para detectar entorno
3. **URLs en preview**: En preview, `NEXT_PUBLIC_SITE_URL` probablemente no esté configurada, causando:
   - URLs incorrectas en sitemap
   - URLs incorrectas en robots.txt
   - Warmup de URLs fallando en `/api/revalidate`
   - Metadatos SEO con URLs incorrectas

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. **`src/lib/site-url.js` - No maneja preview**

**Problema:** Solo diferencia `production` vs no-production. No detecta `preview` ni usa `VERCEL_URL`.

```javascript
// ❌ ACTUAL (línea 25-55)
const isProduction = process.env.NODE_ENV === "production";

// Prioridad 1: NEXT_PUBLIC_SITE_URL
if (process.env.NEXT_PUBLIC_SITE_URL) {
  return process.env.NEXT_PUBLIC_SITE_URL.trim();
}

// Prioridad 2: SITE_URL
if (process.env.SITE_URL) {
  return process.env.SITE_URL.trim();
}

// En producción: NO permitir fallback
if (isProduction) {
  throw new Error("...");
}

// Solo en development: permitir fallback a localhost
return "http://localhost:3000";
```

**Impacto:**
- En preview, si `NEXT_PUBLIC_SITE_URL` no está configurada, lanza error (si `NODE_ENV === 'production'`) o usa `localhost` (si `NODE_ENV !== 'production'`)
- Nunca usa `VERCEL_URL` que Vercel provee automáticamente en preview

---

### 2. **`src/app/api/revalidate/route.js` - URLs incorrectas en preview**

**Problema:** Usa `NEXT_PUBLIC_SITE_URL` con fallback a localhost. No maneja `VERCEL_URL`.

```javascript
// ❌ ACTUAL (línea 23)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
```

**Impacto:**
- En preview, si `NEXT_PUBLIC_SITE_URL` no está configurada, usa `localhost` para warmup
- Las URLs de warmup serán incorrectas (localhost en lugar de la URL del preview)

---

### 3. **`src/app/robots.ts` - Detecta VERCEL_ENV pero no lo aprovecha**

**Estado:** Usa `VERCEL_ENV` solo para verificar `production`, no para manejar `preview`.

```javascript
// ⚠️ ACTUAL (línea 5-7)
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";
```

**Impacto:**
- Funciona correctamente (bloquea preview de ser indexado)
- Pero no aprovecha `VERCEL_ENV` para otras funcionalidades

---

### 4. **No hay configuración centralizada de entorno**

**Problema:** No existe un helper centralizado similar a `indiana-usados/src/config/index.js`.

**Impacto:**
- Código duplicado al detectar entorno
- Inconsistencias en cómo se detecta el entorno
- Difícil mantener y extender

---

## 📋 COMPARACIÓN CON `indiana-usados`

El proyecto `indiana-usados` **SÍ tiene soporte para preview** con una configuración centralizada:

```javascript
// ✅ EJEMPLO DE indiana-usados/src/config/index.js
const validateEnvironment = () => {
  // Prioridad 1: VERCEL_ENV
  if (process.env.VERCEL_ENV) {
    rawEnvironment = process.env.VERCEL_ENV
  }
  // ...
  return environment // 'development' | 'preview' | 'staging' | 'production'
}

const resolveSiteUrl = (envName) => {
  // Prioridad 1: VITE_SITE_URL explícita
  if (process.env.VITE_SITE_URL) {
    return process.env.VITE_SITE_URL
  }
  // Prioridad 2: Si es preview, usar VERCEL_URL
  if (envName === 'preview' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // ...
}
```

**Lecciones aprendidas:**
- Detecta `VERCEL_ENV` como fuente de verdad
- Usa `VERCEL_URL` automáticamente cuando `VERCEL_ENV === 'preview'`
- Tiene configuración centralizada reutilizable

---

## ✅ SOLUCIÓN RECOMENDADA

### Paso 1: Actualizar `src/lib/site-url.js`

Agregar detección de `VERCEL_ENV` y uso de `VERCEL_URL`:

```javascript
export function getSiteUrl() {
  if (typeof process === "undefined") {
    throw new Error("[getSiteUrl] ❌ Solo puede ejecutarse en server-side");
  }

  // ✅ NUEVO: Detectar entorno Vercel
  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase() || null;
  const isProduction = vercelEnv === "production" || process.env.NODE_ENV === "production";
  const isPreview = vercelEnv === "preview";

  // Prioridad 1: NEXT_PUBLIC_SITE_URL (preferido)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim();
    if (url) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
  }

  // Prioridad 2: SITE_URL (fallback server-side)
  if (process.env.SITE_URL) {
    const url = process.env.SITE_URL.trim();
    if (url) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
  }

  // ✅ NUEVO: Prioridad 3: Si es preview, usar VERCEL_URL
  if (isPreview && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // En producción: NO permitir fallback - lanzar error explícito
  if (isProduction) {
    throw new Error(
      "[getSiteUrl] ❌ PRODUCTION ERROR: NEXT_PUBLIC_SITE_URL o SITE_URL deben estar configurados."
    );
  }

  // Solo en development: permitir fallback a localhost
  return "http://localhost:3000";
}
```

### Paso 2: Actualizar `src/app/api/revalidate/route.js`

Usar `getSiteUrl()` en lugar de `NEXT_PUBLIC_SITE_URL` directo:

```javascript
// ✅ CAMBIAR DE:
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// ✅ A:
import { getSiteUrl } from '@/lib/site-url'
const BASE_URL = getSiteUrl()
```

### Paso 3: (Opcional) Crear helper de configuración centralizada

Crear `src/lib/config/env.js` similar a `indiana-usados` para unificar la lógica:

```javascript
/**
 * Detecta el entorno actual
 * @returns {'development' | 'preview' | 'production'}
 */
export function getEnvironment() {
  if (typeof process === "undefined" || !process.env) {
    return 'development';
  }
  
  // Prioridad 1: VERCEL_ENV (en Vercel)
  if (process.env.VERCEL_ENV) {
    const env = process.env.VERCEL_ENV.toLowerCase().trim();
    if (['development', 'preview', 'production'].includes(env)) {
      return env;
    }
  }
  
  // Prioridad 2: NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
}

export function isPreview() {
  return getEnvironment() === 'preview';
}

export function isProduction() {
  return getEnvironment() === 'production';
}

export function isDevelopment() {
  return getEnvironment() === 'development';
}
```

---

## 🧪 CASOS DE USO A VERIFICAR

Después de implementar los cambios, verificar:

1. **Preview Deployment en Vercel:**
   - ✅ Sitemap usa URL correcta del preview
   - ✅ Robots.txt bloquea indexación (correcto)
   - ✅ Warmup de `/api/revalidate` usa URL correcta
   - ✅ Metadatos SEO usan URL correcta

2. **Producción:**
   - ✅ Sigue funcionando igual que antes
   - ✅ Usa `NEXT_PUBLIC_SITE_URL` si está configurada
   - ✅ Lanza error si falta configuración (correcto)

3. **Development:**
   - ✅ Sigue usando localhost como fallback
   - ✅ No se rompe si faltan variables

---

## 📊 PRIORIDAD DE IMPLEMENTACIÓN

### 🔴 ALTA PRIORIDAD
1. **Actualizar `site-url.js`** - Impacta sitemap, robots, SEO
2. **Actualizar `api/revalidate/route.js`** - Impacta warmup de URLs

### 🟡 MEDIA PRIORIDAD
3. **Crear helper de configuración** - Mejora mantenibilidad (opcional)

---

## 🎯 CONCLUSIÓN

**El código NO está preparado para entornos preview**, pero la solución es relativamente simple:

1. **Impacto:** Medio (afecta URLs en preview, pero no rompe funcionalidad)
2. **Esfuerzo:** Bajo (2-3 archivos a modificar)
3. **Riesgo:** Bajo (cambios son retrocompatibles)

**Recomendación:** Implementar las correcciones antes de usar preview deployments en Vercel, especialmente si se espera usar warmup de URLs o metadatos SEO correctos en preview.

---

## 📚 REFERENCIAS

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- `indiana-usados/src/config/index.js` - Ejemplo de implementación correcta
- `src/lib/site-url.js` - Archivo a actualizar
- `src/app/api/revalidate/route.js` - Archivo a actualizar

