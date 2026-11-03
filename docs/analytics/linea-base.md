# Línea base para la salida de la medición simple

Sacada de GA4 (propiedad "Indiana", informe Eventos, un día por vez) el 2026-10-27 y
actualizada el 2026-11-03 con la semana del 27 de octubre al 2 de noviembre, con la medición
vigente: código de `main@04ef6eb` y GTM versión 9. Es la vara para los controles del día de la
salida (D), del día siguiente (D+1) y de la semana siguiente (D+7). La salida del 29 de octubre
no se hizo.

## Contactos por día (`generate_lead`)

| Semana | Eventos | Personas que contactan | Eventos por persona |
|---|---:|---:|---:|
| 29 sep – 5 oct | 256 | 132 | 1,9 |
| 6 – 12 oct | 316 | 118 | 2,7 |
| 13 – 19 oct | 208 | 112 | 1,9 |
| 20 – 26 oct | 126 | 92 | 1,4 |
| **27 oct – 2 nov** | **298** | **128** | **2,3** |

La semana del 27 tiene 116 eventos del 1 de noviembre (ver abajo). Sin ese día, 182 eventos.
Rango de personas por semana en estas 5 semanas: **92 a 132**.

Día por día (los dos períodos de 7 días más recientes):

| Día | Eventos | Personas |
|---|---:|---:|
| Mar 20 | 14 | 13 |
| Mié 21 | 24 | 19 |
| **Jue 22** | **14** | **13** |
| Vie 23 | 22 | 14 |
| Sáb 24 | 12 | 7 |
| Dom 25 | 17 | 12 |
| Lun 26 | 23 | 14 |
| Mar 27 | 27 | 22 |
| Mié 28 | 39 | 25 |
| Jue 29 | 21 | 11 |
| Vie 30 | 20 | 15 |
| Sáb 31 | 16 | 11 |
| *Dom 1 nov* | *116* | *19* |
| Lun 2 nov | 59 | 26 |

**El 1 de noviembre es anómalo en eventos, no en personas:** 116 `generate_lead` y 138
`whatsapp_click` de 19 personas (6 a 7 toques cada una), casi todo desde el navegador interno de
Android y `google / cpc`. Se excluye de los promedios de eventos; sus personas sí cuentan.

Promedio del 20 al 26 de octubre: 18 eventos y 13 personas por día. Del 27 de octubre al 2 de
noviembre: **30 eventos por día sin el 1 de noviembre, y 18 personas por día**.

Ojo con los eventos: saltan mucho por los toques repetidos. El 10 de octubre hubo 99 eventos de
solo 17 personas (casi 6 toques cada una, sobre todo en el navegador interno de Android). Para
comparar días, **mirar personas, no eventos**: van de 7 a 28 por día en las últimas 5 semanas.

## Visitas por día (`page_view`)

Del martes 20 al lunes 26: 310, 289, 312, 254, 158, 260 y 245. Promedio 261 visitas y 81
personas por día.

Del martes 27 al lunes 2: 370, 227, 340, 213, 125, 188 y 319 (personas: 101, 80, 76, 71, 48, 78
y 99). Promedio **255 visitas y 79 personas por día**; visitas por persona entre 2,4 y 4,5. En las
5 semanas, entre 125 y 390 visitas por día.

Desde la salida las visitas pueden bajar un poco: dejan de contarse los filtros del listado y la
redirección de las fichas de usados (antes contaban como visitas).

## Por qué no hay criterio de abort por porcentaje en el día

Con unos 13 contactos por día, a las 12 del mediodía lo esperable son 3 o 4. "Menos del 40 % de lo
esperado" sería 1: el azar solo dispararía la alarma. Por eso, el día D se decide con señales que
no dependen del volumen:

1. **Los clics de prueba controlados** (9:45 y 10:05): cada uno tiene que aparecer en Tiempo real
   como `whatsapp_click` + `generate_lead`, con su `lead_ref`.
2. **Rotura de estructura:** si en Tiempo real hay `whatsapp_click` de personas reales y ningún
   `generate_lead` durante 2 horas, algo se cortó.
3. **Visitas dobles:** en la pestaña Red, una navegación tiene que mandar un solo `page_view`.

Los números de esta página se usan en D+1 y D+7, con días completos.

## Controles con esta línea base

| Cuándo | Qué se compara | Rango esperado |
|---|---|---|
| D+1 | Personas que contactaron el día D | 7 a 28 (el rango de las últimas 5 semanas) |
| D+1 y D+7 | `generate_lead` − (`whatsapp_click` + `phone_click` + `form_submit`), por día y por canal | 0 (1 solo con causa conocida); suma de las diferencias absolutas de la semana 2 o menos. Procedimiento: `salida-a-produccion.md` → "Validación de leads en GA4" |
| D+1 | Visitas por persona | 2,4 a 4,5 (rango de los últimos 14 días; puede bajar un poco, no duplicarse) |
| D+7 | Personas que contactan en la semana completa | 92 a 132 (rango de las 5 semanas) |
| D+7 | Ningún evento con `debug_mode` en los informes | 0 |
