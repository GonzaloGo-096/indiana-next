# Análisis profundo de performance – Puntos críticos

**Fecha:** 2025  
**Alcance:** Página `/usados/vehiculos`, CardAuto, BrandsCarousel, filtros, datos e imágenes.

---

## 1. Resumen ejecutivo

| Área              | Nivel   | Impacto principal                                      |
|-------------------|--------|--------------------------------------------------------|
| Render / React    | Medio  | Re-renders en cascada, sin virtualización del grid     |
| Datos / red       | Medio  | Posible doble fetch (cliente + servidor al cambiar URL)|
| Imágenes         | Bajo   | Bien configuradas (Next/Image, lazy, sizes, priority)  |
| CSS / layout     | Bajo   | Contain, content-visibility; algún will-change de más  |
| Listeners / JS   | Bajo   | useMediaQuery en filtros; scroll con rAF bien usado     |

---

## 2. Flujo de datos y puntos críticos

### 2.1 Carga inicial (primera visita a `/usados/vehiculos`)

1. **Server Component** (`page.jsx`): hace `getVehicles()` con `limit: 8`, `cursor: 1`, mapea con `mapVehiclesPage()` y pasa `initialData` a `VehiculosClient`.
2. **VehiculosClient**: recibe `initialData`, lo guarda en `useState(data)`. No hace fetch inicial en cliente.
3. **AutosGrid**: recibe `vehicles = sortedVehicles` (derivado de `data.vehicles`). Renderiza **todas** las cards del array (8 la primera vez).

**Crítico:** Cada cambio de `data` (o de `currentSort` vía `sortedVehicles`) re-renderiza todo el grid y todas las CardAuto. No hay virtualización: 8, 16, 24… cards son 8, 16, 24… componentes en DOM.

### 2.2 Cambio de filtros (aplicar / limpiar)

1. Usuario aplica filtros → `handleApplyFilters(newFilters)`.
2. Se hace `updateURL(newFilters, 1, currentSort)` → `router.replace(newURL)`.
3. En paralelo se hace **fetch en cliente**: `vehiclesService.getVehicles({ filters, limit: 8, cursor: 1 })`, luego `setData(mappedData)`.

**Punto crítico – doble fuente de verdad:**

- El **cliente** ya tiene datos del fetch que él mismo disparó.
- Al cambiar la URL, Next puede **re-ejecutar el Server Component** con los nuevos `searchParams` y hacer **otro** `getVehicles()` en servidor y pasar **nuevo** `initialData` a `VehiculosClient`.

Consecuencias posibles:

- Dos fetches por cambio de filtro (uno en cliente, uno en servidor).
- Si el cliente no “sincroniza” o ignora `initialData` cuando ya tiene datos propios, puede haber estados intermedios o re-renders extra.
- Si el servidor pasa de nuevo `initialData` después del `setData` del cliente, el estado puede “saltar” o duplicar trabajo.

**Recomendación:** Decidir una única fuente: o bien todo por cliente (fetch en cliente y no depender de re-fetch del servidor al cambiar URL), o bien confiar en el servidor (navegación que recarga datos vía Server Component y usar esos datos como única fuente). Evitar mezclar ambos para el mismo cambio de filtros.

### 2.3 “Cargar más” (infinite scroll)

1. `handleLoadMore` usa `data.nextPage`, hace fetch con `cursor: nextPage`, acumula con `setData(prev => ...)`.
2. El array `vehicles` crece (8 → 16 → 24…). Sigue sin virtualización: todo lo cargado se mantiene en DOM y en React tree.

**Crítico:** A más páginas cargadas, más cards montadas, más imágenes (Next/Image lazy ayuda, pero el DOM y el trabajo de React crecen). Con 24 o 32 vehículos, el coste de scroll y re-renders aumenta.

### 2.4 Orden (sort)

- `sortedVehicles = useMemo(() => sortVehicles(data.vehicles, currentSort), [data.vehicles, currentSort])`.
- Ordenar es barato; el coste es re-render de todo el grid cuando cambia `currentSort` o `data.vehicles`.

---

## 3. React y re-renders

### 3.1 VehiculosClient

- **Estado:** `data`, `isLoading`, `isLoadingMore`, `error`, `selectedSort`, `isSortDropdownOpen`, refs.
- **Derivados:** `searchParamsData` (useMemo con `[searchParams]`), `currentFilters`, `currentPage`, `currentSort`, `isFiltered`, `selectedBrands`, `sortedVehicles`.

Cada vez que cambia `searchParams` (p. ej. por `router.replace`):

- Se recalcula `searchParamsData` y todo lo que depende (filtros, página, sort).
- Si además llega nuevo `initialData` del servidor y no se usa de forma estable, puede haber más actualizaciones de estado y re-renders.

**Punto crítico:** `searchParams` es un objeto; su referencia puede cambiar en cada render de Next aunque “el contenido” sea el mismo, lo que puede romper memoización de hijos que dependan de él.

### 3.2 Filtros (FilterFormSimple)

- Usa **useDevice()** → **useMediaQuery("(min-width: 768px)")**.
- En cada **resize** que cruce el breakpoint, `matches` cambia → re-render de FilterFormSimple y de todo lo que cuelga de él (formulario, dropdowns, sliders).

**Crítico:** useMediaQuery + useDevice en un formulario grande implica re-renders en resize. Si el árbol de filtros es pesado (muchos controles, MultiSelect, RangeSlider), el coste puede notarse. Valorar memoización más agresiva o bajar el uso de useDevice a un nivel más alto (p. ej. solo para mostrar/ocultar drawer vs panel).

### 3.3 BrandsCarousel

- Lista de marcas: ahora es constante estática `BRANDS_FOR_CAROUSEL` (una sola vez). Bien.
- Estado: `canScrollLeft`, `canScrollRight`; se actualizan en cada scroll (vía rAF). Eso fuerza un re-render del carrusel en cada scroll, pero el árbol del carrusel es pequeño (botones + lista de logos). Aceptable; si se quisiera afinar, se podría evitar setState cuando el valor no cambie (p. ej. comparar con el valor anterior antes de `setCanScrollLeft` / `setCanScrollRight`).

### 3.4 AutosGrid y CardAuto

- **AutosGrid:** memo, `vehiclesGrid` en useMemo con `[vehicles]`. Cuando `vehicles` o la referencia del array cambian, se regenera todo el listado de cards.
- **CardAuto:** memo; props `auto` e `imagePriority`. Si el padre pasa objetos `vehicle` con referencias nuevas en cada render (p. ej. `vehicles.map(v => <Card key={v.id} vehicle={v} />)` con `v` del array que viene de estado), cada card recibe la misma referencia por ítem; el problema sería si en algún punto se crean objetos nuevos para el mismo vehículo (p. ej. en `sortedVehicles` si el mapeo devuelve copias). Habría que asegurar que `sortedVehicles` mantenga referencias estables a los mismos objetos `vehicle` cuando los datos no cambian.

**Crítico:** Sin virtualización, 8/16/24/32 cards = 8/16/24/32 CardAuto siempre en el árbol. Cualquier re-render del padre que baje nuevo array (aunque sea “igual” en contenido) puede provocar reconciliación costosa si las referencias no son estables.

---

## 4. Imágenes

### 4.1 Configuración actual (resumen)

- **Next/Image** en CardAuto (foto principal + logo) y en BrandsCarousel (logos).
- **Lista:** `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`, `quality={80}`, `loading="lazy"` salvo primeras 6 (`imagePriority === "high"`).
- **Placeholder:** `placeholder="blur"` con `getBlurPlaceholder(primaryImage)` (Cloudinary o data URL mínima).
- **next.config.mjs:** formats webp/avif, deviceSizes/imageSizes razonables, cache largo.

**Conclusión:** Configuración sólida. El mayor coste es cantidad de imágenes (2 por card + N logos en carrusel), no tanto la configuración individual.

### 4.2 Posibles afinaciones

- Reducir `quality` en cards (p. ej. 75) para listado; mantener 80 en detalle.
- Asegurar que `sizes` en detalle o en modales no pida tamaños mayores de los necesarios.

---

## 5. CSS y layout

### 5.1 Lo que está bien

- **CardAuto:** `contain: layout paint style` en el contenedor de imagen; `will-change: transform` en la card para hover.
- **ListAutos:** `content-visibility: auto` y `contain-intrinsic-size: auto 420px` en `.cardWrapper`; `contain: layout style` en cards/skeleton.
- **BrandsCarousel:** scroll con `passive: true`, actualización con rAF.

### 5.2 Riesgos

- **will-change: transform** en muchos elementos (card, imagen, logos) reserva capas de composición. En listas largas, muchas capas pueden aumentar uso de memoria y GPU. Valorar limitar `will-change` solo a elementos que realmente animan (p. ej. solo la card en hover, no todos los hijos).
- **content-visibility: auto:** si `contain-intrinsic-size` no se acerca a la altura real, puede haber saltos al hacer scroll. 420px es un valor razonable para una card; vigilar en distintos viewports.

---

## 6. Listeners y efectos

### 6.1 Scroll y resize

- **BrandsCarousel:** scroll con rAF, resize con debounce 150ms, cleanup correcto. Bien.
- **Restaurar scroll:** timeout al montar (VEHICLE_CONSTANTS.SCROLL_RESTORE_TIMEOUT) y posiblemente otro en handleApplyFilters (doble rAF). Asegurar que no se disparen múltiples restauraciones (uno solo por “vuelta desde detalle”).

### 6.2 useMediaQuery / useDevice

- Cualquier componente que use useDevice (p. ej. FilterFormSimple) re-renderiza cuando el viewport cruza 768px. Si hay varios consumidores de useMediaQuery/useDevice, cada uno puede subscribirse por separado a `matchMedia`. Valorar un único contexto o store para “isMobile” y que solo un listener actualice el estado.

---

## 7. Mapeo y transformación de datos

- **mapVehiclesPage:** itera `docs`, por cada uno llama a `extractVehicleImageUrls` y `extractAllImageUrls(..., { includeExtras: false })`. Los extractors son funciones ligeras (acceso a propiedades, sin regex pesado). Aceptable.
- **sortVehicles:** se ejecuta en cliente en cada cambio de `currentSort` o `data.vehicles`. Para 8–32 ítems es trivial. No crítico.

---

## 8. Priorización de acciones (por impacto)

### Alta prioridad (puntos críticos)

1. **Unificar fuente de datos al cambiar filtros**  
   Evitar doble fetch (cliente + servidor) y doble actualización de estado. Opciones:  
   - Solo cliente: al aplicar filtros, fetch en cliente, `setData`, y no depender de que el Server Component vuelva a pasar `initialData` para ese mismo cambio, o  
   - Solo servidor: navegar y dejar que el Server Component haga el fetch y pase `initialData`, y que el cliente use solo `initialData` (o lo sincronice una sola vez).

2. **Virtualización del grid de vehículos**  
   Con 16–32+ cards, renderizar solo las visibles (+ buffer) reduce DOM y trabajo de React. Librerías: `react-window`, `@tanstack/react-virtual`, etc. Requiere estimar altura de ítem o usar dynamic size.

3. **Estabilizar referencias de `vehicles` / `sortedVehicles`**  
   Asegurar que, cuando los datos no cambian, no se pasen arrays u objetos nuevos a AutosGrid/CardAuto (evitar recrear `sortedVehicles` por cambios de referencia de `data` o `searchParams` si el contenido es el mismo). Así el memo de AutosGrid y CardAuto puede evitar re-renders.

### Media prioridad

4. **Reducir re-renders por resize (useDevice / useMediaQuery)**  
   Centralizar “isMobile” en un contexto o en un solo listener y/o memoizar mejor el árbol de FilterFormSimple para que un cambio de breakpoint no recalculen todo el formulario innecesariamente.

5. **BrandsCarousel: setState solo cuando cambie**  
   En `checkScrollButtons`, hacer `setCanScrollLeft(nextLeft)` / `setCanScrollRight(nextRight)` solo si el valor nuevo es distinto del actual (evitar re-renders en cada scroll cuando el estado ya es correcto).

6. **Revisar uso de will-change**  
   Dejar `will-change: transform` solo donde haya animación (p. ej. card en hover); quitarlo de elementos que no animen para reducir capas de composición.

### Baja prioridad

7. **Calidad de imagen en listado**  
   Probar `quality={75}` en CardAuto para listado; mantener 80 en detalle.

8. **Sizes más ajustados**  
   Revisar que en móvil/tablet los `sizes` no pidan imágenes más grandes de lo necesario.

---

## 9. Checklist rápido de verificación

- [ ] Al aplicar filtros, ¿cuántos fetches se disparan? (Network: filtrar por `getallphotos` o similar.)
- [ ] Al redimensionar ventana, ¿cuántos componentes re-renderizan? (React DevTools Profiler.)
- [ ] Con 24+ vehículos cargados, ¿cuántos nodos DOM tiene el grid? (Inspeccionar o “Elements” en DevTools.)
- [ ] ¿Hay layout shift (CLS) al cargar imágenes o al hacer scroll? (Lighthouse o experiencia manual.)
- [ ] ¿El estado de “scroll restaurado” se aplica una sola vez y sin conflictos con el scroll al top inicial?

---

## 10. Conclusión

Los puntos más críticos para sentir la página “pesada” son:

1. **Doble fetch y doble fuente de verdad** al cambiar filtros (cliente + servidor).
2. **Falta de virtualización** en el grid: todas las cards cargadas siguen en el DOM y en React.
3. **Re-renders en cascada** por cambio de URL/searchParams y por useMediaQuery en filtros.

Priorizando: unificar datos al filtrar, luego virtualizar el listado y estabilizar referencias; después afinar re-renders (resize, carrusel, will-change) e imágenes. Con eso se atacan los puntos críticos sin romper la funcionalidad actual.
