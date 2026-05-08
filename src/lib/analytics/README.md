# Tracking — GA4 vía GTM

Fuente única de verdad sobre cómo se mide el sitio Indiana Peugeot.

## Resumen

- **Tag manager**: Google Tag Manager (`GTM-TPJCFTBB`).
- **Plataformas**: GA4 + Meta Pixel + (opcional) Google Ads, todas configuradas como tags **dentro** del contenedor de GTM.
- **Filosofía**: un solo `window.dataLayer`. La app empuja eventos; GTM enruta.
- **Consent Mode v2**: default `denied`, banner pide opt-in explícito. Persiste en `localStorage` (`indiana_consent_v1`).

## Flow

```
Componente UI
  │
  ├── usa <TrackedLink>/<WhatsAppLink>/<TelLink>/<MailLink>/<TrackedButton>
  │   └── onClick → useAnalytics().track*(...)
  │
  └── o llama directo: useAnalytics().track(EVENTS.X, params)
                          │
                          └── pushDataLayer(event, sanitizeParams(params))
                                  │
                                  └── window.dataLayer.push({event, ...params})
                                          │
                                          └── GTM → tags (GA4 / Meta / Ads)
```

## Convenciones obligatorias

Todo evento de **click/interacción** debe incluir tres parámetros mínimos para poder agrupar y filtrar en GA4 sin ambigüedad. **Nunca hardcodear strings**: usar las constantes de [`events.js`](./events.js).

| Param | Significado | Constante |
|---|---|---|
| `source` | Canal/origen del CTA: `floating`, `inline`, `card`, `nav`, `footer`, `hero`, `banner`, `gallery`, `form`, `carousel`, `breadcrumb`, `modal` | `SOURCES.*` |
| `location` | Sección/página lógica: `home`, `okm_list`, `okm_detail`, `usados_list`, `usados_detail`, `planes_list`, `plan_detail`, `postventa`, `careers`, `404` | `LOCATIONS.*` |
| `component_id` | Identificador estable y único en kebab-case (no cambiar al refactorizar estilos) — ej: `whatsapp-floating`, `whatsapp-card-detalle-usado`, `model-card-cta-ver` | string libre |

`pushDataLayer` warnea en dev si un evento de click no trae estos tres campos. Los wrappers UI (`TrackedLink`, `WhatsAppLink`, etc.) los exigen como props (`source`, `location`, `componentId`).

### Schema de "item" (catálogo)

Para eventos sobre vehículos/planes, agregar el bloque generado por los builders:

```js
import { buildItemParamsFromAuto, buildItemParamsFromUsado, buildItemParamsFromPlan, ITEM_LIST } from "@/lib/analytics";

buildItemParamsFromAuto(auto, ITEM_LIST.OKM_GRID)
// { item_id, item_name, item_category: '0km', item_brand: 'Peugeot',
//   item_variant?, price?, currency: 'ARS', item_list_name }
```

## PII — qué NUNCA se manda

- email, nombre, apellido, teléfono, DNI, mensaje, contenido del CV, dirección, password, cualquier texto libre del usuario.
- El helper [`dataLayer.js`](./dataLayer.js) tiene una **blocklist** que descarta keys con esos nombres y warnea en dev. **Es la segunda línea de defensa.** La primera es no agregar la key en quien dispara el evento.
- Para tracking de número de WhatsApp/teléfono destino, usar `hashPhoneNumber()` de [`params.js`](./params.js) (sha-256 truncado, identificador opaco).

## Cómo agregar un evento nuevo

1. Agregar el nombre a `EVENTS` en [`events.js`](./events.js). Si es estándar GA4 (`add_to_cart`, `share`, etc.) usar el nombre exacto; si es custom, snake_case GA4-style.
2. Decidir parámetros obligatorios. Si requiere `source/location/component_id`, sumarlo a `REQUIRED_CONTEXT_EVENTS`.
3. Disparar con `useAnalytics().track(EVENTS.X, params)` o agregar un método al hook si se repite.
4. Agregar fila a la matriz de abajo.
5. En GTM: crear tag "GA4 Event" con el trigger custom `DLV - Event` filtrando por `event = X`. Si es conversión, marcarlo en GA4 Admin → Events.

## Matriz canónica de eventos

### Estándar GA4

| Evento | Cuándo dispara | Params obligatorios | Conversión |
|---|---|---|---|
| `page_view` | Mount + cada cambio de pathname/searchParams (App Router no lo emite solo) | `page_path`, `page_location`, `page_title` | No |
| `view_item` | Mount de `/0km/[slug]`, `/usados/[slug]`, `/planes/[id]` | `item_id`, `item_name`, `item_category`, `item_brand`, `currency`, `location` | No |
| `select_item` | Click en `ModelCard` / `PlanCard` (ir al detalle) | `item_id`, `item_name`, `item_category`, `item_brand`, `currency`, `item_list_name`, `source`, `location`, `component_id` | No |
| `view_item_list` | Render de listados post-filtros (no por scroll) | `item_list_name`, `items[]`, `location` | No |
| `view_search_results` | Aplicar filtros en `/usados` | `filters` planos, `results_count`, `location` | No |
| `generate_lead` | WhatsApp click (cualquier source) + `form_submit` con éxito | `lead_source`, `source`, `location`, `component_id` | **Sí** |
| `form_start` | Primer focus/change en cualquier campo | `form_id`, `location` | No |
| `form_submit` | Submit OK | `form_id`, `location`, `success` | **Sí** (si `form_id=careers`) |

### Custom

| Evento | Cuándo dispara | Params obligatorios | Conversión |
|---|---|---|---|
| `whatsapp_click` | Click en `<WhatsAppLink>` | `source`, `location`, `component_id`, `phone_number_hash`? | Recomendado **Sí** |
| `phone_click` | Click en `<TelLink>` | `source`, `location`, `component_id` | Opcional |
| `email_click` | Click en `<MailLink>` | `source`, `location`, `component_id` | No |
| `cta_click` | Botones genéricos (hero/banner/nav) | `source`, `location`, `component_id`, `label` | No |
| `gallery_open` | Apertura de `GalleryModal` | `source`, `location`, `component_id`, `total_images` | No |
| `gallery_navigate` | Next/prev/dot dentro de la galería | `component_id`, `direction`, `from_index`, `to_index`, `total_images` | No |
| `filter_applied` | Aplicar filtros (acompaña `view_search_results`) | `location`, `component_id`, `filters_count`, filtros planos | No |
| `sort_applied` | Cambiar ordenamiento | `location`, `component_id`, `sort_by` | No |
| `carousel_interact` | Next/prev/dot en cualquier carrusel (debounced 250ms) | `component_id`, `action`, `slide_index`, `total_slides`, `location` | No |
| `nav_toggle` | Abrir/cerrar menú/dropdown | `component_id`, `open`, `location` | No |
| `scroll_depth` | 25/50/75/90% de la página (1 vez por pathname) | `percent`, `page_path` | No |

### Mapeo recomendado a tags de GTM

| Evento | Tag GA4 | Tag Meta Pixel | Tag Google Ads |
|---|---|---|---|
| `page_view` | `page_view` | `PageView` (auto) | — |
| `view_item` | `view_item` | `ViewContent` | — |
| `select_item` | `select_item` | — | — |
| `view_item_list` | `view_item_list` | — | — |
| `whatsapp_click` | `whatsapp_click` (conversion) | `Contact` | Conversion: Lead |
| `generate_lead` | `generate_lead` (conversion) | `Lead` | Conversion: Lead |
| `form_submit` (careers) | `form_submit` (conversion) | `SubmitApplication` | Conversion: Application |
| `phone_click` | `phone_click` | `Contact` | — |
| `email_click` | `email_click` | `Contact` | — |
| `view_search_results` + `filter_applied` | `view_search_results` | — | — |
| Resto | GA4 Event con mismo nombre | — | — |

## Configuración recomendada en GTM

1. Tag **GA4 Configuration**: pegar Measurement ID, **deshabilitar** "Send a page view event when this configuration loads" (lo dispara `usePageViewTracker`).
2. Trigger custom **DLV - Event**: tipo "Custom Event", event name regex `.*` o el evento específico.
3. Variables tipo "Data Layer Variable" para cada parámetro que quieras ver en reportes (`source`, `location`, `component_id`, `item_id`, `item_name`, `item_category`, `lead_source`, `form_id`, `phone_number_hash`, `filters_count`, etc.).
4. Marcar eventos de conversión en GA4 Admin → Events → toggle "Mark as conversion".
5. Audiencias sugeridas: visitantes de `okm_detail` que no dispararon `whatsapp_click` (remarketing).

## Verificación / debug

- **Console (dev)**: cada push loggea `[analytics] {event, ...}`.
- **DevTools**: `dataLayer.slice(-5)` muestra los últimos pushes.
- **GTM Preview Mode**: `tagmanager.google.com` → Preview, conectar contra Vercel Preview deployment (no funciona en localhost salvo ngrok).
- **GA4 DebugView** (`Admin → DebugView`): activar la extensión "GA4 Debugger" en Chrome y validar especialmente `page_view` (no debe duplicarse), `generate_lead`, parámetros `item_*`.
- **Tag Assistant Companion** (extensión Chrome): valida hits a GTM y GA4.
- **Realtime de GA4**: Reports → Realtime, ~30s de latencia.

### QA del banner de consent

```js
// limpiar elección y recargar
localStorage.removeItem("indiana_consent_v1");
location.reload();
```

## Troubleshooting

- **Doble `page_view`** → revisar el tag GA4 Configuration: el page_view automático debe estar deshabilitado.
- **Eventos no llegan a GA4** → verificar que GTM esté **publicado** (no solo workspace), que el trigger esté activo, y que las cookies de analytics estén `granted` (Consent Mode).
- **Build falla con `useSearchParams must be wrapped in Suspense`** → asegurar que `<PageViewTracker>` esté dentro de `<Suspense fallback={null}>`.
- **Warning `missing required context keys`** → el componente no pasó `source`/`location`/`componentId` a un wrapper. Pasarlos.
- **Warning `dropped param "X" (PII blocklist)`** → el componente intentó mandar PII al dataLayer. Reemplazar por un derivado seguro (ej: `has_phone: !!telefono`).

## Pendiente (TODO)

- **Carruseles** (`carousel_interact`): los 6 carruseles del sitio (`VehiculosCarouselClient`, `UtilitariosCarouselClient`, `UsadosPageCarousel`, `SimilarVehiclesCarousel`, `BrandsCarousel`, `PromocionesCarousel`) no se trackean todavía. Cuando se quiera agregar:
  1. En cada carrusel, conectar el evento de cambio de slide (`onSlideChange`, `onSelect`, etc.) a `useAnalytics().track(EVENTS.CAROUSEL_INTERACT, {...})`.
  2. Pasar como params: `{ component_id: "carousel-<id>", action: "next"|"prev"|"dot"|"autoplay", slide_index, total_slides, location }`.
  3. Debouncear con 250ms si el carrusel autoplays — evita burst de eventos.
- **CSP** en `next.config.mjs`: las directivas mínimas para GTM+GA4+Meta están documentadas en el `next.config.mjs` (comentario). Activarla requiere testing en Vercel Preview.
- **Página `/cookies`**: el banner referencia `#`. Crear página de política de cookies.

## Variables de entorno

- `NEXT_PUBLIC_GTM_ID` — contenedor GTM (ya seteado).
- `NEXT_PUBLIC_META_PIXEL_ID` — Meta Pixel (ya seteado).
- `NEXT_PUBLIC_ANALYTICS_DEBUG=true` — opcional, activa logs `[analytics]` también en producción.

**No** agregar `NEXT_PUBLIC_GA4_ID`. GA4 se gestiona desde GTM. Cargar `gtag.js` standalone genera doble `page_view`.
