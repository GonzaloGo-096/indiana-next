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
| **C** (objetivo) | nuevo | **v11** (la v10 con el filtro de eventos automáticos; ver "Registro de la salida") | **apagadas** | Sí |

\* "La página cambia en función de los eventos del historial de navegación", "Interacciones con
formularios" y "Búsquedas en el sitio". Los clics de salida quedan prendidos siempre: no
duplican nada y sirven de control (clics a wa.me contra nuestros `whatsapp_click`).

**Regla: GTM v11 y las 3 opciones apagadas van siempre juntas.** v11 con las opciones prendidas
duplica `page_view` y mezcla el `form_submit` y el `view_search_results` automáticos de GA4 con
los nuestros; v9 con las opciones apagadas deja de contar las navegaciones sin recarga (la v9 no
tiene etiqueta de `page_view`). Por eso el código es una etapa y GTM + GA4 es otra.

| Código | GTM | 3 opciones | Resultado |
|---|---|---|---|
| viejo | v9 | prendidas | ✅ A |
| nuevo | v9 | prendidas | ✅ B |
| nuevo | v11 | apagadas | ✅ C |
| viejo | v11 | apagadas | ⚠️ Leads bien; el código viejo manda un `page_view` por cada filtro del listado. Solo minutos |
| cualquiera | v11 | prendidas | ❌ visitas dobles; formularios y búsquedas mezclados |
| cualquiera | v10 | cualquiera | ❌ visitas internas dobles: **no volver a publicarla** |
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
   inmediatamente anterior. En Vercel → Settings → Git → Deploy Hooks, ninguno apunta a `main`
   (ver "Congelamiento hasta el control a los 7 días").
4. Marca del código publicado. Los scripts de medición no están en el HTML sino en los JS que
   carga la portada; este comando los recorre:

   ```
   node -e 'const b="https://indiana.com.ar";(async()=>{const h=await(await fetch(b+"/")).text();let p=0,n=0;for(const u of new Set(h.match(/\/_next\/static\/[^"\x27\s]+?\.js/g))){const j=await(await fetch(b+u)).text();if(j.includes("fbq(\x27init\x27"))p++;if(j.includes("fbq(\x27consent\x27,\x27revoke\x27)"))n++}console.log({pixel:p,nuevo:n})})()'
   ```

   Código viejo: `{ pixel: 1, nuevo: 0 }` (comprobado en producción el 2026-11-02). Código
   nuevo: `nuevo` 1 o más (trae el Pixel en pausa). `pixel: 0` significa que el comando no
   encontró el JS del Pixel: la marca no sirve y se mira el despliegue en Vercel.
5. **Sin avisos previos** (decisión de Gonzalo, 2026-11-03): antes de la salida no se avisa a la
   agencia, al cliente ni a ventas. Se les informa después de comprobar que la medición funciona
   (ver "Aviso posterior"). **Esta condición no bloquea el inicio.**
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
| 1.3 | Consentimiento y Pixel: los 3 escenarios de "Consentimiento: qué mirar" | Claude, Gonzalo mira | Los 3 escenarios dan lo esperado | Falla de consentimiento → B → A inmediato |
| 1.4 | En Red, los `collect` sin `_dbg` ni `ep.debug_mode` | Claude | Ninguno lo lleva | Alguno lo lleva → B → A (esos datos quedarían fuera de los informes) |
| 1.5 | Clic de prueba de WhatsApp desde una ficha elegida antes, con cookies aceptadas | Gonzalo hace el clic, Claude lee GA4 | En Tiempo real, en menos de 5 min: `whatsapp_click` +1 y `generate_lead` +1 con ese auto; el mensaje termina en "(Ref. web XXXXX)" | Falta `generate_lead` → B → A |
| 1.6 | Observar B al menos 1 hora | Claude | Contactos de personas reales, cada uno con su `generate_lead` | Contactos reales sin `generate_lead` → B → A |

Al cerrar la etapa 1 se decide si la etapa 2 va ese día u otro: B es estable.

### Etapa 2: GTM v10 + GA4, una sola unidad (B → C)

Ejecutada el 2026-11-04. La tabla queda como se planeó; la v10 falló en el paso 2.5 y se reemplazó por
la v11 (ver "Registro de la salida").

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

1. Día de la salida en GA4:
   - leads contra contactos, con el procedimiento de "Validación de leads en GA4" (lectura
     provisoria; la definitiva es a los 2 días);
   - visitas por persona entre 2,4 y 4,5 (puede bajar un poco; no duplicarse);
   - ningún evento con `debug_mode` en los informes.
2. Looker: Leads y % Conversión dentro del rango; en la torta "Categoría de Lead", el clic de
   prueba de la ficha de un usado cae en **"Usados"** (fórmula v2, `estado-previo.md`).
3. Fuera de rango: investigar en menos de 4 h y decidir si se vuelve atrás.
4. Con los puntos 1 y 2 bien, mandar el "Aviso posterior", que incluye el pedido de datos de
   "Conversiones de la agencia".
5. Sigue el congelamiento hasta el control a los 7 días (ver "Congelamiento hasta el control a
   los 7 días").

### Aviso posterior

No hay avisos previos (condición 0.5). La agencia, el cliente y ventas se enteran **después de
comprobar que la nueva medición funciona**: cuando la etapa 3 da bien los puntos 1 y 2 (lectura
provisoria del día siguiente). Claude redacta los mensajes; Gonzalo los manda.

| A quién | Qué dice |
|---|---|
| Agencia | Qué cambió y cuándo (fecha y hora de las etapas 1 y 2); que el Pixel de Meta ahora espera el permiso del cartel, así que van a ver menos eventos desde esa hora; que no se tocó su contenedor ni los textos de sus botones; el pedido de datos de "Conversiones de la agencia"; que no cambien su contenedor ni esos textos hasta D+7 |
| Cliente | Que la medición nueva está funcionando y qué mide; cuándo llega el control de los 7 días |
| Ventas | Que los chats de quienes aceptan las cookies llegan con "(Ref. web XXXXX)" y para qué sirve anotarlo |

Si hubo una vuelta atrás antes del aviso, se cuenta en el mismo aviso.

**Riesgo aceptado:** entre la etapa 1 y el aviso (1 o 2 días), la agencia puede notar la baja de
eventos en Meta sin saber por qué. Si preguntan antes, se les manda el aviso en ese momento, sin
esperar la lectura.

### Control a los 7 días (D+7): cuándo la medición está terminada

1. Siete días en C sin vuelta atrás.
2. Leads contra contactos: los tres controles de "Validación de leads en GA4" bien, cada día y
   en el acumulado.
3. Personas que contactaron: **la semana completa** dentro del rango de las semanas de
   `linea-base.md` (entre la peor y la mejor; el 2026-11-01 es anómalo y no cuenta). No se
   compara día por día: con ~13 personas por día la variación diaria es mayor que cualquier
   margen útil.
4. Looker: Leads y % Conversión dentro del rango, y la torta clasificando bien.
5. Consentimiento: se repiten "Rechazar" y "Aceptar" de "Consentimiento: qué mirar", en
   producción, y dan lo esperado.
6. Agencia: Google Ads sin cambios; Meta leído con "Conversiones de la agencia".

Con todo bien, y con OK de Gonzalo: se mezcla la rama de documentación, se levanta el
congelamiento y se marca la etapa A como terminada en `docs/PLAN.md`.

### Validación de leads en GA4

Cada contacto (WhatsApp, teléfono, postulación a empleo) genera **un** `generate_lead`: lo
garantiza el código y lo prueba el test de contrato. Los dos eventos salen del mismo clic, en el
mismo momento y con el mismo consentimiento. Por eso el valor esperado de la diferencia es
**exactamente 0**, y una diferencia es una falla (por ejemplo, el puente que no se dispara), no
ruido. Con ~30 contactos por día un porcentaje engaña: un solo evento perdido ya es más del 3%,
y en una semana de 200 un margen del 5% esconde 10.

**Cómo se arma la comparación**, para que los dos lados se midan igual:

| Qué | Cómo | Por qué |
|---|---|---|
| Herramienta | GA4 → Explorar → **Exploración libre** "Validación leads salida". Los dos eventos en **la misma tabla** | Misma fuente, mismo rango, mismos filtros para las dos filas. No se compara un número de GA4 con uno de Looker ni de Tiempo real: Looker tiene hasta 12 h de caché y Tiempo real mira 30 min |
| Zona horaria | La de la propiedad: (GMT-03:00) hora de Buenos Aires (comprobado el 2026-11-03 en Administrar → Detalles de la propiedad). Las exploraciones siempre usan esa | Que "un día" sea el mismo día para los dos eventos |
| Fechas | Rango personalizado de **un solo día** (inicio = fin). Lectura provisoria al día siguiente; **definitiva a los 2 días** | GA4 termina de procesar en 24 a 48 h. Si el número cambia entre las dos lecturas, era procesamiento |
| Métrica | **Número de eventos**, la misma para todas las filas | No usar "Usuarios" ni "Eventos clave": cuentan otra cosa |
| Tabla 1 | Filas: **Nombre del evento**. Filtro: el nombre coincide exactamente con `generate_lead`, `whatsapp_click`, `phone_click` o `form_submit` | La diferencia del día |
| Tabla 2 | Filas: **Nombre del evento** y **Lead Source**. Mismo filtro | Cada canal contra su evento: `whatsapp` ↔ `whatsapp_click`, `phone` ↔ `phone_click`, `form` ↔ `form_submit` |
| Sin segmentos ni comparaciones | Ningún segmento, ninguna comparación, ningún filtro de hostname | Cualquier filtro extra se aplicaría distinto a cada evento |
| Muestreo | El indicador de la exploración tiene que decir que usa el 100% de los datos | Con muestreo, los números son estimados |

**`form_submit`:** el sitio solo lo manda en la postulación de empleo, pero mientras las 3
opciones de GA4 están prendidas (A y B), GA4 suma su `form_submit` automático y la comparación
no sirve (no hay dimensión `form_id` registrada para separarlos). Por eso el control vale para
los **días completos en C**. El día de la salida se mira con la dimensión **Hora**, solo desde la
hora siguiente al paso 2.3.

**Los tres controles:**

| Control | Pasa si | Se investiga si |
|---|---|---|
| Diferencia del día: `generate_lead` − (`whatsapp_click` + `phone_click` + `form_submit`) | Da 0 | Da 2 o más, en cualquier sentido |
| Por canal (tabla 2) | Cada par coincide; ningún `generate_lead` con Lead Source `(not set)` | Un canal falla (señala qué activador del puente está mal) |
| Acumulado de la semana: la suma de las diferencias **en valor absoluto** de los 7 días (un +1 y un −1 suman 2, no 0) | 2 o menos, y cada día distinto de 0 con su causa anotada | 3 o más, o un día distinto de 0 sin causa |

Una diferencia de 1 se acepta solo con causa conocida (por ejemplo, los 15 min de caché del día
de la salida). Cada lectura se anota en este documento: fecha, los 4 números y la diferencia.

### Conversiones de la agencia

**Qué se les pide** (en el "Aviso posterior"), por día, desde el 2026-10-20 hasta la salida y la
semana siguiente:

| Fuente | Datos |
|---|---|
| Google Ads | Por cada una de las 6 acciones de conversión: conversiones **por hora de la conversión** (no por fecha del clic: esas se siguen sumando días después) y clics |
| Meta (Administrador de eventos del Pixel) | `PageView` y cada evento de contacto que usen (que nos digan sus nombres) |
| Su GA4 (`G-9BJB9NYSBF`), opcional | `page_view`: tiene que quedar igual, sirve de control |

**Google Ads: no debería cambiar.** La salida no toca la parte de Google (el cartel y Consent
Mode ya están en producción) ni los textos de sus botones. Pasa si las conversiones por clic de la
semana quedan dentro del rango de las semanas anteriores. Si baja una sola acción, puede ser un
texto o un botón que cambió; si bajan todas, algo de la carga de su contenedor.

**Meta: va a bajar, y es lo esperado.** Desde la salida el Pixel solo manda lo de quienes aceptan
el cartel.

**La prueba principal de Meta es técnica, no estadística:** los escenarios de "Consentimiento:
qué mirar" y la "Prueba del PageView retenido", en la etapa 1, en el paso 2.6 y otra vez a los 7
días. Ahí se ve directamente que antes de aceptar no sale nada y que al aceptar sí.

Los números de Meta son un **indicador orientativo**, no una condición matemática. Como la pausa
afecta a todos los eventos por igual, la baja por consentimiento debería ser **parecida** en
`PageView` y en contactos. No se exige una proporción exacta: con poco volumen, las dos bajas
pueden diferir sin que haya falla. Sirven para decidir **qué mirar**:

| Lo que se ve | Lectura | Qué se hace |
|---|---|---|
| `PageView` y contactos bajan en una proporción parecida | Consentimiento | Nada |
| Los contactos bajan bastante más que los `PageView` | Puede haber una falla de contactos | Repetir la prueba técnica con un clic aceptado |
| `PageView` en 0 o casi 0 | El Pixel no carga o no recibe el permiso | Repetir la prueba técnica; si falla, es la falla funcional de "Consentimiento: qué mirar" |
| No bajan nada | La pausa no funciona | Repetir la prueba técnica; si sale algo antes de aceptar, es falla **de consentimiento** |

La decisión de volver atrás sale siempre de la prueba técnica, nunca solo de los números.

### Congelamiento hasta el control a los 7 días

**Qué es:** desde la etapa 0 hasta el control de D+7 no se mezcla ni se sube nada a `staging` ni
a `main`, no se publica nada en GTM y no se cambia la configuración de GA4.

**Cómo funciona la vuelta atrás en nuestro plan** (Vercel Hobby; documentación de `vercel
rollback` y API de Vercel, consultadas el 2026-11-03):

- Instant Rollback lleva producción al despliegue de producción **inmediatamente anterior**, y
  solo a ese. Pedir uno más viejo da el error "To roll back further than the previous production
  deployment, upgrade to pro".
- Hoy: producción es `dpl_AzSxqQN1UfnEbHmF4UfoC9Hemarg` (`main@04ef6eb`, A); el anterior es
  `dpl_8iw4nZXAD6kWsdL52sCULbnSuJMH` (`main@7b99624`).
- Después del paso 1.1: producción es el despliegue de la salida y el anterior pasa a ser
  `dpl_AzSx…` (A). **Ese es el destino que hay que conservar.**

**Qué mueve el destino** (todo lo que crea un despliegue de **producción**):

| Acción | ¿Mueve el destino? |
|---|---|
| Push o merge a `main` (rama de producción), aunque sea solo documentación | **Sí** |
| "Redeploy" de un despliegue de producción en el panel de Vercel, aunque sea el mismo código | **Sí** |
| `vercel --prod` o `vercel deploy --prod` desde la computadora | **Sí** |
| "Promote to Production" de cualquier despliegue | **Sí** |
| Un deploy hook que apunte a `main` (no verificado si existe: se mira en Settings → Git → Deploy Hooks en la etapa 0) | **Sí** |
| Cambiar una variable de entorno de producción | Por sí solo no, pero para que tome efecto hace falta un redeploy, que sí |
| Push a `staging` o a cualquier otra rama | No: son vistas previas (`target: null`, comprobado) |
| Cambios en GTM, GA4 o Looker | No (pero se congelan por la comparación) |

Si el destino se mueve, volver a A deja de ser un clic: hace falta el `git revert` y un despliegue
nuevo ("Volver al flujo normal de despliegue"), en medio de un problema.

**Qué más evita el congelamiento:**

- que otro cambio del sitio mueva los números y no se sepa si fue la medición;
- que haya commits encima del merge de la salida y el revert de emergencia tenga conflictos.

**Qué queda permitido:** trabajar en ramas (`feat/`, `fix/`, `docs/`…), commitearlas, subirlas y
ver su vista previa; leer GA4 y Looker y armar exploraciones; empezar el tablero nuevo de Looker
en una **copia**; preparar la segunda etapa (privacidad, pedidos a la agencia).

**Excepción:** una urgencia en producción (sitio caído, un precio mal mostrado), con OK de
Gonzalo. Se anota acá que el destino del rollback cambió y que ese día queda marcado en la
comparación. La actualización de los planes de ahorro entra en esta regla: si el cliente la
necesita antes de D+7, es una excepción; si no, va después.

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
| `G111`, `_ga` o `_ga_…` antes de aceptar, o después de rechazar | Google mide con cookies sin permiso | **Falla de consentimiento** | Inmediato: Instant Rollback del código; si estaba en C, después GTM v9 y las 3 opciones |
| `facebook.com/tr` o `_fbp` antes de aceptar, o después de rechazar | Meta recibe sin permiso | **Falla de consentimiento** | Inmediato: Instant Rollback del código; si estaba en C, después GTM v9 y las 3 opciones |
| Después de aceptar sigue `G100` o no aparece `_ga` | No mide a quien aceptó | Funcional | B → A e investigar |
| Después de aceptar no hay `facebook.com/tr` | La agencia pierde datos de Meta | Funcional (agencia) | B → A, contarlo en el aviso a la agencia, corregir en una rama |
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
| Dos `PageView` de la misma dirección en el paso 3 | Falla: Meta cuenta doble esa visita. Corregir en una rama; no es falla de consentimiento ni urgente |
| Ninguno en el paso 3 ni en el 4 | Falla funcional: B → A (ver la tabla de abajo) |
| Alguno **antes** de aceptar (paso 2) | Falla de consentimiento: B → A inmediato |

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
   rechazan): se les informa después de comprobar la medición (ver "Aviso posterior").
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
de consentimiento (Google o el Pixel envían sin permiso): ahí va primero el código (B → A, Instant Rollback) y después
GTM v9 y las 3 opciones, porque el consentimiento y el Pixel están en el código.

### Qué está autorizado de antemano

Si Gonzalo lo autoriza en el paso 0.8, vale **solo el día de la salida** y **solo cuando se
cumple una condición de detención escrita** en las etapas 1 y 2 o en "Consentimiento: qué
mirar". Ahí no se pide otra confirmación:

| Acción | Quién la hace | Lleva a |
|---|---|---|
| Vercel: Instant Rollback a `dpl_AzSxqQN1UfnEbHmF4UfoC9Hemarg` | Claude, apenas se cumple la condición (Gonzalo mira si está) | B → A |
| GTM: publicar la versión 9 | **No está autorizado de antemano.** Claude avisa y pide autorización expresa en el momento; con el OK, Gonzalo lo hace guiado por Claude | C → B |
| GA4: prender las 3 opciones de la medición mejorada, después de comprobar la v9 | Igual que GTM: autorización expresa en el momento | C → B |
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
- reintentar: volver a publicar la v11 (nunca la v10: cuenta doble) o volver a mergear;
- volver atrás por un motivo que no es una condición de detención escrita (por criterio);
- cualquier cambio en Looker, en otra configuración de GA4 o en el contenedor de la agencia;
- todo lo posterior al día de la salida.

Las acciones automáticas se avisan en el chat en el momento, con qué condición se cumplió.

### C → B: GTM v9 y las 3 opciones prendidas

1. **GTM:** Versiones → versión 9 → menú ⋮ → **Publicar**.
   - Comprobar: en Versiones, la 9 figura "Publicada". La v11 queda en la lista: para
     reintentar se publica de nuevo la v11, sin reimportar nada.
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
   producción desde la etapa 0 hasta D+7 (ver "Congelamiento hasta el control a los 7 días").
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

Anotar en este documento qué falló, en qué paso y en qué estado quedó el sitio. Si el "Aviso
posterior" ya salió, avisar a la agencia, al cliente y a ventas; si no, se cuenta en ese aviso
cuando se mande.

## Registro de la salida

### 2026-11-03: etapa 1 (A → B)

- 15:39: merge `staging` → `main` (`f0a7aae`), push. Despliegue `dpl_918ZMhw3qoXnjoPvCRPZDQPGdioo`,
  "Ready" a las 15:40. Destino de la vuelta atrás: `dpl_AzSxqQN1UfnEbHmF4UfoC9Hemarg`.
- Marca `{ pixel: 1, nuevo: 1 }`; smoke 14/14; sin errores nuevos en Vercel.
- Consentimiento (1.3), en contextos limpios: sin responder y rechazar, ningún envío a Meta ni
  cookies; aceptar, `G111`, `_ga` y `_fbp`, y el PageView retenido sale en la misma página. Ojo:
  Meta descarta los envíos de navegadores automáticos ("HeadlessChrome"); la prueba vale con un
  user agent de Chrome normal.
- Sin `_dbg` ni `debug_mode` (1.4).
- **Clic de prueba 1.5:** 15:58 a 16:02, ficha Ford Focus 2014, **Ref. web SCMNN**, sin enviar el
  mensaje. Tiempo real: `whatsapp_click` 1 y `generate_lead` 1 con ese auto. Se descuenta en los
  controles.
- Observación 1.6 hasta 16:40: contactos reales con su `generate_lead`, uno a uno.
- Autorización previa (0.8), dada por Gonzalo al autorizar la etapa 1: Claude puede hacer el
  Instant Rollback ante una condición de detención escrita. Volver GTM a la v9 y prender las 3
  opciones de GA4 **siempre** lleva su autorización expresa en el momento; si no responde, no se
  hace (se quitó la regla de los 15 minutos).
- Quedan sin probar con tráfico real: `phone_click`, `form_submit` y el WhatsApp flotante.

### 2026-11-04: etapa 2 (B → C), con un doble conteo corregido

**Control previo:** el 3-nov dio 21 `whatsapp_click` y 21 `generate_lead`, iguales hora por hora;
desde las 15:00, 10 y 10, incluida la prueba SCMNN.

| Hora | Qué pasó |
|---|---|
| 9:39:47 | 2.1: Gonzalo apaga las 3 opciones de GA4; comprobado reabriendo el panel |
| 10:07 | 2.2: Gonzalo publica la v10, 27 minutos después de GA4 |
| 10:23 | 2.3: `gtm:publicado` da "Todo ok" |
| ~10:26 | 2.4: prueba **HDMUV**, una vez en cada evento |
| 10:39 y 10:53 | 2.5 **falla**: 3 páginas con 2 vistas cada una; un clic en Postventa suma 2. Condición de detención; opciones de GA4 sin cambios |
| 11:13 a 12:08 | Gonzalo decide corregir sin volver a la v9, con límite hasta las 12:15. Se aísla la causa y se arma la corrección sin publicarla |
| 12:17 | Gonzalo publica la **v11** |
| 12:32 | 2.3 repetido: "Todo ok" |
| ~12:50 | 2.4 y 2.5 repetidos: prueba **VMJG5**, una vez en cada evento; 3 páginas con 1 vista cada una |
| ~13:00 | 2.6: con cookies rechazadas, mensaje sin código y sin envío a Meta en la consola |

**Causa:** la etiqueta de Google Ads del contenedor de la agencia genera sola eventos `page_view` y
`form_submit`. Nuestros activadores respondían a cualquier evento con ese nombre, además de a los
avisos del sitio. El código empuja un solo `page_view` por página.

**Cómo se aisló, sin mandar datos:** sitio local con los dos contenedores reales y los envíos
respondidos dentro del navegador. Solo nuestro contenedor: 1 visita. Con el de la agencia: 2. Sin su
etiqueta de Ads: 1.

**Corrección (v11):** variable `DLV - eventModel` y la condición "`eventModel` es igual a
`undefined`" en `CE - page_view`, `CE - view_search_results`, `CE - form_submit` y
`CE - form_submit (empleo)`. Definida en `scripts/gtm-definition.mjs`. El contenedor de la agencia
no se tocó. Google no documenta `eventModel`: si lo cambia, vuelve el doble conteo. Evaluar después
de D+7 que el código use un nombre de evento propio.

**Datos del 4-nov:** las vistas no sirven de referencia. De 9:39 a 10:07 se pudieron contar de menos
las navegaciones internas, y de 10:07 a unas 12:32 quedaron dobles. Las pruebas de laboratorio no
mandaron datos. Sí llegaron a GA4 las pruebas de Gonzalo y una carga de la portada hecha por Claude
cerca de las 10:50.

**Límites:** la prueba de Meta del 2.6 se leyó en la consola, porque la pestaña Red tampoco mostró el
envío al aceptar.

**Sin resolver:** la referencia **8KYMJ** salió en un mensaje y no apareció en Tiempo real; **A6X43**
apareció una vez en cada evento y no se sabe de quién es. Se revisan en los informes del 5-nov.

**Pruebas de la tarde (Gonzalo, en incógnito):**
- ~15:35, WhatsApp flotante de `/planes`: **RSKQY**, una vez en `whatsapp_click` y una en
  `generate_lead`. WhatsApp se abrió de verdad.
- ~16:30, teléfono del pie: `phone_click` 1 y `generate_lead` 1, sin llamada real. Un clic anterior no
  apareció porque esa ventana tenía guardado el rechazo de las cookies.

**Sin probar con tráfico real:** el formulario de empleo, que todavía no entrega las postulaciones.

**Control a los 7 días:** 2026-11-11, contado desde la v11 (confirmado por Gonzalo).

**Anotaciones:** GA4, 3-nov y 4-nov. Looker queda sin anotación por decisión de Gonzalo: no tiene una
función propia, y un cuadro de texto lo vería cualquiera que abra el tablero. Tag
`release/medicion-simple` en `f0a7aae`.
