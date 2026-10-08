# Medición del sitio

Qué se mide, por dónde pasa y cómo comprobarlo. Simplificado el 2026-10-06:
antes eran ~25 eventos (8 sin etiqueta en GTM, formularios inflados); ahora son 6, y cada
contacto manda un solo evento de detalle (más el `generate_lead` del puente, hasta la Fase 7).

## Quién es dueño de qué

| Pieza | Dueño | Se toca desde acá |
|---|---|---|
| GTM `GTM-TPJCFTBB` → GA4 `G-9HJ64VGVLH` | Nosotros | Sí |
| GTM `GTM-M2J2LBRD` (Google Ads) y el ID del Meta Pixel `870960458928397` | Agencia | **No** (el código que carga el Pixel sí es nuestro: `MarketingTracking.jsx`) |

El contenedor de la agencia dispara sus conversiones de Ads por el **texto** de los
botones ("Contactar por WhatsApp", "Contactanos por WhatsApp", "Cotizá con nosotros",
"Reservá tu turno", "Consultá productos", y "Solicitar cotización" de los planes, que ellos buscan
como "SOLICITAR COTIZACIÓN"). Cambiar esos textos les rompe la medición.

## Los eventos

| Evento | Cuándo | Parámetros | Clave |
|---|---|---|---|
| `page_view` | Al entrar y en cada cambio de página (no al filtrar) | `page_location`, `page_title` | No |
| `view_item` | Abrir una ficha de 0km, usado o plan | `item_id`, `item_name`, `item_category` | No |
| `whatsapp_click` | Clic en cualquier botón de WhatsApp | `component_id`, `lead_ref` + el auto si es de una ficha (también el flotante) | No, hasta la Fase 7 (ver puente) |
| `phone_click` | Clic en un teléfono | `component_id` | No, hasta la Fase 7 (ver puente) |
| `view_search_results` | Aplicar filtros en usados (no al limpiarlos) | `results_count`, `filters_count`, `marca` | No |
| `form_submit` | Postulación enviada en Trabajá con nosotros | `form_id` | No |

**Puente de transición (lo arma GTM, no el código):** en cada `whatsapp_click`, `phone_click` y
`form_submit` de empleo, GTM manda además un `generate_lead` con `lead_source` (whatsapp, phone o
form). Así el tablero viejo de Looker sigue funcionando y `generate_lead` sigue siendo el **único**
evento clave. Se borra en la Fase 7, cuando el tablero nuevo esté validado; ahí se marcan
`whatsapp_click` y `phone_click` como clave.

Todos llevan además `location` (la sección: `home`, `okm_detail`, `usados_list`…),
que `track()` saca de la URL. Ningún componente la pasa.

`page_view` sale del código (`PageViewTracker`) y no de la medición mejorada de GA4, que
también cuenta cada filtro del listado y el salto de la redirección de usados. En GTM el
page_view automático de la etiqueta de Google va **apagado**, y el día de publicar se apagan en
GA4 cuatro opciones de la medición mejorada (historial, formularios, clics de salida y búsquedas
en el sitio): con cualquiera prendida, se cuenta doble.

En las fichas (0km, usado, plan) la visita se cuenta cuando la ficha real se armó (aviso de
`ItemViewTracker` vía `pageItem.js`), no a tiempo fijo: así una redirección o un servidor lento
no cuentan dos visitas. `page_location` sale sin parámetros de URL con forma de dato personal.
Rutas fuera de las secciones conocidas (404, páginas sueltas) van con `location = other`.

GA4 solo muestra en informes a quien acepta las cookies (con identidad por dispositivo no hay
modelado): los números son de ese grupo, no del total.

## Cómo se usa

- WhatsApp: `<WhatsAppLink href componentId item?>`.
- Teléfono: `<TelLink phone componentId>`.
- Ficha: `<ItemViewTracker item={buildItemParamsFrom{Auto|Usado|Plan}(...)} />`.
- Otro caso: `track(EVENTS.X, params)` de `dataLayer.js`.

`componentId` identifica el botón en GA4 (`whatsapp-floating`, `whatsapp-detalle-0km`…):
es estable, en kebab-case, y no se cambia al refactorizar estilos.

**Agregar un evento:** sumarlo a `EVENTS`, agregarlo con sus parámetros en
`scripts/gtm-definition.mjs` (la definición de GTM; sin etiqueta no llega a GA4),
correr `node scripts/gtm-container.mjs`, importar `docs/analytics/gtm-medicion-simple.json`
en GTM (espacio **"medicion-simple"**, nunca el "Default Workspace": ver `docs/analytics/salida-a-produccion.md`) y anotarlo en la tabla de arriba.

**GTM recuerda valores:** una clave que un evento manda y otro no (`item_*`,
`component_id`, `marca`) se vacía en `track()` (`RESET_KEYS`); si se agrega una
clave compartida, va ahí.

## Código de referencia (lead_ref)

Cada clic en WhatsApp genera un código de 5 caracteres (`leadRef.js`) que se suma al
final del mensaje, "(Ref. web K7Q2M)", y viaja a GA4 como `lead_ref`. Si el vendedor
anota la referencia del chat, en GA4 se filtra por ese `lead_ref` y aparece la visita:
de qué auto, qué botón y qué campaña vino. Es al azar y no identifica a la persona.

En una ficha, el WhatsApp flotante manda el auto de esa ficha (`pageItem.js`): lo anota
`ItemViewTracker` y el flotante lo lee al hacer clic (`itemFromPage`).

## Datos personales

Nunca se manda nombre, email, teléfono, DNI ni texto escrito por el usuario.
`track()` descarta esas claves como segunda defensa; la primera es no mandarlas.

## Consentimiento

Consent Mode v2: todo `denied` hasta que el usuario acepta en el banner
(`consent.js`, se guarda en `localStorage` como `indiana_consent_v1`).
Para volver a ver el banner: `localStorage.removeItem("indiana_consent_v1")` y recargar.

## Pruebas y datos reales

Nuestro GTM carga solo en `indiana.com.ar` y `www.indiana.com.ar` (`gtmLoader.js`; las dos
sirven el sitio). En localhost o en una versión
de prueba de Vercel no carga, salvo con `NEXT_PUBLIC_ANALYTICS_TEST=true`: ahí carga y marca la
visita con `analytics_test`, GTM la manda a GA4 con `debug_mode` y el filtro "tráfico de
desarrolladores" la deja fuera de los informes (se ve en DebugView). El contenedor de la agencia
y el Pixel no pasan por este control.

## Comprobar

- En desarrollo cada evento sale en la consola como `[analytics] {...}`.
- `dataLayer.slice(-5)` en la consola muestra los últimos.
- GTM → Vista previa contra el preview de Vercel de la rama.
- GA4 → Tiempo real / DebugView.
- Que producción no salga marcada como prueba: en Red, los envíos `collect` a `G-9HJ64VGVLH`
  desde producción no llevan `_dbg`; desde una prueba con la variable, sí
  (`docs/analytics/salida-a-produccion.md`).
