# Plan general del frontend

El único plan del proyecto. Si una tarea no está acá, no está planeada. Cuando se termina algo,
se marca ✅ con la fecha; cuando aparece algo nuevo, se suma en la etapa que corresponde.

Escrito el 2026-10-27, después de revisar las notas, las ramas y `PENDIENTES-GONZALO.md`.

Quién: **C** = Claude · **G** = Gonzalo · **A** = agencia (One Page) · **B** = equipo del
backend · **Cl** = cliente (Indiana).

## El camino, de un vistazo

| Etapa | Qué | Cuándo |
|---|---|---|
| A | Salida de la medición nueva | 28 oct – 5 nov |
| B | Medición: de "cuánto" a "qué vende" | Noviembre, semanas 1 y 2 |
| C | Tablero para el cliente, rehecho | Noviembre, semanas 2 y 3 |
| D | Privacidad y seguridad | En paralelo, desde ya |
| E | Dos ramas con trabajo terminado sin publicar | Noviembre, semana 3 |
| F | Limpieza del frontend por partes | Desde fines de noviembre |
| G | Funciones que esperan al backend | Cuando el backend responda |

Las etapas A, B y C van en orden. D corre en paralelo porque depende sobre todo de otros.
F es la más larga y arranca cuando la medición está estable, para no mezclar cambios.

---

## A. Salida de la medición nueva

Detalle: `docs/analytics/salida-a-produccion.md`. Explicación completa: guía del 27-oct.

| # | Tarea | Quién | Cuándo | Listo cuando |
|---|---|---|---|---|
| A1 | Leer la prueba de 48 h: la campaña `prueba-g100b-20261026` **no** tiene que aparecer en Analytics. Si aparece, se saca el reenvío antes de seguir | C | Mié 28, primero | Resultado anotado |
| A2 | Mezclar `refactor/medicion-simple` y `docs/plan-general` a `staging`, `npm run check`, congelar staging y main hasta el viernes | C | Mié 28 | Preview "Ready" |
| A3 | Vercel: modo prueba solo en Preview; anotar el despliegue de producción de hoy (destino de la vuelta atrás) | C | Mié 28 | Anotado en el runbook |
| A4 | Sumar el día 27 a `docs/analytics/linea-base.md` | C | Mié 28 | Commit |
| A5 | Copiar la fórmula "Categoría de Lead" en Looker | G con guía | Mié 28, 10 min | Tablero sin errores |
| A6 | Mandar los avisos a la agencia, al cliente y a ventas (`mensajes-fase1.md`) | G | Mié 28, 10 min | Enviados |
| A7 | Mirar el consumo de Cloudinary (imágenes). El control vencía el 1 de julio | G (C guía) | Mié 28, 2 min | Número anotado; si pasa del 70 %, se planifica |
| A8 | **Salida**: código 9:30 → clic de prueba 9:45 → Tag Manager y 3 opciones de Analytics 9:50 → control 10:05 | C y G | **Jue 29** | `npm run gtm:publicado` da "Todo ok" |
| A9 | Vigilancia cada 2 horas | C | Jue 29 hasta 18:00 | Sin señales de abort |
| A10 | Control D+1 con la línea base | C | Vie 30 | Los 3 números en rango |
| A11 | Control D+7 y decidir si se saca el puente | C, publica G | Jue 5 nov | Puente decidido |

## B. Medición: de "cuánto" a "qué vende"

| # | Tarea | Quién | Listo cuando |
|---|---|---|---|
| B1 | Vincular Google Ads con nuestro Analytics | A (lo pide G) | Las campañas dejan de verse como "(not set)" |
| B2 | Probar el WhatsApp desde el navegador de la app de Google en Android | G, 5 min | Se sabe si abre al primer toque |
| B3 | Si B2 falla: arreglar el enlace y medir "abrió WhatsApp" | C | Toques por persona en Android cerca de 1,3 |
| B4 | **Decidir el número principal del tablero.** En julio decidiste contar toques ("quiero contar los 2 clicks"). La propuesta es mostrar los dos: toques y visitas con contacto | G | Decisión anotada |
| B5 | Que ventas anote el código "Ref. web" cuando hay venta o visita al salón | Cl (una persona que coordine) | Primeros 10 códigos cruzados |
| B6 | Una convención única de etiquetas de campaña (Taboola, Meta, mails, Linktree) | A (propuesta lista) | Las campañas llegan con nombre |
| B7 | Conectar Analytics con BigQuery (guarda los datos crudos sin el límite de 14 meses) | G autoriza | Exportación activa |

## C. Tablero para el cliente, rehecho

Con la salida desaparecen eventos que usa el tablero viejo (recorridos y algunas tablas).

| # | Tarea | Quién | Listo cuando |
|---|---|---|---|
| C1 | Inventario: qué gráfico del tablero viejo se queda sin datos | C | Lista |
| C2 | Rehacerlo con los 6 eventos: carátula, una sección por tipo de auto (usados, 0km, planes, postventa), "Contactos" en vez de "Leads" | C arma, G acomoda | El cliente lo puede leer solo |
| C3 | Página "nosotros vs agencia" | C | Publicada |
| C4 | Envío automático mensual en PDF al cliente | G configura | Primer envío |

## D. Privacidad y seguridad (en paralelo)

| # | Tarea | Quién | Por qué |
|---|---|---|---|
| D1 | Página de política de privacidad (hoy `/privacidad` da error) | Cl + abogado; C la publica | La ley la pide y el cartel de cookies debería enlazarla |
| D2 | Cartel de cookies v2: decir para qué es el código "Ref. web" y enlazar la política | C, después de D1 | Consentimiento informado |
| D3 | Pasar el repositorio de GitHub a privado | G, 1 min | Hoy cualquiera ve el código, las auditorías y los IDs |
| D4 | Rotar las credenciales de preview que quedaron escritas en un chat | B (lo pide G) | Seguridad básica |
| D5 | Sumar un segundo administrador a Analytics y Tag Manager (hoy el 2FA le llega a otra persona) | G | Si esa persona no está, nadie puede entrar |
| D6 | Decidir los avisos de error: Sentry o seguir mirando Vercel (`PENDIENTES-GONZALO.md` 1) | G | Enterarse de los errores sin ir a buscarlos |

## E. Ramas con trabajo terminado sin publicar

| # | Rama | Qué tiene | Cuidado |
|---|---|---|---|
| E1 | `claude/cuter-code-review-e8ohqm` | Footer nuevo: 13 commits del 24-ago (acordeón accesible, sedes en un solo lugar, teléfonos) | Toca botones de WhatsApp y teléfono: revisar que no cambien los textos (la agencia los usa) ni la medición |
| E2 | `feat/careers-envio-real` | Las postulaciones se mandan al backend (`/jobs/apply`), 2 commits | Confirmar con B que `/jobs/apply` existe en producción |

Cada una: traer staging, `npm run check`, revisión independiente, prueba, y mezclar con tu OK.

## F. Limpieza del frontend por partes

Plan del 2026-08-12, con las reglas de `docs/CONVENCIONES.md`. Partes 0 y 1 ✅ (2026-08-12).
Método por parte: inventario → auditoría → red de seguridad → cambios → cierre.

| # | Parte | Incluye además |
|---|---|---|
| F2 | Usados | — |
| F3 | 0km | Juntar `components/0km` y `components/ceroKm` |
| F4 | Panel de administración | Verificación de sesión: hoy solo mira si hay un token guardado |
| F5 | Resto de las páginas | Página de mantenimiento: conectarla o borrarla (`PENDIENTES-GONZALO.md` 3) |
| F6 | Base compartida (componentes y estilos) | Los tokens `--spacing-8` y `--spacing-10` que no existen (30 usos); TypeScript a medio poner |

## G. Funciones que esperan al backend

| # | Qué | Qué falta del backend |
|---|---|---|
| G1 | Sección "Oportunidades" en usados | Filtro por oferta en `getallphotos` |
| G2 | Auto vendido o pausado, con cartel | Campo `estado` (pedido escrito en `PENDIENTES-GONZALO.md`) |
| G3 | Sesión del panel más segura | Cookie de sesión del lado del servidor |
| G4 | Desplazamiento suave en el resto de los carruseles | Nada: se hace en F2/F3 |

## Cuándo está terminado

El plan termina cuando:

1. La medición está publicada y estable una semana (A).
2. El cliente recibe un tablero que contesta "qué trae contactos y cuáles venden" (B y C).
3. El sitio cumple con la ley de datos personales (D).
4. No quedan ramas con trabajo sin decidir (E).
5. Cada parte del código cumple `docs/CONVENCIONES.md` (F).

G queda abierta: depende de que el backend avance.
