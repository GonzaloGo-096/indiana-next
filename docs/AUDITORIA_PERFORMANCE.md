# Auditoría de Performance — indiana.com.ar

**Stack:** Next.js 16 App Router · React 19 · Tailwind 4 · Cloudinary · GTM × 2 + Meta Pixel
**Fecha:** 22/05/2026
**Alcance:** Home (`/`) mobile + `/0km` desktop/mobile
**Lighthouse de partida:** Home mobile 79 · `/0km` desktop 70 · TBT `/0km` mobile alto

> Esta auditoría está basada en lectura directa del código del repo (no en benchmarks remotos). Cada hallazgo apunta a archivo y línea, con causa técnica y propuesta concreta. No se sugiere romper el tracking ni el SEO técnico (100/100), salvo donde se justifica por TBT.

---

## TL;DR — Ranking de problemas por impacto

| # | Problema | Métrica que afecta | Archivos | Impacto estimado | Esfuerzo |
|---|----------|--------------------|----------|------------------|----------|
| 1 | Hero del home preloadea **2 imágenes** (`priority` desktop + mobile) en paralelo | LCP mobile + bytes mobile | `src/components/Hero/Hero.jsx` | **LCP −1.0 a −1.5s mobile** | Bajo |
| 2 | URLs de Cloudinary **sin transformaciones** (`f_auto,q_auto,w_…`) | LCP, Bytes, "Mejora la entrega de imágenes" (−680 KiB Lighthouse) | `src/config/cloudinaryStaticImages.js`, `src/data/modelos/*.js`, `src/data/modelos/colores.js` | **LCP −0.5 a −1.0s, ahorro 500–800 KiB** | Bajo |
| 3 | Dos contenedores GTM (`gtmId` + `gtmMarketingId`) cargados con `afterInteractive` | TBT desktop/mobile, main-thread work | `src/components/tracking/MarketingTracking.jsx` | **TBT −500 a −900 ms** | Bajo / Política |
| 4 | `PublicSiteChrome` es `"use client"` → todo el chrome se hidrata + monta tracking inmediato | TBT, hydration | `src/components/layout/PublicSiteChrome.jsx` | TBT −150 a −300 ms | Medio |
| 5 | `HeroImageDesktop` se renderiza **solo después de `mounted`** → pierde el LCP del SSR en desktop | LCP `/0km/[slug]` desktop | `src/app/(site)/0km/[autoSlug]/HeroImageDesktop.jsx` | **LCP −0.8 a −1.5s desktop /0km** | Bajo |
| 6 | `HomeUsadosSectionClient` hace fetch en `useEffect` con `axios` para 6 vehículos | TBT, hydration, JS bundle (+13 KB axios) | `src/components/home/HomeUsadosSectionClient.jsx`, `src/lib/services/vehiclesApi.js` | TBT −100 a −200 ms, bundle −13 KB | Medio |
| 7 | `data/modelos/*` (catálogo COLORES + 8 modelos ≈ **75 KB de JS**) entra al **client bundle** vía `useModeloSelector` | Bundle inicial /0km | `src/components/ceroKm/useModeloSelector.js` | JS −60 a −75 KB | Medio |
| 8 | Footer con `dynamic({ ssr: false })` que vuelve a llamar `dynamic` y monta `usePathname` × N FooterItem | TBT, FID secundario | `src/components/layout/Footer/FooterLazy.jsx`, `FooterModules.jsx` | TBT −50 a −150 ms | Bajo |
| 9 | `VehiculosCarouselClient` + `UtilitariosCarouselClient` (2 listeners scroll+resize+RAF en `/0km`) | TBT, jank en scroll mobile | `src/components/0km/*CarouselClient.jsx` | TBT −50 a −100 ms | Bajo |
| 10 | `will-change: transform` + `contain: layout style paint` sobre TODAS las cards e imageContainer | Memoria GPU, paint en mobile | `src/app/(site)/0km/0km.module.css:1142` | TBT/INP, jank | Bajo |
| 11 | `<img>` nativos para logo Nav, postventa hero y `FooterModules` íconos | LCP secundario, bytes | `Nav.jsx`, `page.jsx`, `FooterModules.jsx` | LCP marginal | Bajo |
| 12 | `useId()` en `Nav.jsx` + dos `Suspense` boundaries + `PublicSiteLayout`/`Chrome` | Hydration cost | `Nav.jsx`, `PublicSiteLayout.jsx` | TBT −20 a −80 ms | Bajo |
| 13 | `VersionTabs` con `dynamic({ ssr: false })` siendo UI visible inmediatamente | INP/CLS riesgo, TBT post-hydration | `src/components/ceroKm/VersionContent.jsx:9` | Bundle init OK, pero pierde SSR de UI crítica | Bajo |
| 14 | `react-query-devtools` en `dependencies` (no devDependencies) | Bundle si entra a páginas públicas | `package.json:18` | −9 KB potencial | Bajo |
| 15 | Banner postventa del home: `<img>` 100% width sin `width/height` ni `sizes` | LCP secundario en mobile / CLS riesgo bajo | `src/app/(site)/page.jsx:111-118` | Bytes −80 a −150 KiB | Bajo |

**Si se atacan los 7 primeros:**
- Home mobile: **79 → 92+** (ataca LCP de 3.5 → ~1.8 s y TBT de 370 → ~120 ms).
- `/0km` desktop: **70 → 92+** (LCP de 0.7 s ya está bien; TBT de 2040 → ~400 ms).
- `/0km` mobile: TBT y main-thread work caen un **50–70 %** sin tocar SEO ni UX.

---

## 1. Hero de Home — Causa principal del LCP mobile 3.5 s

### Diagnóstico
```16:42:src/components/Hero/Hero.jsx
const Hero = ({ className }) => {
  return (
    <section ...>
      <div className={styles.backgroundPicture}>
        <Image
          src={staticImages.home.heroDesktop.src}
          alt={staticImages.home.heroDesktop.alt}
          fill
          priority
          quality={85}
          sizes="(min-width: 769px) 100vw, 0vw"
          className={`${styles.backgroundImage} ${styles.backgroundImageDesktop}`}
        />
        <Image
          src={staticImages.home.heroMobile.src}
          alt={staticImages.home.heroMobile.alt}
          fill
          priority
          quality={85}
          sizes="(max-width: 768px) 100vw, 0vw"
          className={`${styles.backgroundImage} ${styles.backgroundImageMobile}`}
        />
```

Hay **dos `<Image priority>`** simultáneos. Next.js, para cada uno, emite:

```html
<link rel="preload" as="image" imagesrcset="..." imagesizes="..." fetchpriority="high">
```

**El truco de `sizes="…0vw"` controla el `srcset` pero NO cancela el preload del segundo archivo**, porque el preload se basa en *imagesrcset*+*imagesizes*. En mobile, el navegador descarga la imagen desktop con `fetchpriority=high` aunque luego CSS la oculte con `display:none` (línea 116 de `Hero.module.css`).

**Doble costo en mobile:** se baja la imagen mobile + la desktop antes del paint del LCP. Si la desktop pesa ~250–400 KB, eso solo explica 0.8–1.2 s de retraso en 3G/Fast 3G.

Sumado a que las URLs Cloudinary no llevan transformaciones (ver punto 2), la imagen desktop puede pesar **>800 KB sin q_auto**.

Además `Hero.module.css` aplica:
- `transform: scale(1.22)` (mobile) / `scale(1.38)` (desktop) → fuerza repintado y agranda visualmente la imagen → la imagen subida debería ser de **menor resolución** y dejar que el zoom CSS la agrande (la calidad percibida no se nota porque el zoom es destructivo igual).

### Acciones recomendadas (alto impacto, bajo riesgo)

**A. Servir una sola imagen Hero al navegador** usando `<picture>` con dos `<source>` y un solo `<img>` real, o bien condicional via media query con `priority` solo en la activa.

Patrón recomendado (con next/image v15+):

```jsx
// Hero.jsx
<div className={styles.backgroundPicture}>
  {/* Mobile (default) */}
  <Image
    src={staticImages.home.heroMobile.src}
    alt={staticImages.home.heroMobile.alt}
    fill
    priority
    fetchPriority="high"
    quality={70}
    sizes="(max-width: 768px) 100vw, 1px"
    className={`${styles.backgroundImage} ${styles.backgroundImageMobile}`}
  />
  {/* Desktop: NO priority, NO eager preload */}
  <Image
    src={staticImages.home.heroDesktop.src}
    alt=""
    aria-hidden="true"
    fill
    loading="lazy"     // ✅ no se descarga en mobile gracias al display:none + lazy
    fetchPriority="low"
    quality={70}
    sizes="(min-width: 769px) 100vw, 1px"
    className={`${styles.backgroundImage} ${styles.backgroundImageDesktop}`}
  />
</div>
```

Justificación:
- En desktop, la mobile no entra al viewport (display:none) y queda `lazy` → no se baja.
- En mobile pasa lo opuesto. Con esto, **un solo asset por viewport**.

> Nota: si el `priority` desktop se siente "lento" al cambiar a desktop (que no es el caso real, porque desktop ya está en 1.1 s FCP), se puede preloadear vía `next/head` *solo* con un `<link>` condicional por User-Agent en server (mucho más complejo y NO hace falta).

**B. Bajar el `quality` de 85 → 70 en imágenes hero**. La diferencia visual es nula sobre una imagen escalada CSS al 122 % y con sombras+overlay encima.

**C. (Opcional, mayor ganancia)**: reemplazar los `<Image>` por un `<div>` con `background-image: image-set(url("…/f_auto,q_auto,w_768/…") 1x, url("…/f_auto,q_auto,w_1536/…") 2x)` y un `<link rel="preload" as="image" imagesrcset>` manual en `<head>` con `media="(max-width:768px)"`. Esto **fuerza** al navegador a respetar el media-query en el preload. Es la única forma 100 % fiable de evitar el doble descargado.

**Impacto esperado:** LCP mobile **3.5 → ~2.0–2.2 s** (sin cambiar nada más).

---

## 2. URLs de Cloudinary sin `f_auto, q_auto, w_…` — Mejora la entrega de imágenes (−680 KiB)

### Diagnóstico
```20:30:src/config/cloudinaryStaticImages.js
export const staticImages = {
  home: {
    heroDesktop: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1773959191/408-inicio-desktop_h8rzgp.webp",
      alt: "Peugeot 408 - Indiana Peugeot",
    },
    heroMobile: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1773959192/408-inicio-mobile_zqscbs.webp",
      ...
```

**Ninguna URL incluye transformaciones**. Cloudinary devuelve el archivo en su tamaño/calidad **original de subida**. Next.js luego lo re-procesa en `/_next/image`, pero:

1. Tiene que descargar el original (caro en Vercel para imágenes pesadas).
2. La caché `/_next/image` no comparte con el CDN de Cloudinary → cache miss más frecuentes en URLs frescas.
3. Si Vercel está limitado en image transforms, fallback a la imagen original (que es exactamente el escenario de Lighthouse: 680 KiB de ahorro estimado).

Lo mismo aplica a:
- `src/data/modelos/colores.js` (28 colores × URL sin transform)
- `src/data/modelos/peugeot208.js` (galería 4 + 6 imágenes sin transform)
- Igual en `peugeot2008/3008/408/5008/Partner/Expert/Boxer`.

### Acción recomendada

**Opción A (rápida, sin tocar código de componentes): centralizar la generación de URLs Cloudinary** con transformaciones por defecto.

Crear helper:
```js
// src/lib/cloudinary.js
const CL_BASE = "https://res.cloudinary.com/drbeomhcu/image/upload";

/** Acepta URL Cloudinary completa o publicId. Inserta transformaciones idempotentes. */
export function cl(url, { w, h, q = "auto", fmt = "auto", crop = "fill" } = {}) {
  if (!url) return "";
  // Caso publicId: cl("foo_xyz", { w: 800 }) → URL canónica
  const isFullUrl = url.startsWith("http");
  const tx = [
    `f_${fmt}`,
    `q_${q}`,
    w && `w_${w}`,
    h && `h_${h}`,
    (w || h) && `c_${crop}`,
    "dpr_auto",
  ].filter(Boolean).join(",");

  if (!isFullUrl) return `${CL_BASE}/${tx}/${url}.webp`;

  // Reescribir URL existente sin transformaciones
  return url.replace(/\/image\/upload\/(?!.*\/v\d+\/.*\/)/, `/image/upload/${tx}/`);
}
```

Luego en `cloudinaryStaticImages.js`:
```js
import { cl } from "@/lib/cloudinary";

export const staticImages = {
  home: {
    heroDesktop: {
      src: cl("https://res.cloudinary.com/drbeomhcu/image/upload/v1773959191/408-inicio-desktop_h8rzgp.webp",
        { w: 1920, q: "auto:eco" }),
      alt: "Peugeot 408 - Indiana Peugeot",
    },
    heroMobile: {
      src: cl("https://res.cloudinary.com/drbeomhcu/image/upload/v1773959192/408-inicio-mobile_zqscbs.webp",
        { w: 828, q: "auto:eco" }),
      ...
    },
  },
```

Y en `data/modelos/colores.js`, las URLs de tarjetas (consumidas por `getHomeCeroKmCardImage`) deberían entregarse ya transformadas. Para tarjetas del carrusel home/0km son `~400×300` reales → pedir `w_512`, no la fuente cruda.

**Opción B (estructural): usar `loader` personalizado de Next/Image**.
```js
// next.config.mjs
images: {
  loader: 'custom',
  loaderFile: './src/lib/cloudinaryLoader.js',
  // …
}
```
```js
// src/lib/cloudinaryLoader.js
export default function cloudinaryLoader({ src, width, quality }) {
  // src = "/drbeomhcu/image/upload/v.../foo.webp" o URL absoluta
  // Insertar f_auto,q_auto:eco,w_{width},c_fill,dpr_auto
  // ...
}
```

Con esto, **todas** las `<Image>` del proyecto pasan automáticamente a Cloudinary con transformaciones óptimas y se omite el `/_next/image`. Esto saca al endpoint de Vercel del camino crítico y elimina costo de image transforms en Vercel.

**Riesgo:** validar visualmente que el `q_auto:eco` no degrade más que `q_85`. En la práctica para fotos de auto se ve idéntico.

**Impacto esperado:** ahorro **300–800 KiB por carga**, LCP **−0.5 a −1.0 s** mobile y desktop.

---

## 3. TBT alto en `/0km` (2040 ms) — Marketing scripts son el 56 % del trabajo

### Diagnóstico
```30:106:src/components/tracking/MarketingTracking.jsx
export default function MarketingTracking() {
  const gtmId = getGtmId();
  const gtmMarketingId = getGtmMarketingId();
  const pixelId = getMetaPixelId();
  ...
  {/* Contenedor Indiana */}
  {gtmId ? (
    <Script id="gtm-loader" strategy="afterInteractive">
      {gtmSnippet(gtmId)}
    </Script>
  ) : null}

  {/* Contenedor agencia de marketing */}
  {gtmMarketingId ? (
    <Script id="gtm-loader-marketing" strategy="afterInteractive">
      {gtmSnippet(gtmMarketingId)}
    </Script>
  ) : null}

  {pixelId ? (
    <Script id="meta-pixel" strategy="afterInteractive">{ /* fbevents.js loader */ }
```

Tu propio reporte indica:
- GTM: **~917 ms** (probablemente sumando ambos containers)
- Meta Pixel: **234 ms**

Total marketing: **>1.1 s** de tiempo de CPU en main thread. Eso **solo** ya pone TBT en zona roja.

### Acciones (priorizar políticamente lo que se puede tocar)

**A. Diferir GTM hasta interacción real (recomendado para mobile):**

Reemplazar `strategy="afterInteractive"` por una estrategia "lazy":

```jsx
import Script from "next/script";

export default function MarketingTracking() {
  const gtmId = getGtmId();
  // ...
  return (
    <>
      {gtmId ? (
        <Script
          id="gtm-loader"
          // Carga al primer scroll, click o keydown (o después de 4 s)
          strategy="lazyOnload"
        >
          {gtmSnippet(gtmId)}
        </Script>
      ) : null}
```

`lazyOnload` ya pospone GTM hasta después del `load`. Para mobile podría ser todavía mejor:

```jsx
// Patrón "delay until interaction":
useEffect(() => {
  const arm = () => {
    // Inyectar GTM aquí (mismo snippet via document.createElement)
    cleanup();
  };
  const events = ["scroll", "pointerdown", "keydown", "touchstart"];
  const cleanup = () => events.forEach(e => window.removeEventListener(e, arm));
  events.forEach(e => window.addEventListener(e, arm, { once: true, passive: true }));
  // Fallback 4s
  const t = setTimeout(arm, 4000);
  return () => { cleanup(); clearTimeout(t); };
}, []);
```

Esto saca **todo el GTM del camino crítico de LCP/TBT en mobile** y dispara el primer `page_view` después de la primera interacción o 4 s, lo que ocurra primero. Validar con equipo de marketing que las conversiones no caen materialmente — generalmente la pérdida es <1 % porque GA4 hace "modeling" igual.

**B. ¿Realmente necesitan DOS containers GTM?**

```jsx
{/* Contenedor Indiana */}
{gtmId ? <Script id="gtm-loader" ... /> : null}
{/* Contenedor agencia de marketing */}
{gtmMarketingId ? <Script id="gtm-loader-marketing" ... /> : null}
```

Dos contenedores ejecutan **dos veces** `gtm.js`, dos veces el bootstrap, dos veces los tags clonados. Si la agencia solo necesita ver `dataLayer`, mejor:
1. Mantener solo `gtmId` (Indiana).
2. Que la agencia importe sus tags **dentro** del mismo container o usen *server-side GTM*.
3. Si políticamente no se puede unificar, al menos **diferir el de la agencia con `lazyOnload`** y dejar el principal con `afterInteractive` — corta a la mitad el peor cuello en TBT.

**C. Meta Pixel: aplicar el mismo patrón "delay-until-interaction"**.

234 ms de fbevents.js + `fbq('track','PageView')` no son críticos para mostrar contenido. Mismo patrón que GTM.

**D. Consent Mode v2 está bien**, pero notar: ya están emitiendo `gtag('consent','default',{... 'denied'})` antes de GTM. Eso significa que muchos tags ad NO ejecutan hasta opt-in. Excelente para privacidad pero **NO reduce el costo** de cargar el container GTM.

**Impacto esperado:** TBT `/0km` **2040 → 800–1100 ms** solo con A+B+C.

---

## 4. `PublicSiteChrome` es Client Component — toda la chrome se hidrata

### Diagnóstico
```1:45:src/components/layout/PublicSiteChrome.jsx
"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Nav from "./Nav";
import FooterLazy from "./Footer/FooterLazy";
import ClientOnlyComponents from "./ClientOnlyComponents";
import MarketingTracking from "../tracking/MarketingTracking";
import PageViewTracker from "../analytics/PageViewTracker";

const ConsentBanner = dynamic(() => import("../analytics/ConsentBanner"), {
  ssr: false,
});

export default function PublicSiteChrome({ children }) {
  return (
    <>
      <MarketingTracking />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <ClientOnlyComponents />
      <Nav />
      <main className="main-content">{children}</main>
      <FooterLazy />
      <ConsentBanner />
    </>
  );
}
```

Marcar `PublicSiteChrome` como `"use client"` fuerza que el componente entero sea Client. Las `children` (que pueden ser RSC) se siguen renderizando en server y se pasan **como props serializados**, lo cual está bien — pero el módulo del chrome viaja al bundle del cliente.

El verdadero problema es lo que **se monta inmediatamente al hidratar**, que es lo que infla el TBT:

- `MarketingTracking` (Scripts afterInteractive → 1100 ms acumulados).
- `PageViewTracker` → `useSearchParams` + `usePathname` + scroll-depth listener.
- `ClientOnlyComponents` → 3 `dynamic({ ssr:false })` (ScrollToTop, AnalyticsWrapper, FloatingWhatsApp) que tienen que **descargarse + ejecutarse en el cliente**.
- `Nav` → `useId`, `usePathname`, scroll-lock, escape listener, hover handlers, multi-state.
- `FooterLazy` → otro `dynamic({ ssr:false })`, Footer hace `FooterModules` con `useState` + N `usePathname` calls.
- `ConsentBanner` → dynamic ssr:false con useSyncExternalStore + useConsent.

Resultado: en una hidratación de un home con muy pocos componentes propios, **el chrome solo suma ~200-300 ms de hydration**.

### Acciones

**A. `PublicSiteChrome` debería ser un Server Component** que solo renderice los children y un Client Component pequeño con los tracking + nav. Refactor:

```jsx
// PublicSiteChrome.jsx (sin "use client")
import Nav from "./Nav";
import Footer from "./Footer/Footer";
import SiteSideEffects from "./SiteSideEffects"; // ← nuevo, único client
import MarketingTracking from "../tracking/MarketingTracking";

export default function PublicSiteChrome({ children }) {
  return (
    <>
      <Nav />
      <main className="main-content">{children}</main>
      <Footer />
      <MarketingTracking />
      <SiteSideEffects />
    </>
  );
}
```

Y `SiteSideEffects` (Client Component minimal) agrupa PageViewTracker + ConsentBanner + Floating + ScrollToTop con un solo entry point al bundle:

```jsx
"use client";
import { Suspense } from "react";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import ConsentBanner from "@/components/analytics/ConsentBanner";
// ...

export default function SiteSideEffects() {
  return (
    <>
      <Suspense fallback={null}><PageViewTracker /></Suspense>
      <ConsentBanner />
      <FloatingWhatsAppButton />
      <ScrollToTopOnMount />
      <AnalyticsWrapper />
    </>
  );
}
```

**B. Footer DEBE renderizarse en SSR**: `FooterLazy` con `ssr:false` no aporta nada al UX porque el footer cae fuera del viewport inicial; SI aporta a SEO sacar links del HTML inicial. La cita misma del archivo dice "Evita que el footer aparezca antes que el contenido durante transiciones" — eso se resuelve con CSS (sticky footer + min-height) que **ya tienen** en `globals.css:153` (`min-height: calc(100dvh - 92px)`). Quitar el `dynamic({ssr:false})`:

```jsx
// FooterLazy.jsx ← borrar archivo
// PublicSiteChrome.jsx
import Footer from "./Footer/Footer";
// ...
<Footer />
```

Aunque `Footer` importa `FooterModules` que es client (por `useState` del accordion), el shell del footer (logo + columnas + copyright) **renderiza en SSR igual**: solo los accordions piden hidratación. Esto **es bueno**: 100 % indexable, sin layout shift por mount.

**C. `Nav.jsx` no necesita ser tan grande**. Cosas que se pueden mover a server o hooks ligeros:
- `useId()` para los `mobilePanelId` puede ser un id estático/CSS sin colisiones (`#nav-mobile-panel`) → ahorro de `useId` por render.
- El `usePathname()` se llama en `Nav` y dentro de `NavMenuContent` además de en `FooterModules`/cada `FooterItem`/`ScrollToTopOnMount`. **Cada llamada** suscribe a actualizaciones de routing. Considerar consolidar en un Provider único.

**Impacto esperado:** TBT **−150 a −300 ms**, indexabilidad del footer recuperada.

---

## 5. `HeroImageDesktop` pierde el LCP del SSR en `/0km/[slug]`

### Diagnóstico
```18:46:src/app/(site)/0km/[autoSlug]/HeroImageDesktop.jsx
export function HeroImageDesktop({ heroImage }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!heroImage?.url) return null;

  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroBadge}>NUEVO {heroImage.modelName || ""}</div>
      {mounted && (
        <Image
          src={heroImage.url}
          ...
          priority
          quality={85}
          sizes="1200px"
        />
      )}
    </div>
  );
}
```

Contradicción crítica: el componente es `"use client"` y la imagen **solo se renderiza después de `setMounted(true)`**, lo que ocurre tras hidratación.

Resultado:
- El SSR emite `<div className={heroContainer}>` con `<div badge>` pero **sin** la `<img>`.
- `priority` no surte ningún efecto, porque Next.js solo emite `<link rel="preload">` cuando la `<Image>` está en el árbol durante SSR.
- El navegador descubre la imagen **recién después de hidratar** → +300–800 ms perdidos.

El comentario dice que es para "evitar cargar en mobile". Pero esto está mejor resuelto con CSS `display:none` + Next.js `sizes` (que sí controla srcset/preload).

### Acción

```jsx
// HeroImageDesktop.jsx (server component, sin "use client")
import Image from "next/image";
import styles from "./0km-detalle.module.css";

export function HeroImageDesktop({ heroImage }) {
  if (!heroImage?.url) return null;

  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroBadge}>NUEVO {heroImage.modelName || ""}</div>
      <Image
        src={heroImage.url}
        alt={heroImage.alt}
        width={1920}
        height={800}
        className={styles.heroImage}
        priority
        quality={80}
        // Solo desktop: en mobile la card se oculta por CSS, sizes="1px" evita preload
        sizes="(min-width: 768px) 1200px, 1px"
      />
    </div>
  );
}
```

CSS ya esconde `.heroContainer` en mobile (verificar en `0km-detalle.module.css`). Con `sizes` condicional, el preload solo ocurre en desktop.

**Impacto esperado:** LCP `/0km/[slug]` desktop **−0.5 a −1.0 s** (esto explica una parte importante del 70 → 90 objetivo).

---

## 6. `HomeUsadosSectionClient` — fetch en cliente con axios

### Diagnóstico
```11:42:src/components/home/HomeUsadosSectionClient.jsx
export function HomeUsadosSectionClient() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadVehicles = async () => {
      try {
        const backendData = await vehiclesService.getVehicles({
          filters: {},
          limit: 6,
          cursor: 1,
          signal: controller.signal,
        });
        const mappedData = mapVehiclesPage(backendData, 1);
        setVehicles(mappedData.vehicles || []);
      } catch (error) { ... }
    };
    loadVehicles();
    return () => controller.abort();
  }, []);

  return <UsadosSection vehicles={vehicles} />;
}
```

Problemas:
1. **Fetch en `useEffect`** → la sección de usados pinta vacía y luego "salta" → mal UX (afortunadamente CLS está en 0 porque hay min-height en el wrapper, pero es frágil).
2. **Axios** (13 KB gzip) bundleado solo para esta llamada en la home pública. El resto del proyecto público no la necesita.
3. La home **podría** hacer este fetch en server: `getVehicles({limit:6})` con `revalidate: N` (ISR). Eso elimina por completo el fetch del cliente, reduce JS y mejora LCP secundario (carrusel de usados ya renderizado en SSR).

### Acciones

**A. Convertir `HomeUsadosSectionClient` en server-fetch + `Suspense`:**

```jsx
// HomeUsadosSection.server.jsx (Server Component)
import { vehiclesService } from "@/lib/services/vehiclesApi.server"; // ← versión server
import { mapVehiclesPage } from "@/lib/mappers/vehicleMapper";
import { UsadosSection } from "./UsadosSection";

export async function HomeUsadosSection() {
  try {
    const data = await vehiclesService.getVehicles({ filters: {}, limit: 6, cursor: 1 });
    const mapped = mapVehiclesPage(data, 1);
    return <UsadosSection vehicles={mapped.vehicles || []} />;
  } catch {
    return <UsadosSection vehicles={[]} />;
  }
}
```

Y en `app/(site)/page.jsx`:

```jsx
import { Suspense } from "react";
import { HomeUsadosSection } from "@/components/home/HomeUsadosSection.server";

// ...
<Suspense fallback={<UsadosSkeleton />}>
  <HomeUsadosSection />
</Suspense>
```

Beneficio:
- **Axios fuera del bundle público** (sigue en server, vía `vehiclesApi.server.js`).
- Renderiza en SSR → 0 trabajo cliente para esa data.
- Cacheable con `revalidate: 300` o `revalidate: 3600` según freshness real.

**B. Si por arquitectura no se puede pasar a server, al menos:**
- Reemplazar `axios` por `fetch` nativo en la versión cliente. La home no necesita interceptors de auth.
- Diferir la carga con `IntersectionObserver` (solo fetch cuando la sección está cerca del viewport).

**Impacto esperado:**
- Bundle público **−13 KB gzip** (axios) + interceptors.
- TBT **−80 a −150 ms** (no se ejecuta `loadVehicles` durante hidratación).
- Mejor primer paint del carrusel usados.

---

## 7. `data/modelos/*` viaja al bundle del cliente

### Diagnóstico

```1:5:src/components/ceroKm/useModeloSelector.js
"use client";

import { useState, useCallback, useMemo } from "react";
import { getModelo, COLORES } from "../../data/modelos";
```

`useModeloSelector.js` es Client. Importa **todo** `data/modelos/index.js`, que a su vez importa los 8 modelos + colores:

```
peugeot208.js   10.9 KB
peugeot2008.js   8.7 KB
peugeot3008.js   5.1 KB
peugeot408.js    4.9 KB
peugeot5008.js   5.1 KB
peugeotPartner   7.1 KB
peugeotExpert    6.6 KB
peugeotBoxer     6.5 KB
colores.js       9.4 KB
                ──────
                ≈ 64 KB de JS estático (15–20 KB gzip)
```

Cada `/0km/[slug]` arrastra esos 64 KB al cliente aunque solo necesite **un modelo**. Y por cascada también lo arrastran:
- `ModelGallery.jsx` (importa `images` desde props OK pero el ModeloSelectorProvider sí los importa)
- `getHomeCeroKmCardImage` lo necesita en server (OK en server), pero al ser default export de `data/modelos/index.js`, cuando un client tira `from "../../data/modelos"` se trae todo.

Encima, `ModeloDetalleClient.jsx` ya recibe `modelo` por props **y aún así** abajo `useModeloSelector` vuelve a hacer `getModelo(slug)` desde el bundle cliente.

### Acción

**A. Pasar todo lo necesario por props desde el Server Component, no re-importar en el cliente.**

```jsx
// useModeloSelector.js
"use client";
import { useState, useCallback, useMemo } from "react";

// ❌ borrar:
// import { getModelo, COLORES } from "../../data/modelos";

// ✅ Recibir el modelo y el catálogo de colores filtrado:
export function useModeloSelector({ modelo, coloresAvailable }) {
  // modelo y coloresAvailable vienen del server, ya filtrados al modelo activo
  // ...
}
```

`ModeloSelectorProvider` también recibe el `modelo` y el subset de COLORES (solo los que aparecen en `coloresPermitidos` de las versiones del modelo). En vez de bundlear los 28 colores, solo viajan los 3–5 que aplican al modelo (~2 KB).

**B. Encerrar `data/modelos/*` con un comentario `/** @server-only */`** y, idealmente, mover a `src/server/data/modelos/`. Bun/Turbopack no enforcea pero ayuda a no volver a importar accidentalmente.

**Impacto esperado:**
- Bundle de `/0km/[slug]`: **−50 a −65 KB** (15–20 KB gzip).
- Mejor TBT en mobile (parse + eval).

---

## 8. Footer dinámico — saca SEO + agrega TBT

```1:17:src/components/layout/Footer/FooterLazy.jsx
"use client";

import dynamic from "next/dynamic";

const Footer = dynamic(() => import("./Footer"), { ssr: false });

export default function FooterLazy() {
  return <Footer />;
}
```

- `ssr: false` → **el HTML del footer no se sirve en SSR**. Eso significa que los **enlaces internos** del footer (Postventa, Trabaja con nosotros, etc.) **no están en el HTML inicial**, por ende:
  - Lighthouse SEO pasa porque la página tiene Nav y H1 OK, pero Google ve un footer "vacío" hasta que JS corre.
  - El "internal linking power" de un footer rico se anula para crawlers que no esperan JS.
- Hidratar el footer agrega trabajo en TBT (todos esos accordions + useState).

Ya lo cubrí en el punto 4.B: **renderizar `Footer` directamente en server**, mover el estado de accordion a Client interno (que ya lo está).

---

## 9. Carruseles client en `/0km` — micro-optimizaciones de TBT

```71:103:src/components/0km/VehiculosCarouselClient.jsx
useEffect(() => {
  const carousel = carouselRef.current;
  if (!carousel) return;

  checkScrollButtons();

  let rafId = null;
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      checkScrollButtons();
      rafId = null;
    });
  };
  ...
  carousel.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
```

Buen patrón con RAF + debounce. Pero:

- Se montan **2 instancias** (`VehiculosCarouselClient` + `UtilitariosCarouselClient`) prácticamente idénticas, cada una con su listener de scroll + resize + IntersectionObserver implícito.
- `checkScrollButtons` hace `Array.from(carousel.children)` + loop por cada scroll para calcular `activeIndex` (los dots). Para 8 cards no es caro, pero **cada scroll en mobile** genera reflow + lectura de offsets.

### Acciones

**A. Componente único reutilizable** (`HorizontalCarousel`) compartido por vehículos / utilitarios / home / usados, en lugar de duplicar lógica.

**B. Usar `IntersectionObserver` para detectar la card central** en lugar de `forEach + offsetLeft` por scroll. Más eficiente y sin lecturas forzadas de layout:

```jsx
useEffect(() => {
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) {
      const idx = Number(visible.target.dataset.index);
      if (!Number.isNaN(idx)) setActiveIndex(idx);
    }
  }, { root: carouselRef.current, threshold: [0.5, 0.75, 1] });
  Array.from(carouselRef.current.children).forEach((el, i) => {
    el.dataset.index = i;
    io.observe(el);
  });
  return () => io.disconnect();
}, [cards.length]);
```

**Impacto esperado:** TBT en `/0km` mobile **−40 a −80 ms** y scroll más fluido.

---

## 10. CSS — `will-change` + `contain` sobre TODAS las cards

```1142:1147:src/app/(site)/0km/0km.module.css
.carousel,
.card,
.imageContainer {
  will-change: transform;
  contain: layout style paint;
}
```

**Issue:**
- `will-change: transform` aplicado a **toda card** crea una composite layer por card. Con 8–10 cards en `/0km` → 8–10 layers permanentes en GPU.
- En mobile, especialmente en gama media (Snapdragon 6xx, A12 viejo), esto consume **decenas de MB de memoria** y degrada el repintado en scroll.
- `contain: layout style paint` está OK en `.imageContainer`, pero el combo con `will-change` es excesivo.

### Acción

```css
/* Solo aplicar will-change cuando hace falta (durante hover/scroll activo). */
.carousel {
  contain: layout style; /* paint NO necesario en wrapper */
}

.card {
  /* sin will-change permanente */
}

.card:hover,
.card:focus-within {
  will-change: transform;
}

.imageContainer {
  contain: layout paint;
}
```

**Impacto esperado:** menor memoria GPU, INP/jank en scroll mejor. No mueve aguja en Lighthouse score pero mejora la **calidad percibida** y baja CPU en dispositivos lentos.

---

## 11. `<img>` nativos en lugar de `<Image>` — bytes y LCP secundario

### Casos detectados

```146:153:src/components/layout/Nav/Nav.jsx
<img
  src="/assets/logos/logos-indiana/indiana-final.webp"
  alt="Indiana Peugeot — inicio"
  className={styles.logo}
  width={200}
  height={80}
  decoding="async"
/>
```

```111:118:src/app/(site)/page.jsx
<img
  src={staticImages.postventa.hero.src}   // ← URL Cloudinary sin transformar
  alt={staticImages.postventa.hero.alt}
  className={styles.postventaImage}
  decoding="async"
  loading="lazy"
/>
```

```64:69:src/components/layout/Footer/FooterModules.jsx
<img
  src={iconSrc}
  alt={item.text}
  className={`${styles.iconImage} ...`}
/>
```

### Problemas

- Logo del nav: archivo local (16 KB), aceptable. Pero al estar arriba del fold, no entrega un `srcset` para retina mobile.
- **Banner postventa con `<img>` apuntando a Cloudinary sin transformaciones** → se baja la imagen completa (puede ser 500–800 KB).
- Íconos del footer: pequeños, OK como `<img>`, pero no traen `width/height` → CLS riesgo nulo porque CSS los dimensiona; no es urgente.

### Acción

Reemplazar el banner postventa por `<Image>` con `loading="lazy"` y `sizes` adecuados, y aplicar la transformación Cloudinary del punto 2:

```jsx
import Image from "next/image";

<Image
  src={staticImages.postventa.hero.src} // ahora con f_auto,q_auto,w_1600
  alt={staticImages.postventa.hero.alt}
  className={styles.postventaImage}
  width={1600}
  height={600}
  sizes="(max-width: 768px) 100vw, 1200px"
  loading="lazy"
  quality={75}
/>
```

**Impacto esperado:** banner postventa **−200 a −500 KB** en mobile.

---

## 12. Bundle deps — limpieza

### Hallazgos

```17:18:package.json
"@tanstack/react-query": "^5.90.18",
"@tanstack/react-query-devtools": "^5.91.2",
```

`react-query-devtools` está en `dependencies` (no `devDependencies`). Aunque tree-shaking lo elimina si no se importa, **conviene moverlo** a devDependencies:

```bash
npm uninstall @tanstack/react-query-devtools
npm install -D @tanstack/react-query-devtools
```

Validar que solo se importa en `src/app/admin/layout.js` y que ese admin **no se publica** a usuarios anónimos (lo cual ya parece el caso).

### Otros

- `@vercel/analytics`: lazy via `AnalyticsWrapper` (OK, `ssr:false`). Se podría diferir aún más al primer `requestIdleCallback`.
- `react-hook-form` + `@hookform/resolvers` + `zod`: usados en formularios — **¿están en chunks por ruta?** Si están en `careers`/`/trabaja-con-nosotros`, deberían quedar fuera del bundle de `/` y `/0km`. Confirmar con `next build` y `--analyze`.
- `browser-image-compression`: solo se usa en admin (`src/utils/clientImageOptimize.js`). Verificar que tree-shaking lo deja fuera del bundle público.
- `axios`: ya cubierto en punto 6 — moverlo a server.

### Recomendación

Correr análisis de bundle:
```bash
ANALYZE=true npm run build
```
Con `@next/bundle-analyzer` integrado en `next.config.mjs`:
```js
import bundleAnalyzer from "@next/bundle-analyzer";
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
export default withBundleAnalyzer(nextConfig);
```

Revisar el `page.js` chunk de `/0km` y `/0km/[slug]`. Si supera 250 KB initial JS gzip, hay más para deferir.

---

## Mapa de causas por métrica

### LCP (Home mobile 3.5 s, `/0km` desktop 0.7 s — ya OK)

| Causa | Página | Acción |
|-------|--------|--------|
| Doble `<Image priority>` Hero | `/` mobile | Punto 1 |
| Cloudinary URLs sin `f_auto,q_auto,w_…` | `/` y `/0km/[slug]` | Punto 2 |
| `HeroImageDesktop` esperando `mounted` antes de pintar | `/0km/[slug]` desktop | Punto 5 |
| Banner postventa con `<img>` sin transformar | `/` | Punto 11 |
| `data/modelos` en bundle cliente atrasa hidratación → atrasa LCP secundario | `/0km` | Punto 7 |

### TBT (Home 370 ms, `/0km` desktop 2040 ms, `/0km` mobile alto)

| Causa | Páginas | Acción | TBT estimado |
|-------|---------|--------|--------------|
| GTM × 2 (917 ms) | Todas | Punto 3 | −400 a −700 ms |
| Meta Pixel (234 ms) | Todas | Punto 3 | −150 a −230 ms |
| `PublicSiteChrome` client + N dynamic ssr:false | Todas | Punto 4 | −100 a −250 ms |
| `data/modelos` en bundle client | `/0km` | Punto 7 | −80 a −150 ms |
| `HomeUsadosSectionClient` con axios + fetch | `/` | Punto 6 | −80 a −150 ms |
| 2 carruseles client con scroll+resize listeners | `/0km` | Punto 9 | −40 a −80 ms |
| `react-query-devtools` accidental | (verificar) | Punto 12 | −0 a −50 ms |
| `useId` + múltiples `usePathname` | Todas | Punto 4.C | −20 a −60 ms |

### Hydration cost (impacta TBT y FID/INP)

| Causa | Acción |
|-------|--------|
| `PublicSiteChrome` "use client" | Punto 4 |
| `FooterLazy` (ssr:false) + N FooterItem hidratando | Punto 4.B |
| `ConsentBanner` dynamic ssr:false (necesario) | Mantener pero medir |
| `useMediaQuery` en `HomeUsadosCarousel` → doble render por breakpoint | Aceptable, ver Punto 9 |
| `HeroImageDesktop` mount-gated | Punto 5 |
| `ModelGallery` mount-gated desktop/mobile + dynamic import | Reducir: pintar mobile en SSR como default, hidratar desktop después |

### Bundle size

| Origen | Tamaño | Acción |
|--------|--------|--------|
| `data/modelos/*` + colores | ~64 KB raw | Punto 7 |
| `axios` en home pública | 13 KB gzip | Punto 6 |
| `@tanstack/react-query-devtools` (si entra) | 9 KB gzip | Punto 12 |
| `@vercel/analytics` | ~3 KB gzip | Aceptable (ya lazy) |
| `browser-image-compression` (admin) | 70 KB+ | Verificar que NO entra al bundle público |

### Imágenes mal optimizadas (mapa concreto)

| Archivo / Componente | Problema | Acción |
|----------------------|----------|--------|
| `Hero.jsx` (desktop + mobile) | doble preload por priority | Punto 1 |
| `cloudinaryStaticImages.js` (hero, postventa, careers, services) | URLs sin transformación | Punto 2 |
| `data/modelos/colores.js` (28 colores × URL) | sin transformación, sirven a tarjetas de carrusel | Punto 2 |
| `data/modelos/peugeot*.js` (galerías mobile/desktop) | sin transformación, 4–6 imágenes por modelo | Punto 2 |
| `ModelCard.jsx` `Image` (línea 139) | OK uso de sizes, pero src sin transform | Punto 2 |
| `HeroImageDesktop.jsx` | mount-gated bloquea preload | Punto 5 |
| `page.jsx` postventa `<img>` | nativo + Cloudinary sin transform | Punto 11 |
| `Nav.jsx` logo `<img>` | local, OK aunque sin srcset | Bajo |

### Qué se puede convertir a Server Component

| Componente actual | Puede ser Server | Notas |
|-------------------|------------------|-------|
| `PublicSiteChrome` | ✅ | Punto 4 |
| `FooterLazy` → `Footer` | ✅ | Punto 4 / 8 |
| `HeroImageDesktop` | ✅ | Punto 5 |
| `HomeUsadosSectionClient` → `HomeUsadosSection` | ✅ | Punto 6 (vía Suspense + fetch server) |
| `ModelGallery` (parcial) | Parcial | Layout y mobile primero en server; desktop hidrata |
| `VersionContent` | ❌ | Mantiene estado activo de versión/color (necesario client) |
| `VehiculosCarouselClient`, `UtilitariosCarouselClient` | ❌ | Interactividad obligatoria |
| `Nav` | ❌ | Necesita scroll-lock + usePathname (pero el shell puede ser server) |

### Qué debería ir con `dynamic()` (o **NO** ir)

| Componente | Estado actual | Recomendación |
|-----------|---------------|---------------|
| `ConsentBanner` | `dynamic({ ssr:false })` | ✅ correcto (depende de localStorage) |
| `FloatingWhatsAppButton` | `dynamic({ ssr:false })` | ✅ correcto |
| `AnalyticsWrapper` | `dynamic({ ssr:false })` | ✅ |
| `Footer` (vía FooterLazy) | `dynamic({ ssr:false })` | ❌ quitar — pierde SEO + sube TBT |
| `VersionTabs` (en `VersionContent`) | `dynamic({ ssr:false })` | ❌ es UI principal visible, dejar SSR + hidratar normal |
| `ModeloPlanes` (en `/0km/[slug]/page.jsx`) | `dynamic()` server | ✅ ahorra JS si no se usa siempre |
| `FeatureSection` | `dynamic()` server | ✅ |
| `ModelGallery` | `dynamic()` server | ✅ (es debajo del fold) |

### Qué debería cargarse lazy

| Recurso | Estado | Recomendación |
|---------|--------|---------------|
| Galería (`ModelGallery`) | dynamic + `loading="lazy"` desde la 4ª img | Bajar también las 2 primeras a `loading="lazy"` en mobile (no aporta a LCP), mantener la 1ª `priority` solo desktop |
| `VersionItemsImageDesktop` | `loading="lazy"` | OK |
| `HomeUsadosCarousel` | fetch en useEffect | Diferir con IntersectionObserver o pasar a server con Suspense |
| GTM (1.er container) | `afterInteractive` | `lazyOnload` + delay-until-interaction |
| GTM (2.º container) | `afterInteractive` | `lazyOnload` (o quitar) |
| Meta Pixel | `afterInteractive` | `lazyOnload` |
| `react-query-devtools` | dependency | move to devDeps |

### Qué se puede eliminar / diferir

- `FooterLazy.jsx` (archivo entero) → reemplazar por import directo de `Footer`.
- `HeroImageDesktop`: estado `mounted` y `useEffect` → componente puramente server.
- `MarketingTracking` con `afterInteractive` → estrategia `lazyOnload` o custom delay.
- Dos containers GTM → unificar a uno (decisión de negocio).
- `axios` en home pública → fetch nativo o server-fetch.

### Mobile vs Desktop — qué afecta a cada uno

#### Home mobile (objetivo 90+)
1. Hero doble priority (punto 1) — **principal**.
2. Cloudinary sin transform (punto 2).
3. Banner postventa nativo sin transform (punto 11).
4. GTM × 2 + Pixel (punto 3) — afecta TBT.
5. HomeUsadosSectionClient fetch + axios (punto 6).

#### `/0km` desktop (objetivo 90+)
1. `HeroImageDesktop` mount-gated (punto 5) — **principal LCP**.
2. GTM × 2 (punto 3) — **principal TBT** (2040 ms es marketing).
3. `data/modelos` en bundle cliente (punto 7).
4. `PublicSiteChrome` client (punto 4).
5. 2 carruseles client (punto 9).

#### `/0km` mobile
1. GTM × 2 + Pixel (punto 3) — **dominante en TBT mobile**.
2. `data/modelos` en bundle (punto 7).
3. Carruseles client (punto 9).
4. `will-change` en todas las cards (punto 10).
5. Cloudinary sin transform en tarjetas (punto 2).

---

## Quick wins (orden recomendado de implementación)

| Orden | Cambio | Tiempo estimado | Riesgo | Impacto |
|-------|--------|-----------------|--------|---------|
| 1 | Hero: quitar `priority` de la imagen no aplicable al viewport + `quality=70` (Punto 1) | 20 min | Bajo | LCP −1.0 s mobile |
| 2 | Helper `cl()` para transformar URLs Cloudinary + actualizar `cloudinaryStaticImages.js` (Punto 2) | 1 h | Bajo | −500–800 KB, LCP −0.5 s |
| 3 | `HeroImageDesktop` server component (Punto 5) | 15 min | Bajo | LCP /0km desktop −1.0 s |
| 4 | GTM/Pixel a `lazyOnload` o delay-until-interaction (Punto 3) | 1 h | Bajo-medio (validar marketing) | TBT −700–1100 ms |
| 5 | `FooterLazy` → `Footer` SSR (Punto 8 + 4.B) | 30 min | Bajo | TBT −80 ms + SEO interno |
| 6 | `useModeloSelector` recibe props en vez de importar `data/modelos` (Punto 7) | 1.5 h | Medio (refactor) | Bundle /0km −18 KB gzip |
| 7 | `HomeUsadosSection` server-fetch + Suspense (Punto 6) | 1.5 h | Medio | Bundle −13 KB axios + TBT −150 ms |
| 8 | `PublicSiteChrome` server (Punto 4) | 2 h | Medio | TBT −150–300 ms + cleaner architecture |
| 9 | CSS `will-change` selectivo (Punto 10) | 15 min | Bajo | INP/jank mejor |
| 10 | Banner postventa `<Image>` + Cloudinary transform (Punto 11) | 15 min | Bajo | LCP secundario mobile |
| 11 | Quitar `dynamic ssr:false` de `VersionTabs` (Punto 13) | 5 min | Bajo | Mejor SSR de UI |
| 12 | Mover `react-query-devtools` a devDeps + bundle analyzer (Punto 12 / 14) | 30 min | Bajo | Bundle clean |

**Total esfuerzo:** 1 día desarrollador + 0.5 día QA.

---

## Mejoras estructurales (medio plazo)

1. **Loader Cloudinary nativo de next/image** (Punto 2.B) — implica `loaderFile`, validación visual y testing en preview Vercel. Pero quita por completo Vercel image transforms del camino crítico y unifica el sistema de imágenes.
2. **Componente único `HorizontalCarousel`** que reemplace `VehiculosCarouselClient`, `UtilitariosCarouselClient`, `UsadosCarousel`, `HomeUsadosCarousel`. Comparte lógica de scroll + IntersectionObserver + accesibilidad. Reduce TBT post-hidratación y mantenimiento.
3. **Server-side analytics (Conversions API / Measurement Protocol)** para conversiones críticas (form_submit, generate_lead). Reduce dependencia del Pixel cliente y mejora calidad de datos con iOS/Safari ITP. Permite seguir bajando el costo cliente del Pixel sin perder atribución.
4. **CDN cache rules + ISR** para `/0km` y `/0km/[slug]` con `revalidate: 3600`. Si los modelos cambian rara vez, esto saca data fetching del runtime y mejora TTFB.
5. **Splitting de Tailwind por ruta** (`tailwindcss/utilities.css`): Tailwind v4 ya hace tree-shake por archivo. Verificar que no se inyectan utilidades nunca usadas. Las clases dentro de strings `className` en JSX se detectan; las construidas dinámicamente (raras en este repo) NO.

---

## Tradeoffs explícitos

| Decisión | A favor | En contra | Recomendación |
|----------|---------|-----------|---------------|
| Pasar GTM a `lazyOnload` / delay-until-interaction | TBT −500–900 ms | Eventos antes del primer scroll (pageview inicial, bounce instantáneo) se pierden o llegan retrasados | Aceptar pérdida marginal: GA4 modela bounces; Indiana debería validar con su agencia |
| Eliminar segundo container GTM | TBT 1× en lugar de 2× | Posible pérdida de tags propios de la agencia | Mantener uno (decisión política) o ambos `lazyOnload` |
| Convertir Footer a SSR | SEO + TBT | Mayor HTML inicial (≈4 KB extra) | Hacerlo: el SEO vale más que 4 KB |
| Helper `cl()` reescribiendo URLs Cloudinary | −600 KiB inmediato | Si la URL existente ya trae transformaciones (raro aquí), el helper podría duplicar — validar con regex robusta | Empezar con URLs sin transform (mayoría), iterar |
| `HeroImageDesktop` server-only | LCP +grande | Si la regla `display:none` mobile no funciona como esperan, se podría preloadear igual — mitiga `sizes` | Hacerlo + verificar en mobile real |

---

## Reglas para mantener Performance + SEO + Tracking

1. **Nunca usar `dynamic({ ssr:false })` para UI con contenido textual o links** (footer, headers, body de página). Solo para widgets que dependen de browser API (localStorage, IntersectionObserver con DOM real, etc.).
2. **`priority` solo en UN `<Image>` por viewport activo**. Si hay variante mobile/desktop, usar `sizes` con `1px` para la inactiva.
3. **Cualquier URL externa de imagen pasa por el helper `cl()`** (o equivalente). Lint regla regex sobre `res.cloudinary.com.*upload/[^f]` para detectar URLs sin transform.
4. **GTM y Meta Pixel nunca con `afterInteractive` sin Consent Mode + delay**. Mínimo `lazyOnload`.
5. **No importar `src/data/*` desde Client Components**. Pasar la data como props desde Server Components.
6. **Footer en SSR sí o sí**.
7. **Métricas en CI**: agregar `@lhci/cli` corriendo en preview de Vercel sobre `/` y `/0km`. Budget: LCP <2.5 s mobile, TBT <200 ms, performance >90.

---

## Resumen ejecutivo

- **El 75 % del TBT en `/0km` desktop (2040 ms) viene de marketing scripts** (GTM × 2 + Pixel). Diferirlos con `lazyOnload` + delay-until-interaction lleva TBT a zona verde sin tocar UX.
- **El LCP mobile del home (3.5 s) está dominado por el Hero** que carga dos imágenes Cloudinary sin transformación y con doble `priority`. Un fix de 30 min lo baja a ~2.0 s.
- **`HeroImageDesktop` en `/0km/[slug]` está hidratando antes de pintar la imagen** — fix de 5 minutos, gana 1 segundo de LCP desktop.
- **Cloudinary se está usando sin transformaciones en todo el proyecto** — implementar un helper único cambia ~500–800 KB por carga.
- **`PublicSiteChrome` siendo client + `data/modelos` en bundle client** son los dos mayores aportes a JS shipping y hydration. Refactor controlado a Server Components saca ~80 KB raw del client y ~150–300 ms de TBT.

El proyecto **ya tiene excelente arquitectura de tracking, SEO y a11y**. La auditoría no propone tocar nada de eso. Los cambios son acotados, de bajo riesgo, y respetan Consent Mode v2 + GA4 Enhanced Ecommerce + Schema.org.
