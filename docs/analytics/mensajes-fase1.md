# Mensajes de la Fase 1 (T14)

## Versión final para la salida del jueves 29 de octubre (mandar el miércoles 28)

Actualizada el 2026-10-27 con lo decidido en pre-producción: el código "(Ref. web)" solo
aparece en los chats de quien aceptó las cookies, y el Pixel de Meta respeta la elección de
cookies. Los mensajes de más abajo son los borradores originales del 7 de octubre y quedan
como historia. No se envió nada todavía.

### Al cliente (Indiana)

> Hola, les cuento: **el jueves 29 a la mañana** publicamos la nueva medición del sitio.
>
> **Qué cambia.** Ordenamos lo que mide la web: de unos 25 eventos quedaron 6 que responden lo
> que importa (visitas, autos vistos, contactos por WhatsApp y teléfono, búsquedas en usados y
> postulaciones). Cada WhatsApp ahora dice desde qué botón salió y de qué auto, también el
> botón verde flotante, que es el 70 % de los contactos.
>
> **Lo que van a ver los vendedores.** En los chats de las personas que aceptaron las cookies
> del sitio, el mensaje termina con un código, por ejemplo "(Ref. web K7M2Q)". Si el vendedor
> lo anota cuando vende, se puede saber qué auto, qué botón y qué campaña trajo la venta. Quien
> rechazó las cookies escribe igual, pero sin código. Necesitamos una persona de ventas que
> coordine el registro.
>
> **Qué no cambia.** Los botones y textos del sitio son los mismos, y el número de "Leads" del
> tablero sigue contando igual. Ese día puede saltar "contactos por modelo": no es más demanda,
> es que antes el botón flotante no decía de qué auto era.
>
> **Sobre los números.** Analytics solo cuenta a quienes aceptan las cookies del aviso del
> sitio. Los números son de ese grupo, no del total de visitantes.
>
> **Lo que necesitamos de ustedes.**
> 1. **Una política de privacidad para el sitio**, con su abogado: hoy el sitio no tiene. Nosotros
>    armamos la página y los links; el texto legal tiene que venir de ustedes.
> 2. **Autorización para BigQuery**: una copia diaria de los datos. Requiere un proyecto de Google
>    Cloud a nombre de Indiana con una tarjeta cargada; con este tráfico el costo esperado es cero
>    o centavos. Solo guarda desde que se activa.
> 3. **Las IP fijas de cada sede**, para no contar como clientes los clics de vendedores.
> 4. **Una persona de ventas** que coordine el código "Ref. web".

### A la agencia

> Hola, les avisamos que **el jueves 29 a las 9:30** actualizamos la medición propia del sitio
> (nuestro GTM-TPJCFTBB y nuestro GA4). **No tocamos su contenedor GTM-M2J2LBRD, sus etiquetas ni
> Google Ads**, y no cambia ningún texto de botón: "Contactar por WhatsApp", "Contactanos por
> WhatsApp", "Cotizá con nosotros", "Reservá tu turno", "Consultá productos" y "Solicitar
> cotización" siguen iguales.
>
> Dos cosas que cambian y conviene que sepan:
>
> 1. **WhatsApp:** en los chats de quien aceptó las cookies, el mensaje prellenado termina con un
>    código "(Ref. web XXXXX)". El link y el número son los mismos.
> 2. **Pixel de Meta (870960458928397):** desde ese día respeta la elección de cookies del
>    visitante. Es un requisito legal para Indiana. Van a ver menos eventos en Meta: son los de
>    quienes rechazan.
>
> Y un pedido: **¿pueden vincular su cuenta de Google Ads con nuestra propiedad de GA4?** Hoy
> nuestro Analytics no ve los nombres de campaña, y en las últimas dos semanas los contactos que
> llegan desde Ads bajaron con el mismo tráfico: con el vínculo podemos ver qué campaña cambió.
> Además les permitiría importar como conversión el WhatsApp del botón flotante (el 70 % de los
> WhatsApp), que hoy sus conversiones no cuentan porque el botón no tiene texto. ¿Hubo algún cambio
> en las campañas de búsqueda desde el 12 de octubre?
>
> Y una propuesta, para que sus campañas se vean mejor en nuestros informes (sin cambiar nada de
> lo que miden ustedes): en los últimos 90 días, el tráfico de Google Ads llega bien marcado, pero
> el de **Taboola** (81 visitas, de las que mejor convierten) y algunos clics de **Display** llegan
> como "sitio que nos linkeó", sin decir que son pagos. Si les sirve, armamos juntos una forma
> única de etiquetar los links (`utm_source`, `utm_medium`, `utm_campaign`) para Taboola, Meta, los
> mails y el Linktree. El sitio ya conserva esas etiquetas aunque la persona navegue antes de
> aceptar las cookies.
>
> Cualquier cosa, estamos.

### Al equipo de ventas (puede ir dentro del mensaje al cliente)

> Desde el jueves 29, algunos mensajes de WhatsApp que llegan desde la web van a terminar con un
> código, por ejemplo "(Ref. web K7M2Q)". No hay que responder nada distinto. Si ese contacto
> termina en una venta o en una visita al salón, anoten el código con la fecha: con eso sabemos qué
> auto miró y de qué anuncio vino. Si el mensaje no trae código, no pasa nada: esa persona prefirió
> no aceptar las cookies del sitio.

---

## Borradores originales del 2026-10-07 (historia)

Borradores para que Gonzalo los revise y los mande. No se envió nada. Corregidos el
2026-10-07 a la noche, después de la auditoría: cada afirmación está comprobada.

## Al cliente (Indiana)

> Hola, les cuento cómo viene la medición del sitio.
>
> **Qué hicimos.** Revisamos todo lo que mide la web y lo ordenamos: de unos 25 eventos
> quedaron 6 que responden lo que importa (visitas, autos vistos, contactos por WhatsApp y
> teléfono, búsquedas en usados y postulaciones). Arreglamos datos que salían inflados (por
> ejemplo, 161 "formularios enviados" para 11 postulaciones reales) y ahora cada WhatsApp
> dice desde qué botón se hizo y, si fue desde la ficha de un auto, de cuál (también el botón
> verde flotante).
>
> **Un cambio que van a ver los vendedores.** El mensaje que llega por WhatsApp ahora termina
> con un código, por ejemplo "(Ref. web K7M2Q)". Sirve para unir ese chat con lo que pasó en
> la web: si el vendedor lo anota cuando vende, se puede saber qué auto, qué botón y qué
> campaña trajo la venta. Para eso necesitamos un responsable comercial que lo coordine.
>
> **Qué no cambia.** Los botones y textos del sitio son los mismos. El número de "Leads" del
> tablero actual sigue igual. Ese día van a notar un salto en "contactos por modelo", porque
> el botón flotante ahora dice de qué auto es: no es más demanda, es que antes no se sabía.
> Después armamos un tablero nuevo, más simple, separado por 0km, usados, planes y postventa.
>
> **Algo importante sobre los números.** Google Analytics solo cuenta a las personas que
> aceptan las cookies del aviso del sitio. Los números son de ese grupo, no del total de
> visitantes, y lo mismo pasa con los códigos de WhatsApp: un cliente que rechazó las cookies
> llega con su código, pero no aparece en Analytics.
>
> **Lo que necesitamos de ustedes.**
> 1. **Autorización para BigQuery.** Es una copia diaria y completa de los datos, sin
>    vencimiento. Requiere un proyecto de Google Cloud a nombre de Indiana con una tarjeta
>    cargada; con el tráfico del sitio el costo esperado es cero o centavos por mes. Guarda
>    datos solo desde el día que se activa, así que conviene hacerlo pronto.
> 2. **Las IP fijas de cada sede**, para que los clics de vendedores y recepción no se cuenten
>    como clientes.
> 3. **Una persona de ventas** que coordine el registro del código "Ref. web".
>
> **Un dato para Google Ads.** El 70% de los WhatsApp salen del botón flotante verde. Las
> conversiones de Google Ads, que maneja la agencia, no lo cuentan: se disparan por el texto
> del botón y ese botón es solo un ícono. Se lo pasamos a la agencia como sugerencia.

## A la agencia (mandar el día que publiquemos, Fase 3)

> Hola, les avisamos que el [fecha] actualizamos la medición propia del sitio (nuestro
> GTM-TPJCFTBB y nuestro GA4). **No tocamos su contenedor GTM-M2J2LBRD, sus etiquetas ni
> Google Ads**, y no cambió ningún texto de botón: "Contactar por WhatsApp", "Contactanos por
> WhatsApp", "Cotizá con nosotros", "Reservá tu turno", "Consultá productos" y "Solicitar
> cotización" siguen iguales. Lo único que cambia en los WhatsApp es que el mensaje
> prellenado termina con un código "(Ref. web XXXXX)"; el link y el número son los mismos.
> Si a futuro hace falta cambiar algún texto de botón, les avisamos antes.
>
> De paso, cosas que vimos de su lado, por si les sirven (no las tocamos):
>
> 1. **El WhatsApp flotante no se cuenta en Ads.** Es el 70% de los WhatsApp (714 de 1.025
>    en 28 días) y no tiene texto, solo el ícono. Se podría disparar por el enlace a wa.me, o
>    importar a Ads el evento de nuestro GA4 si vinculamos las cuentas.
> 2. **Planes:** el disparador busca "SOLICITAR COTIZACIÓN" en mayúsculas y el botón dice
>    "Solicitar cotización", así que probablemente no se esté contando. Conviene comparar sin
>    distinguir mayúsculas.
> 3. **Fichas de usados:** si un anuncio lleva a una ficha con la dirección corta, el sitio
>    redirige y hasta ahora se perdían `gclid` y `utm`. Queda corregido con esta actualización;
>    igual conviene usar la dirección completa de la ficha (un salto menos).
> 4. Su etiqueta de Google manda todas las visitas (no solo la primera) también a la propiedad
>    G-9BJB9NYSBF, y tiene prendida la recolección automática de datos del usuario. ¿Es de
>    ustedes? ¿La usan?
>
> [Si Gonzalo aprueba que el Pixel respete el consentimiento, agregar:]
> 5. **Pixel de Meta:** desde el [fecha] el Pixel (870960458928397), que se carga desde el
>    código del sitio, va a respetar la elección de cookies del visitante. Es un requisito
>    legal para Indiana. Van a ver menos eventos en Meta: son los de quienes rechazan.
>
> Cualquier cosa, estamos.

## Qué se corrigió respecto del primer borrador

- "Cada contacto se cuenta una vez": la métrica Leads ya contaba bien; lo que se arregló es
  el detalle (botón, auto) y los formularios inflados.
- "Nada cambia en el sitio": el mensaje de WhatsApp lleva el código "Ref. web".
- "Los datos se guardan 14 meses": eso afecta solo a las exploraciones de GA4, no a los
  informes ni a Looker. Se sacó del mensaje.
- "El tablero actual sigue funcionando igual": Leads sí, pero contactos por modelo salta.
- El Pixel no es un tema solo de la agencia: lo carga nuestro código.
- La propiedad G-9BJB9NYSBF recibe todas las visitas, no solo la primera.
