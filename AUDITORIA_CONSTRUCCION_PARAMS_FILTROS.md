# Auditoría puntual: Construcción de params en server vs client

**Enfoque:** Duplicación y divergencia entre `vehiclesApi.server.js`, `vehiclesApi.js` y `utils/filters.js` en el armado de query params para el listado de vehículos.

**Contexto:** El sistema de filtros funciona. El Admin envía filtros correctamente al backend (validado manualmente). Esta auditoría analiza únicamente la construcción de params.

---

## 1. Estado actual real

### Cómo arma params el server (`vehiclesApi.server.js`)

El server construye los params **manualmente** dentro de `getVehicles` (líneas 132-158):

1. Crea `new URLSearchParams()` vacío.
2. Para cada filtro, replica la lógica en línea:
   - `marca`: si `filters.marca` es array con elementos → `join(",")` → `set("marca", ...)`
   - `caja`: igual
   - `combustible`: igual
   - `año`: si `filters.año` es array de 2 elementos → `set("anio", "${año[0]},${año[1]}")`
   - `precio`: igual con `filters.precio`
   - `kilometraje`: igual con `filters.kilometraje` → `set("km", ...)`
3. **No omite** rangos por defecto: si el array existe y tiene 2 elementos, siempre envía.
4. **No usa** `FILTER_DEFAULTS`.
5. **No incluye** `page` (solo `limit` y `cursor`).
6. Añade `limit` y `cursor` al final.

No importa ni usa `buildSearchParams` ni `filters.js`.

---

### Cómo arma params el client (`vehiclesApi.js`)

El client usa `buildSearchParams(filters)`:

1. Llama a `buildSearchParams(filters)` de `utils/filters.js`.
2. Sobre el `URLSearchParams` resultante hace `set("limit", limit)` y `set("cursor", cursor)`.
3. Usa ese objeto para la URL del request.

No modifica ni elimina ningún param que haya añadido `buildSearchParams`.

---

### Qué está centralizado vs duplicado

| Elemento | Ubicación | Usado por |
|----------|-----------|-----------|
| **buildSearchParams** | `utils/filters.js` | `vehiclesApi.js`, `VehiculosClient`, `UsadosClient` |
| **Lógica manual de filtros** | `vehiclesApi.server.js` (líneas 136-152) | Solo el server |
| **FILTER_DEFAULTS** | `constants/filterOptions.js` | `filters.js` (buildSearchParams), `FilterFormSimple`, `AdminFilters`, `Dashboard` |

**Centralizado:** La lógica del client está en `buildSearchParams`.  
**Duplicado:** La lógica del server está reescrita en el propio archivo del servicio, con la misma intención (arrays → strings, rangos → "min,max") pero sin compartir código.

---

## 2. Diferencias exactas entre server y client

| # | Aspecto | Server | Client (via buildSearchParams) |
|---|---------|--------|--------------------------------|
| 1 | **Omisión de rangos por defecto** | No omite. Siempre envía año, precio, km si existen como array de 2 elementos. | Omite año, precio, km si coinciden exactamente con FILTER_DEFAULTS (1990-2024, 5M-100M, 0-200k). |
| 2 | **Param `page`** | No lo añade nunca. | Lo añade si `filters.page` existe y es > 0. |
| 3 | **Param `cursor`** | Sí, siempre. | Sí, siempre. |
| 4 | **Param `limit`** | Sí, siempre. | Sí, siempre. |
| 5 | **Nombres de params** | `marca`, `caja`, `combustible`, `anio`, `precio`, `km` | Igual. |
| 6 | **Filtros soportados** | marca, caja, combustible, año, precio, kilometraje | Igual. |
| 7 | **Formato de entrada** | Espera `filters` en formato frontend (arrays, `año` con ñ). | Igual. |
| 8 | **Uso de constantes** | No usa FILTER_DEFAULTS. | Usa FILTER_DEFAULTS para decidir si envía rangos. |
| 9 | **Validación de tipos** | Comprueba `Array.isArray` y `length` antes de usar. | Igual. |
| 10 | **Orden de params en URL** | Depende del orden en el código (filtros primero, luego limit/cursor). | buildSearchParams: filtros primero; vehiclesApi añade limit y cursor al final. |

---

## 3. Impacto real de esas diferencias

### Diferencia 1: Omisión de defaults

- **Server:** Con `filters.año = [1990, 2024]` envía `anio=1990,2024`.
- **Client:** Con los mismos valores no envía `anio` (optimización).

**Impacto:** Irrelevante en la práctica. El backend suele tratar "sin anio" y "anio=1990,2024" de forma equivalente. Es una diferencia de tamaño de URL, no de semántica. Si el backend interpretara distinto la ausencia del param, sería un bug; no hay indicios de ello.

---

### Diferencia 2: Param `page`

- **Server:** No envía `page`.
- **Client:** Puede enviar `page` si `filters.page` existe (p. ej. desde `parseFilters` cuando la URL tiene `?page=2`).

**Impacto:** Deuda técnica. El backend usa `cursor`, no `page`. Enviar `page` es redundante. Si el backend ignora params desconocidos (habitual), no hay bug. Si algún día el backend usara `page` con otro significado, podría haber confusión. Riesgo bajo.

---

### Diferencia 3–9: Resto

**Impacto:** Irrelevante. Nombres, formato de entrada y filtros soportados son los mismos. La única diferencia relevante es la omisión de defaults (optimización) y el param `page` (posible ruido).

---

## 4. Riesgo de mantenibilidad

**Al agregar un filtro nuevo** (ej. `transmisión`):

1. **filters.js:** Añadir en `parseFilters` (lectura desde URL) y en `buildSearchParams` (escritura a params). Si es rango, decidir si usa FILTER_DEFAULTS.
2. **vehiclesApi.server.js:** Añadir el bloque manual equivalente (líneas 136–152).
3. **filterOptions.js:** Si es rango, añadir entradas en FILTER_DEFAULTS.

Hay que tocar al menos 2 archivos para la construcción de params (filters.js y vehiclesApi.server), más filterOptions si aplica.

**Al modificar un filtro existente** (ej. cambiar nombre de param o formato):

1. Si se cambia en `buildSearchParams`, el server no se actualiza automáticamente.
2. Si se cambia en el server, `buildSearchParams` no se actualiza.

El riesgo real es **olvidar una de las dos implementaciones** y que server y client generen requests distintos para el mismo filtro.

---

## 5. Qué partes NO tocaría

Dentro de este punto concreto, no tocaría:

1. **buildSearchParams:** Lógica correcta, usada por el client. Es el punto de referencia.
2. **parseFilters:** Correcta y simétrica con buildSearchParams.
3. **FILTER_DEFAULTS:** Bien centralizado y usado.
4. **vehiclesApi.js:** Su uso de buildSearchParams es correcto. Solo añade limit/cursor.
5. **Formato interno de filtros** (objeto con arrays y rangos): Consistente y claro.
6. **Nombres de params** (marca, caja, anio, precio, km): Coinciden con lo que el backend espera.

Lo único que conviene unificar es **la construcción de los params de filtros** en el server, para que use la misma función que el client.

---

## 6. Estrategias de mejora

### Opción mínima

**Objetivo:** Unificar la construcción de filtros en el server usando `buildSearchParams`.

**Qué hacer:**
- En `vehiclesApi.server.js`, importar `buildSearchParams` de `utils/filters`.
- Sustituir el bloque manual (líneas 132–154) por:
  - `const params = buildSearchParams(filters);`
  - `params.delete("page");` (por si buildSearchParams lo añadió; el backend no lo usa).
  - `params.set("limit", ...)` y `params.set("cursor", ...)`.
- Usar `params.toString()` para la URL.

**Qué no tocar:** vehiclesApi.js, buildSearchParams, parseFilters, FILTER_DEFAULTS.

**Beneficio:** Un solo lugar para la lógica de filtros. Al agregar filtros, solo se toca filters.js.

**Riesgo:** Bajo. El server pasaría a omitir rangos por defecto igual que el client. Comportamiento esperado: mismo resultado, URLs algo más cortas.

---

### Opción intermedia

**Objetivo:** Unificar y documentar el contrato.

**Qué hacer:**
- Todo lo de la opción mínima.
- Añadir un comentario en `buildSearchParams` indicando que se usa tanto para URL del frontend como para requests al backend, y que quien llame debe añadir `limit` y `cursor` para el backend.
- Opcional: eliminar el param `page` de `buildSearchParams` si su único uso es la URL del frontend, o dejar que quien construya la request al backend haga `params.delete("page")` (como en la opción mínima).

**Qué no tocar:** parseFilters, FILTER_DEFAULTS, flujo del client.

**Beneficio:** Misma unificación que la opción mínima, más claridad para futuros cambios.

**Riesgo:** Bajo.

---

### Opción más robusta

**Objetivo:** Una función explícita para params de backend.

**Qué hacer:**
- Crear `buildBackendParams(filters, { limit, cursor })` en `utils/filters.js` que:
  - Llame internamente a `buildSearchParams(filters)`.
  - Elimine `page` si existe.
  - Añada `limit` y `cursor`.
  - Devuelva `URLSearchParams`.
- `vehiclesApi.server.js` y `vehiclesApi.js` usarían `buildBackendParams` en lugar de construir params a mano o combinar buildSearchParams + limit/cursor.
- `buildSearchParams` quedaría solo para uso en URLs del frontend (p. ej. VehiculosClient.updateURL).

**Qué no tocar:** parseFilters, FILTER_DEFAULTS, formato de filtros.

**Beneficio:** Contrato claro: “params para backend” vs “params para URL del frontend”. Menos riesgo de que alguien mezcle responsabilidades.

**Riesgo:** Medio. Hay que asegurarse de que `updateURL` en VehiculosClient siga usando `buildSearchParams` (que sí debe incluir `page` para la URL del usuario). Requiere revisar todos los usos de `buildSearchParams`.

---

## 7. Recomendación final

**Recomendación:** Planificarlo para después, con prioridad media.

**Razones:**

1. **Funciona hoy:** No hay bugs conocidos; server y client envían filtros válidos al backend.
2. **Impacto limitado:** La divergencia afecta sobre todo a mantenibilidad (dos sitios que mantener), no al comportamiento actual.
3. **Cambio acotado:** La opción mínima es un refactor pequeño y de bajo riesgo.
4. **Cuándo hacerlo:** Al agregar un nuevo filtro o al tocar esta zona por otra razón. Hacerlo entonces evita acumular más duplicación.

**No recomiendo:**
- Tratarlo como urgente.
- Dejarlo solo documentado sin plan de cambio: la deuda seguirá creciendo con cada filtro nuevo.
- Un refactor grande: la opción mínima es suficiente.

**Sí recomiendo:**
- Aprovechar el próximo cambio en filtros para aplicar la opción mínima.
- Documentar en `vehiclesApi.server.js` que la intención es migrar a `buildSearchParams` para mantener una sola implementación.
