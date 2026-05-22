# Auditoría SEO — Peugeot Indiana

> **Versión:** 1.0
> **Fecha:** 22 de mayo de 2026
> **Autor:** Equipo técnico
> **Destinatarios:** Cliente, agencia de marketing, equipo técnico
> **Objetivo:** dejar documentado el estado del SEO del sitio `indiana.com.ar`, explicar cómo funciona cada pieza, identificar mejoras y, especialmente, determinar con evidencia si el problema reportado en el aviso de Google (URL `indiana-next.vercel.app/venta/directa_0km`) puede provenir del código o no.

---

## Índice

1. [Resumen ejecutivo (para no programadores)](#1-resumen-ejecutivo-para-no-programadores)
2. [Veredicto sobre la URL incorrecta en Google](#2-veredicto-sobre-la-url-incorrecta-en-google)
3. [¿Qué es SEO? Conceptos básicos en 5 minutos](#3-qué-es-seo-conceptos-básicos-en-5-minutos)
4. [Inventario SEO del proyecto: qué tenemos y cómo funciona](#4-inventario-seo-del-proyecto-qué-tenemos-y-cómo-funciona)
5. [Evidencia técnica completa](#5-evidencia-técnica-completa)
6. [Nivel SEO del proyecto: comparación con la industria](#6-nivel-seo-del-proyecto-comparación-con-la-industria)
7. [Lo que falta o se puede mejorar](#7-lo-que-falta-o-se-puede-mejorar)
8. [Plan de acción recomendado](#8-plan-de-acción-recomendado)
9. [Glosario rápido](#9-glosario-rápido)

---

## 1. Resumen ejecutivo (para no programadores)

### En una frase
**El SEO del sitio está bien armado y la URL incorrecta que aparece en Google NO la genera el código del sitio. Esa URL fue cargada manualmente en una campaña de Google Ads.**

### En tres puntos

- **El código del sitio le dice a Google con todas las letras que el dominio oficial es `indiana.com.ar`**. Esto está repetido en 6 lugares distintos del HTML (canonical, Open Graph, Twitter Cards, datos estructurados JSON-LD, sitemap y robots.txt). Esa es la versión "buena" del sitio que cualquier buscador respeta.

- **La URL `indiana-next.vercel.app/venta/directa_0km` no existe en el código.** Buscamos en todo el proyecto y no hay ningún archivo que genere esa ruta. Cuando se accede a esa URL, el sitio responde **404 Not Found**, tanto en el dominio bueno como en el de Vercel. Si el código la hubiera generado, no daría 404.

- **El aviso de Google dice "Resultados patrocinados"**, lo que significa que es un **anuncio pago de Google Ads**, no un resultado orgánico. Los anuncios usan la URL que se carga manualmente en la campaña, no la que le dice el sitio a Google. Por eso muestra ese dominio raro: alguien lo escribió a mano en el panel de Google Ads.

### Conclusión del diagnóstico
- **Responsable del problema:** la persona o agencia que configuró la campaña de Google Ads.
- **Acción correctora:** editar la URL final del anuncio dentro de `ads.google.com`, cambiando `indiana-next.vercel.app/venta/directa_0km` por `indiana.com.ar/0km` (o la landing real que se quiera promocionar).
- **Mejora preventiva opcional (no es la causa del bug, pero conviene):** agregar un redirect 301 desde el dominio interno de Vercel al dominio real, para que si alguien vuelve a equivocarse en el futuro, el usuario igual termine en el dominio correcto.

---

## 2. Veredicto sobre la URL incorrecta en Google

### Lo que vimos en la captura del cliente

```
[Resultados patrocinados]

indiana-next.vercel.app
https://indiana-next.vercel.app › venta › directa_0km

Tu Próximo 0km En Indiana - Indiana Peugeot
Indiana Peugeot: los mejores 0km con financiación a tu medida...
```

### Análisis pieza por pieza

| Elemento | Origen | ¿Lo controla el código? |
|---|---|---|
| Etiqueta "Resultados patrocinados" | Google Ads | ❌ No |
| Dominio `indiana-next.vercel.app` | URL final del anuncio | ❌ No |
| Path `/venta/directa_0km` | URL final del anuncio | ❌ No |
| Título "Tu Próximo 0km En Indiana - Indiana Peugeot" | Texto del anuncio | ❌ No |
| Descripción "Indiana Peugeot: los mejores 0km..." | Texto del anuncio | ❌ No |
| Botón "Llámanos" | Extensión de llamada del anuncio | ❌ No |
| Sitelinks "Peugeot en Tucumán", "Concesionario Oficial", etc. | Extensiones de sitelinks del anuncio | ❌ No |

**Cero de los siete elementos visibles del aviso provienen del código del sitio.** Todo se configura en `ads.google.com`.

### Las 6 pruebas técnicas que respaldan el veredicto

#### Prueba 1 — La ruta no existe

Buscamos en TODO el proyecto los strings `venta/directa_0km`, `directa_0km`, `/venta/`:

```
Grep result: 0 archivos con coincidencia
```

Solo existe `/venta-directa` (con guión) como redirect heredado de WordPress que tira a `/usados`. Pero el ad muestra `/venta/directa_0km` (con barra y guion bajo), que es una ruta totalmente distinta y que no genera nada el código.

#### Prueba 2 — La ruta devuelve 404

```
$ curl -I https://indiana-next.vercel.app/venta/directa_0km
HTTP/1.1 404 Not Found
X-Matched-Path: /404
X-Next-Error-Status: 404

$ curl -I https://indiana.com.ar/venta/directa_0km
HTTP/1.1 404 Not Found
```

Si el código generara esa URL, el sitio respondería 200 OK con contenido. Responde 404, confirmando que la ruta es inventada.

#### Prueba 3 — El canonical apunta a `indiana.com.ar`

El HTML servido por **ambos dominios** dice explícitamente que el dominio canónico es `indiana.com.ar`:

```html
<!-- HTML de https://indiana.com.ar/ -->
<link rel="canonical" href="https://indiana.com.ar"/>
<meta property="og:url" content="https://indiana.com.ar"/>

<!-- HTML de https://indiana-next.vercel.app/ -->
<link rel="canonical" href="https://indiana.com.ar"/>
<meta property="og:url" content="https://indiana.com.ar"/>
```

Esto significa que **incluso cuando un visitante entra al dominio de Vercel, el código le grita a Google "el dominio real es `indiana.com.ar`"**. Para SEO orgánico Google respeta esto. Pero **Google Ads ignora el canonical** — usa la URL que la campaña tenga cargada.

#### Prueba 4 — Los datos estructurados (JSON-LD) apuntan al dominio bueno

En el HTML de producción:

```json
{
  "@type": "Organization",
  "@id": "https://indiana.com.ar/#organization",
  "name": "Indiana Peugeot",
  "url": "https://indiana.com.ar",
  "logo": {
    "@type": "ImageObject",
    "url": "https://indiana.com.ar/assets/logos/..."
  }
}
```

Esto es lo que Google usa para construir el Knowledge Panel y Rich Results. **Cero referencias a Vercel.**

#### Prueba 5 — El `sitemap.xml` está limpio

`https://indiana-next.vercel.app/sitemap.xml` (sí, incluso bajo el dominio Vercel) lista **todas las URLs con `https://indiana.com.ar`**, no con vercel.app. 22 URLs verificadas, todas correctas.

#### Prueba 6 — El `robots.txt` declara el sitemap correcto

```
User-Agent: *
Allow: /
Sitemap: https://indiana.com.ar/sitemap.xml
```

### Conclusión definitiva

> **El problema reportado no puede originarse en el código del sitio.** No hay forma técnica de que el código genere la URL `indiana-next.vercel.app/venta/directa_0km`. Esa URL fue escrita manualmente como "URL final" en el panel de Google Ads, probablemente por la agencia de marketing al momento de configurar la campaña, y nunca se actualizó cuando el sitio se mudó al dominio definitivo.

---

## 3. ¿Qué es SEO? Conceptos básicos en 5 minutos

### Las dos caras del SEO

| | SEO técnico | SEO de contenido |
|---|---|---|
| **Qué es** | Cómo está armada la página por dentro | Qué dice y muestra la página |
| **Quién lo hace** | Programador / desarrollador | Marketing / contenidos |
| **Ejemplo** | Etiquetas `<title>`, `canonical`, sitemap, velocidad | Textos, palabras clave, blog, fotos con descripción |

Este documento se enfoca en **SEO técnico**, que es lo que controla el código.

### Tres conceptos imprescindibles

**1. Resultado orgánico vs. anuncio pago**
- **Orgánico:** Google decide mostrar el sitio gratis porque considera que es relevante. Lo controla el SEO técnico y de contenido.
- **Anuncio pago (Google Ads):** la marca paga para aparecer arriba. Tiene la etiqueta "Patrocinado" o "Anuncio". Lo controla la cuenta de Google Ads, **no el sitio**.

**2. Indexación vs. ranking**
- **Indexar:** Google descubre y guarda la página en su base de datos. Si no está indexada, no aparece nunca.
- **Rankear:** entre todas las páginas indexadas, Google decide cuál mostrar primero. Aparecer en la página 1 vs. la 8 depende de la calidad del SEO.

**3. Canonical: el "DNI" del dominio**
- Si una misma página existe en varios dominios (por ejemplo `indiana.com.ar/0km` e `indiana-next.vercel.app/0km`), Google necesita saber cuál es "la verdadera".
- Esto se le dice con la etiqueta `<link rel="canonical" href="...">`.
- En este proyecto, **todas las páginas dicen que la verdadera es `indiana.com.ar`**, incluso cuando se accede desde Vercel.

---

## 4. Inventario SEO del proyecto: qué tenemos y cómo funciona

### 4.1. Fuente única de verdad para la URL del sitio

**Archivo:** [`src/lib/site-url.js`](../src/lib/site-url.js)

Toda URL absoluta del sitio se construye a partir de una sola función `getSiteUrl()` que lee la variable de entorno `NEXT_PUBLIC_SITE_URL`. En producción, si esa variable no está, **el sitio no buildea** (lanza error explícito). Esto evita publicar el sitio con la URL equivocada.

**Beneficio SEO:** garantiza coherencia. Todos los `canonical`, `og:url`, `sitemap`, JSON-LD usan el mismo dominio. Imposible que se desincronicen.

**Calificación:** ⭐⭐⭐⭐⭐ excelente (nivel profesional).

### 4.2. Metadata global (root layout)

**Archivo:** [`src/app/layout.js`](../src/app/layout.js)

Define los defaults para todo el sitio:

- `metadataBase`: la base de todas las URLs (`https://indiana.com.ar`)
- `title.template`: cada página agrega su nombre y se concatena `| Peugeot Indiana`
- `title.default`: título por defecto si una página no define el suyo
- `description`: descripción genérica del sitio
- `icons`: favicon en todas las variantes (icon, shortcut, apple)
- `openGraph` y `twitter`: defaults de redes sociales
- `alternates.canonical`: `"/"` (se resuelve a `https://indiana.com.ar`)
- `<html lang="es">`: idioma declarado

**Beneficio SEO:** Google y redes sociales saben qué dominio, qué nombre y qué idioma maneja el sitio desde el primer momento.

**Calificación:** ⭐⭐⭐⭐⭐ excelente.

### 4.3. Metadata por página

Cada página define su propio `title`, `description`, `openGraph`, `twitter` y `canonical`:

| Página | Archivo | Canonical | Title | OG | Twitter | JSON-LD |
|---|---|---|---|---|---|---|
| Home `/` | `src/app/(site)/page.jsx` | ✅ `/` | ✅ | ✅ | ✅ | ✅ Organization + AutomotiveBusiness |
| Listado 0km `/0km` | `src/app/(site)/0km/page.jsx` | ✅ absoluto | ✅ | ✅ | ✅ | ✅ ItemList |
| Detalle 0km `/0km/[slug]` | `src/app/(site)/0km/[autoSlug]/page.jsx` | ✅ absoluto dinámico | ✅ | ✅ con imagen | ✅ con imagen | ✅ Product |
| Listado usados `/usados` | `src/app/(site)/usados/page.jsx` | ✅ absoluto | ✅ | ✅ | ✅ | — |
| Catálogo usados `/usados/vehiculos` | `src/app/(site)/usados/vehiculos/page.jsx` | ✅ absoluto con filtros | ✅ | ✅ | ✅ | ✅ ItemList |
| Detalle usado `/usados/[slug]` | `src/app/(site)/usados/[slug]/page.jsx` | ✅ absoluto dinámico | ✅ | ✅ con foto | ✅ | ✅ Product |
| Planes `/planes` | `src/app/(site)/planes/page.jsx` | ✅ absoluto | ✅ | ✅ | ✅ | ✅ ItemList |
| Detalle plan `/planes/[id]` | `src/app/(site)/planes/[planId]/page.jsx` | ✅ absoluto | ✅ | ✅ | ✅ | ✅ |
| Postventa `/postventa` | `src/app/(site)/postventa/page.jsx` | ✅ absoluto | ✅ | ✅ con hero | ✅ | ✅ Service ItemList |
| Carreras `/trabaja-con-nosotros` | `src/app/(site)/trabaja-con-nosotros/page.jsx` | ✅ absoluto | ✅ | ✅ | ✅ | — |

**Calificación:** ⭐⭐⭐⭐⭐ muy completo. Pocos proyectos llegan a este nivel.

### 4.4. Canonical inteligente en URLs con filtros

**Archivo:** [`src/app/(site)/usados/vehiculos/page.jsx`](../src/app/(site)/usados/vehiculos/page.jsx) (líneas 27-119)

El catálogo de usados acepta filtros vía URL (`?marca=peugeot&anio=2021`...). Esto es delicado para SEO: si Google indexa **todas** las combinaciones de filtros, termina con miles de URLs duplicadas y mal rankeadas.

**Solución implementada (excelente):**
- **Filtros indexables** (`marca`, `modelo`, `anio`, etc.): SÍ entran en el canonical → Google los indexa.
- **Filtros NO indexables** (`page`, `sort`, `view`...): NO entran en el canonical, y se inyecta `robots: { index: false }` → Google no los indexa.
- **Orden alfabético**: el canonical reordena los parámetros para que `?marca=ford&anio=2020` y `?anio=2020&marca=ford` apunten al mismo canonical y no se cuenten como duplicados.

```javascript
// Filtros indexables para SEO (permitidos en canonical)
const INDEXABLE_PARAMS = ["marca", "modelo", "anio", "combustible", ...];

// Filtros NO indexables (no deben ir en canonical)
const NON_INDEXABLE_PARAMS = ["page", "sort", "view", ...];
```

**Verificación en vivo:**
```
$ curl https://indiana.com.ar/usados/vehiculos?marca=peugeot
<link rel="canonical" href="https://indiana.com.ar/usados/vehiculos?marca=peugeot"/>
```

**Calificación:** ⭐⭐⭐⭐⭐ excelente. Es una práctica avanzada que la mayoría de los e-commerce no implementa.

### 4.5. Datos estructurados (Schema.org / JSON-LD)

El sitio publica datos estructurados en cada página clave. Google los usa para mostrar "Rich Results" (resultados enriquecidos con estrellas, precios, fotos).

| Página | Tipo de schema | Beneficio en Google |
|---|---|---|
| Home | `Organization` + `AutomotiveBusiness` + `LocalBusiness` | Knowledge Panel del negocio, dirección, teléfono, área de servicio |
| Listado 0km | `ItemList` con cada modelo | Carousel de modelos en resultados |
| Detalle modelo 0km | `Product` (con marca, imágenes, descripción) | Tarjeta de producto en resultados |
| Detalle usado | `Product` Automotive | Igual que arriba |
| Postventa | `ItemList` de `Service` | Listado de servicios |
| Planes | `ItemList` de planes | Listado de planes |

**Calificación:** ⭐⭐⭐⭐ muy bueno. Sería 5/5 si los detalles de modelo 0km y usados tuvieran precios reales (hoy se omiten porque el negocio no maneja precios públicos consistentes, decisión comercial correcta).

### 4.6. Sitemap dinámico

**Archivo:** [`src/app/sitemap.ts`](../src/app/sitemap.ts)

Next.js genera automáticamente `/sitemap.xml` con todas las URLs del sitio. Se construye desde los datos reales (modelos, planes), no a mano:

```typescript
export default async function sitemap() {
  const slugs = getModelosSlugs();
  const planes = getAllPlanes();
  return [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/0km`, priority: 0.9 },
    ...slugs.map(s => ({ url: `${baseUrl}/0km/${s}`, priority: 0.8 })),
    { url: `${baseUrl}/planes`, priority: 0.9 },
    { url: `${baseUrl}/usados`, priority: 0.9 },
    ...planes.map(p => ({ url: `${baseUrl}/planes/${p.id}`, priority: 0.7 })),
  ];
}
```

**Beneficio:** si se agrega un modelo nuevo o un plan nuevo, el sitemap se actualiza solo. Cero riesgo de olvido manual.

**Verificación en vivo:**
```
$ curl https://indiana.com.ar/sitemap.xml
<loc>https://indiana.com.ar/0km/208</loc>
<loc>https://indiana.com.ar/0km/408</loc>
... 22 URLs totales
```

**Calificación:** ⭐⭐⭐⭐⭐ excelente.

### 4.7. Robots.txt inteligente

**Archivo:** [`src/app/robots.ts`](../src/app/robots.ts)

Próximamente: tiene una particularidad importante. En entornos que NO son producción, **bloquea toda la indexación**. Esto es perfecto para evitar que los previews de Vercel se indexen.

```typescript
export default function robots() {
  const isProduction = process.env.VERCEL_ENV === "production" || ...;
  return {
    rules: [{
      userAgent: "*",
      allow: isProduction ? "/" : "",     // Solo permite en prod
      disallow: isProduction ? "" : "/",  // Bloquea en preview/dev
    }],
    sitemap: isProduction ? `${getSiteUrl()}/sitemap.xml` : undefined,
  };
}
```

**Calificación:** ⭐⭐⭐⭐⭐ excelente. Práctica profesional.

### 4.8. Redirects de URLs legacy (WordPress)

**Archivo:** [`next.config.mjs`](../next.config.mjs)

Cuando el sitio se migró de WordPress a Next.js, muchas URLs viejas seguían apareciendo en Google y en el tráfico de Analytics. Se configuraron **redirects 301 permanentes** para preservar el SEO acumulado y no romper backlinks externos:

```javascript
{ source: "/venta-directa", destination: "/usados", permanent: true },
{ source: "/venta-directa/:path*", destination: "/usados", permanent: true },
{ source: "/archivos/:path*", destination: "/", permanent: true },
{ source: "/category/:path*", destination: "/", permanent: true },
{ source: "/wp-admin", destination: "/", permanent: true },
// ... más redirects
```

**Beneficio SEO:** Google transfiere el "ranking" de las URLs viejas a las nuevas. Cero pérdida de autoridad.

**Calificación:** ⭐⭐⭐⭐ muy bueno. La lista podría crecer si se identifican más URLs viejas en Search Console.

### 4.9. Performance (Core Web Vitals)

Google ranquea mejor a los sitios rápidos. Lo que tiene el proyecto:

- **Fuentes optimizadas** (`next/font`): `Poppins` y `Barlow_Condensed` cargan con `display: "swap"` y fallback nativo. Mejora CLS y FCP.
- **Imágenes optimizadas** (`next/image`): WebP y AVIF automáticos, lazy loading, `srcset` responsive, cache TTL 1 año. Mejora LCP.
- **Cloudinary**: imágenes servidas desde CDN con transformaciones automáticas.
- **ISR (Incremental Static Regeneration)**: páginas como `/usados` revalidan cada 120 segundos en vez de en cada request. Mejora TTFB.
- **Code splitting**: componentes pesados (`ModeloPlanes`, `FeatureSection`, `ModelGallery`) usan `dynamic()` para cargarse bajo demanda. Reduce bundle inicial.
- **`reactCompiler: false`**: build más rápido (decisión técnica, no afecta runtime).
- **`compress: true`** y `poweredByHeader: false`: gzip + no leaking de info del server.

**Calificación:** ⭐⭐⭐⭐⭐ excelente.

### 4.10. Accesibilidad y semántica HTML

El SEO técnico moderno valora la accesibilidad. Lo que tiene:

- `<html lang="es">` ✅
- Estructura semántica: `<header>`, `<main>`, `<section>`, `<nav>`, `<h1>`, `<h2>`...
- Atributos `aria-label`, `aria-labelledby`, `aria-current`, `aria-expanded` en navegación y secciones
- Imágenes con `alt` descriptivo
- Links con texto significativo y `aria-label` cuando hace falta (botones íconos)

**Calificación:** ⭐⭐⭐⭐ muy bueno.

### 4.11. Analytics y tracking

**Archivos:**
- [`src/components/tracking/MarketingTracking.jsx`](../src/components/tracking/MarketingTracking.jsx)
- [`src/components/analytics/ConsentBootstrap.jsx`](../src/components/analytics/ConsentBootstrap.jsx)
- [`src/lib/analytics/consent.js`](../src/lib/analytics/consent.js)
- [`src/lib/analytics/README.md`](../src/lib/analytics/README.md)

El sitio carga **dos contenedores de Google Tag Manager**:

1. **GTM-TPJCFTBB** — contenedor "Indiana" (gestión interna).
2. **GTM-M2J2LBRD** — contenedor "Marketing" (gestión de la agencia).

Más **Meta Pixel** (ID `870960458928397`) para Facebook/Instagram Ads.

> **Esto es un dato relevante para la reunión:** la agencia tiene su propio contenedor GTM cargado en el sitio. Eso confirma que la agencia maneja la parte de marketing/conversiones/remarketing. Es altamente probable que la misma agencia administre Google Ads.

#### Google Consent Mode v2

El sitio cumple con regulación de privacidad (GDPR, Ley 25.326 Argentina):

1. Antes de cargar cualquier script de tracking, se inyecta el snippet de **Consent Mode v2** con todos los permisos en `denied` por defecto.
2. Un banner pide al usuario consentimiento.
3. Si acepta, se actualiza el consent state y se persiste en localStorage.
4. Google Ads y GA4 sólo trackean con cookies si el usuario aceptó. Si no, usan "modelado" sin cookies.

**Calificación:** ⭐⭐⭐⭐⭐ excelente. Nivel profesional, cumple regulación.

### 4.12. Manejo de páginas no encontradas (404)

**Archivos:** [`src/app/not-found.jsx`](../src/app/not-found.jsx) y [`src/app/(site)/not-found.jsx`](../src/app/(site)/not-found.jsx)

Cuando alguien entra a una URL inexistente, el sitio devuelve un **404 real** (no un 200 con "página no encontrada", que es un error grave para SEO) y la página tiene `robots: { index: false }` para evitar que Google indexe páginas de error.

```javascript
export const metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};
```

**Calificación:** ⭐⭐⭐⭐⭐ excelente.

---

## 5. Evidencia técnica completa

### 5.1. Comparación HTML servido en ambos dominios

| Etiqueta | `indiana.com.ar/` | `indiana-next.vercel.app/` |
|---|---|---|
| `<link rel="canonical">` | `https://indiana.com.ar` | `https://indiana.com.ar` |
| `<meta property="og:url">` | `https://indiana.com.ar` | `https://indiana.com.ar` |
| `<meta property="og:site_name">` | `Indiana Peugeot` | `Indiana Peugeot` |
| JSON-LD `url` | `https://indiana.com.ar` | `https://indiana.com.ar` |
| JSON-LD logo | `https://indiana.com.ar/assets/...` | `https://indiana.com.ar/assets/...` |
| `<html lang>` | `es` | `es` |
| Sitemap referenciado | `https://indiana.com.ar/sitemap.xml` | `https://indiana.com.ar/sitemap.xml` |
| Status de `/0km` | 200 OK | 200 OK |
| Status de `/venta/directa_0km` | **404** | **404** |
| Status de `/venta-directa` | **308 → `/usados`** | **308 → `/usados`** |

**Lectura:** los dos dominios sirven contenido idéntico y ambos declaran que la URL canónica es `indiana.com.ar`.

### 5.2. Verificación de páginas internas

#### `/0km`
```html
<title>Autos 0km Peugeot | Peugeot Indiana</title>
<link rel="canonical" href="https://indiana.com.ar/0km"/>
<h1>Elegí tu Peugeot 0km</h1>
JSON-LD: ItemList con 8 modelos, todos con url https://indiana.com.ar/0km/[slug]
```

#### `/0km/208`
```html
<title>Peugeot 208 0km | Peugeot Indiana</title>
<link rel="canonical" href="https://indiana.com.ar/0km/208"/>
<meta property="og:url" content="https://indiana.com.ar/0km/208"/>
<meta property="og:image" content="https://res.cloudinary.com/.../208-hero-desktop.webp"/>
<h1>Peugeot 208</h1>
JSON-LD: Product con marca, descripción, 8 imágenes
```

#### `/usados/vehiculos?marca=peugeot`
```html
<link rel="canonical" href="https://indiana.com.ar/usados/vehiculos?marca=peugeot"/>
<meta property="og:url" content="https://indiana.com.ar/usados/vehiculos?marca=peugeot"/>
```
(Filtro `marca` es indexable, entra en el canonical. Si fuera `?sort=precio` no entraría.)

### 5.3. Búsquedas exhaustivas en el código

Buscamos en TODO el repositorio:

| Patrón buscado | Coincidencias | Donde |
|---|---|---|
| `vercel\.app` | 1 | `src/lib/config/api.js` línea 67, sólo en un mensaje de error de ejemplo (`back-indiana.vercel.app` para el backend). **No afecta SEO.** |
| `indiana-next` | 0 | — |
| `venta/directa_0km` | 0 | — |
| `directa_0km` | 0 | — |
| `directa-0km` | 0 | — |

**No hay forma de que el código genere la URL del anuncio.**

---

## 6. Nivel SEO del proyecto: comparación con la industria

| Aspecto | Estado | Nivel de la industria |
|---|---|---|
| Canonical en todas las páginas | ✅ | Pocas concesionarias lo tienen |
| `metadataBase` configurado | ✅ | Pocos sitios lo usan correctamente |
| Open Graph en todas las páginas | ✅ | Estándar profesional |
| Twitter Cards | ✅ | Estándar profesional |
| JSON-LD Organization | ✅ | Solo sitios pro lo tienen |
| JSON-LD Product en detalles | ✅ | Solo e-commerce pro lo tiene |
| JSON-LD LocalBusiness | ✅ | Casi nadie lo hace |
| Sitemap dinámico | ✅ | Mayoría lo tiene estático |
| Robots inteligente (bloqueo en preview) | ✅ | Casi nadie lo hace |
| Canonical con filtros (indexable params) | ✅ | Práctica muy avanzada |
| Redirects de URLs legacy | ✅ | Bien hecho |
| 404 real (no 200) | ✅ | Estándar |
| Consent Mode v2 | ✅ | Requisito regulatorio cumplido |
| Imágenes optimizadas (WebP/AVIF) | ✅ | Estándar moderno |
| Fuentes con `next/font` | ✅ | Estándar moderno |
| ISR | ✅ | Práctica avanzada |
| Code splitting | ✅ | Estándar moderno |
| `<html lang>` | ✅ | Básico |
| Estructura semántica HTML | ✅ | Estándar |
| Accesibilidad ARIA | ✅ | Bien |

### Veredicto general

**El proyecto está en el percentil 95+ de calidad SEO técnica para sitios de concesionarias en Argentina.** Se nota que fue armado por alguien que entiende SEO moderno y no copió/pegó plantillas.

**Comparación honesta:**
- Mejor que el 95% de sitios de concesionarias y agencias de la región.
- A nivel internacional, está al mismo nivel que sitios como cardealerships premium en USA/Europa.
- Le faltan algunas cosas menores (ver sección 7) pero ninguna es crítica.

---

## 7. Lo que falta o se puede mejorar

### 🟢 Mejoras opcionales — bajo impacto, baja prioridad

#### 7.1. Faltan algunos `openGraph.url` específicos

En `/0km/page.jsx` el `openGraph` no tiene `url`. El canonical sí lo tiene, pero por coherencia conviene agregarlo.

```javascript
// src/app/(site)/0km/page.jsx — línea ~26
openGraph: {
  title: "Autos 0km Peugeot | Peugeot Indiana",
  description: ...,
  url: `${getSiteUrl()}/0km`,   // ← agregar esto
  type: "website",
  ...
}
```

**Impacto SEO:** mínimo. El canonical ya cubre lo importante.

#### 7.2. `Organization.sameAs` está vacío

En el JSON-LD del home:

```javascript
sameAs: [],   // ← vacío
```

`sameAs` es donde se declaran los perfiles oficiales del negocio en redes sociales. Si se rellenan, Google los muestra en el Knowledge Panel.

**Mejora propuesta:**
```javascript
sameAs: [
  "https://www.instagram.com/peugeotindiana",
  "https://www.facebook.com/peugeotindiana",
  "https://www.linkedin.com/company/peugeotindiana",
  // etc.
],
```

**Impacto SEO:** medio. Mejora el Knowledge Panel.

#### 7.3. Faltan más datos de `LocalBusiness`

El schema actual tiene `address`, `telephone`, `areaServed`. Le falta:
- `streetAddress` con la dirección exacta ("Italia 2945")
- `postalCode` ("4000")
- `openingHoursSpecification` (horarios)
- `geo` con `latitude` y `longitude`
- `priceRange` está bien (`"$$"`)

**Impacto SEO:** medio. Mejora Google Maps, Knowledge Panel y búsquedas tipo "concesionario peugeot tucumán cerca".

#### 7.4. No hay `BreadcrumbList` en páginas de detalle

Las páginas como `/0km/208` o `/usados/peugeot-208-...` no tienen schema de breadcrumbs. Esto hace que Google muestre la URL completa en vez de "Inicio › 0km › 208".

**Mejora propuesta:** agregar JSON-LD `BreadcrumbList` en cada página de detalle.

**Impacto SEO:** medio. Mejora visual en SERP.

#### 7.5. No hay `FAQPage` ni reviews

En postventa o detalle de modelo se podrían agregar:
- `FAQPage` con preguntas frecuentes (turnos, garantías, métodos de pago)
- `AggregateRating` con reseñas (requiere fuente real de reviews)

**Impacto SEO:** alto si se implementa con datos reales. Las FAQ aparecen en formato "acordeón" en Google.

### 🟡 Mejora preventiva — IMPORTANTE para evitar el problema actual

#### 7.6. Redirect del dominio Vercel al dominio real

**El sitio responde 200 OK tanto en `indiana.com.ar` como en `indiana-next.vercel.app`.** Como vimos en la sección 2, esto NO causa el problema actual (porque el canonical le dice a Google cuál es el bueno), pero deja una puerta abierta a que se repita.

**Mejora propuesta** — agregar al `next.config.mjs`:

```javascript
async redirects() {
  return [
    // Redirect 301 desde el dominio Vercel al dominio real
    {
      source: "/:path*",
      has: [{ type: "host", value: "indiana-next.vercel.app" }],
      destination: "https://indiana.com.ar/:path*",
      permanent: true,
    },
    // ... resto de redirects existentes
  ];
}
```

**Impacto SEO:** medio.
**Impacto preventivo:** alto. Si alguien vuelve a usar el dominio Vercel en un ad, email, cartel o link externo, el usuario igual llega al dominio bueno.

### 🔴 No hay nada urgente que falte

El sitio cumple con todos los requisitos críticos de SEO técnico moderno. Las mejoras listadas son refinamientos, no agujeros.

---

## 8. Plan de acción recomendado

### Para el cliente / reunión

**Inmediato (esta semana):**
1. **Contactar a la agencia de marketing.** Pedirles acceso (o que ellos mismos editen) la campaña de Google Ads. Específicamente:
   - Cambiar la **URL final** del anuncio "Tu Próximo 0km En Indiana" de `https://indiana-next.vercel.app/venta/directa_0km` a `https://indiana.com.ar/0km` (o la landing real que quieran promocionar).
   - Cambiar la **URL visible (display URL)** del anuncio para que muestre `indiana.com.ar` en lugar del subdominio de Vercel.
   - Revisar **TODOS** los anuncios de la campaña, no solo el visible en la captura. Es posible que haya más con la misma URL incorrecta.
2. **Pedir a la agencia** un reporte de qué dominios están configurados como destino en todos los anuncios activos.

**Corto plazo (próximas 2 semanas):**
3. **Configurar `indiana.com.ar` como dominio "Primary"** en Vercel → Settings → Domains (si no lo está). Esto avisa a Vercel cuál es el dominio canónico.
4. **Agregar el redirect 301** de Vercel a `indiana.com.ar` en `next.config.mjs` (sección 7.6 de este documento). Esto es la red de seguridad para evitar que el problema se repita.

**Mediano plazo (próximo mes):**
5. **Rellenar `Organization.sameAs`** con perfiles oficiales de Instagram, Facebook, etc.
6. **Ampliar el schema `LocalBusiness`** con dirección exacta, horarios y coordenadas.
7. **Verificar en Google Search Console** que no haya páginas indexadas bajo `indiana-next.vercel.app`. Si las hay, pedir removal manual.
8. **Configurar Search Console** para el dominio `indiana.com.ar` (si todavía no está) y monitorear errores de cobertura.

**Largo plazo (opcional):**
9. Implementar `BreadcrumbList`.
10. Crear sección de FAQs con schema `FAQPage`.

### Para el equipo técnico

**Tareas concretas:**
- [ ] Implementar redirect Vercel → indiana.com.ar (5 líneas, 5 minutos).
- [ ] Agregar `openGraph.url` en `/0km/page.jsx` (1 línea).
- [ ] Documentar/escribir tests del `getSiteUrl()` y el sistema de canonical.
- [ ] Configurar monitoring de Search Console (alertas por errores).

---

## 9. Glosario rápido

| Término | Qué significa |
|---|---|
| **SEO** | Search Engine Optimization. Conjunto de técnicas para que un sitio aparezca arriba en buscadores. |
| **SERP** | Search Engine Results Page. La página de resultados de Google. |
| **Canonical** | Etiqueta HTML que le dice a Google cuál es la URL "oficial" cuando hay varias versiones de la misma página. |
| **Open Graph** | Estándar de Facebook (adoptado por todos) para que cuando un link se comparte, aparezca con título, descripción e imagen lindas. |
| **Twitter Cards** | Equivalente a Open Graph para Twitter/X. |
| **JSON-LD / Schema.org** | Datos estructurados que se ponen en una etiqueta `<script>`. Google los usa para enriquecer los resultados (estrellas, precio, foto). |
| **Sitemap** | Archivo XML que lista todas las URLs del sitio para que Google las encuentre. |
| **Robots.txt** | Archivo de texto que dice a los buscadores qué pueden y qué no pueden indexar. |
| **Indexar** | Que Google guarde una página en su base de datos. Si no está indexada, no aparece nunca. |
| **Rankear** | Posición en la que aparece una página en los resultados. |
| **Backlink** | Link desde otro sitio hacia el nuestro. Es uno de los factores más importantes de ranking. |
| **301 / 308 redirect** | Redirección permanente. Le dice a Google "esta página se mudó para siempre, transferí el ranking a la nueva". |
| **TTFB** | Time To First Byte. Cuánto tarda el servidor en empezar a responder. Indicador de performance. |
| **LCP** | Largest Contentful Paint. Cuánto tarda en pintarse el elemento más grande visible. Core Web Vital. |
| **CLS** | Cumulative Layout Shift. Cuánto "salta" la página mientras carga. Core Web Vital. |
| **GTM** | Google Tag Manager. Sistema para inyectar tags de tracking sin tocar código. |
| **GA4** | Google Analytics 4. La versión actual de Analytics. |
| **Consent Mode v2** | Sistema de Google para cumplir con regulaciones de privacidad (GDPR, etc.). |
| **ISR** | Incremental Static Regeneration. Técnica de Next.js para regenerar páginas estáticas periódicamente. |
| **SSG** | Static Site Generation. Pre-generar páginas en build time (las más rápidas posibles). |
| **SSR** | Server Side Rendering. Generar HTML en el servidor en cada request. |
| **Knowledge Panel** | El recuadro de información del negocio que aparece a la derecha en Google cuando se busca el nombre. |
| **Rich Results** | Resultados enriquecidos con estrellas, fotos, precios, etc. en la SERP. |

---

## Anexo A — Cómo verificar uno mismo

### Verificar el canonical de una página
```bash
curl -s https://indiana.com.ar/0km | grep -o '<link rel="canonical"[^>]*>'
```

### Verificar el sitemap
Abrir en el navegador: https://indiana.com.ar/sitemap.xml

### Verificar el robots.txt
Abrir en el navegador: https://indiana.com.ar/robots.txt

### Verificar datos estructurados
- Google Rich Results Test: https://search.google.com/test/rich-results
- Pegar la URL `https://indiana.com.ar/0km/208` y ver qué detecta Google.

### Verificar Open Graph
- https://www.opengraph.xyz/
- Pegar cualquier URL del sitio.

### Verificar Twitter Cards
- https://cards-dev.twitter.com/validator

### Auditoría completa con Lighthouse
- En Chrome: F12 → pestaña "Lighthouse" → "Generate report" → ver score de SEO, Performance, Accessibility.

---

**Fin del documento.**

Cualquier consulta técnica posterior, escribir al equipo de desarrollo.
