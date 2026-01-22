# 📊 Análisis del Uso de Skeletons en el Proyecto

**Fecha:** 2024  
**Proyecto:** Indiana Front (Next.js)

---

## 📍 Ubicaciones de Skeletons

### 1. **Skeletons en `indiana-usados`** (React)

#### Componente Reutilizable Base
- **Ubicación:** `indiana-usados/src/components/skeletons/Skeleton/`
- **Archivos:**
  - `Skeleton.jsx` - Componente base reutilizable
  - `Skeleton.module.css` - Estilos con animación shimmer
- **Características:**
  - Componente genérico con props (`type`, `width`, `height`)
  - Variantes predefinidas: `SkeletonText`, `SkeletonTitle`, `SkeletonImage`, `SkeletonButton`
  - Componentes de agrupación: `SkeletonGroup`, `SkeletonGrid`
  - ✅ **Ventaja:** Reutilizable y consistente

#### Skeletons Específicos
- **ListAutosSkeleton:** `indiana-usados/src/components/skeletons/ListAutosSkeleton/`
  - Usa `CardAutoSkeleton` + `SkeletonGrid`
  - Configurable con prop `cantidad` (default: 6)
- **DetalleSkeleton:** `indiana-usados/src/components/skeletons/DetalleSkeleton/`
  - Para páginas de detalle de vehículos

---

### 2. **Skeletons en `indiana-next`** (Next.js)

#### A. Loading States de Next.js (Archivos `loading.jsx`)

##### ✅ `/0km` - Listado de Modelos
- **Ubicación:** `indiana-next/src/app/0km/loading.jsx`
- **Estilos:** `indiana-next/src/app/0km/0km-loading.module.css`
- **Estructura:**
  - Header con título y subtítulo skeleton
  - Carrusel con 4 cards skeleton
- **Estado:** ✅ Correcto - No tiene problemas de responsive

##### ✅ `/0km/[autoSlug]` - Detalle de Modelo (CORREGIDO)
- **Ubicación:** `indiana-next/src/app/0km/[autoSlug]/loading.jsx`
- **Estilos:** `indiana-next/src/app/0km/[autoSlug]/0km-detalle-loading.module.css`
- **Estructura:**
  ```jsx
  <div className={styles.hero}>
    <div className={styles.skeletonHeroImage}></div>
  </div>
  ```
- **✅ CORREGIDO:**
  - El skeleton del hero ahora se oculta en mobile usando media query CSS
  - El componente real `HeroImageDesktop` solo se renderiza en desktop (≥768px)
  - **Solución aplicada:** Media query `@media (max-width: 767px)` oculta `.hero`

**Código del componente real:**
```jsx
// HeroImageDesktop.jsx línea 30
if (!mounted || !isDesktop || !heroImage?.url) {
  return null; // ✅ Correcto: No renderiza nada en mobile
}
```

**Solución aplicada:**
```css
/* ✅ Ocultar hero skeleton en mobile (el hero solo existe en desktop) */
@media (max-width: 767px) {
  .hero {
    display: none;
  }
}
```

---

#### B. Skeletons Inline en Componentes

##### 1. **AutosGrid** (Lista de Vehículos)
- **Ubicación:** `indiana-next/src/components/vehicles/List/ListAutos/AutosGrid.jsx`
- **Líneas:** 42-94
- **Estilos:** `ListAutos.module.css` (líneas 280-429)
- **Características:**
  - Skeleton inline definido como componente `ListAutosSkeleton`
  - Estructura idéntica a `CardAuto` (imagen, logo, datos, precio)
  - Muestra 8 elementos skeleton
  - ✅ **Bien implementado:** Estructura profesional, animación shimmer

##### 2. **SimilarVehiclesCarousel**
- **Ubicación:** `indiana-next/src/components/vehicles/SimilarVehiclesCarousel/SimilarVehiclesCarousel.jsx`
- **Líneas:** 32-72
- **Estilos:** `SimilarVehiclesCarousel.module.css` (líneas 192-314)
- **Características:**
  - Skeleton inline `SkeletonCard`
  - Estructura igual a `CardSimilar`
  - Se muestra mientras `isLoading === true`
  - ✅ **Bien implementado**

##### 3. **PriceRangeCarousel**
- **Ubicación:** `indiana-next/src/components/vehicles/PriceRangeCarousel/PriceRangeCarousel.jsx`
- **Líneas:** 30-70
- **Estilos:** `PriceRangeCarousel.module.css` (líneas 162-298)
- **Características:**
  - Mismo patrón que `SimilarVehiclesCarousel`
  - Skeleton inline `SkeletonCard`
  - ✅ **Bien implementado**

##### 4. **ModelGallery**
- **Ubicación:** `indiana-next/src/components/ceroKm/ModelGallery.jsx`
- **Líneas:** 79-83
- **Estilos:** `ModelGallery.module.css` (líneas 86-101)
- **Características:**
  - Skeleton simple por imagen individual
  - Se muestra mientras cada imagen carga
  - ✅ **Bien implementado:** Skeleton por imagen, no bloquea toda la galería

---

## 🔍 Patrones Identificados

### ✅ Patrones Correctos

1. **Skeletons con estructura idéntica al componente real**
   - `ListAutosSkeleton` replica `CardAuto`
   - `SkeletonCard` replica `CardSimilar`
   - ✅ Mejora la percepción de carga

2. **Animación shimmer consistente**
   - Todos usan `linear-gradient` con `background-size: 200% 100%`
   - Animación `shimmer` o `skeleton-loading`
   - ✅ Visualmente atractivo

3. **Skeletons inline para componentes específicos**
   - Cada componente tiene su skeleton personalizado
   - ✅ Mantiene la lógica cerca del componente

### ❌ Problemas Identificados (y Resueltos)

1. ~~**Hero skeleton en mobile (0km detalle)**~~ ✅ **RESUELTO**
   - **Archivo:** `indiana-next/src/app/0km/[autoSlug]/loading.jsx`
   - ~~**Problema:** Muestra skeleton del hero en mobile cuando el hero no existe~~
   - **Solución aplicada:** Media query CSS oculta `.hero` en mobile (`@media (max-width: 767px)`)

2. **Falta de componente base reutilizable en Next.js**
   - En `indiana-usados` hay un componente `Skeleton` reutilizable
   - En `indiana-next` cada skeleton está definido inline
   - **Impacto:** Código duplicado, difícil mantener consistencia
   - **Recomendación:** Crear componente base similar a `indiana-usados`

3. **Inconsistencia en ubicaciones**
   - Algunos en `loading.jsx` (Next.js)
   - Otros inline en componentes
   - **Impacto:** Dificulta encontrar y mantener skeletons

---

## 📊 Resumen de Ubicaciones

### `indiana-usados` (React)
```
src/components/skeletons/
├── Skeleton/
│   ├── Skeleton.jsx ✅ (Componente base reutilizable)
│   └── Skeleton.module.css
├── ListAutosSkeleton/
│   ├── ListAutosSkeleton.jsx
│   └── CardAutoSkeleton.jsx
└── DetalleSkeleton/
    ├── DetalleSkeleton.jsx
    └── DetalleSkeleton.module.css
```

### `indiana-next` (Next.js)
```
src/app/
├── 0km/
│   ├── loading.jsx ✅
│   └── 0km-loading.module.css
└── 0km/[autoSlug]/
    ├── loading.jsx ✅ (CORREGIDO: hero oculto en mobile)
    └── 0km-detalle-loading.module.css ✅ (Media query agregada)

src/components/
├── vehicles/
│   ├── List/ListAutos/
│   │   ├── AutosGrid.jsx (skeleton inline) ✅
│   │   └── ListAutos.module.css
│   ├── SimilarVehiclesCarousel/
│   │   ├── SimilarVehiclesCarousel.jsx (skeleton inline) ✅
│   │   └── SimilarVehiclesCarousel.module.css
│   └── PriceRangeCarousel/
│       ├── PriceRangeCarousel.jsx (skeleton inline) ✅
│       └── PriceRangeCarousel.module.css
└── ceroKm/
    └── ModelGallery.jsx (skeleton inline por imagen) ✅
```

---

## 🎯 Recomendaciones

### 1. ~~**URGENTE: Corregir Hero Skeleton en Mobile**~~ ✅ **COMPLETADO**
   - **Archivo:** `indiana-next/src/app/0km/[autoSlug]/0km-detalle-loading.module.css`
   - **Solución aplicada:** Media query CSS agregada para ocultar `.hero` en mobile
   ```css
   @media (max-width: 767px) {
     .hero {
       display: none;
     }
   }
   ```

### 2. **Crear Componente Base Reutilizable**
   - Crear `indiana-next/src/components/ui/Skeleton/Skeleton.jsx`
   - Similar al de `indiana-usados` pero adaptado a Next.js
   - Migrar skeletons inline gradualmente

### 3. **Estandarizar Ubicaciones**
   - Decidir si skeletons van en:
     - `loading.jsx` (Next.js App Router)
     - Componentes inline
     - Componentes separados en carpeta `skeletons/`
   - Documentar la decisión

### 4. **Mejorar Consistencia Visual**
   - Asegurar que todos los skeletons usen la misma animación
   - Mismo color base (`--color-neutral-200`)
   - Misma duración de animación (1.5s)

---

## 📝 Notas Técnicas

### Animación Shimmer
Todos los skeletons usan una animación similar:
```css
background: linear-gradient(
  90deg,
  var(--color-neutral-200, #e8eaed) 25%,
  var(--color-neutral-100, #f1f3f4) 50%,
  var(--color-neutral-200, #e8eaed) 75%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Responsive Breakpoints
- Mobile: `< 768px`
- Desktop: `≥ 768px`
- **Nota:** El hero de 0km detalle solo existe en desktop

---

## ✅ Checklist de Verificación

- [x] Identificar todas las ubicaciones de skeletons
- [x] Analizar patrones de uso
- [x] Identificar problemas (hero en mobile)
- [x] Documentar recomendaciones
- [x] **COMPLETADO:** Corregir hero skeleton en mobile ✅
- [ ] **PENDIENTE:** Crear componente base reutilizable
- [ ] **PENDIENTE:** Estandarizar ubicaciones

---

**Última actualización:** 2024

