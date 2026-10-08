# Tablero de Looker Studio: diseño

Reemplaza a "Indiana — Dashboard". Ese tablero usa `generate_lead` (que sigue llegando por el
puente de GTM hasta la Fase 7) y sus exploraciones usan `select_item` y `view_item_list`, que
dejan de llegar con la medición simple. Se arma **después** de publicar, con una o dos semanas
de datos nuevos. `whatsapp_click` y `phone_click` ya llegaban antes con el mismo nombre: la
serie de contactos tiene historia (con un salto en contactos por modelo el día del corte,
porque el flotante pasa a decir de qué auto es).

## Reglas para no romper nada

- **Informe nuevo, fuente de datos nueva.** La fuente "Indiana" del tablero viejo tiene
  campos calculados propios ("Categoría de Lead") y la comparten los dos informes:
  editarla rompe el viejo. Crear una fuente nueva: conector Google Analytics →
  cuenta Indiana (71428151) → propiedad Indiana Next Metricas (536382821).
- El tablero viejo se archiva recién cuando el nuevo esté validado.
- Filtro de informe: **Nombre de host = indiana.com.ar o www.indiana.com.ar** (deja afuera
  pruebas desde `localhost` y versiones de prueba de Vercel). Las dos direcciones sirven el
  sitio y la oficial es sin www: filtrar solo www tira visitas reales (comprobado 2026-10-07).

## Campos calculados (en la fuente nueva)

**Contactos** (métrica):

```
SUM(CASE WHEN Nombre del evento IN ("whatsapp_click", "phone_click") THEN 1 ELSE 0 END)
```

(No usar "Eventos clave" para esto hasta la Fase 7: mientras exista el puente, el único evento
clave es `generate_lead`, que además incluye las postulaciones a empleo.)

**Área** (dimensión, desde el parámetro `location`):

```
CASE
  WHEN Location IN ("okm_list", "okm_detail") THEN "0km"
  WHEN Location IN ("usados_list", "usados_detail") THEN "Usados"
  WHEN Location IN ("planes_list", "plan_detail") THEN "Planes"
  WHEN Location = "postventa" THEN "Postventa"
  WHEN Location = "careers" THEN "Empleo"
  ELSE "General (inicio)"
END
```

**Botón** (dimensión, desde `component_id`):

```
CASE
  WHEN Component ID = "whatsapp-floating" THEN "Flotante"
  WHEN REGEXP_MATCH(Component ID, "^whatsapp-(detalle|card-detalle)") THEN "Ficha"
  WHEN REGEXP_MATCH(Component ID, "^whatsapp-postventa") THEN "Postventa (servicio)"
  WHEN REGEXP_MATCH(Component ID, "^footer-") THEN "Footer (sede)"
  ELSE "Otro"
END
```

**Canal** (dimensión, desde `Nombre del evento`): WhatsApp / Teléfono.

## Páginas

1. **Resumen**
   - Cuatro números del período, con comparación contra el anterior: contactos, WhatsApp,
     teléfono y visitas.
   - Serie semanal de contactos por canal.
   - Contactos por Área (barras).
   - Contactos por origen: Grupo de canales de la sesión (Paid Search, Organic, Referral…).
   - Contactos por dispositivo y por ciudad.
2. **0km**
   - Tabla por modelo: Item Name, Vistas (eventos `view_item`), Contactos y % contacto.
     Filtro: Item Category = 0km.
3. **Usados**: la misma tabla con Item Category = usado. Agregar las marcas buscadas
   (`view_search_results` por `marca`) y las búsquedas sin resultados.
4. **Planes**: la misma tabla con Item Category = plan.
5. **Postventa**: contactos por servicio (`whatsapp-postventa-service`, `-chapa-pintura`,
   `-repuestos`) y por sede del footer.
6. **Referencias**: tabla de `lead_ref` con fecha, Área, Item Name, Botón y Fuente/medio de
   la sesión. Es la que usa ventas para cruzar un chat ("Ref. web K7Q2M") con su visita.

## Entrega

- Programar envío por mail (Compartir → Programar envío) cada lunes, en PDF.
- Compartir con permiso de lector.

## Antes de dar por bueno

- Comparar los contactos del Resumen contra GA4 → Eventos (mismo período) para el evento
  `whatsapp_click` + `phone_click`.
- Revisar que "Item Name" de los contactos de 0km coincida con lo que se ve en la ficha.
