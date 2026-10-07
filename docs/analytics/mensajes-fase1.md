# Mensajes de la Fase 1 (T14)

Borradores para que Gonzalo los revise y los mande. No se envió nada.

## Al cliente (Indiana)

> Hola, les cuento cómo viene la medición del sitio.
>
> **Qué hicimos.** Revisamos todo lo que mide la web y lo simplificamos: de unos 25 eventos
> quedaron 6, y cada contacto (WhatsApp, llamada) se cuenta una sola vez. Cada WhatsApp
> ahora lleva un código "Ref. web" en el mensaje, para poder unir el contacto con la venta.
> Ya ajustamos Google Analytics: los datos se guardan 14 meses (antes eran 2) y las
> pruebas internas no se mezclan con los datos reales.
>
> **Qué van a notar.** Nada en el sitio: los botones y textos son los mismos. El tablero
> actual sigue funcionando igual y el número de "Leads" se mantiene comparable. Después
> armamos un tablero nuevo, más simple, separado por 0km, usados, planes y postventa.
>
> **Algo que necesitamos de ustedes.** Para guardar el detalle de cada contacto sin
> vencimiento, Google ofrece una copia diaria a una base de datos (BigQuery). Requiere un
> proyecto de Google Cloud a nombre de Indiana con una tarjeta cargada. Con el tráfico del
> sitio el costo esperado es cero o centavos por mes, pero Google pide la tarjeta igual.
> Guarda datos solo desde el día que se activa, así que conviene hacerlo pronto. ¿Nos
> autorizan a avanzar?
>
> **Un dato importante.** El 70% de los WhatsApp salen del botón flotante verde. Las
> conversiones de Google Ads que maneja la agencia no lo cuentan, porque se disparan por
> el texto del botón y ese botón es solo un ícono. Se lo pasamos a la agencia como
> sugerencia.

## A la agencia (mandar el día que publiquemos, Fase 3)

> Hola, les avisamos que el [fecha] actualizamos la medición propia del sitio (nuestro
> GTM-TPJCFTBB y nuestro GA4). **No tocamos su contenedor GTM-M2J2LBRD, sus etiquetas,
> Google Ads ni el Pixel**, y no cambió ningún texto de botón: "Contactar por WhatsApp",
> "Contactanos por WhatsApp", "Cotizá con nosotros", "Reservá tu turno", "Consultá
> productos" y "Solicitar cotización" siguen iguales. Si a futuro hace falta cambiar
> alguno, les avisamos antes.
>
> De paso, cosas que vimos de su lado, por si les sirven (no las tocamos):
>
> 1. **El WhatsApp flotante no se cuenta en Ads.** Es el 70% de los WhatsApp (714 de 1.025
>    en 28 días) y no tiene texto, solo el ícono. Se podría disparar por el enlace a
>    wa.me, o importar a Ads el evento whatsapp_click de nuestro GA4.
> 2. **Planes:** el disparador busca "SOLICITAR COTIZACIÓN" en mayúsculas y el botón dice
>    "Solicitar cotización". Conviene comparar sin distinguir mayúsculas.
> 3. **El Pixel de Meta** se carga aunque el visitante rechace las cookies. Se podría
>    pasar a su GTM con el consentimiento.
> 4. La primera visita también va a otra propiedad de GA4 (G-9BJB9NYSBF). ¿Es de ustedes?
>
> Cualquier cosa, estamos.

## Correcciones hechas en la presentación

- "Cada WhatsApp se contaba dos veces" → cada WhatsApp **mandaba dos eventos**. La métrica
  Leads lo contaba una vez; lo doble era el total de eventos.
- "Ese día los leads bajan" → con el puente, **Leads sigue igual** al publicar.
- WhatsApp y teléfono como eventos clave → recién en la Fase 7; hasta entonces el único es
  generate_lead.
- GTM: 8 etiquetas (con el puente), no 7. Tests: 530.
- Lo ya hecho en GA4 (14 meses, identidad, filtro, dimensiones) sale de los pasos del día
  de publicación.
