# Medición del sitio

Qué se mide, por dónde pasa y cómo comprobarlo. Simplificado el 2026-10-06:
antes eran ~25 eventos con duplicados; ahora son 5 y cada contacto cuenta una vez.

## Quién es dueño de qué

| Pieza | Dueño | Se toca desde acá |
|---|---|---|
| GTM `GTM-TPJCFTBB` → GA4 `G-9HJ64VGVLH` | Nosotros | Sí |
| GTM `GTM-M2J2LBRD` (Google Ads) y Meta Pixel `870960458928397` | Agencia | **No** |

El contenedor de la agencia dispara sus conversiones de Ads por el **texto** de los
botones ("Contactar por WhatsApp", "Contactanos por WhatsApp", "Cotizá con nosotros",
"Reservá tu turno", "Consultá productos"). Cambiar esos textos les rompe la medición.

## Los eventos

| Evento | Cuándo | Parámetros | Clave |
|---|---|---|---|
| `page_view` | Al entrar y en cada cambio de página (no al filtrar) | `page_location`, `page_title` | No |
| `view_item` | Abrir una ficha de 0km, usado o plan | `item_id`, `item_name`, `item_category` | No |
| `whatsapp_click` | Clic en cualquier botón de WhatsApp | `component_id` + el auto si es de una ficha | **Sí** |
| `phone_click` | Clic en un teléfono | `component_id` | **Sí** |
| `view_search_results` | Aplicar filtros en usados (no al limpiarlos) | `results_count`, `filters_count`, `marca` | No |
| `form_submit` | Postulación enviada en Trabajá con nosotros | `form_id` | No |

Todos llevan además `location` (la sección: `home`, `okm_detail`, `usados_list`…),
que `track()` saca de la URL. Ningún componente la pasa.

`page_view` sale del código (`PageViewTracker`) porque la etiqueta de Google no
registraba la navegación sin recarga. En GTM su page_view automático va **apagado**;
si se prende, la primera visita se cuenta doble.

## Cómo se usa

- WhatsApp: `<WhatsAppLink href componentId item?>`.
- Teléfono: `<TelLink phone componentId>`.
- Ficha: `<ItemViewTracker item={buildItemParamsFrom{Auto|Usado|Plan}(...)} />`.
- Otro caso: `track(EVENTS.X, params)` de `dataLayer.js`.

`componentId` identifica el botón en GA4 (`whatsapp-floating`, `whatsapp-detalle-0km`…):
es estable, en kebab-case, y no se cambia al refactorizar estilos.

**Agregar un evento:** sumarlo a `EVENTS`, crear su etiqueta en GTM (sin etiqueta
no llega a GA4) y anotarlo en la tabla de arriba.

## Datos personales

Nunca se manda nombre, email, teléfono, DNI ni texto escrito por el usuario.
`track()` descarta esas claves como segunda defensa; la primera es no mandarlas.

## Consentimiento

Consent Mode v2: todo `denied` hasta que el usuario acepta en el banner
(`consent.js`, se guarda en `localStorage` como `indiana_consent_v1`).
Para volver a ver el banner: `localStorage.removeItem("indiana_consent_v1")` y recargar.

## Comprobar

- En desarrollo cada evento sale en la consola como `[analytics] {...}`.
- `dataLayer.slice(-5)` en la consola muestra los últimos.
- GTM → Vista previa contra el preview de Vercel de la rama.
- GA4 → Tiempo real / DebugView.
