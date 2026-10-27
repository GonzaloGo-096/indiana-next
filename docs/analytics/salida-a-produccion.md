# Medición simple: salida a producción y riesgos

Rama: `refactor/medicion-simple`. Qué se mide: `src/lib/analytics/README.md`. Estado previo y
vuelta atrás detallada: `docs/analytics/estado-previo.md`.
Escrito el 2026-10-06; corregido el 2026-10-07 después de la revisión de la Fase 1 y otra vez
esa noche después de la auditoría (comprobaciones en producción y en el respaldo de la v9).
Actualizado el 2026-10-26 con la Etapa 0 y la auditoría de seis posturas: aviso de
compatibilidad, `lead_ref` solo con consentimiento, pasos con criterios de abort y vuelta atrás
en `main` y `staging`.

## Estado

| Pieza | Estado |
|---|---|
| Código | En la rama, `npm run check` en verde, dos revisiones independientes y prueba real con Tag Assistant (2026-10-26). Sin publicar |
| GTM (GTM-TPJCFTBB) | Publicada la **versión 9** (la de siempre). El espacio "medicion-simple" ya está importado (T13), sin publicar. Ver "GTM: qué espacio de trabajo" |
| GA4 | Fase 1 hecha: 14 meses, filtro de desarrolladores activo, 3 dimensiones, identidad por dispositivo |
| Looker Studio | El tablero viejo ("Indiana — Dashboard") intacto. El nuevo se arma aparte |
| Agencia (GTM-M2J2LBRD, Ads, Pixel) | Sin tocar. Ningún texto de botón cambió |

## GTM: qué espacio de trabajo

Hay **un solo** espacio que se publica. Confundirlos pone en producción una versión rota.

| Espacio | Qué tiene | Qué se hace |
|---|---|---|
| ~~"Default Workspace"~~ (espacio 10) | 37 cambios de una importación vieja del 2026-10-06, sin puente, sin `lead_ref`, sin `debug_mode` | **Eliminado en T13** (2026-10-07). Si GTM vuelve a mostrar un espacio con ese contenido, no publicarlo |
| **"medicion-simple"** (espacio **11**, creado en T13) | `docs/analytics/gtm-medicion-simple.json` importado con **Sobrescribir**: 42 cambios (15 añadidos, 27 eliminados); 8 etiquetas, entre ellas "GA4 - Event - generate_lead (puente, se borra en Fase 7)" | **El único que se publica**, en la Fase 3 |

Con el aviso de compatibilidad el código sigue empujando `generate_lead`, pero el GTM nuevo no
lo escucha: en el GTM nuevo, `generate_lead` sale **solo** del puente. Publicar una versión sin
el puente dejaría "Leads" en 0.

Antes de apretar **Enviar** en la Fase 3, comprobar en pantalla:

1. El nombre del espacio arriba a la izquierda dice **medicion-simple**.
2. El resumen lista 8 etiquetas e incluye **"generate_lead (puente, se borra en Fase 7)"**.
3. No hay otro espacio de trabajo con cambios pendientes.

## Antes de probar fuera de producción

**Cómo se prueba (comprobado el 2026-10-26).** La vista previa de GTM no se conecta a las copias de
Vercel: están protegidas con login y Tag Assistant queda "Not Connected". Se prueba en la
computadora: `NEXT_PUBLIC_ANALYTICS_TEST=true npm run build`, después
`NEXT_PUBLIC_ANALYTICS_TEST=true npm run start`, y Vista previa contra
`http://localhost:3000/0km/208`. Es el mismo código que la copia. En la copia de Vercel sí se
comprueba lo que no necesita GTM: que no carguen la agencia ni el Pixel. Fuera de la vista
previa, una prueba con la versión 9 publicada sale sin `_dbg` y entra a los informes: no aceptar
cookies ni tocar WhatsApp en una copia sin la vista previa conectada.

Resultado de la prueba del 2026-10-26 (Tag Assistant, envíos reales con `_dbg=1`): aceptar tarde
reenvía `page_view` y `view_item`; WhatsApp de la ficha y flotante llevan botón, auto y
`lead_ref`; el puente manda `lead_source=whatsapp`; la búsqueda de usados manda `marca`,
`filters_count` y `results_count` (también con 0 resultados).

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
parámetro no tiene que viajar. **Solo se puede comprobar en la Fase 4**, en producción y sin
Tag Assistant: la vista previa de GTM marca todo como prueba (`_dbg=1`) sea cual sea la
configuración. En la Fase 2 solo se mira que, sin la marca `analytics_test`, la etiqueta tenga
`debug_mode` indefinido.

- Herramientas de desarrollo del navegador → Red → filtrar `collect`.
- En los envíos a `G-9HJ64VGVLH` (mirar la pestaña de **carga útil**: GA4 junta varios eventos
  en un solo envío): **no** llevan `_dbg` ni `ep.debug_mode`.
- Si un envío de producción lleva `_dbg`, volver atrás (ver abajo): esos datos quedarían fuera
  de los informes.

## Pasos de la salida (reescrito el 2026-10-26 después de la auditoría)

Desde el aviso de compatibilidad (`LEAD_COMPAT` en `events.js`) el código sigue empujando
`generate_lead`, así que **en las cuatro combinaciones de código y GTM "Leads" sigue contando**
(las visitas no: el código viejo con el GTM nuevo manda también un `page_view` por cada filtro
del listado, así que ese estado intermedio dura lo menos posible) y el orden ya
no es obligatorio. Igual se sigue un orden fijo, el que deja cada paso fácil de volver atrás.

Decide Gonzalo, solo y en el momento, con los criterios de abajo. Si un criterio de abort se
cumple, se vuelve atrás ese paso sin discutir y se investiga después.

### Día anterior (D-1)

1. **Congelar.** `npm run check` en verde sobre la rama. Merge `--no-ff` de la rama a
   `staging`, anotar el SHA y esperar el build de Preview de staging en "Ready". Desde acá
   no entra nada más a `staging` ni a `main` hasta D+1.
2. **Producción sin modo prueba.** En Vercel → Environment Variables, `NEXT_PUBLIC_ANALYTICS_TEST`
   figura **solo** en Preview. Anotar el ID y la URL del despliegue de producción actual
   (hoy `dpl_AzSxqQN1UfnEbHmF4UfoC9Hemarg`, `main@04ef6eb`): es el destino de la vuelta atrás.
3. **Respaldos.** Comprobar la huella del respaldo v9 (`estado-previo.md`). Copiar la fórmula de
   "Categoría de Lead" de Looker en `estado-previo.md` y aplicar la que usa `Lead Type` si tiene
   valor y si no `item_category`/`location` (sirve antes y después del corte).
4. **Línea base.** De los últimos 7 días, por día: `generate_lead`, `whatsapp_click`,
   `page_view` y usuarios. Anotar también el mismo día de la semana anterior.
5. **Avisos con fecha y franja horaria:** agencia (borrador en `mensajes-fase1.md`, con el punto
   del Pixel), cliente y **equipo de ventas** (el "(Ref. web XXXXX)" les aparece desde ese día,
   solo en los chats de quien aceptó las cookies).
6. **Sesiones abiertas** en el perfil de Chrome correcto: Vercel, GitHub, GTM, GA4 y Looker. Los
   códigos de respaldo del 2FA a mano.

### Día de la salida (D), martes o miércoles desde las 9:30

| Hora | Paso | Criterio para seguir | Abort |
|---|---|---|---|
| 9:30 | **Código.** `main` ← `staging` (`--no-ff`), push, esperar "Ready" | `node scripts/smoke.mjs https://indiana.com.ar` 14/14; en Red, los `collect` a `G-9HJ64VGVLH` sin `_dbg` ni `ep.debug_mode`; con cookies aceptadas cargan `GTM-M2J2LBRD` y `fbevents.js`; con rechazadas, el Pixel no manda `PageView` | Build fallido (no se toca nada más) o un criterio falla → Instant Rollback al despliegue anotado |
| 9:45 | **Un clic de prueba** de WhatsApp desde la oficina, con la v9 todavía publicada | En Tiempo real: `whatsapp_click` y `generate_lead` en menos de 2 min. Anotar su `lead_ref` | Falta `generate_lead` → volver el código |
| 9:50 | **GTM.** Comprobar en pantalla espacio "medicion-simple" y las 8 etiquetas; publicar con nombre `v10 medicion-simple AAAA-MM-DD` y descripción "volver = publicar v9" | — | — |
| 9:50 | **GA4, en el mismo minuto.** Medición mejorada: apagar "cambios de página según el historial", "interacciones con formularios" y "búsquedas en el sitio". **Dejar prendidos los clics de salida** (no duplican nada y sirven de control: clics a wa.me contra nuestros `whatsapp_click`) | — | — |
| 10:05 | **Esperar** 15 min de caché de `gtm.js`; después un clic de prueba en una ventana de incógnito | `npm run gtm:publicado` da "Todo ok" (versión posterior a la 9, sin activador de `generate_lead`); `whatsapp_click` y `generate_lead` en Tiempo real; `page_view` una sola vez por navegación (en Red) | Falta `generate_lead` o `page_view` doble → publicar v9 y prender las 3 opciones |
| 10:25 | **Anotar** en GA4 y Looker las horas de código, GTM y medición mejorada; tag de git `release/medicion-simple`; mensaje "listo" a agencia, cliente y ventas | — | — |
| hasta 18:00 | **Vigilar** Tiempo real cada 2 h y los runtime logs de Vercel en la primera hora | — | `generate_lead` acumulado < 40 % de lo esperado por la línea base horaria, o `whatsapp_click` > 0 con `generate_lead` en 0 por más de 2 h → volver atrás |

Las pruebas en producción cuentan como leads reales y le llegan a la agencia: como máximo 2,
anotadas con su `lead_ref`.

### Día siguiente (D+1)

1. Informe del día D en GA4:
   - `generate_lead` / (`whatsapp_click` + `phone_click` + `form_submit` de careers) entre 0,95 y 1,05;
   - `generate_lead` entre 0,6 y 1,4 veces el mismo día de la semana anterior;
   - `page_view` por usuario entre 0,7 y 1,2 veces la línea base (puede bajar un poco; no duplicarse);
   - ningún evento con `debug_mode` en los informes.
2. Fuera de rango: investigar en menos de 4 h y decidir si se vuelve atrás.
3. Looker: Leads, % Conversión y la torta (Looker puede tardar horas en refrescar: se mira en D+1).
4. Pedir a la agencia sus conversiones de Ads y Meta contra la semana anterior.
5. Levantar el congelamiento.

## Riesgos importantes

1. **Orden de la salida: resuelto con el aviso de compatibilidad** (2026-10-26).
   - Antes, código nuevo con GTM v9 dejaba "Leads" en 0: la v9 cuenta el `generate_lead` que
     empuja el sitio y el código nuevo había dejado de empujarlo.
   - Ahora `track()` lo vuelve a empujar después de cada contacto (`LEAD_COMPAT`), y el GTM
     nuevo no tiene activador para ese evento: no hay doble conteo (el test de contrato lo
     exige). En las cuatro combinaciones "Leads" sigue contando y cada pieza se vuelve atrás sola.
   - El aviso se saca cuando la v9 ya no pueda volver (después del control de D+7).
2. **Publicar el espacio equivocado.** Ver "GTM: qué espacio de trabajo". Es el error con
   peor efecto: sin puente, "Leads" cae a 0.
3. **"Leads" no cambia el día de la salida.** Con el puente, `generate_lead` sigue contando
   WhatsApp, teléfono y postulaciones a empleo como antes, y sigue siendo el único evento
   clave: "Leads" y "% Conversión" del tablero viejo siguen iguales. Las **visitas** no
   deberían subir: las navegaciones sin recargar ya se contaban. Pueden bajar un poco, porque
   dejan de contar los cambios de filtro del listado, el salto de la redirección de usados y
   las salidas en menos de medio segundo. **Contactos por modelo** sí sube: el WhatsApp
   flotante (70% de los contactos) ahora dice de qué auto es. Anotarlo en GA4 y Looker ese día.
4. **Lo que se rompe del tablero viejo.** La torta "Categoría de Lead": usa `Lead Type`,
   que el `whatsapp_click` nuevo ya no manda. Se arregla en D-1 (paso 3). Además dejan de
   recibir datos las dimensiones viejas `vertical`, Message Template ID, `component_source`,
   Modelo y `success`: revisar que ningún otro gráfico las use. Las tablas de
   vistas/contactos por modelo siguen (usan `item_name` e `item_category`). Las 7
   exploraciones que usan `select_item` o `view_item_list` quedan sin datos nuevos hasta
   rehacerlas.
5. **Pruebas que entran a los informes.** Ver "Antes de probar fuera de producción".
6. **`debug_mode` en producción.** Ver "Comprobar que producción no sale marcada como prueba".
7. **La agencia mide por el texto de los botones.** Cambiar "Contactar por WhatsApp",
   "Contactanos por WhatsApp", "Cotizá con nosotros", "Reservá tu turno", "Consultá
   productos" o "Solicitar cotización" (ellos buscan "SOLICITAR COTIZACIÓN" en mayúsculas,
   que hoy no coincide) les rompe sus conversiones de Ads. Cualquier cambio de diseño en esos botones
   pasa por ellos.
8. **El contenedor de la agencia comparte el dataLayer** y carga en todas las páginas. Si
   ellos cambian algo, puede afectar lo nuestro sin aviso; por ejemplo, si empujaran una clave
   `analytics_test` se prendería el modo prueba. Conviene un canal de aviso mutuo.
9. **Pixel de Meta y consentimiento: resuelto en la rama** (`metaPixel.js`, 2026-10-07). Queda
   en pausa hasta que se aceptan las cookies de publicidad y no carga fuera de producción. Lo
   aprueba Gonzalo en pre-producción; la agencia va a ver menos eventos en Meta (los de quienes
   rechazan): avisarles en D-1.
10. **Datos de prueba viejos en GA4.** Las pruebas del 2026-10-06 dejaron unos pocos eventos
    con hostname `localhost` en nuestra propiedad y en la de la agencia. En Looker filtrar por
    hostname `indiana.com.ar` **o** `www.indiana.com.ar` (las dos direcciones sirven el sitio y
    la oficial, la del canonical, es sin www: filtrar solo www tira visitas reales). Desde el
    commit `dba5993` (cuando llegue a main), localhost ya no manda nada a nuestra propiedad, y
    desde `soloEnProduccion` (2026-10-26) el contenedor de la agencia y el Pixel tampoco cargan
    fuera de producción, ni en local ni en las copias de Vercel.
11. **Remarketing de la agencia.** Una versión temprana de las pruebas dejó escapar pings de
    remarketing (y posiblemente 1 conversión de prueba de "Contactanos por WhatsApp", ~10:50
    del 2026-10-06) a la cuenta de Ads de la agencia, desde navegadores sin clic en anuncios.
    Impacto esperado: nulo en conversiones; se puede confirmar con ellos.
12. **Identidad basada en dispositivo** (T8): evita que GA4 oculte filas con pocos usuarios.
    Tiene que quedar así: si alguien vuelve a "Mezclada", la tabla de referencias de chat
    (una persona por fila) empieza a perder filas. Y además quien acepta las cookies tarde
    contaría doble: el sitio reenvía su visita al aceptar porque lo enviado sin cookies no entra
    a los informes (`onAnalyticsGranted` en `consent.js`). Si se cambia la identidad, sacar
    ese reenvío.
13. **La referencia por chat solo existe con la medición aceptada** (desde 2026-10-26: quien
    rechaza escribe sin código, ver README). **Y solo sirve si ventas la anota.** Es un cambio de hábito del
    equipo comercial; sin eso, queda en GA4 pero no se cruza con ventas.
14. **Cookies rechazadas y bloqueadores.** Con identidad por dispositivo no hay modelado:
    quien rechaza las cookies **no aparece en los informes** ni en Looker, y quien bloquea GTM
    tampoco. Los números son de quienes aceptan, no el total, y una "Ref. web" de alguien que
    rechazó no se encuentra en GA4. Hay que decírselo al cliente.
15. **Redirección de fichas de usados.** Comprobado en producción (2026-10-07): una ficha con
    dirección corta redirige a la completa y **perdía `utm_*` y `gclid`** (la visita de un
    anuncio quedaba como directa). Y el listado linkea a la dirección corta (el backend no manda
    la versión en la lista): con el servidor lento se contaban **dos visitas** por ficha.
    **Arreglado en la rama:** la redirección conserva la query, y en las fichas la visita se
    cuenta recién cuando la ficha real se armó. Que el listado linkee directo a la dirección
    completa necesita que el backend mande `version` en la lista: pendiente del backend.
16. **WhatsApp con la ruedita.** No contaba el contacto ni llevaba referencia, y después de un
    clic el link quedaba con la referencia vieja. **Arreglado en la rama.** "Abrir en pestaña
    nueva" desde el menú del botón derecho no se puede detectar: abre el chat sin referencia y
    sin evento (es raro en WhatsApp).

## Volver atrás

Detalle de cada consola en `estado-previo.md`. Con el aviso de compatibilidad, código y GTM se
vuelven atrás **por separado**: se vuelve solo la pieza que falló.

1. **Código, en minutos:** Vercel → Deployments → el despliegue anotado en D-1 → Instant Rollback
   (o `vercel rollback <url anotada>`). En el plan Hobby solo se puede volver al despliegue
   inmediatamente anterior: por eso se anota y no se redespliega nada entre D-1 y D.
2. **GTM:** Versiones → versión 9 → Publicar. En el mismo minuto, en GA4 volver a prender las 3
   opciones de la medición mejorada que se apagaron.
3. **Comprobar:** un clic de prueba muestra `generate_lead` en Tiempo real.
4. **El mismo día, la vuelta atrás definitiva en git**, si el código no vuelve a salir:
   - revertir el merge en `main` **y también en `staging`** (si solo se revierte en `main`,
     `staging` sigue con el código nuevo y el próximo pase lo vuelve a llevar, o lo lleva a
     medias);
   - después, Undo Rollback en Vercel (mientras el rollback esté activo, Vercel no publica lo
     que se suba a `main`);
   - para reintentar más adelante: revertir el revert en una rama nueva.
5. Avisar a la agencia, al cliente y a ventas.
