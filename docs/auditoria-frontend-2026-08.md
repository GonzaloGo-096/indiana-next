# Auditoría frontend — indiana-next

**Fecha:** 11 de agosto de 2026 · **Alcance:** todo `src/` (sitio público + admin + API routes). Backend fuera de alcance salvo como evidencia.
**Método:** exploración de arquitectura y deuda (2 pasadas) + auditoría de seguridad (barrido OWASP) + auditoría de performance (build real medido). Todo hallazgo citado fue verificado contra el código (`path:línea`); los números de los agentes que no se pudieron reproducir se corrigieron y se indica el valor verificado.

---

## 1. Resumen ejecutivo

El sitio funciona y tiene buenas decisiones de base (ISR con tags, loader propio de Cloudinary, tokens CSS, hero bien optimizado, secretos fuera de git). Los problemas están concentrados en cinco frentes:

| # | Frente | El número que importa |
|---|--------|----------------------|
| 1 | **Errores invisibles en producción** | ~24 `console.*` sin guard + ~100 que desaparecen en prod + 14 catch silenciosos + **0 error reporting**. La sección de usados del home lleva rota un tiempo indeterminado sin que nadie lo supiera: este es el porqué. |
| 2 | **Seguridad: 2 críticas** | `/api/photos/*` procesa imágenes con sharp **antes** de validar auth (DoS sin credenciales) + sharp/axios/next con CVEs high conocidos. |
| 3 | **Duplicación** | ~500 líneas CSS copiadas entre 3 cards; 2 carruseles 89–95% idénticos; 2 API routes casi iguales (421+374 líneas). Cada bug de precio se arregla 3 veces (pasó esta semana). |
| 4 | **Tests donde no duele** | 69 casos, ninguno sobre `lib/pricing/*` (los últimos 5 commits son fixes ahí) ni `utils/filters.js` (433 líneas de lógica pura). |
| 5 | **Toolchain fantasma** | Tailwind cargado sin uso, TypeScript que no chequea ningún archivo, react-compiler instalado y apagado, CSP escrita y comentada. Costo sin retorno. |

**Recomendación:** empezar por F0 (bugs activos + 2 críticas de seguridad, ~2 días) y F1 (observabilidad, ~1 día). Sin F1, cada bug futuro se vuelve a descubrir por un usuario y no por un log.

---

## 2. Bugs activos (P0)

### B1 — La home no muestra los autos usados · P0 · esfuerzo S-M
- **Evidencia:** `src/components/home/HomeUsadosSectionClient.jsx:14-40` — único punto del sitio que fetchea el backend desde el browser (`useEffect` + axios). Verificado en prod (indiana.com.ar): el HTML trae 0 cards y el browser nunca emite el request. En local además el backend de preview (`back-indiana-preview`) no envía `Access-Control-Allow-Origin` → CORS bloquea la respuesta.
- **Fix:** mover el fetch al server reutilizando `vehiclesApi.server.js` (tag `vehicles-list`, mismo patrón que `src/app/(site)/usados/page.jsx`), con `<Suspense>` para no bloquear el SSR del home. Elimina la clase entera de fallas (CORS, hidratación, JS deshabilitado), la sección aparece en el primer paint, y saca axios del bundle de home (–20,7 KB gz).
- **Verificar:** `curl` a prod debe traer las cards en el HTML; Lighthouse mobile antes/después (LCP/CLS).

### B2 — El fallo de B1 es invisible por diseño · P0 · esfuerzo S
- **Evidencia:** `HomeUsadosSectionClient.jsx:32-34` (el catch solo loguea `if NODE_ENV === "development"`) + `src/components/home/UsadosSection.jsx:52` (`vehicles.length > 0 &&` — sin datos no hay carrusel, ni skeleton, ni mensaje: la sección se achica en silencio, sin reservar altura → CLS cuando aparezca).
- **Fix:** error visible en telemetría (ver F1) + skeleton/altura reservada.

### B3 — Precio de oferta desbordado en CardAuto y CardDetalle · P0 · esfuerzo S
- **Evidencia:** el reparto fijo `flex: 0 0 30%` / `flex: 0 0 70%` + gap + padding (>100% del ancho) sigue vigente en `CardAuto.module.css` (~línea 510) y `CardDetalle.module.css` (~línea 514). En CardSimilar ya está corregido (branch `fix/card-precio-oferta-padding`, sin commitear, verificado en navegador a 212–320 px). En CardAuto hoy entra por 0,5 px de margen: cualquier precio más largo lo rompe.
- **Fix:** replicar el patrón ya validado (label auto + display flexible + apilado por container query).

### B4 — 15 media queries inválidas: responsive muerto · P0 · esfuerzo S
- **Evidencia (verificada, corrige el "46" reportado por el agente):** `@media (min-width: var(--tablet-min))` y similares — `var()` no funciona en media queries, esos bloques **nunca aplican en ningún viewport**. 15 ocurrencias: `src/styles/utilities.css` (7), `src/app/globals.css` (3), `src/app/(site)/0km/0km.module.css` (2), `src/components/postventa/PostventaServiceCard.module.css` (2), `src/app/(site)/planes/planes.module.css` (1).
- **Fix:** reemplazar por valores literales. Después, QA visual de esos 5 archivos en breakpoints: hay estilos responsive que nunca existieron y al activarlos algo puede cambiar de aspecto.

### B5 — Caché ISR redundante · P1 · esfuerzo S
- **Evidencia:** `src/app/(site)/usados/page.jsx:81` declara `revalidate = 120` (Full Route Cache) mientras `src/lib/services/vehiclesApi.server.js:74-77` cachea datos 6 h con tags (Data Cache). Ambas capas coexisten: la página se re-renderiza cada 2 min **con datos idénticos** (~30 invocaciones/hora desperdiciadas). La frescura real ya es event-driven vía `revalidateTag` desde el admin.
- **Fix:** eliminar el `revalidate = 120` (o igualarlo a 21600). Verificar: invocaciones/hora en Vercel y que editar un auto en admin siga actualizando `/usados`.

### B6 — El warmup de caché calienta URLs que nadie visita · P1 · esfuerzo S
- **Evidencia:** `src/app/api/revalidate/route.js` arma `warmupUrls` como `/usados/${id}`, pero la ruta pública es `/usados/[slug]` (`buildVehicleDetailUrl` en `src/utils/vehicleSlug.js`). Los fallos se tragan por diseño best-effort.
- **Fix:** construir el warmup con el mismo builder de slug.

---

## 3. Seguridad

Auditoría con barrido OWASP. Falsos positivos refutados al final de la sección.

### CRÍTICA C1 — sharp procesa uploads sin autenticar · esfuerzo 3-5 h
- **Evidencia (verificada):** `src/app/api/photos/create/route.js` — `request.formData()` en L172, `processFormData()` (sharp: decode + resize + webp) en L205, y el header `Authorization` recién se lee en L244 **solo para reenviarlo** al backend; el rechazo llega después del trabajo caro. Ídem `update/[id]/route.js` (L167-225 vs 264). Sin límite de tamaño de body, cantidad de archivos ni megapíxeles.
- **Ataque:** POST anónimo con imágenes grandes o pixel-flood → CPU/RAM serverless gratis para el atacante; repetido en paralelo, agota invocaciones y presupuesto Vercel. Además entrega bytes controlados directamente al decoder vulnerable (C2) sin credenciales.
- **Fix:** validar auth **antes** de leer el FormData; `content-length` máximo; `sharp(...).limitInputPixels(...)`.

### CRÍTICA C2 — dependencias con CVEs high · esfuerzo 3-6 h
- **Evidencia:** `sharp 0.34.5` (CVEs de libvips — alcanzable sin auth por C1), `axios 1.13.2` (SSRF/prototype pollution), `next 16.1.2` (DoS RSC, request smuggling; fix en 16.3.x), transitivas high (`form-data`, `postcss`, `nanoid`, `follow-redirects`).
- **Fix:** `npm audit fix` (no-breaking) + subir `next` ≥16.3 y `sharp` ≥0.35 con smoke test de build y upload.

### MEDIA M1 — Cero security headers; la CSP existe pero comentada
- `next.config.mjs:26-47`: bloque `headers()` completo comentado ("fase 2"). Sin HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options. No es exploit directo, es defensa en profundidad ausente: cualquier XSS corre sin contención y el sitio es enmarcable.
- **Fix:** activar los 4 headers básicos ya; CSP en `Report-Only` primero (por GTM/Meta).

### MEDIA M2 — JSON-LD inyectado sin escapar `<` (XSS si el backend no sanitiza)
- **Evidencia (verificada):** `src/app/(site)/usados/[slug]/page.jsx:249` `JSON.stringify(jsonLd)` → L312 `dangerouslySetInnerHTML`. Mismo patrón en 8 lugares (listado, 0km, home, planes, postventa). `JSON.stringify` no escapa `<`/`>`: un campo de vehículo con `</script><script>` ejecutaría JS en el dominio y robaría el token admin (M3). Hoy esos campos los cargan admins → severidad media, no crítica.
- **Fix:** helper único que reemplace `<`→`<`, `>`→`>`, `&`→`&` en los 8 sitios.

### MEDIA M3 — Token admin en localStorage
- `src/lib/http/client.js:101`, `src/hooks/useAuth.js:166`. Legible por cualquier script del origen → un XSS roba la sesión. **Mitigante verificado:** las páginas `/admin/*` son client-side con datos vía react-query+Bearer; el HTML SSR no filtra inventario antes del redirect de `RequireAuth`. El riesgo es el robo de token, no la exposición de contenido.
- **Fix ideal:** cookie `HttpOnly` (requiere coordinar backend). Mientras: priorizar M1+M2, que cierran la vía de robo.

### MEDIA M4 — `/api/revalidate` sin rate limiting
- Bien hecho: el secret falla cerrado (sin fallback), comparación correcta. Pero cada intento dispara `verifyAdminBearerToken` contra el backend y cada éxito hasta 15 fetches de warmup → amplificación.
- **Fix:** rate-limit por IP.

### MEDIA M5 — Verificar auth ejecutando un DELETE
- `src/lib/auth/verifyAdminBearerServer.js:26-44`: valida el token con `DELETE /photos/deletephoto/<dummyId>`. Hoy el id son 24 ceros (no-op), pero es configurable por env (`REVALIDATE_AUTH_DUMMY_OBJECT_ID`): un error de config y **cada verificación borra un vehículo real**.
- **Fix:** pedir al backend un endpoint idempotente (`GET /user/me`) y migrar.

### BAJAS
- **B-1** `/api/careers`: valida tamaño (5 MB) y MIME, pero el MIME es declarado por el cliente (spoofable). Hoy inocuo: el archivo no se persiste (el envío de mail es un TODO). Al implementarlo: validar por magic bytes.
- **B-2** `photos/create/route.js:247` loguea prefijo del Bearer bajo `API_DEBUG` — no activar ese flag en prod; idealmente no loguear el token nunca.

### Refutados (no perder tiempo acá)
- Open redirects en los 14 redirects de next.config → destinos estáticos hardcodeados.
- Inyección vía searchParams en `filters.js` → `URLSearchParams` encodea + `Number()` con descarte de NaN.
- Secretos commiteados → `.env*` fuera de git e historial; los IDs de GTM/Meta en `.env.example` son públicos por diseño.
- Fallback inseguro del secret de revalidate → falla cerrado.
- Exposición de datos admin en HTML pre-redirect → no ocurre.

---

## 4. Observabilidad (la causa raíz de que B1 viviera oculto)

| Hallazgo | Evidencia | Prio |
|---|---|---|
| ~24 `console.*` sin guard corriendo en prod | peor: `vehiclesApi.server.js` (4 sueltos de 23, server-side por request); también `usados/vehiculos/page.jsx`, `planes/[planId]`, `0km/[autoSlug]`, `lib/http/client.js`, `vehicleMapper.js`, etc. (12 archivos) | P1 |
| ~100 `console.*` gateados a dev | los errores de prod **desaparecen por completo** (patrón dominante en `useAuth`, `useCarMutation`, `dirtyVehicleIds`) | P1 |
| 14 catch que devuelven valor neutro | `revalidatePublicCache.js:25,48` (falla invisible), `verifyAdminBearerServer.js:48`, `consent.js:85`, etc. + 1 catch vacío (`ScrollToTopOnMount.jsx:72`) | P1 |
| `generateStaticParams` → `return []` si la API cae en build | `0km/[autoSlug]/page.jsx:242`, `planes/[planId]/page.jsx:217` — **el sitio se despliega sin páginas de detalle, en silencio** | P1 |
| 0 error reporting en prod | no hay Sentry ni equivalente; los 4 error boundaries solo hacen `console.error` en dev | P1 |
| `lib/logger.js` existe y resuelve esto | adoptado solo en API routes; falta en los 12 archivos de arriba | — |
| Sin regla ESLint `no-console` | `eslint.config.mjs` solo extiende core-web-vitals | P2 |
| Gaps de `error.jsx` | sin boundary propio: `usados/[slug]`, `0km`, `0km/[autoSlug]`, `planes`, `planes/[planId]`, `postventa`, `trabaja-con-nosotros` | P2 |

---

## 5. Duplicación

| Cluster | Números (medidos) | Prio |
|---|---|---|
| **Cards** (`CardAuto` / `CardSimilar` / `CardDetalle`) | 2.442 líneas CSS + 924 JSX; 220 líneas CSS idénticas entre las 2 primeras (74% de solape), 104 comunes a las 3; 11 clases repetidas en los 3 archivos (todo el bloque precio/marca/logo); 120 líneas JSX idénticas | P2 |
| **Carruseles** (11 componentes, 5.730 líneas) | `SimilarVehiclesCarousel` vs `PriceRangeCarousel`: 89–95% idénticos (mismo componente, distinto fetch); 0km `Vehiculos` vs `Utilitarios`: 73–81%; ya existen `useCarouselInteract`, `CarouselDots`, `carouselActiveIndex` sin consolidar | P2 |
| **API routes de fotos** | `photos/create` (421 L) y `photos/update/[id]` (374 L) casi idénticos: `processFormData` y sharp duplicados literales — y cualquier fix de C1 habría que hacerlo 2 veces | P2 |
| **0km en dos árboles** | `components/0km/` (2 archivos) y `components/ceroKm/` (20 archivos): mismo dominio, dos nombres | P3 |
| **Fetching cliente ×4** | `useVehiclesList`, `usePriceRangeVehicles`, `useSimilarVehicles`, `HomeUsadosSectionClient`: cada uno reimplementa useState+useEffect+abort. Nota de performance: **no** migrar a react-query (costaría +12 KB gz públicos por beneficio marginal); un Map con TTL en `vehiclesApi.js` da el 80% | P3 |
| **Shim HTTP** | `lib/api/axiosInstance.js` (11 líneas) solo re-exporta `lib/http/client.js`; 4 servicios importan el shim | P3 |

Regla que esta semana demostró el costo: el bug del precio se arregló en CardSimilar y **sigue vivo en CardAuto y CardDetalle** (B3).

---

## 6. Performance (medido sobre build real)

**Baseline First Load JS (gzip):** home 228 KB · /usados 202 KB · listado ~230 KB · detalle ~228 KB · `/trabaja-con-nosotros` **272 KB** (la pública más pesada) · admin 283 KB · piso del framework 189 KB. CSS crítico: home 28,6 KB gz; un chunk compartido de 122 KB raw lo cargan todas las rutas.

| Hallazgo | Métrica | Fix | Esfuerzo |
|---|---|---|---|
| Imagen postventa sin optimizar | `hero-postventa.webp` se sirve original: **585 KB**; con `f_auto,q_auto,w_1200`: **25 KB (–96%)**. Causa: `<img>` plano en `(site)/page.jsx:112` — el loader Cloudinary nunca interviene | `next/image` o transforms en la URL | S |
| Sección usados del home en cliente | = B1; además –20,7 KB gz de axios en home | server component | S-M |
| zod entero en `/trabaja-con-nosotros` | 63,3 KB gz para un form below-the-fold | `next/dynamic` del form | S |
| ISR redundante | = B5; ~180× menos re-renders sin perder frescura | quitar `revalidate=120` | S |
| `onScroll` sin throttle | `UsadosCarousel.jsx:290`: `querySelectorAll` + lecturas de layout por evento de scroll (el otro handler del mismo archivo ya usa rAF, L216-228) | rAF-throttle | S |
| Media queries inválidas | = B4: CSS muerto en el critical path | valores literales | S |

**Verificado como BIEN (no tocar):** hero LCP (priority + preload + srcset correctos; 102/35 KB), react-query aislado en admin, warnings de `qualities` = ruido de dev (silenciar con `images.qualities: [75,80,85,90]`, no "arreglar"), logos locales sin srcset (pesan 2–16 KB), abort+prefetch manual de `useVehiclesList` (funciona bien).

---

## 7. Tests

- **3 archivos / 69 casos / 605 líneas** para ~53 módulos en `lib/` + `utils/` + `hooks/`. Cubierto: params de GA4, route de upload, logger.
- **El riesgo está exactamente donde no hay tests:** los últimos 5 commits son fixes encadenados sobre `lib/pricing/discount.js` + `validateDiscount.js` — cero tests. `utils/filters.js` (433 líneas, la lógica pura más grande del repo), `vehicleMapper`, `vehicleOffer`, `vehicleSlug`: cero tests.
- Config: Vitest 4 con `environment: node` — correcto para lógica pura; **no** agregar jsdom todavía (los módulos prioritarios no lo necesitan). Sin coverage configurado, sin E2E.

---

## 8. Estructura y toolchain fantasma

| Item | Evidencia | Acción propuesta |
|---|---|---|
| Tailwind cargado sin uso | `globals.css:14,39` importa theme+utilities y hay bridge `@theme` de 18 tokens; **0 utilidades Tailwind en 119 JSX** | remover (build más liviano) |
| TypeScript decorativo | `tsconfig` con `strict:false` e `include` que no cubre ningún `.js`; solo 2 `.ts` reales (robots/sitemap); `jsconfig.json` redundante (Next lo ignora si hay tsconfig) | decidir: TS de verdad (gradual) o sacar los @types |
| react-compiler | `babel-plugin-react-compiler` instalado + `reactCompiler:false` | remover el paquete |
| `maintenance.js` muerto | 5 exports, 0 importadores, sin `middleware.js` — la feature no puede activarse aunque `/mantenimiento` existe | cablear con middleware o borrar |
| Componentes/exports huérfanos | `MailLink.jsx` (0 imports) + 13 named exports sin consumidores (`DEFAULT_DISCOUNT`, `slugify`, `mergeDefaultRanges`, etc.) | borrar tras confirmar |
| Basura en git | `dev-output.log` (24 KB) commiteado; `.cursor/debug-*.log` | borrar + `.gitignore` |
| Imports mixtos | 189 con `@/` vs 132 relativos profundos (`../../../../lib/...`), a veces ambos en el mismo archivo | codemod a `@/` |
| Organización dispersa | mappers en 3 lugares, hooks en 3 lugares, config en 2, `utils/` vs `lib/` difuso | consolidar en F4 |
| Tokens CSS con fugas | 3.027 usos de `var(--…)` (81%) pero 638 hex fuera del token file; el azul de marca escrito `#061b9c`/`#061B9C` en 14 archivos | pasada de tokenización |
| Prettier | 13 archivos CSS sin formatear (deuda previa, verificada contra HEAD) | `format` en una pasada aparte |

---

## 9. Backlog de mitigación

Cada fase se arranca con OK previo y termina con su verificación. Ningún borrado sin confirmar antes.

### F0 — Bugs activos y críticas de seguridad (~2 días) ← EMPEZAR ACÁ
1. C1: auth antes de sharp + límites en `/api/photos/*` (aprovechar y des-duplicar las 2 routes en un helper común).
2. C2: `npm audit fix` + next ≥16.3 + sharp ≥0.35, con smoke test.
3. B1+B2: sección usados del home a server component con Suspense + skeleton.
4. B3: replicar fix de precio en CardAuto y CardDetalle (+ commitear lo ya validado de CardSimilar).
5. B4: 15 media queries a valores literales + QA visual de los 5 archivos.
6. B5+B6: quitar `revalidate=120`; warmup por slug.

**Verificación F0:** HTML de prod con cards; `npm audit` sin high alcanzables; POST anónimo a `/api/photos/create` rechazado antes de procesar; tests verdes; Lighthouse home antes/después.

### F1 — Observabilidad (~1 día)
1. Adoptar `lib/logger.js` en los 12 archivos con console sueltos.
2. Destapar los 14 catch neutros (log estructurado, no throw).
3. `generateStaticParams`: si la API falla en build, **fallar el build** (o al menos loguear como error), no `return []`.
4. Error reporting en prod — **decisión previa: Sentry u otro** (preguntar antes de instalar nada).
5. ESLint `no-console` (permitiendo `logger`).

**Verificación F1:** forzar un error de backend en local y verlo reportado; build con API caída falla ruidosamente.

### F2 — Tests donde duele (~1 día)
`lib/pricing/*` (tabla de casos de descuento: PORCENTAJE/MONTO_FIJO/vacío/tope 100 — los 5 commits recientes son el spec), `utils/filters.js`, `vehicleMapper`, `vehicleOffer`, `vehicleSlug`. Todo con el Vitest ya configurado, sin jsdom.

**Verificación F2:** coverage de esos 5 módulos >80%; los tests documentan el comportamiento de los fixes recientes.

### F3 — Consolidación de duplicados (~2-3 días)
1. Extraer bloque precio/marca/logo compartido de las 3 cards (CSS module común + subcomponente).
2. `SimilarVehiclesCarousel` + `PriceRangeCarousel` → un `<VehicleCarousel>` genérico (borra ~700 líneas).
3. Misma pasada para los 2 carruseles 0km.
4. Map con TTL en `vehiclesApi.js` para dedupe de requests en detalle.

**Verificación F3:** diff visual por screenshot en las 4 superficies (listado, detalle, similares, home); tests verdes; conteo de líneas antes/después.

### F4 — Limpieza estructural (~1-2 días, cada borrado con OK)
Toolchain fantasma (Tailwind, jsconfig, react-compiler, shim axios, maintenance.js, MailLink, exports muertos, dev-output.log) · imports a `@/` · consolidar mappers/hooks · activar security headers (M1, la CSP ya está redactada) + escape de JSON-LD (M2) · pasada de tokens de color · M4/M5 (rate limit + reemplazo del DELETE-probe, coordinado con backend).

**Verificación F4:** build verde, bundle igual o menor, `securityheaders.com` con A, grep de hex fuera del token file en descenso.

---

## 10. Qué NO tocar y por qué

- **Nada de GTM/GA4/consent sin coordinar** con la línea de trabajo de medición en curso (hay funnels y un dashboard de Looker dependiendo de esos eventos). Los 2 eventos muertos conocidos (`email_click`, `carousel_interact`) se resuelven en esa línea, no acá.
- **Nada de One Page** (agencia): peugeotindiana.com.ar y su GTM son de ellos.
- **El loader de Cloudinary**: existe porque el optimizador de Vercel devolvía 402. No volver atrás.
- **Hero del home y react-query en admin**: verificados como correctos.
- **`useVehiclesList` manual**: funciona bien (abort + prefetch); migrarlo a react-query suma bundle sin beneficio.
- **La métrica "Leads = clicks"** en analytics es una decisión, no un bug.

---

## Apéndice — comandos reproducibles

```bash
# Media queries inválidas (15)
grep -rEn '@media[^{]*var\(' src --include='*.css'

# Console sin guard (revisar contexto de cada uno)
grep -rn 'console\.' src --include='*.js' --include='*.jsx' | grep -v NODE_ENV

# Solape de cards (líneas normalizadas comunes)
# (ver método en la conversación de auditoría: sort -u de líneas no vacías + comm -12)

# Hex fuera del token file
grep -rEoh '#[0-9a-fA-F]{3,8}\b' src --include='*.css' | sort | uniq -c | sort -rn | head -20

# Deps vulnerables
npm audit --omit=dev

# Bundle por ruta (Next 16 ya no lo imprime): medir gzip de los chunks
# referenciados por .next/server/app/<ruta>.html tras `npm run build`

# Exports sin consumidores (muestreo)
# por cada export: grep -rn "<nombre>" src --include='*.js*' | grep -v <archivo-origen>
```
