# Medición: estado previo a la salida y vuelta atrás

Foto de cómo está todo **antes** de publicar la medición simple. Escrito el 2026-10-07.
Cada valor dice de dónde se leyó. Nada de esto se tocó para escribirlo.

## Respaldos

| Qué | Dónde | Huella SHA-256 |
|---|---|---|
| GTM versión 9 (exportada por Gonzalo el 2026-10-07 10:30) | `docs/analytics/backup/GTM-TPJCFTBB_v9.json` | `8225fa0fb0e72f07e0c12bfd27999b250ae53e86c75fd5c4bf4c67615c5bbc3d` |
| PDF del tablero viejo, período 23 sept – 6 oct 2026 | Fuera del repo: `Descargas/Indiana_—_Dashboard.pdf` (1.481.576 bytes) | `ee0acccf1c9214139760a93eb30c58ac2e8b7b9f5985b0eab08104eb12500eee` |

Para comprobar que un respaldo no cambió: `sha256sum <archivo>` tiene que dar la misma huella.

## Código

Leído con `git` el 2026-10-07.

- **Producción (`main`):** `04ef6eb3b58217121ec748820798bb5f5da0a7b7`, del 2026-10-06 09:40. Es el
  merge "publicar planes actualizados a octubre 2026". Ese código todavía manda
  `generate_lead` junto a cada `whatsapp_click`.
- **Rama de trabajo:** `refactor/medicion-simple` en `8ec86b1`, 7 commits por delante de `main`, sin
  publicar.

## GTM (GTM-TPJCFTBB)

Leído en Tag Manager el 2026-10-07 y en el respaldo.

- Cuenta `6351586507`, contenedor `250370263`, "www.indiana.com.ar", web.
- **Publicada: versión 9**, el 10 jun 2026 por infodigital@indiana.com.ar. Tiene 11 etiquetas,
  11 activadores y 19 variables, igual que el respaldo.
- **Espacio de trabajo 10** (el que abre por defecto): **37 cambios pendientes sin publicar**
  (10 agregados, 27 eliminados, 0 modificados). Los hizo infodigital "hace un día": es la
  importación vieja de la medición simple, la que **no** tiene `lead_ref`. Publicar ese
  espacio por error pondría en producción una versión incompleta. Se descarta en T13.

Etiquetas de la versión 9. Todas mandan a `G-9HJ64VGVLH`:

| Etiqueta | Evento | Se dispara con | Parámetros |
|---|---|---|---|
| GA4 - Base | etiqueta de Google, `send_page_view=true` | Initialization - All Pages | — |
| GA4 - Event - whatsapp_click | `whatsapp_click` | CE - whatsapp_click | component_source, location, component_id, item_name, lead_source, lead_type, vertical, message_template_id, phone_number_hash, item_category, item_id, modelo |
| GA4 - Event - generate_lead | `generate_lead` | CE - generate_lead | component_source, location, component_id, lead_type, vertical, message_template_id, phone_number_hash, lead_source, item_id, item_name, item_category |
| GA4 - Event - view_item | `view_item` | CE - view_item | component_source, location, component_id, item_category, item_id, item_name, modelo |
| GA4 - Event - view_item_list | `view_item_list` | CE - view_item_list | item_list_name, component_id, location, component_source |
| GA4 - Event - select_item | `select_item` | CE - select_item | component_source, location, component_id, item_category, item_id, item_name, modelo |
| GA4 - Event - cta_click | `cta_click` | CE - cta_click | component_source, location, component_id |
| GA4 - Event - gallery_open | `gallery_open` | CE - gallery_open | component_source, location, component_id |
| GA4 - Event - view_search_results | `view_search_results` | CE - view_search_results | location, component_id, results_count, filters_count, marca |
| GA4 - Event - phone_click | `phone_click` | CE - phone_click | component_source, location, component_id, phone_number_hash |
| GA4 - Event - form_submit | `form_submit` | CE - form_submit | form_id, location, success |

El activador "All Pages - Page View" existe, pero ninguna etiqueta lo usa. La visita la manda la
etiqueta de Google al iniciar.

## GA4 (propiedad "Indiana", p536382821)

Leído en Administrar el 2026-10-07.

| Ajuste | Valor actual | Qué cambia en la Fase 1 |
|---|---|---|
| Flujo web | "Indiana Next Metricas", `https://www.indiana.com.ar`, flujo `14826187436`, `G-9HJ64VGVLH` | — |
| Medición mejorada | **Las 7 opciones activadas**: vistas de página (con "cambios de página según el historial" **activado**), desplazamientos, clics de salida, búsquedas en el sitio, interacciones con formularios, vídeos, descargas | Nada. Se apaga el día de publicar (Fase 3) |
| Eventos clave | `generate_lead`, con datos. `close_convert_lead`, `purchase` y `qualify_lead` existen sin datos (plantillas de GA4) | **Nada.** `generate_lead` queda como único evento clave hasta la Fase 7 (decisión del puente) |
| Identidad para los informes | **Mezclado** | Basada en dispositivo (T8) |
| Conservación de datos | **Eventos: 2 meses.** Usuarios: 14 meses | Eventos a 14 meses (T9) |
| Dimensiones personalizadas (13, alcance evento) | Component ID, Item Category, Item List Name, Item Name, Item Variant, Lead Source, Lead Type, Location, Message Template ID, Modelo, Source, Ubicación del botón (`component_source`), vertical | Se agregan `lead_ref`, `item_id` y `marca` (T10). No se archiva ninguna |
| Filtros de datos | "Internal Traffic" (tráfico interno, excluir), en estado **Prueba** | Se agrega "Tráfico de desarrolladores", activo (T11) |
| Vínculo con Google Ads | Ninguno | — |
| Vínculo con BigQuery | Ninguno | Se crea (T12), con autorización de facturación del cliente |
| Historial de cambios de la propiedad | **Sin cambios** entre el 7 sept y el 7 oct 2026 | Sirve para comprobar que nadie tocó nada |

**Ojo con la conservación de 2 meses:** las exploraciones de GA4 no pueden mirar eventos de más
de 2 meses. Los informes estándar y Looker Studio no se ven afectados, porque usan datos
agregados.

## Looker Studio ("Indiana — Dashboard", `f4451be2-488d-474d-9b60-13398526269e`)

Leído en vivo el 2026-10-07. Fuente: conector GA4 "Indiana" (`f7d8c891-…`, revisión 11).
Contenido sin cambios desde el 14 jul 2026, 08:41.

| Gráfico | Cómo cuenta | Qué pasa con la medición nueva |
|---|---|---|
| Leads (págs. 1 y 2) | Número de eventos + filtro "Leads (generate_lead)": Nombre del evento = `generate_lead` | Sigue igual **gracias al puente** de GTM |
| % Conversión (págs. 1 y 2) | Campo calculado `calc_fnd6cxxg4d` = eventos clave ÷ usuarios activos | Sigue igual mientras `generate_lead` sea el único evento clave |
| Torta debajo de Leads | "Categoría de Lead" (calculada sobre `Lead Type`) + filtro "WhatsApp" (`whatsapp_click`) | **Se rompe:** el `whatsapp_click` nuevo no manda `lead_type` y todo caería en "RRHH/Otros". Se corrige el día de publicar con un respaldo sobre `item_category`/`location` |
| Tablas Vistas/Contacto por modelo (págs. 3 a 5) | Datos combinados: `view_item` + `whatsapp_click` por Item Name e Item Category | Siguen: los eventos nuevos mandan `item_name` e `item_category` |

**Abrir el editor de Looker crea entradas en el historial de versiones aunque no se cambie
nada.** El 2026-10-07 aparecieron las de 11:40, 11:47 y 12:33. Se compararon contra la del
14 jul y son idénticas.

## Vuelta atrás

Se usa si después de publicar algo sale mal. **GTM y el código vuelven juntos.** Si vuelve uno
solo, se cuentan doble o se pierden las visitas (ver riesgo 1 de `salida-a-produccion.md`).

### 1. GTM

1. Tag Manager → contenedor GTM-TPJCFTBB → **Versiones**.
2. Abrir la **versión 9** → menú de tres puntos → **Publicar**.
3. Comprobar en "Versiones" que la 9 figura como "Publicada".

Si la versión 9 ya no estuviera en la lista:

1. Administrador → Importar contenedor → `docs/analytics/backup/GTM-TPJCFTBB_v9.json`.
2. Espacio de trabajo **nuevo** → **Sobrescribir**.
3. Enviar → Publicar.

### 2. Código

La forma rápida, en minutos: Vercel → proyecto `indiana-next` → Deployments → el último
despliegue de producción **anterior** a la salida → **Promote to Production**.

La forma definitiva, en el repo:

```
git checkout main
git revert -m 1 <commit del merge de la salida>
git push
```

Vercel publica solo. Hay que comprobar que producción vuelve a mandar `generate_lead`: en el
sitio, un clic de WhatsApp tiene que aparecer en GA4 → Tiempo real.

### 3. GA4

Cada cambio se deshace en el mismo lugar donde se hizo, y ninguno borra datos:

- **Medición mejorada:** volver a activar lo que se apagó. Los valores originales están en la
  tabla de arriba.
- **Eventos clave:** dejar `generate_lead` como único evento clave.
- **Identidad:** volver a "Mezclado". Es solo cómo se muestran los informes; no cambia los datos.
- **Conservación:** 14 meses no se revierte; no hace falta.
- **Dimensiones nuevas:** archivarlas si molestan. **No** archivar las 13 existentes, porque
  se pierde el acceso al historial con ellas.
- **Filtro de desarrolladores:** pasarlo a "Prueba" o "Inactivo".
- **BigQuery:** desvincular desde "Vinculaciones con BigQuery".

### 4. Looker Studio

- Lo único que se toca el día de publicar es el campo calculado "Categoría de Lead".
  **Antes de cambiarlo, copiar su fórmula original en este documento**, debajo de esta línea,
  para poder volver a pegarla.
- Si algo del tablero queda mal: Archivo → Historial de versiones → la última versión anterior
  a la salida → **Restaurar esta versión**.

Fórmula original de "Categoría de Lead": *(se completa el día de publicar, antes de editarla)*
