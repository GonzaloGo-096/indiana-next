# Medición simple: salida a producción y riesgos

Rama: `refactor/medicion-simple`. Detalle de qué se mide en `src/lib/analytics/README.md`.
Escrito el 2026-10-06, antes de publicar.

## Estado

| Pieza | Estado |
|---|---|
| Código | En la rama, `npm run check` en verde (510 tests), revisión de código aplicada |
| GTM (GTM-TPJCFTBB) | Importado en "Default Workspace" **sin publicar**. Falta reimportar la versión final (con `lead_ref`) |
| GA4 | Sin cambios todavía |
| Looker Studio | El tablero viejo ("Indiana — Dashboard") intacto. El nuevo se arma aparte |
| Agencia (GTM-M2J2LBRD, Ads, Pixel) | Sin tocar. Ningún texto de botón cambió |

Auditoría automatizada (2026-10-06), sitio nuevo + GTM sin publicar contra la versión de hoy:
24 páginas × compu/celular × acepta/rechaza cookies; 904 clics con exactamente 1 evento;
referencia del chat = referencia del evento 134/134; flotante con auto 16/16; conversiones
de Ads de la agencia 158/158 iguales; Pixel con los mismos eventos; 0 errores de JavaScript.

## Pasos, el mismo día y en este orden

1. **Pre-producción:** revisar los commits con Gonzalo; mezclar a `staging`, después a `main`.
2. **GTM:** Administrador → Importar contenedor → `docs/analytics/gtm-medicion-simple.json`
   → espacio de trabajo existente → **Sobrescribir** → Enviar → Publicar. La versión 9 queda
   para volver atrás.
3. **GA4** (Administrar):
   - Flujos de datos → Medición mejorada: apagar "cambios de página según el historial",
     "interacciones con formularios" y "clics de salida".
   - Eventos: marcar `whatsapp_click` y `phone_click` como eventos clave.
   - Identidad para los informes: **basada en dispositivo**.
   - Conservación de datos: **14 meses**.
   - Definiciones personalizadas: dimensiones `lead_ref` y `marca` (alcance evento).
4. **Control:** clics reales en producción y ver GA4 en Tiempo real; repetir a la semana.

## Riesgos importantes

1. **Orden de la salida.** Si sale el código sin publicar GTM, la primera visita de cada
   sesión se cuenta doble hasta publicar (el GTM viejo manda su propia visita). Si se publica
   GTM sin el código nuevo, se pierden las visitas hasta que salga el código. Van juntos.
2. **Los "leads" bajan el día de la salida.** Dejan de contarse los duplicados
   (`generate_lead`) y las postulaciones a empleo. No es una caída: es la cifra real.
   Avisar antes a quien mire los números.
3. **Reportes que se vacían.** El tablero de Looker viejo y las 7 exploraciones usan eventos
   que dejan de existir (`generate_lead`, `select_item`, `view_item_list`). Quedan vacíos
   hasta rehacerlos sobre los eventos nuevos.
4. **La agencia mide por el texto de los botones.** Cambiar "Contactar por WhatsApp",
   "Contactanos por WhatsApp", "Cotizá con nosotros", "Reservá tu turno" o "Consultá
   productos" les rompe sus conversiones de Ads. Cualquier cambio de diseño en esos botones
   pasa por ellos.
5. **El contenedor de la agencia comparte el dataLayer** y carga en todas las páginas. Si
   ellos cambian algo, puede afectar lo nuestro sin aviso. Conviene un canal de aviso mutuo.
6. **Pixel de Meta sin consentimiento.** Se carga desde nuestro código y dispara aunque el
   usuario rechace las cookies. Es de la agencia (ninguna cuenta nuestra tiene acceso), pero
   el sitio es nuestro: riesgo legal. Está en las recomendaciones para la agencia.
7. **Datos de prueba en GA4.** Las pruebas del 2026-10-06 dejaron unos pocos eventos con
   hostname `localhost` en nuestra propiedad y en la de la agencia. En Looker filtrar por
   hostname `www.indiana.com.ar`.
8. **Remarketing de la agencia.** Una versión temprana de las pruebas dejó escapar pings de
   remarketing (y posiblemente 1 conversión de prueba de "Contactanos por WhatsApp", ~10:50
   del 2026-10-06) a la cuenta de Ads de la agencia, desde navegadores sin clic en anuncios.
   Impacto esperado: nulo en conversiones; se puede confirmar con ellos.
9. **GA4 con Google Signals.** Mientras la identidad no sea "basada en dispositivo", GA4
   oculta filas con pocos usuarios (umbrales): con el volumen de una concesionaria se
   pierden datos en los reportes.
10. **La referencia por chat solo sirve si ventas la anota.** Es un cambio de hábito del
    equipo comercial; sin eso, queda en GA4 pero no se cruza con ventas.
11. **Cookies rechazadas y bloqueadores.** GA4 ve menos a quien rechaza cookies (y nada a
    quien bloquea GTM, ~15–25% del tráfico real). Afecta a todos los sitios; los números son
    una muestra, no el total.
12. **Default Workspace de GTM.** La importación lo sobrescribió (no tenía cambios
    pendientes). Si alguien más trabaja en ese contenedor, tiene que saberlo.

## Volver atrás

- GTM: Versiones → versión 9 → Publicar.
- Código: revertir el merge en `main` (Vercel publica la versión anterior).
- GA4: los cambios de configuración se deshacen desde el mismo lugar.
