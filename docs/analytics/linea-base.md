# Línea base para la salida del jueves 29 de octubre

Sacada de GA4 (propiedad "Indiana", informe Eventos con dimensión Fecha) el 2026-10-27, con la
medición de hoy: código de `main` y GTM versión 9. Es la vara para los controles del día de la
salida (D), del día siguiente (D+1) y de la semana siguiente (D+7). El 28 se suma el día 27.

## Contactos por día (`generate_lead`)

| Semana | Eventos | Personas que contactan | Eventos por persona |
|---|---:|---:|---:|
| 29 sep – 5 oct | 256 | 132 | 1,9 |
| 6 – 12 oct | 316 | 118 | 2,7 |
| 13 – 19 oct | 208 | 112 | 1,9 |
| **20 – 26 oct** | **126** | **92** | **1,4** |

Últimos 7 días, día por día:

| Día | Eventos | Personas |
|---|---:|---:|
| Mar 20 | 14 | 13 |
| Mié 21 | 24 | 19 |
| **Jue 22** | **14** | **13** |
| Vie 23 | 22 | 14 |
| Sáb 24 | 12 | 7 |
| Dom 25 | 17 | 12 |
| Lun 26 | 23 | 14 |

Promedio de los últimos 7 días: **18 eventos y 13 personas por día**. El jueves anterior al de la
salida (22 de octubre): 14 eventos, 13 personas.

Ojo con los eventos: saltan mucho por los toques repetidos. El 10 de octubre hubo 99 eventos de
solo 17 personas (casi 6 toques cada una, sobre todo en el navegador interno de Android). Para
comparar días, **mirar personas, no eventos**: van de 7 a 28 por día en las últimas 4 semanas.

## Visitas por día (`page_view`)

Últimos 7 días: 310, 289, 312, 254, 158, 260 y 245 (martes 20 a lunes 26). Promedio **261 visitas
y 81 personas por día**; en las 4 semanas, entre 158 y 390.

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
| D+1 (viernes 30) | Personas que contactaron el jueves 29 | 7 a 28 (el rango de las últimas 4 semanas) |
| D+1 | `generate_lead` / (`whatsapp_click` + `phone_click` + postulaciones) | 0,95 a 1,05 |
| D+1 | Visitas por persona | 2,5 a 4 (hoy 2,5 a 4,1) |
| D+7 (jueves 5 nov) | Personas que contactan, promedio de 7 días | 8 a 20 (hoy 13) |
| D+7 | Ningún evento con `debug_mode` en los informes | 0 |
