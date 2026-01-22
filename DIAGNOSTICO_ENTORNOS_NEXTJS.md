# 🔍 DIAGNÓSTICO: MANEJO DE ENTORNOS EN NEXT.JS

**Proyecto:** indiana-next  
**Fecha:** Análisis realizado sin cambios en el código  
**Objetivo:** Entender el estado actual del manejo de entornos y detectar qué falta para trabajar correctamente con Vercel Preview Deployments

---

## 📋 RESUMEN EJECUTIVO

**Estado general:** ❌ **NO está preparado nativamente para preview deployments de Vercel**

El código actual usa un enfoque **binario** (`development` vs `production`) basado en `NODE_ENV`, sin detectar ni manejar el entorno `preview` que Vercel provee automáticamente.

---

## 1️⃣ USO ACTUAL DE VARIABLES DE ENTORNO

### ✅ **`process.env.NODE_ENV` - Uso intensivo**

**Ubicaciones encontradas:** 119 ocurrencias en el código

**Patrón dominante:**
```javascript
if (process.env.NODE_ENV === 'development') {
  // logging, debugging, comportamientos especiales
}
```

**Archivos principales:**
- `src/lib/services/vehiclesApi.server.js` (cache: `no-store` en dev)
- `src/lib/site-url.js` (fallback a localhost en dev)
- `src/app/api/revalidate/route.js` (warmup URLs)
- `src/hooks/useAuth.js` (logging extensivo en dev)
- Componentes de UI (mostrar/ocultar debug info)
- Hooks y utilidades (validaciones, logging)

**Lógica condicional encontrada:**

| Tipo | Archivo | Lógica |
|------|---------|--------|
| **Cache** | `vehiclesApi.server.js:61` | `cache: NODE_ENV === 'development' ? 'no-store' : undefined` |
| **URLs** | `site-url.js:25` | `isProduction = NODE_ENV === 'production'` |
| **Logging** | Múltiples | `if (NODE_ENV === 'development') console.log(...)` |
| **UI Debug** | `admin/layout.js:37` | `{NODE_ENV === 'development' && <DebugPanel>}` |
| **Error Display** | `error.jsx:42` | `{NODE_ENV === 'development' && <ErrorDetails>}` |

**⚠️ Problema:** `NODE_ENV` es `'production'` tanto en producción como en preview de Vercel.

---

### ⚠️ **`process.env.VERCEL_ENV` - Uso parcial**

**Ubicaciones encontradas:** Solo 1 uso efectivo

**Archivo:** `src/app/robots.ts` (líneas 5-7)

```typescript
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";
```

**Estado:**
- ✅ Detecta `VERCEL_ENV` correctamente
- ⚠️ Solo lo usa para robots.txt (bloquear indexación)
- ❌ No se usa en ninguna otra parte del código

**Valores posibles de `VERCEL_ENV`:**
- `'development'` (Vercel local dev)
- `'preview'` (Preview deployments - PRs, branches)
- `'production'` (Production deployments)

---

### ❌ **`process.env.VERCEL_URL` - NO se usa**

**Estado:** No encontrado en el código actual

**¿Qué es?**
- Variable automática de Vercel en preview deployments
- Formato: `proyecto-git-hash.vercel.app`
- Ejemplo: `indiana-next-abc123.vercel.app`

**Impacto:** Sin `VERCEL_URL`, el proyecto no puede determinar automáticamente la URL del preview.

---

### 📊 **Variables de entorno custom usadas**

| Variable | Tipo | Uso | Estado |
|----------|------|-----|--------|
| `NEXT_PUBLIC_SITE_URL` | Public | URLs absolutas (SEO, sitemap) | ✅ Usada |
| `SITE_URL` | Server-only | Fallback server-side | ✅ Usada |
| `NEXT_PUBLIC_API_URL` | Public | Backend API base URL | ✅ Usada |
| `API_URL` | Server-only | Fallback server-side | ✅ Usada |
| `REVALIDATE_SECRET` | Server-only | Seguridad en `/api/revalidate` | ✅ Usada |
| `NEXT_PUBLIC_API_TIMEOUT` | Public | Timeout de requests | ✅ Usada |

**Problema:** Ninguna de estas variables se configura automáticamente para preview.

---

## 2️⃣ ESTRUCTURA DE ARCHIVOS .ENV

### ❌ **Archivos .env ausentes en el repositorio**

**Búsqueda realizada:** No se encontraron archivos `.env*` en el directorio `indiana-next/`

**Archivos esperados vs encontrados:**

| Archivo | Esperado | Encontrado | Estado |
|---------|----------|------------|--------|
| `.env.local` | ✅ Sí (gitignored) | ❌ No (correcto) | ✅ OK |
| `.env.development` | ⚠️ Opcional | ❌ No | ⚠️ Faltante |
| `.env.production` | ⚠️ Opcional | ❌ No | ⚠️ Faltante |
| `.env.example` | ✅ Recomendado | ❌ No | ❌ Faltante |

**Referencias encontradas:**

1. **`README.md` (líneas 7-16):**
   ```bash
   # Site URL (para SEO, sitemap, robots)
   NEXT_PUBLIC_SITE_URL=
   SITE_URL=
   
   # API Backend (para vehículos usados)
   NEXT_PUBLIC_API_URL=http://localhost:3001
   # En producción: NEXT_PUBLIC_API_URL=https://back-indiana.vercel.app
   ```

2. **`README.md` (línea 19):**
   > "Note: `.env.local` is gitignored and should not be committed. See `.env.example` for reference."

   **⚠️ Inconsistencia:** El README menciona `.env.example` pero el archivo no existe.

---

### 📝 **Variables documentadas en README**

**Variables esperadas según README:**
- `NEXT_PUBLIC_SITE_URL` (SEO, sitemap, robots)
- `SITE_URL` (fallback server-side)
- `NEXT_PUBLIC_API_URL` (backend API)

**Variables adicionales encontradas en código:**
- `REVALIDATE_SECRET` (no documentada en README)
- `API_URL` (fallback server-side, no documentada)
- `NEXT_PUBLIC_API_TIMEOUT` (no documentada)

---

## 3️⃣ CONFIGURACIÓN DE NEXT.JS

### ✅ **`next.config.mjs` - Configuración básica**

**Estado:** Configuración limpia, sin lógica de entorno

```javascript
const nextConfig = {
  reactCompiler: false,
  images: { /* optimizaciones */ },
  compress: true,
  poweredByHeader: false,
};
```

**Análisis:**
- ✅ No hay redirects/rewrites condicionales por entorno
- ✅ No hay flags dependientes de entorno
- ✅ Configuración estática (sin uso de `process.env`)

**⚠️ Implicación:** La configuración es la misma para todos los entornos (dev/preview/prod).

---

### ⚠️ **Middleware - Sin lógica de entorno**

**Archivo:** `src/middleware.js`

**Estado:** Protección de rutas `/admin/*`, sin lógica condicional por entorno.

**Análisis:** No afecta preview deployments.

---

### 📄 **Metadata Routes - Uso parcial de entornos**

#### `src/app/sitemap.ts`
```typescript
export default async function sitemap() {
  const baseUrl = getSiteUrl(); // ⚠️ No detecta preview
  // ...
}
```

**Problema:** Usa `getSiteUrl()` que no maneja `VERCEL_URL`.

#### `src/app/robots.ts`
```typescript
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";
```

**Estado:** ✅ Funciona correctamente (bloquea preview de indexarse).  
**Nota:** Es el único lugar donde se usa `VERCEL_ENV`.

---

## 4️⃣ SUPOSICIONES IMPLÍCITAS DEL CÓDIGO

### 🔴 **Suposición 1: Binario development/production**

**Evidencia:**
```javascript
// src/lib/site-url.js:25
const isProduction = process.env.NODE_ENV === "production";

// src/lib/services/vehiclesApi.server.js:61
cache: process.env.NODE_ENV === "development" ? "no-store" : undefined
```

**Suposición implícita:**
- Si `NODE_ENV !== 'production'` → Es development
- Si `NODE_ENV === 'production'` → Es production

**❌ Problema:** En preview de Vercel, `NODE_ENV === 'production'`, pero no es producción real.

**Impacto:**
- `getSiteUrl()` puede lanzar error en preview si falta `NEXT_PUBLIC_SITE_URL`
- Cache puede comportarse como producción (no deseado en preview)

---

### 🔴 **Suposición 2: `NEXT_PUBLIC_SITE_URL` siempre configurada**

**Evidencia:**
```javascript
// src/lib/site-url.js:44-51
if (isProduction) {
  throw new Error(
    "[getSiteUrl] ❌ PRODUCTION ERROR: NEXT_PUBLIC_SITE_URL o SITE_URL deben estar configurados."
  );
}
```

**Suposición implícita:**
- En producción (y preview), `NEXT_PUBLIC_SITE_URL` estará configurada
- Si no está configurada, es un error de configuración

**❌ Problema:** En preview deployments, `NEXT_PUBLIC_SITE_URL` probablemente NO esté configurada, y `VERCEL_URL` (que Vercel provee automáticamente) no se usa.

**Impacto:**
- Sitemap tendrá URLs incorrectas (`localhost` o error)
- Robots.txt tendrá sitemap URL incorrecta
- `/api/revalidate` warmup usará URLs incorrectas

---

### ⚠️ **Suposición 3: URLs hardcodeadas solo para externas**

**Evidencia encontrada:**

| URL | Tipo | Archivo | Uso |
|-----|------|---------|-----|
| `https://wa.me/...` | Externa | Múltiples | ✅ OK (WhatsApp) |
| `https://schema.org/...` | Externa | Múltiples | ✅ OK (Schema.org) |
| `https://mtr.center/...` | Externa | `FeatureSection.jsx:101` | ✅ OK (external link) |
| `http://localhost:3000` | **Fallback** | `site-url.js:55` | ⚠️ Problema en preview |
| `http://localhost:3001` | **Fallback API** | `axiosInstance.js:30` | ⚠️ Problema en preview |

**Análisis:**
- ✅ URLs externas están hardcodeadas correctamente
- ⚠️ Fallbacks a localhost pueden usarse en preview (incorrecto)

---

### ✅ **Suposición 4: Helper centralizado para URLs**

**Evidencia:**
- `src/lib/site-url.js` existe y se usa en:
  - `sitemap.ts`
  - `robots.ts`
  - Probablemente en metadatos de páginas

**Estado:** ✅ Buena práctica, pero el helper no maneja preview.

---

## 5️⃣ RIESGOS Y FALTANTES PARA PREVIEW DEPLOYMENTS

### 🔴 **RIESGO CRÍTICO 1: URLs incorrectas en preview**

**Ubicación:** `src/lib/site-url.js`

**Problema:**
```javascript
const isProduction = process.env.NODE_ENV === "production";

// Si NEXT_PUBLIC_SITE_URL no está configurada:
if (isProduction) {
  throw new Error("..."); // ❌ Lanzará error en preview
}

return "http://localhost:3000"; // ❌ Usará localhost en preview si no es production
```

**Impacto:**
- ❌ Sitemap tendrá URLs incorrectas
- ❌ Metadatos SEO con URLs incorrectas
- ❌ `/api/revalidate` warmup fallará con URLs incorrectas

**Escenario:**
1. Preview deployment se crea (PR o branch)
2. `NODE_ENV === 'production'` (Vercel build)
3. `NEXT_PUBLIC_SITE_URL` no está configurada en preview
4. `getSiteUrl()` lanza error O usa localhost
5. Sitemap, metadatos, warmup usan URLs incorrectas

---

### 🔴 **RIESGO CRÍTICO 2: Warmup de URLs en `/api/revalidate`**

**Ubicación:** `src/app/api/revalidate/route.js:23`

**Código actual:**
```javascript
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
```

**Problema:**
- En preview, si `NEXT_PUBLIC_SITE_URL` no está configurada, usa `localhost`
- Warmup intentará hacer fetch a `http://localhost:3000/...` desde el servidor de Vercel
- Esto fallará (localhost no es accesible desde Vercel)

**Impacto:**
- ❌ Warmup de URLs no funcionará en preview
- ❌ Revalidación funcionará, pero sin warmup (pérdida de performance)

---

### 🟡 **RIESGO MEDIO 3: Cache en preview**

**Ubicación:** `src/lib/services/vehiclesApi.server.js:61`

**Código actual:**
```javascript
cache: process.env.NODE_ENV === "development" ? "no-store" : undefined
```

**Estado:**
- En preview: `NODE_ENV === 'production'` → Cache habilitado (correcto)
- Comportamiento deseable: Cache en preview (como producción)

**⚠️ Nota:** Este comportamiento es correcto, pero puede confundir si se espera que preview se comporte como development.

---

### 🟡 **RIESGO MEDIO 4: Logging excesivo en preview**

**Evidencia:** 80+ checks de `NODE_ENV === 'development'` para logging

**Problema:**
- En preview: `NODE_ENV === 'production'` → No hay logging
- Puede dificultar debugging en preview

**Impacto:**
- ⚠️ Menor visibilidad de errores en preview
- ⚠️ Dificulta troubleshooting

**Nota:** Este comportamiento puede ser deseable (no exponer logs en preview).

---

### 🟢 **RIESGO BAJO 5: Robots.txt ya funciona correctamente**

**Ubicación:** `src/app/robots.ts`

**Estado:** ✅ Funciona correctamente

```typescript
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";
```

**Análisis:**
- Preview no será indexado (correcto)
- Production será indexado (correcto)
- No necesita cambios

---

## ✅ QUÉ ESTÁ BIEN

1. **`robots.ts` detecta `VERCEL_ENV`** - Único lugar donde se usa correctamente
2. **Helper centralizado `site-url.js`** - Buena práctica, solo falta manejar preview
3. **Sin URLs hardcodeadas del sitio** - Se usa `getSiteUrl()` consistentemente
4. **Separación de variables public/server** - `NEXT_PUBLIC_*` vs variables sin prefijo
5. **Configuración limpia en `next.config.mjs`** - Sin complejidad innecesaria

---

## ❌ QUÉ FALTA

### 🔴 **PRIORIDAD ALTA**

1. **Detección de entorno preview en `site-url.js`**
   - Falta: Usar `VERCEL_ENV` para detectar preview
   - Falta: Usar `VERCEL_URL` como fallback en preview

2. **Actualizar `/api/revalidate` para usar `getSiteUrl()`**
   - Falta: Reemplazar `NEXT_PUBLIC_SITE_URL` directo por `getSiteUrl()`

3. **Documentación de variables de entorno**
   - Falta: `.env.example` mencionado en README pero no existe

### 🟡 **PRIORIDAD MEDIA**

4. **Helper de configuración de entorno centralizado**
   - Falta: Función `getEnvironment()` para detectar entorno
   - Falta: Helpers `isPreview()`, `isProduction()`, `isDevelopment()`

5. **Documentación de comportamiento en preview**
   - Falta: README no explica cómo funcionan preview deployments
   - Falta: Guía de variables de entorno por entorno

---

## 📋 QUÉ DEBERÍA DEFINIRSE ANTES DE LA MIGRACIÓN

### 1. **Estrategia de variables de entorno en Vercel**

**Preguntas a responder:**
- ¿Se configurará `NEXT_PUBLIC_SITE_URL` manualmente en cada preview?
- ¿O se usará `VERCEL_URL` automáticamente en preview?
- ¿Qué pasa con `NEXT_PUBLIC_API_URL` en preview? ¿Usa staging o production?

**Recomendación:**
- ✅ Usar `VERCEL_URL` automáticamente en preview (nativo de Vercel)
- ⚠️ Definir política para `NEXT_PUBLIC_API_URL` en preview

---

### 2. **Comportamiento esperado en preview**

**Preguntas a responder:**
- ¿Preview debe comportarse como production (con cache)?
- ¿O debe comportarse como development (sin cache, con logging)?
- ¿Preview debe bloquearse de indexación? (✅ Ya implementado en robots.ts)

**Recomendación:**
- Preview debe comportarse como production (cache habilitado)
- Preview debe bloquearse de indexación (✅ Ya funciona)
- Logging opcional (no crítico)

---

### 3. **Manejo de errores en preview**

**Pregunta:**
- Si `getSiteUrl()` falla en preview, ¿debe lanzar error o usar fallback?

**Recomendación:**
- ✅ En preview, si falta `NEXT_PUBLIC_SITE_URL`, usar `VERCEL_URL` automáticamente
- ✅ En production, mantener error explícito si falta configuración

---

### 4. **Testing de preview**

**Pregunta:**
- ¿Cómo se probará que preview deployments funcionan correctamente?

**Recomendación:**
- Crear PR de prueba para verificar:
  - URLs correctas en sitemap
  - Warmup de `/api/revalidate` funciona
  - Metadatos SEO usan URLs correctas

---

## 🎯 CONCLUSIÓN

**Estado actual:** El código **NO está preparado nativamente** para preview deployments de Vercel.

**Principales problemas:**
1. ❌ `site-url.js` no detecta `VERCEL_ENV === 'preview'` ni usa `VERCEL_URL`
2. ❌ `/api/revalidate` no maneja URLs de preview correctamente
3. ⚠️ Suposición binaria `development`/`production` no contempla `preview`

**Esfuerzo de migración:** Bajo (2-3 archivos principales a modificar)

**Riesgo:** Bajo (cambios son retrocompatibles con development y production)

**Recomendación:** Implementar detección de `VERCEL_ENV` y uso de `VERCEL_URL` antes de usar preview deployments activamente.

---

## 📚 REFERENCIAS

- **Next.js Environment Variables:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **Vercel Automatic System Environment Variables:** `VERCEL_ENV`, `VERCEL_URL`
- **Código de referencia:** `indiana-usados/src/config/index.js` (ejemplo de implementación correcta)

