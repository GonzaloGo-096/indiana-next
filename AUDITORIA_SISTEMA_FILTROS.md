# Auditoría Técnica: Sistema de Filtros de Vehículos Usados

**Proyecto:** Indiana Next  
**Fecha:** Marzo 2025  
**Alcance:** Filtros de vehículos usados (público + admin)

---

--------------------------------------------------
## 1. RESUMEN EJECUTIVO
--------------------------------------------------

El sistema de filtros está **razonablemente bien estructurado** en su núcleo: existe una representación interna consistente (`marca`, `caja`, `combustible`, `año`, `precio`, `kilometraje`), las funciones `parseFilters` y `buildSearchParams` son simétricas y están centralizadas en `utils/filters.js`, y la URL actúa como fuente de verdad en la ruta principal `/usados/vehiculos`.

**Problemas detectados:**
- **Duplicación real:** El server (`vehiclesApi.server.js`) construye los params manualmente en lugar de usar `buildSearchParams`, lo que implica dos implementaciones paralelas.
- **Divergencia server vs client:** El server envía rangos por defecto (año, precio, km) al backend; el client los omite para optimizar. Mismo resultado funcional, requests ligeramente distintos.

**Evaluación:**
- **Funcionamiento actual (público):** Sano. La página `/usados/vehiculos` con filtros opera correctamente.
- **Mantenibilidad:** Media. Dos sitios construyen params; agregar un filtro requiere cambios en al menos dos lugares (filters.js + vehiclesApi.server).
- **Riesgo detectado:** Medio. El Admin funciona correctamente (validado manualmente); la duplicación server/client es la principal deuda.

**Impresión profesional:** El diseño general (URL como fuente de verdad, parseFilters/buildSearchParams) es sólido. La principal fragilidad es la duplicación server y el formato de filtros del Admin. No se recomienda un refactor amplio; sí correcciones puntuales.

---

--------------------------------------------------
## 2. MAPA DE ARCHIVOS Y RESPONSABILIDADES
--------------------------------------------------

### 2.1 Núcleo del sistema de filtros

| Archivo | Responsabilidad | Entrada | Salida | Conexiones |
|---------|-----------------|---------|--------|------------|
| **utils/filters.js** | Fuente única de lógica de filtros | - | - | Importado por VehiculosClient, vehiclesApi, VehiculosPage |
| `parseFilters(searchParams)` | Convierte URL/objeto a objeto de filtros | URLSearchParams u objeto plano | `{ marca: [], caja: [], combustible: [], año: [min,max], precio: [min,max], kilometraje: [min,max], page? }` | VehiculosPage, VehiculosClient, generateMetadata |
| `buildSearchParams(filters)` | Convierte objeto de filtros a URLSearchParams | Objeto de filtros | URLSearchParams (marca, caja, combustible, anio, precio, km, page) | VehiculosClient, vehiclesApi |
| `hasAnyFilter(filters)` | Indica si hay al menos un filtro activo | Objeto de filtros | boolean | VehiculosClient |
| `sortVehicles(vehicles, sortOption)` | Ordena vehículos en cliente | Array + string | Array ordenado | VehiculosClient |
| **constants/filterOptions.js** | Valores por defecto y opciones | - | FILTER_DEFAULTS, marcas, combustibles, cajas, SORT_OPTIONS | filters.js, FilterFormSimple, AdminFilters |

### 2.2 Servicios de API

| Archivo | Responsabilidad | Construcción de params | Usado por |
|---------|-----------------|------------------------|-----------|
| **lib/services/vehiclesApi.server.js** | Fetch en Server Components | **Manual** (líneas 134-156): marca, caja, combustible, año→anio, precio, kilometraje→km, limit, cursor. No usa buildSearchParams. No omite defaults. | VehiculosPage, Home, UsadosPage |
| **lib/services/vehiclesApi.js** | Axios en Client Components | **buildSearchParams(filters)** + limit + cursor. Omite rangos por defecto. | VehiculosClient, useVehiclesList |

### 2.3 Páginas y clientes

| Archivo | Responsabilidad | Fuente de filtros | Construcción de request |
|---------|-----------------|-------------------|-------------------------|
| **app/usados/vehiculos/page.jsx** | Server: fetch inicial, metadata | `parseFilters(await searchParams)` | `vehiclesService.getVehicles({ filters, limit: 8, cursor })` |
| **app/usados/vehiculos/VehiculosClient.jsx** | Client: UI, filtros, infinite scroll | `parseFilters(useSearchParams())` → currentFilters | `vehiclesService.getVehicles({ filters, limit, cursor })` |
| **app/admin/page.jsx** | Dashboard admin | Estado local `filters` (marca, año) | `useVehiclesList(backendFilters())` |

### 2.4 Componentes de UI

| Archivo | Responsabilidad | Datos que recibe | Datos que emite |
|---------|-----------------|------------------|-----------------|
| **FilterFormSimple** | Formulario de filtros (caja, combustible, año, precio, km) | `currentFilters` (prop desde padre) | `onApplyFilters(filters)` con objeto en formato frontend |
| **AdminFilters** | Filtros del admin (marca, año) | `initialFilters` | `onFiltersChange(filters)` con { marca: [], año: [min,max] } |
| **BrandsCarousel** | Selección de marcas | `selectedBrands` (desde currentFilters.marca) | `onBrandSelect(brandName)` |

### 2.5 Lógica específica del Admin

| Archivo/Función | Responsabilidad | Entrada | Salida |
|-----------------|-----------------|---------|--------|
| **backendFilters()** (Dashboard) | Convierte estado del admin a formato para useVehiclesList | `filters` { marca: [], año: [min,max] } | `{ marca: "Ford,Renault", anio: "2015,2020" }` (formato backend) |
| **useVehiclesList(filters)** | Infinite query con TanStack Query | Objeto filters | Llama vehiclesApi.getVehicles({ filters, limit, cursor }) |

### 2.6 SEO (VehiculosPage)

| Función | Responsabilidad | Nota |
|---------|-----------------|------|
| `pickIndexableParams` | Extrae params para canonical | Usa INDEXABLE_PARAMS: marca, modelo, anio, combustible, caja, etc. |
| `INDEXABLE_PARAMS` | Lista de params considerados indexables | No incluye "precio" ni "km" (usa precioDesde/precioHasta) |
| `NON_INDEXABLE_PARAMS` | page, sort, etc. | Params desconocidos → noindex |

### 2.7 Código no utilizado

| Archivo | Estado |
|---------|--------|
| **app/usados/UsadosClient.jsx** | No importado por ninguna ruta. La página /usados usa UsadosPageCarousel, no UsadosClient. Código muerto. |

---

--------------------------------------------------
## 3. FLUJO REAL DE FILTROS DE PUNTA A PUNTA
--------------------------------------------------

### A. Entrada desde la URL

1. **Origen:** Next.js pasa `searchParams` a la página. En Next.js 15+, puede ser una Promise, se resuelve con `await searchParams`.
2. **Formato recibido:** Objeto con claves string y valores string o string[]. Ej: `{ marca: "Ford", anio: "2015,2020", page: "2" }`.
3. **Parseo:** `parseFilters(searchParams)`:
   - Convierte el objeto a `URLSearchParams` (itera keys, hace `params.set(key, String(value))`).
   - Lee `marca`, `caja`, `combustible` → split por coma → arrays.
   - Lee `anio`, `precio`, `km` → split por coma → `[min, max]` numéricos.
   - Lee `page` → número.
4. **Resultado:** `{ marca: ["Ford"], caja: [], combustible: [], año: [2015, 2020], precio: [5e6, 1e8], kilometraje: [0, 200000], page: 2 }`.
5. **Dónde se usa:** VehiculosPage (server) y VehiculosClient (via useSearchParams).

### B. Representación interna

**Estructura única en frontend:**
```js
{
  marca: string[],
  caja: string[],
  combustible: string[],
  año: [number, number],      // año con ñ
  precio: [number, number],
  kilometraje: [number, number],
  page?: number
}
```

**Consistencia:** FilterFormSimple, VehiculosClient, parseFilters y buildSearchParams usan esta estructura. AdminFilters usa `marca` y `año`; Admin los transforma con `backendFilters()` a otro formato.

### C. Construcción de request al backend

**Server (vehiclesApi.server.js):**
- Construye URL manualmente:
  - `marca` → `filters.marca.join(",")`
  - `caja` → `filters.caja.join(",")`
  - `combustible` → `filters.combustible.join(",")`
  - `año` → `anio=${filters.año[0]},${filters.año[1]}` (siempre que sea array de 2)
  - `precio` → idem
  - `kilometraje` → `km=${filters.kilometraje[0]},${filters.kilometraje[1]}`
  - Agrega `limit` y `cursor`.
- **No omite** rangos por defecto. Si año es [1990, 2024], envía `anio=1990,2024`.

**Client (vehiclesApi.js):**
- `buildSearchParams(filters)`:
  - Arrays → strings con coma.
  - Rangos: solo si **no** son FILTER_DEFAULTS (optimización).
  - `page` si existe.
- Agrega `limit` y `cursor`.
- **Omite** rangos por defecto. Si año es [1990, 2024], no envía `anio`.

**Admin (useVehiclesList):**
- Recibe `backendFilters()` = `{ marca: "Ford,Renault", anio: "2015,2020" }`.
- Lo pasa a vehiclesApi.getVehicles como `filters`.
- vehiclesApi usa `buildSearchParams(filters)`:
  - `filters.marca` es string → `Array.isArray` false → no se agrega.
  - `filters.año` no existe (existe `anio`) → no se agrega.
- Resultado: request sin filtros, salvo limit y cursor.

### D. Respuesta y vuelta a UI

1. **Server:** Hace fetch, mapea con `mapVehiclesPage`, pasa `initialData` e `initialFilters` a VehiculosClient.
2. **Client:** Usa `initialData` como estado inicial. Cuando el usuario cambia filtros, hace fetch, actualiza estado con `setData`, y `updateURL` cambia la URL.
3. **Sincronización:** `currentFilters = parseFilters(searchParams)` se recalcula cuando cambia la URL. FilterFormSimple recibe `currentFilters` y sincroniza su estado interno en un `useEffect`. La URL es la fuente de verdad; el estado local del form se alinea con ella.
4. **Coherencia:** Si la URL tiene `?marca=Ford`, currentFilters tiene `{ marca: ["Ford"], ... }`, el grid muestra los datos del último fetch, y el form muestra Ford seleccionado. Hay coherencia en el flujo público.

---

--------------------------------------------------
## 4. COMPARACIÓN EXPLÍCITA ENTRE CAPAS
--------------------------------------------------

### 4.1 parseFilters vs buildSearchParams

| Aspecto | parseFilters | buildSearchParams |
|---------|--------------|-------------------|
| Dirección | URL/objeto → objeto | Objeto → URLSearchParams |
| Simetría | Sí. parseFilters lee "anio" → filters.año; buildSearchParams lee filters.año → "anio" |
| Rangos por defecto | parseFilters no los filtra; si URL tiene anio=1990,2024 los incluye | buildSearchParams omite si coinciden con FILTER_DEFAULTS |
| page | Lee de params, devuelve filters.page | Escribe filters.page en params |
| Consistencia | Lógica inversa correcta | Lógica inversa correcta |

**Conclusión:** Bien diseñadas y alineadas. La única diferencia es la omisión de defaults en buildSearchParams.

### 4.2 Server vs Client request builder

| Aspecto | vehiclesApi.server | vehiclesApi (client) |
|---------|--------------------|----------------------|
| Helper usado | Ninguno (manual) | buildSearchParams |
| Filtros simples | Igual: join(",") | Igual |
| Rangos | Siempre envía si existen | Omite si son defaults |
| limit, cursor | Sí | Sí |
| page | No envía (correcto, backend usa cursor) | buildSearchParams puede añadir page si filters.page existe |

**Conclusión:** Lógica duplicada en el server. Resultado funcional equivalente para el flujo público (rangos por defecto = sin filtro efectivo). Divergencia: requests con defaults pueden diferir en longitud, no en semántica.

### 4.3 Filtros públicos vs Admin

| Aspecto | Público (VehiculosClient) | Admin (Dashboard) |
|---------|---------------------------|-------------------|
| Formato interno | Objeto frontend (arrays, rangos) | Objeto frontend en AdminFilters |
| Transformación antes de API | Ninguna | backendFilters() → formato backend |
| Consumidor | vehiclesApi.getVehicles | useVehiclesList → vehiclesApi.getVehicles |
| buildSearchParams | Recibe formato frontend ✓ | Recibe formato backend ✗ |

**Conclusión:** El Admin transforma a formato backend antes de llamar a vehiclesApi, que espera formato frontend. Los filtros del Admin no se aplican.

### 4.4 Representación interna vs enviada al backend

| Formato | Uso | Ejemplo marca | Ejemplo año |
|---------|-----|---------------|-------------|
| Interno (frontend) | FilterFormSimple, parseFilters, buildSearchParams | `["Ford", "Renault"]` | `[2015, 2020]` |
| URL | searchParams | `marca=Ford,Renault` | `anio=2015,2020` |
| Request backend | Query string | `marca=Ford,Renault` | `anio=2015,2020` |

buildSearchParams produce params que coinciden con lo que el backend espera. La capa de adaptación es correcta cuando el input es el objeto frontend.

### 4.5 Filtros en UI vs filtros en request

- **FilterFormSimple:** Emite objeto en formato frontend. Es lo que se pasa a `onApplyFilters` y luego a `updateURL` y `vehiclesService.getVehicles`. Alineado.
- **BrandsCarousel:** Modifica `marca` en currentFilters. El handler arma `{ ...currentFilters, marca: newBrands }` y llama `handleApplyFilters`. Alineado.
- **AdminFilters:** Emite `{ marca: [], año: [min,max] }`. El Dashboard lo transforma con backendFilters antes de pasarlo a useVehiclesList. Desalineado con lo que espera vehiclesApi.

---

--------------------------------------------------
## 5. HALLAZGOS CONFIRMADOS
--------------------------------------------------

### H1. Duplicación: construcción de params en el server

**Archivos:** `vehiclesApi.server.js` (líneas 134-156) y `utils/filters.js` (buildSearchParams).

**Qué pasa:** El server construye los query params manualmente con la misma lógica que buildSearchParams (marca, caja, combustible, año→anio, precio, kilometraje→km), pero sin usar buildSearchParams.

**Por qué importa:** Cualquier cambio en filtros (nuevo filtro, cambio de nombre, nueva regla) debe hacerse en dos sitios. Riesgo de olvidos y divergencia.

**Riesgo:** Mantenibilidad. No parece generar bugs hoy; la lógica es equivalente.

**Impacto funcional:** Ninguno detectado en el flujo público.

---

### H2. ~~Admin: formato de filtros incompatible~~ — DESESTIMADO

**Nota:** Validación manual confirmó que el Admin envía filtros correctamente al backend (ej: `marca=Peugeot&anio=1990,2016&limit=50&cursor=1`). No se considera un hallazgo activo.

---

### H3. Omisión de rangos por defecto: server vs client

**Archivos:** `vehiclesApi.server.js`, `vehiclesApi.js`, `filters.js`.

**Qué pasa:** Con filtros por defecto (ej. año 1990-2024), el server envía `anio=1990,2024`; el client no envía `anio`. El backend probablemente trata “sin anio” y “anio=1990,2024” igual. No se ha validado contra el backend real.

**Por qué importa:** Posible divergencia sutil si el backend interpreta distinto la ausencia del param.

**Riesgo:** Bajo. Requiere validación con el backend.

---

### H4. INDEXABLE_PARAMS vs params reales de filtros

**Archivos:** `app/usados/vehiculos/page.jsx` (INDEXABLE_PARAMS, pickIndexableParams).

**Qué pasa:** INDEXABLE_PARAMS incluye "precioDesde", "precioHasta" pero no "precio". Los filtros usan "precio" como "min,max". "km" tampoco está. Al tener `?precio=5000000,100000000` o `?km=0,100000`, esos params son “desconocidos” y hasNonIndexableParams devuelve true → noindex.

**Por qué importa:** Las URLs con filtros de precio o km pueden quedar como noindex. Es una decisión de producto (indexar o no listados filtrados).

**Riesgo:** Bajo para funcionamiento; medio para SEO si se quieren indexar esas URLs.

---

### H5. UsadosClient: código no referenciado

**Archivos:** `app/usados/UsadosClient.jsx`.

**Qué pasa:** No hay imports de UsadosClient. La página /usados usa UsadosPageCarousel. Es código muerto.

**Por qué importa:** Mantenimiento innecesario y posible confusión.

**Riesgo:** Bajo. Solo limpieza de código.

---

### H6. FilterFormSimple handleClear vs handleClearFilters del padre

**Archivos:** `FilterFormSimple.jsx`, `VehiculosClient.jsx`.

**Qué pasa:** El botón "Limpiar" del form hace `router.push(window.location.pathname)`. El botón "Volver a lista principal" del padre hace `handleApplyFilters({})`. Ambos llevan a lista sin filtros, pero por caminos distintos (navegación vs actualización de URL + fetch).

**Por qué importa:** Comportamiento equivalente; no es un bug. Solo diferencia de implementación.

**Riesgo:** Ninguno.

---

### H7. Clave de sessionStorage incorrecta en VehiculosClient (scroll restore)

**Archivos:** `VehiculosClient.jsx` (línea 91), `storageKeys.js`, `CardAuto.jsx`.

**Qué pasa:** CardAuto guarda con `STORAGE_KEYS.VEHICLES_LIST_SCROLL` = `'vehicles_list_scroll'`. VehiculosClient lee con `sessionStorage.getItem("scroll_vehicles-list")` (string hardcodeado distinto). Las claves no coinciden; el scroll nunca se restaura al volver del detalle.

**Por qué importa:** Afecta la UX del flujo lista → detalle → volver. Fuera del núcleo de filtros pero detectado en la auditoría.

**Riesgo:** Medio para UX. Bajo para filtros.

---

--------------------------------------------------
## 6. ZONAS GRISES / HIPÓTESIS A VALIDAR
--------------------------------------------------

### Z1. Backend: interpretación de params desconocidos

**Sospecha:** Si el client envía `page=2` además de `cursor=2`, ¿el backend lo ignora o altera el resultado?

**Validación:** Revisar documentación o código del backend; comparar requests con y sin `page`.

**Probabilidad de problema:** Baja. Lo habitual es ignorar params desconocidos.

---

### Z2. parseFilters con searchParams como array

**Sospecha:** Next.js puede pasar `searchParams.marca = ["Ford", "Renault"]` para `?marca=Ford&marca=Renault`. parseFilters solo hace `params.set(key, String(value))` cuando value es string o number; con array no añade nada.

**Validación:** Probar URLs con params repetidos y ver si parseFilters los interpreta bien.

**Probabilidad de problema:** Baja. Es más común recibir `marca=Ford,Renault` como string.

---

### Z3. Sincronización FilterFormSimple con URL en transiciones rápidas

**Sospecha:** Si el usuario cambia filtros muy rápido, ¿el useEffect que sincroniza `currentFilters` → estado local puede generar condiciones de carrera?

**Validación:** Pruebas de estrés con cambios rápidos de filtros.

**Probabilidad de problema:** Baja.

---

### Z4. ~~Scroll restore y clave de sessionStorage~~ → CONFIRMADO (ver H7)

---

--------------------------------------------------
## 7. EVALUACIÓN DE RIESGO TÉCNICO
--------------------------------------------------

| Dimensión | Valor | Justificación |
|-----------|-------|---------------|
| **Riesgo actual** | Medio | El flujo público funciona. El Admin muy probablemente no filtra. Duplicación de lógica en server. |
| **Riesgo al escalar** | Medio | Agregar filtros implica tocar filters.js y vehiclesApi.server; fácil olvidar uno. La arquitectura base es sólida. |
| **Riesgo al agregar nuevos filtros** | Medio | buildSearchParams y parseFilters son extensibles. El server requiere cambios manuales paralelos. Admin requiere ajustar backendFilters si se unifica el formato. |

---

--------------------------------------------------
## 8. QUÉ PARTES PARECEN SANAS Y NO TOCARÍA TODAVÍA
--------------------------------------------------

1. **parseFilters y buildSearchParams:** Simétricas, claras y centralizadas. Base del sistema.
2. **Estructura interna de filtros:** Consistente en todo el flujo público.
3. **URL como fuente de verdad en VehiculosClient:** Bien aplicada; currentFilters derivado de searchParams.
4. **FilterFormSimple:** Recibe currentFilters por prop, sincroniza con useEffect, emite formato correcto. Evita uso directo de useSearchParams en el form.
5. **FILTER_DEFAULTS en filterOptions.js:** Centralizado y reutilizado.
6. **sortVehicles:** Ordena en cliente sin tocar el backend; diseño coherente.
7. **Integración BrandsCarousel:** selectedBrands y onBrandSelect bien integrados con el sistema de filtros.
8. **VehiculosPage:** Parse de searchParams, fetch inicial, paso de initialData e initialFilters al cliente. Flujo coherente.

---

--------------------------------------------------
## 9. ÁREAS CANDIDATAS A MEJORA
--------------------------------------------------

### Urgente

**Admin: corregir formato de filtros**

- **Problema:** backendFilters produce formato que buildSearchParams no entiende; filtros no se aplican.
- **Acción:** Pasar a useVehiclesList el objeto en formato frontend (`{ marca: [], año: [min, max] }`) en lugar del resultado de backendFilters. Eliminar backendFilters y pasar `filters` directamente.
- **Riesgo:** Bajo si se mantiene la estructura de filters del Dashboard.

---

### Importante pero no urgente

**Unificar construcción de params en el server**

- **Problema:** vehiclesApi.server duplica la lógica de buildSearchParams.
- **Acción:** Usar buildSearchParams en el server, añadir limit y cursor, y opcionalmente eliminar `page` si se incluyera.
- **Riesgo:** Bajo. Requiere pruebas de regresión en SSR y cache.

---

**INDEXABLE_PARAMS: incluir precio y km**

- **Problema:** "precio" y "km" se tratan como desconocidos y fuerzan noindex.
- **Acción:** Añadir "precio" y "km" a INDEXABLE_PARAMS si se quieren indexar URLs filtradas.
- **Riesgo:** Bajo. Decisión de producto.

---

### Mejora estructural futura

**Definición explícita del contrato de filtros**

- **Problema:** No hay un tipo/interfaz documentado que una UI, API y backend.
- **Acción:** Definir (p. ej. en JSDoc o TypeScript) la estructura de filtros y quién la usa.
- **Riesgo:** Bajo. Mejora de documentación y prevención.

---

**Eliminar UsadosClient si no hay planes de uso**

- **Problema:** Código muerto.
- **Acción:** Eliminar o documentar como legacy.
- **Riesgo:** Bajo. Verificar que no haya referencias.

---

### Innecesario por ahora

- Refactor amplio de la arquitectura de filtros.
- Cambiar la URL como fuente de verdad.
- Unificar server y client en un solo servicio (los requisitos de fetch vs axios son distintos).

---

--------------------------------------------------
## 10. ESTRATEGIAS POSIBLES DE MEJORA
--------------------------------------------------

### A. Estrategia conservadora

**Qué tocar:**
- `app/admin/page.jsx`: eliminar backendFilters, pasar `filters` directamente a useVehiclesList.

**Qué dejar intacto:**
- vehiclesApi.server, vehiclesApi, filters.js, FilterFormSimple, VehiculosClient.

**Beneficios:** Admin con filtros funcionando.

**Riesgos:** Bajo. Cambio localizado.

---

### B. Estrategia intermedia

**Qué tocar:**
- Admin: como en A.
- `vehiclesApi.server.js`: usar buildSearchParams para filtros y añadir limit/cursor.

**Qué dejar intacto:**
- parseFilters, buildSearchParams, FilterFormSimple, VehiculosClient, INDEXABLE_PARAMS.

**Beneficios:** Admin correcto y única implementación de construcción de params.

**Riesgos:** Medio. Requiere pruebas de server, cache y revalidación.

---

### C. Estrategia más profunda

**Qué tocar:**
- Todo lo de B.
- Crear `buildBackendParams(filters, { limit, cursor })` que encapsule filtros + paginación y sea usada por server y client.
- Ajustar INDEXABLE_PARAMS para precio y km.
- Eliminar UsadosClient.

**Qué dejar intacto:**
- parseFilters, estructura de filtros, FilterFormSimple, flujo de VehiculosClient.

**Beneficios:** Un solo punto de construcción de params, menos duplicación, SEO más claro, menos código muerto.

**Riesgos:** Medio-alto. Más cambios y más superficie de pruebas.

---

--------------------------------------------------
## 11. CHECKLIST DE VALIDACIÓN MANUAL
--------------------------------------------------

1. **URL → filtros:**
   - Ir a `/usados/vehiculos?marca=Ford&anio=2015,2020`.
   - Verificar que el form muestre Ford y rango 2015-2020.
   - Verificar que el grid muestre solo Ford en ese rango de años.

2. **Filtros → URL:**
   - Aplicar marca Ford y año 2015-2020.
   - Verificar que la URL tenga `marca=Ford` y `anio=2015,2020`.
   - Verificar que los resultados coincidan.

3. **Request al backend (Network):**
   - Aplicar filtros.
   - Inspeccionar la request a `/photos/getallphotos`.
   - Confirmar que los query params coincidan con la URL (marca, anio, precio, km, limit, cursor).

4. **Server vs Client:**
   - Cargar `/usados/vehiculos?marca=Ford` (refresh completo).
   - Ver el HTML inicial: ¿incluye vehículos Ford?
   - Cambiar filtro en el form y ver la nueva request desde el cliente.
   - Comparar que ambos (SSR y client) envíen los mismos filtros al backend.

5. **Admin:**
   - En `/admin`, elegir marca Ford.
   - Ver en Network la request a getallphotos.
   - Si no tiene `marca=Ford`, confirmar el bug de formato.

6. **Rangos por defecto:**
   - Cargar sin filtros.
   - Ver requests del server y del client.
   - Comprobar si el server envía anio/precio/km y el client no.

7. **Limpiar filtros:**
   - Aplicar filtros, luego "Limpiar" en el form.
   - Verificar que la URL vuelva a `/usados/vehiculos` sin query.
   - Verificar que se muestren todos los vehículos.

8. **“Volver a lista principal”:**
   - Aplicar filtros, hacer scroll, clic en "Volver a lista principal".
   - Verificar que se limpien los filtros y se restaure la posición de scroll.

9. **Infinite scroll:**
   - Aplicar marca Ford.
   - Clic en "Cargar más".
   - Verificar que la nueva request use los mismos filtros y cursor/nextPage correcto.

10. **Sorting:**
    - Aplicar orden "Precio: menor a mayor".
    - Verificar que la URL tenga `sort=precio_asc`.
    - Verificar que el orden en pantalla sea correcto (sin nuevo fetch; es orden en cliente).
