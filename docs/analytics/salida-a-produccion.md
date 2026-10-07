# Medición simple: salida a producción y riesgos

Rama: `refactor/medicion-simple`. Qué se mide: `src/lib/analytics/README.md`. Estado previo y
vuelta atrás detallada: `docs/analytics/estado-previo.md`.
Escrito el 2026-10-06; corregido el 2026-10-07 después de la revisión de la Fase 1.

## Estado

| Pieza | Estado |
|---|---|
| Código | En la rama, `npm run check` en verde, revisado. Sin publicar |
| GTM (GTM-TPJCFTBB) | Publicada la **versión 9** (la de siempre). El espacio "medicion-simple" se crea en T13. Ver "GTM: qué espacio de trabajo" |
| GA4 | Conservación de eventos ya en 14 meses (T9). El resto, pendiente de la Fase 1 |
| Looker Studio | El tablero viejo ("Indiana — Dashboard") intacto. El nuevo se arma aparte |
| Agencia (GTM-M2J2LBRD, Ads, Pixel) | Sin tocar. Ningún texto de botón cambió |

## GTM: qué espacio de trabajo

Hay **un solo** espacio que se publica. Confundirlos pone en producción una versión rota.

| Espacio | Qué tiene | Qué se hace |
|---|---|---|
| ~~"Default Workspace"~~ (espacio 10) | 37 cambios de una importación vieja del 2026-10-06, sin puente, sin `lead_ref`, sin `debug_mode` | **Eliminado en T13** (2026-10-07). Si GTM vuelve a mostrar un espacio con ese contenido, no publicarlo |
| **"medicion-simple"** (espacio **11**, creado en T13) | `docs/analytics/gtm-medicion-simple.json` importado con **Sobrescribir**: 42 cambios (15 añadidos, 27 eliminados); 8 etiquetas, entre ellas "GA4 - Event - generate_lead (puente, se borra en Fase 7)" | **El único que se publica**, en la Fase 3 |

Publicar una versión sin el puente haría que `generate_lead` dejara de llegar apenas salga el
código nuevo (el código ya no lo empuja): "Leads" caería a 0.

Antes de apretar **Enviar** en la Fase 3, comprobar en pantalla:

1. El nombre del espacio arriba a la izquierda dice **medicion-simple**.
2. El resumen lista 8 etiquetas e incluye **"generate_lead (puente, se borra en Fase 7)"**.
3. No hay otro espacio de trabajo con cambios pendientes.

## Antes de probar fuera de producción

`NEXT_PUBLIC_ANALYTICS_TEST=true` (localhost o Preview de Vercel) hace que nuestro GTM cargue y
mande todo con `debug_mode`, **incluido el `generate_lead` del puente, que es evento clave**.
Sin el filtro de desarrolladores activo, esas pruebas entran a los informes e inflan "Leads" y
"% Conversión" del tablero viejo.

Por eso, **antes de prender la variable en cualquier lado**:

- GA4 → Administrar → Filtros de datos → **"Tráfico de desarrolladores"**, operación
  **Excluir**, estado **Activo** (T11). El filtro "Internal Traffic" que ya existe es otro
  (tráfico interno) y está en Prueba: no sirve para esto.
- Comprobar con una visita de prueba que aparece en **DebugView** y que **no** aparece en los
  informes del día siguiente.

La variable va **solo** en el entorno Preview de Vercel, nunca en Production.

## Comprobar que producción no sale marcada como prueba

GA4 toma **cualquier** valor de `debug_mode` como prueba (incluso `false`). En producción el
parámetro no tiene que viajar. Se comprueba en la Fase 2 (con la vista previa de GTM) y otra vez
en la Fase 4 (en producción):

- Herramientas de desarrollo del navegador → Red → filtrar `collect`.
- En los envíos a `G-9HJ64VGVLH`:
  - **producción** (`www.indiana.com.ar`, sin Tag Assistant): **no** llevan `_dbg` ni
    `ep.debug_mode`;
  - **prueba** (Preview con la variable prendida): **sí** llevan `_dbg=1`.
- Si un envío de producción lleva `_dbg`, volver atrás (ver abajo): esos datos quedarían fuera
  de los informes.

## Pasos de la salida, el mismo día y en este orden

1. **Pre-producción:** revisar los commits con Gonzalo; mezclar a `staging`, después a `main`.
2. **GTM:** publicar el espacio **"medicion-simple"** (ver la comprobación de arriba). La
   versión 9 queda para volver atrás.
3. **GA4** (Administrar):
   - Flujos de datos → Medición mejorada: apagar "cambios de página según el historial",
     "interacciones con formularios" y "clics de salida".
   - Eventos clave: **no tocar.** `generate_lead` (que ahora manda el puente de GTM) sigue
     siendo el único evento clave hasta la Fase 7. Marcar `whatsapp_click` o `phone_click`
     antes contaría cada contacto dos veces.
4. **Looker, tablero viejo:** arreglar la torta "Categoría de Lead" con el respaldo sobre
   `item_category`/`location`. Antes, copiar su fórmula original en `estado-previo.md`.
5. **Control:** clics reales en producción, GA4 en Tiempo real, la comprobación de `_dbg` de
   arriba; repetir a la semana.

Lo que ya no depende de la salida (identidad basada en dispositivo, conservación de 14 meses,
dimensiones `lead_ref`, `item_id` y `marca`, filtro de desarrolladores) se hace en la Fase 1.

## Riesgos importantes

1. **Orden de la salida.** Si sale el código sin publicar GTM, la primera visita de cada
   sesión se cuenta doble hasta publicar (el GTM viejo manda su propia visita). Si se publica
   GTM sin el código nuevo, se pierden las visitas hasta que salga el código. Van juntos.
2. **Publicar el espacio equivocado.** Ver "GTM: qué espacio de trabajo". Es el error con
   peor efecto: sin puente, "Leads" cae a 0.
3. **"Leads" no cambia el día de la salida.** Con el puente, `generate_lead` sigue contando
   WhatsApp, teléfono y postulaciones a empleo como antes, y sigue siendo el único evento
   clave: "Leads" y "% Conversión" del tablero viejo siguen iguales. Lo que sí cambia ese
   día son las **visitas**: suben, porque empiezan a contarse las navegaciones sin recargar.
   El cambio de definición de contacto (sin postulaciones) se hace en la Fase 7.
4. **Lo que se rompe del tablero viejo.** Solo la torta "Categoría de Lead": usa `Lead Type`,
   que el `whatsapp_click` nuevo ya no manda. Se arregla en el paso 4. Las tablas de
   vistas/contactos por modelo siguen (usan `item_name` e `item_category`). Las 7
   exploraciones que usan `select_item` o `view_item_list` quedan sin datos nuevos hasta
   rehacerlas.
5. **Pruebas que entran a los informes.** Ver "Antes de probar fuera de producción".
6. **`debug_mode` en producción.** Ver "Comprobar que producción no sale marcada como prueba".
7. **La agencia mide por el texto de los botones.** Cambiar "Contactar por WhatsApp",
   "Contactanos por WhatsApp", "Cotizá con nosotros", "Reservá tu turno" o "Consultá
   productos" les rompe sus conversiones de Ads. Cualquier cambio de diseño en esos botones
   pasa por ellos.
8. **El contenedor de la agencia comparte el dataLayer** y carga en todas las páginas. Si
   ellos cambian algo, puede afectar lo nuestro sin aviso; por ejemplo, si empujaran una clave
   `analytics_test` se prendería el modo prueba. Conviene un canal de aviso mutuo.
9. **Pixel de Meta sin consentimiento.** Se carga desde nuestro código y dispara aunque el
   usuario rechace las cookies. Es de la agencia (ninguna cuenta nuestra tiene acceso), pero
   el sitio es nuestro: riesgo legal. Está en las recomendaciones para la agencia.
10. **Datos de prueba viejos en GA4.** Las pruebas del 2026-10-06 dejaron unos pocos eventos
    con hostname `localhost` en nuestra propiedad y en la de la agencia. En Looker filtrar por
    hostname `www.indiana.com.ar`. Desde el commit `dba5993`, localhost ya no manda nada a
    nuestra propiedad; la de la agencia sigue recibiendo desde localhost (su contenedor no
    pasa por nuestro control).
11. **Remarketing de la agencia.** Una versión temprana de las pruebas dejó escapar pings de
    remarketing (y posiblemente 1 conversión de prueba de "Contactanos por WhatsApp", ~10:50
    del 2026-10-06) a la cuenta de Ads de la agencia, desde navegadores sin clic en anuncios.
    Impacto esperado: nulo en conversiones; se puede confirmar con ellos.
12. **GA4 con Google Signals.** Mientras la identidad no sea "basada en dispositivo", GA4
    oculta filas con pocos usuarios (umbrales): con el volumen de una concesionaria se
    pierden datos en los reportes.
13. **La referencia por chat solo sirve si ventas la anota.** Es un cambio de hábito del
    equipo comercial; sin eso, queda en GA4 pero no se cruza con ventas.
14. **Cookies rechazadas y bloqueadores.** GA4 ve menos a quien rechaza cookies (y nada a
    quien bloquea GTM, ~15–25% del tráfico real). Afecta a todos los sitios; los números son
    una muestra, no el total.

## Volver atrás

Detalle paso a paso en `estado-previo.md`. Resumen:

- GTM: Versiones → versión 9 → Publicar.
- Código: Vercel → Promote del despliegue anterior, o revertir el merge en `main`.
- GA4: los cambios de configuración se deshacen desde el mismo lugar.
