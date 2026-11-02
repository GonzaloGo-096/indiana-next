# Medición simple: salida a producción y riesgos

Rama: `refactor/medicion-simple`. Qué se mide: `src/lib/analytics/README.md`. Estado previo y
vuelta atrás detallada: `docs/analytics/estado-previo.md`.
Escrito el 2026-10-06; corregido el 2026-10-07 después de la revisión de la Fase 1 y otra vez
esa noche después de la auditoría (comprobaciones en producción y en el respaldo de la v9).
Actualizado el 2026-10-26 con la Etapa 0 y la auditoría de seis posturas: aviso de
compatibilidad, `lead_ref` solo con consentimiento, pasos con criterios de abort y vuelta atrás
en `main` y `staging`.
Actualizado el 2026-11-02 después de la certificación por pasos (código, GTM, GA4, Looker y
preparación): salida por etapas A → B → C con condiciones de avance y de detención, qué mirar del
consentimiento y vuelta atrás paso a paso.

## Estado

| Pieza | Estado |
|---|---|
| Código | En la rama, `npm run check` en verde, dos revisiones independientes y prueba real con Tag Assistant (2026-10-26). Sin publicar |
| GTM (GTM-TPJCFTBB) | Publicada la **versión 9** (la de siempre). El espacio "medicion-simple" ya está importado (T13), sin publicar. Ver "GTM: qué espacio de trabajo" |
| GA4 | Fase 1 hecha: 14 meses, filtro de desarrolladores activo, 3 dimensiones, identidad por dispositivo. Dimensión Results Count (`results_count`) creada el 2026-11-02 |
| Looker Studio | El tablero viejo ("Indiana — Dashboard") con la fórmula v2 de "Categoría de Lead" aplicada el 2026-11-02 (torta idéntica antes y después; `estado-previo.md`). El nuevo se arma aparte |
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

## Pasos de la salida (reescrito el 2026-11-02: por etapas, sin horarios)

La salida del 2026-10-29 no se hizo. Desde el 2026-11-02 se sale **por etapas**: cada paso
avanza solo si se cumple su condición, y se detiene si se cumple la de detención. No hay
horarios ni operaciones seguidas sin comprobar. Decide Gonzalo; Claude ejecuta lo suyo y
comprueba.

### Los tres estados

| Estado | Código | GTM | GA4: 3 opciones de medición mejorada* | ¿Se puede quedar así? |
|---|---|---|---|---|
| **A** (antes de salir) | viejo (`main@04ef6eb`) | v9 | prendidas | Sí |
| **B** (intermedio) | nuevo (`staging@0d46ac6`) | v9 | prendidas | **Sí, horas o días.** Leads cuenta por `LEAD_COMPAT`; las visitas, igual que en A |
| **C** (objetivo) | nuevo | v10 | **apagadas** | Sí |

\* "La página cambia en función de los eventos del historial de navegación", "Interacciones con
formularios" y "Búsquedas en el sitio". Los clics de salida quedan prendidos siempre: no
duplican nada y sirven de control (clics a wa.me contra nuestros `whatsapp_click`).

**Regla: GTM v10 y las 3 opciones apagadas van siempre juntas.** v10 con las opciones prendidas
duplica `page_view` y mezcla el `form_submit` y el `view_search_results` automáticos de GA4 con
los nuestros; v9 con las opciones apagadas deja de contar las navegaciones sin recarga (la v9 no
tiene etiqueta de `page_view`). Por eso el código es una etapa y GTM + GA4 es otra.

| Código | GTM | 3 opciones | Resultado |
|---|---|---|---|
| viejo | v9 | prendidas | ✅ A |
| nuevo | v9 | prendidas | ✅ B |
| nuevo | v10 | apagadas | ✅ C |
| viejo | v10 | apagadas | ⚠️ Leads bien; el código viejo manda un `page_view` por cada filtro del listado. Solo minutos |
| cualquiera | v10 | prendidas | ❌ visitas dobles; formularios y búsquedas mezclados |
| cualquiera | v9 | apagadas | ❌ se pierden las visitas sin recarga |

Toda vuelta atrás termina en un estado ✅ (ver "Volver atrás").

### Qué prueba qué

| Pregunta | Prueba que la responde | No alcanza |
|---|---|---|
| ¿El sitio funciona? | `node scripts/smoke.mjs https://indiana.com.ar` 14/14, WhatsApp abre al primer clic, el cartel aparece, consola sin errores nuevos | — |
| ¿El navegador mandó el evento? | Herramientas de desarrollo → Red → `collect` a `G-9HJ64VGVLH` | — |
| ¿GA4 lo recibió? | Tiempo real o DebugView: el evento suma 1 **con el `lead_ref` del clic de prueba** (en B, que no manda `lead_ref`, con el auto elegido y la hora anotada) | Red: el envío puede salir y GA4 descartarlo |
| ¿GA4 lo procesó? | Informes estándar y Looker al día siguiente | Tiempo real |
| ¿Cumple con el consentimiento? | Red y cookies del navegador (ver "Consentimiento: qué mirar") | GA4: lo enviado sin permiso no aparece en ningún informe |

Un evento se da por bueno cuando GA4 lo muestra con el código del clic de prueba, no cuando
aparece en Red. Las pruebas en producción cuentan como leads reales y le llegan a la agencia:
como máximo 3, anotadas con su `lead_ref`.

### Etapa 0: condiciones para empezar (A)

Todas, comprobadas el mismo día. Si falta una, no se empieza.

1. `origin/staging` = `0d46ac6`, `origin/main` = `04ef6eb` (`git fetch && git rev-parse`).
2. GTM publicado: versión 9 (`npm run gtm:publicado` dice "versión 9"). Espacio
   "medicion-simple": 42 cambios (15 añadidos, 27 eliminados), sin avisos de conflicto.
3. Producción en `dpl_AzSxqQN1UfnEbHmF4UfoC9Hemarg` (`main@04ef6eb`), sin despliegues de
   producción posteriores: en el plan Hobby solo se puede volver al despliegue de producción
   inmediatamente anterior.
4. Marca del código publicado. Los scripts de medición no están en el HTML sino en los JS que
   carga la portada; este comando los recorre:

   ```
   node -e 'const b="https://indiana.com.ar";(async()=>{const h=await(await fetch(b+"/")).text();let p=0,n=0;for(const u of new Set(h.match(/\/_next\/static\/[^"\x27\s]+?\.js/g))){const j=await(await fetch(b+u)).text();if(j.includes("fbq(\x27init\x27"))p++;if(j.includes("fbq(\x27consent\x27,\x27revoke\x27)"))n++}console.log({pixel:p,nuevo:n})})()'
   ```

   Código viejo: `{ pixel: 1, nuevo: 0 }` (comprobado en producción el 2026-11-02). Código
   nuevo: `nuevo` 1 o más (trae el Pixel en pausa). `pixel: 0` significa que el comando no
   encontró el JS del Pixel: la marca no sirve y se mira el despliegue en Vercel.
5. Avisos enviados (agencia, cliente, ventas: `mensajes-fase1.md`).
6. Sesiones abiertas: GTM, GA4 y Looker (`infodigital@indiana.com.ar`, perfil "peugeot
   indiana"), Vercel (perfil "gona") y `git push` desde la computadora.
7. **2FA:** Gonzalo puede completar él mismo, en el momento, una verificación de
   `infodigital@indiana.com.ar` (hoy el segundo paso le llega a otra persona: si se depende de
   ella, tiene que estar disponible durante toda la salida). Los códigos **nunca** pasan por el
   chat: si una pantalla pide verificación, Claude avisa y Gonzalo la completa en el navegador.
8. Gonzalo da (o no) la autorización previa de "Volver atrás → Qué está autorizado de
   antemano". Se da ese día, en el chat; ninguna revisión anterior la da.

### Etapa 1: código nuevo (A → B)

| Paso | Qué | Quién | Para seguir | Se detiene si |
|---|---|---|---|---|
| 1.1 | `git checkout main && git pull --ff-only && git merge --no-ff staging -m "merge: publicar medicion simple a produccion"`, `git push`; esperar "Ready" en Vercel. Anotar el SHA del merge y el ID del despliegue | Claude, con OK de Gonzalo en el momento | Despliegue "Ready" y la marca del paso 0.4 da `nuevo` 1 o más | El build falla: producción no cambió, no se toca nada más |
| 1.2 | ¿El sitio funciona? (tabla "Qué prueba qué") | Claude | Las 4 pruebas bien | Algo no carga → Instant Rollback (B → A) |
| 1.3 | Consentimiento y Pixel: los 3 escenarios de "Consentimiento: qué mirar" | Claude, Gonzalo mira | Los 3 escenarios dan lo esperado | Resultado legal incorrecto → B → A inmediato |
| 1.4 | En Red, los `collect` sin `_dbg` ni `ep.debug_mode` | Claude | Ninguno lo lleva | Alguno lo lleva → B → A (esos datos quedarían fuera de los informes) |
| 1.5 | Clic de prueba de WhatsApp desde una ficha elegida antes, con cookies aceptadas | Gonzalo hace el clic, Claude lee GA4 | En Tiempo real, en menos de 5 min: `whatsapp_click` +1 y `generate_lead` +1 con ese auto; el mensaje termina en "(Ref. web XXXXX)" | Falta `generate_lead` → B → A |
| 1.6 | Observar B al menos 1 hora | Claude | Contactos de personas reales, cada uno con su `generate_lead` | Contactos reales sin `generate_lead` → B → A |

Al cerrar la etapa 1 se decide si la etapa 2 va ese día u otro: B es estable.

### Etapa 2: GTM v10 + GA4, una sola unidad (B → C)

| Paso | Qué | Quién | Para seguir | Se detiene si |
|---|---|---|---|---|
| 2.1 | GA4 → Flujo web → Medición mejorada: apagar las 3 opciones; los clics de salida quedan prendidos. Guardar | Gonzalo hace clic, Claude guía | Reabriendo el panel, las 3 apagadas | — |
| 2.2 | Enseguida: GTM → espacio "medicion-simple" → comprobar en pantalla el nombre del espacio, 42 cambios y la etiqueta "generate_lead (puente…)" → Enviar → Publicar, nombre `v10 medicion-simple AAAA-MM-DD`, descripción "volver = publicar v9" | Gonzalo hace clic, Claude guía | Versiones: v10 "Publicada" | GTM no deja publicar → volver a prender las 3 opciones (B) |
| 2.3 | Esperar 15 min (caché de `gtm.js`) y `npm run gtm:publicado` | Claude | "Todo ok" | Un faltante: comprobarlo a mano en Tiempo real; si es real → C → B |
| 2.4 | Clic de prueba en incógnito con cookies aceptadas; anotar su "Ref. web" | Gonzalo hace el clic, Claude lee GA4 | Tiempo real: en `whatsapp_click` y en `generate_lead`, el parámetro `lead_ref` muestra ese código una vez cada uno | Aparece dos veces en `generate_lead` o no aparece → C → B |
| 2.5 | Navegar 3 páginas en esa ventana | Claude | Red: un `page_view` por página. Tiempo real: `page_view` +3 | +6 → revisar que las 3 opciones quedaron apagadas; si lo están → C → B |
| 2.6 | Clic con cookies rechazadas, en otra ventana de incógnito | Gonzalo | El mensaje sale sin "(Ref. web)"; nada a `facebook.com/tr` | Envíos a Meta → B → A del código (ver "Volver atrás") |
| 2.7 | Anotaciones en GA4 y Looker (horas de código, GTM y medición mejorada), tag de git `release/medicion-simple`, mensaje "listo" | Claude y Gonzalo | — | — |
| 2.8 | Vigilar Tiempo real cada 2 h el resto del día y los runtime logs de Vercel en la primera hora | Claude | Contactos reales con su `generate_lead` | 2 h con `whatsapp_click` reales y ningún `generate_lead`, o visitas dobles → C → B; si en 30 min no mejora, B → A |

El orden 2.1 → 2.2 es a propósito: en los ~15 min de caché conviven visitantes con la
configuración vieja y la nueva. Con GA4 primero, el error posible es contar de menos algunas
navegaciones; con GTM primero sería contar doble. Contar de menos no ensucia los promedios.

### Etapa 3: confirmación en informes (C, día siguiente)

1. Informe del día de la salida en GA4:
   - `generate_lead` / (`whatsapp_click` + `phone_click` + `form_submit` de careers) entre 0,95 y 1,05;
   - personas que contactaron dentro del rango de `linea-base.md` (el 2026-11-01 es anómalo:
     no cuenta para el rango);
   - visitas por persona entre 2,5 y 4 (puede bajar un poco; no duplicarse);
   - ningún evento con `debug_mode` en los informes.
2. Looker: Leads y % Conversión dentro del rango; en la torta "Categoría de Lead", el clic de
   prueba de la ficha de un usado cae en **"Usados"** (fórmula v2, `estado-previo.md`).
3. Fuera de rango: investigar en menos de 4 h y decidir si se vuelve atrás.
4. Pedir a la agencia sus conversiones de Ads y Meta contra la semana anterior.
5. Levantar el congelamiento de `staging` y `main` recién después del control a los 7 días (el
   rollback rápido de Vercel solo llega al despliegue inmediatamente anterior).

## Consentimiento: qué mirar

Cada escenario en una ventana de incógnito **nueva** (sin cookies ni `localStorage` de antes).
Herramientas de desarrollo → **Red**, filtrando `collect` (Google) y `facebook` (Meta), y →
**Aplicación → Cookies** de `indiana.com.ar`.

| Escenario | Google (`collect` a `G-9HJ64VGVLH` y envíos de Ads de la agencia) | Cookies de Google | Meta | Cookie de Meta |
|---|---|---|---|---|
| **Sin responder** | Salen envíos con `gcs=G100` | **No** hay `_ga` ni `_ga_9HJ64VGVLH` | Se descarga `fbevents.js`; **ningún** envío a `facebook.com/tr` | **No** hay `_fbp` |
| **Rechazar** | Siguen con `gcs=G100`. `localStorage` → `indiana_consent_v1` con `analytics:false, ads:false`. Al recargar, el cartel no vuelve | **No** hay `_ga` | Ningún `facebook.com/tr` | **No** hay `_fbp` |
| **Aceptar** | Desde ahí, `gcs=G111`; sale de nuevo el `page_view` de la página (reenvío al aceptar tarde, con la campaña de entrada) | **Aparecen** `_ga` y `_ga_9HJ64VGVLH` | Aparece `facebook.com/tr?…ev=PageView`, en la misma página o recién al recargar (ver "Prueba del PageView retenido") | **Aparece** `_fbp` |
| **Aceptar y recargar** | El primer envío ya sale con `gcs=G111` | Siguen | `PageView` al cargar | Sigue |

`gcs` es `G1` + publicidad + analítica (1 concedido, 0 denegado): `G100` todo denegado, `G111`
todo concedido. Con nuestro cartel (solo "Aceptar todas" y "Rechazar") no deberían verse `G101`
ni `G110`. `gcd` lleva el detalle de las 4 señales de Consent Mode v2: es secundario, se mira
`gcs`.

| Resultado incorrecto | Qué significa | Gravedad | Qué se hace |
|---|---|---|---|
| `G111`, `_ga` o `_ga_…` antes de aceptar, o después de rechazar | Google mide con cookies sin permiso | **Legal** | Inmediato: Instant Rollback del código; si estaba en C, después GTM v9 y las 3 opciones |
| `facebook.com/tr` o `_fbp` antes de aceptar, o después de rechazar | Meta recibe sin permiso | **Legal** | Inmediato: Instant Rollback del código; si estaba en C, después GTM v9 y las 3 opciones |
| Después de aceptar sigue `G100` o no aparece `_ga` | No mide a quien aceptó | Funcional | B → A e investigar |
| Después de aceptar no hay `facebook.com/tr` | La agencia pierde datos de Meta | Funcional (agencia) | B → A, avisar a la agencia, corregir en una rama |
| Falta "(Ref. web)" con cookies aceptadas | Solo afecta a ventas | Menor | No se vuelve atrás; se corrige en una rama |

### Prueba del PageView retenido

El Pixel registra el `PageView` al cargar, en pausa. No está comprobado si al aceptar lo manda
en esa misma página o recién en la siguiente. Se prueba una vez, en la etapa 1:

1. Ventana de incógnito nueva. Red con "Conservar registro" activado y filtro `facebook.com/tr`.
2. Abrir una ficha (anotar su dirección). No tocar nada: la lista tiene que quedar vacía.
3. Aceptar las cookies **sin moverse de la página** y esperar 10 segundos. Anotar si aparece
   `tr?…ev=PageView` y con qué `dl=` (la dirección de la página).
4. Recargar con F5 (una carga completa: no depende de si el Pixel sigue las navegaciones
   internas del sitio). Tiene que aparecer un `PageView` con la dirección de esa página.

| Resultado | Lectura |
|---|---|
| Un `PageView` en el paso 3 con la dirección de la ficha, y otro en el 4 | Bien: el retenido sale al aceptar |
| Nada en el paso 3, uno en el 4 | Bien: Meta pierde solo la página donde se aceptó. Anotarlo para la agencia |
| Dos `PageView` de la misma dirección en el paso 3 | Falla: Meta cuenta doble esa visita. Corregir en una rama; no es legal ni urgente |
| Ninguno en el paso 3 ni en el 4 | Falla funcional: B → A (ver la tabla de abajo) |
| Alguno **antes** de aceptar (paso 2) | Falla legal: B → A inmediato |

**Señal técnica no es cumplimiento legal.** Estas pruebas demuestran qué sale del navegador en
cada caso. No demuestran que el diseño cumpla la ley, que depende de cosas que estas pruebas no
miran y que decide el cliente con su abogado (`docs/PLAN.md`, D1 y D2):

- el sitio todavía no tiene política de privacidad (`/privacidad` da error) y el cartel no la
  enlaza;
- antes de responder, Google recibe envíos **sin cookies** (`G100`) y el navegador descarga la
  librería de Meta (`fbevents.js`) aunque no mande eventos: los dos le muestran a Google y a Meta
  la IP y el navegador. Es el funcionamiento estándar de Consent Mode v2 "avanzado"; hay
  interpretaciones estrictas que piden no cargar nada antes del permiso.

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
   que el `whatsapp_click` nuevo ya no manda. Arreglado el 2026-11-02 con la fórmula v2, que
   reproduce la clasificación vieja (`estado-previo.md`). Además dejan de
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

Detalle de cada consola en `estado-previo.md`. Toda vuelta atrás termina en un estado ✅ (ver
"Los tres estados"): de C se vuelve a B y de B a A. De C a A se pasa por B, salvo ante una falla
legal de consentimiento o del Pixel: ahí va primero el código (B → A, Instant Rollback) y después
GTM v9 y las 3 opciones, porque el consentimiento y el Pixel están en el código.

### Qué está autorizado de antemano

Si Gonzalo lo autoriza en el paso 0.8, vale **solo el día de la salida** y **solo cuando se
cumple una condición de detención escrita** en las etapas 1 y 2 o en "Consentimiento: qué
mirar". Ahí no se pide otra confirmación:

| Acción | Quién la hace | Lleva a |
|---|---|---|
| Vercel: Instant Rollback a `dpl_AzSxqQN1UfnEbHmF4UfoC9Hemarg` | Claude, apenas se cumple la condición (Gonzalo mira si está) | B → A |
| GTM: publicar la versión 9 | Gonzalo, guiado por Claude. Si no responde al aviso en 15 min, Claude | C → B |
| GA4: prender las 3 opciones de la medición mejorada, después de comprobar la v9 | Igual que GTM | C → B |
| Dejar de avanzar (no pasar a la etapa siguiente) | Cualquiera de los dos | — |

Reglas en una vuelta atrás:

- una acción por vez, y se comprueba antes de la siguiente;
- antes de "Publicar" en GTM se escribe en el chat el número de versión que se va a publicar (9);
- si Google solicita una verificación de segundo factor, se detiene el procedimiento hasta que
  Gonzalo complete la verificación;
- los códigos de verificación nunca deben compartirse por el chat ni con Claude.

Siempre con autorización explícita de Gonzalo en el momento, aunque haya autorización previa:

- los `git revert` en `main` y `staging` (vuelta atrás definitiva);
- promover cualquier despliegue en Vercel (incluido el del revert);
- reintentar: volver a publicar la v10 o volver a mergear;
- volver atrás por un motivo que no es una condición de detención escrita (por criterio);
- cualquier cambio en Looker, en otra configuración de GA4 o en el contenedor de la agencia;
- todo lo posterior al día de la salida.

Las acciones automáticas se avisan en el chat en el momento, con qué condición se cumplió.

### C → B: GTM v9 y las 3 opciones prendidas

1. **GTM:** Versiones → versión 9 → menú ⋮ → **Publicar**.
   - Comprobar: en Versiones, la 9 figura "Publicada". La v10 queda en la lista: para
     reintentar se publica de nuevo la v10, sin reimportar nada.
   - Si la 9 no estuviera: importar `docs/analytics/backup/GTM-TPJCFTBB_v9.json` en un espacio
     nuevo con **Sobrescribir** y publicar (`estado-previo.md`).
2. **Enseguida, GA4:** Flujo web → Medición mejorada → prender "La página cambia en función de
   los eventos del historial de navegación" (en la configuración avanzada de Vistas de página),
   "Interacciones con formularios" y "Búsquedas en el sitio" → Guardar.
   - Comprobar: reabriendo el panel, las 7 opciones prendidas; en Historial de cambios de la
     propiedad, una entrada nueva de la medición mejorada.
   - El orden (GTM primero) es el inverso de la etapa 2, por el mismo motivo: en los minutos de
     caché el error posible es contar de menos, no doble.
3. **Comprobar B, pasados 15 min:**
   - `npm run gtm:publicado` muestra "versión 9" (fallan 8 chequeos: es lo esperado con la v9);
   - clic de prueba: `whatsapp_click` y `generate_lead` +1 en Tiempo real;
   - 3 páginas navegadas: `page_view` +3 en Tiempo real.

### B → A: código viejo, en minutos

1. **Vercel** (perfil "gona", pestaña nueva) → proyecto `indiana-next` → Deployments →
   `dpl_AzSxqQN1UfnEbHmF4UfoC9Hemarg` (`main@04ef6eb`) → **Instant Rollback** → confirmar.
   Equivalente: `vercel rollback <url de ese despliegue>`. En el plan Hobby solo se puede volver
   al despliegue de producción **inmediatamente anterior**: por eso no se despliega nada a
   producción entre la etapa 0 y la salida.
2. **Comprobar:**
   - la marca del paso 0.4 vuelve a dar `{ pixel: 1, nuevo: 0 }` (código viejo);
   - `node scripts/smoke.mjs https://indiana.com.ar` 14/14;
   - clic de prueba: `whatsapp_click` y `generate_lead` en Tiempo real (el código viejo los
     empuja los dos).
3. **Efecto en los despliegues siguientes:** después de un Instant Rollback, Vercel **deja de
   asignar el dominio de producción** a los despliegues nuevos. Lo que se suba a `main` se
   construye pero **no se publica**. Esto es lo que se quiere mientras se investiga.

### Volver al flujo normal de despliegue

Si el código no vuelve a salir ese día, la vuelta atrás definitiva se hace en git y después se
reactiva el flujo de Vercel:

1. Revertir el merge en `main` **y también en `staging`** (si solo se revierte en `main`,
   `staging` sigue con el código nuevo y el próximo pase lo vuelve a llevar, o lo lleva a
   medias). Es la única excepción a "nunca commitear directo a main/staging" de CLAUDE.md:

   ```
   git fetch origin
   git checkout main && git pull --ff-only
   git revert -m 1 <sha del merge de la salida en main> --no-edit && git push origin main
   git checkout staging && git pull --ff-only
   git revert -m 1 <sha del merge de la rama en staging> --no-edit && git push origin staging
   ```

2. Esperar que el despliegue del revert (`main@<sha del revert>`) quede en "Ready". Por el
   rollback, todavía **no** está en producción.
3. **Promoverlo:** Vercel → ese despliegue → ⋮ → **Promote to Production**, o
   `vercel promote <url del despliegue del revert>`. Promover **vuelve a activar la asignación
   automática del dominio** (documentación de Vercel, "Instant Rollback"). Ojo: promover el
   despliegue de la salida en vez del revert vuelve a poner el código nuevo.
4. Comprobar: la marca del paso 0.4 da `nuevo: 0`, `smoke.mjs` 14/14, y que el siguiente push a `main`
   (por ejemplo, un cambio de documentación) quede publicado solo.
5. Para reintentar la salida más adelante: rama nueva desde `staging` y `git revert <sha del
   revert en staging>`. **No** volver a mergear `refactor/medicion-simple`: git responde
   "Already up to date" y no trae nada (comprobado en simulación el 2026-10-27).

Si en cambio se corrige el problema y el código nuevo vuelve a salir, el despliegue nuevo se
promueve igual (paso 3), y eso también reactiva el flujo normal.

### Después de cualquier vuelta atrás

Avisar a la agencia, al cliente y a ventas, y anotar en este documento qué falló, en qué paso y
en qué estado quedó el sitio.
