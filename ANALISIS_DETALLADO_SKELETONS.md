# 🔍 Análisis Detallado de Skeletons - Plan de Mejora

**Fecha:** 2024  
**Proyecto:** Indiana Next.js  
**Objetivo:** Analizar y mejorar cada skeleton uno por uno de manera sistemática

---

## 📋 Índice de Skeletons Identificados

### **Categoría A: Loading States de Next.js (Archivos `loading.jsx`)**
1. ✅ `/app/loading.jsx` - Loading global
2. ✅ `/app/0km/loading.jsx` - Listado de modelos 0km
3. ✅ `/app/0km/[autoSlug]/loading.jsx` - Detalle de modelo (CORREGIDO: hero mobile)

### **Categoría B: Skeletons Inline en Componentes**
4. ⚠️ `AutosGrid` - Lista de vehículos (ListAutos)
5. ⚠️ `SimilarVehiclesCarousel` - Carrusel de vehículos similares
6. ⚠️ `PriceRangeCarousel` - Carrusel por rango de precio
7. ✅ `ModelGallery` - Galería de imágenes

---

## 📊 Análisis Individual Detallado

### **1. `/app/loading.jsx` - Loading Global**

**Ubicación:** `indiana-next/src/app/loading.jsx`  
**Estilos:** `indiana-next/src/app/loading.module.css`

#### ✅ Estado Actual
- **Tipo:** Spinner (no es skeleton)
- **Uso:** Loading global de Next.js
- **Implementación:** Correcta, no requiere cambios

#### 📝 Notas
- No es un skeleton, es un spinner
- Funciona correctamente
- **Acción:** ✅ No requiere cambios

---

### **2. `/app/0km/loading.jsx` - Listado de Modelos**

**Ubicación:** `indiana-next/src/app/0km/loading.jsx`  
**Estilos:** `indiana-next/src/app/0km/0km-loading.module.css`

#### 📐 Estructura Actual
```jsx
- Container
  - Header (título + subtítulo skeleton)
  - Carrusel (4 cards skeleton)
    - Card (imagen + texto + botón skeleton)
```

#### ✅ Aspectos Positivos
- Estructura clara y organizada
- Responsive implementado
- Animación shimmer consistente

#### ⚠️ Problemas Identificados
1. **Colores hardcodeados en algunos lugares**
   - Usa `var(--color-neutral-200)` pero también valores directos
   - Inconsistencia con otros skeletons

2. **Falta de accesibilidad**
   - No tiene `aria-label` o `aria-hidden` explícito
   - Podría mejorar con `role="status"`

3. **Cantidad fija de cards**
   - Siempre muestra 4 cards
   - Podría ser configurable

#### 🎯 Mejoras Sugeridas
- [ ] Estandarizar colores (usar solo variables CSS)
- [ ] Agregar atributos de accesibilidad
- [ ] Hacer cantidad de cards configurable
- [ ] Verificar responsive en diferentes breakpoints

#### 📊 Prioridad: **MEDIA** (Funciona bien, mejoras menores)

---

### **3. `/app/0km/[autoSlug]/loading.jsx` - Detalle de Modelo**

**Ubicación:** `indiana-next/src/app/0km/[autoSlug]/loading.jsx`  
**Estilos:** `indiana-next/src/app/0km/[autoSlug]/0km-detalle-loading.module.css`

#### 📐 Estructura Actual
```jsx
- Container
  - Hero skeleton (oculto en mobile ✅)
  - Header (título + subtítulo)
  - Content
    - LeftColumn (imagen + selector de color)
    - RightColumn (textos + lista)
```

#### ✅ Aspectos Positivos
- ✅ **CORREGIDO:** Hero oculto en mobile
- Estructura refleja el layout real
- Responsive bien implementado

#### ⚠️ Problemas Identificados
1. **Colores inconsistentes**
   - Mezcla `var(--color-neutral-200)` con valores directos
   - Diferentes tonos de gris en diferentes elementos

2. **Falta de accesibilidad**
   - No tiene `aria-label` descriptivo
   - Podría usar `role="status"` con `aria-live="polite"`

3. **Alturas fijas que podrían no coincidir**
   - `skeletonHeroImage`: 400px fijo
   - `skeletonImage`: 300px mobile, 400px desktop
   - Verificar que coincidan con el contenido real

#### 🎯 Mejoras Sugeridas
- [x] ✅ Ocultar hero en mobile (COMPLETADO)
- [ ] Estandarizar colores (usar solo variables CSS)
- [ ] Agregar atributos de accesibilidad
- [ ] Verificar alturas con el contenido real
- [ ] Agregar `prefers-reduced-motion` para animaciones

#### 📊 Prioridad: **MEDIA** (Ya corregido el problema principal)

---

### **4. `AutosGrid` - Lista de Vehículos**

**Ubicación:** `indiana-next/src/components/vehicles/List/ListAutos/AutosGrid.jsx`  
**Estilos:** `indiana-next/src/components/vehicles/List/ListAutos/ListAutos.module.css` (líneas 280-504)

#### 📐 Estructura Actual
```jsx
ListAutosSkeleton
  - loadingContainer
    - loading (grid)
      - skeletonCard (x8)
        - skeletonImage (aspect-ratio 16/9)
        - skeletonBody
          - skeletonContainer1
            - skeletonLogo (absoluto)
            - skeletonContainer1Right
              - skeletonRow1 (marca | modelo)
              - skeletonRow3 (caja, km, año)
          - skeletonPriceContainer
```

#### ✅ Aspectos Positivos
- **Excelente:** Estructura idéntica a `CardAuto`
- **Excelente:** Usa `aspect-ratio` para imagen
- **Excelente:** Logo en posición absoluta (igual al real)
- **Excelente:** Responsive con `clamp()` para tamaños
- **Excelente:** Animación `skeleton-loading` bien implementada
- Muestra 8 elementos (buena cantidad)

#### ⚠️ Problemas Identificados
1. **Animación diferente a otros skeletons**
   - Usa `skeleton-loading` (dirección inversa: 200% → -200%)
   - Otros usan `shimmer` (dirección: -200% → 200%)
   - **Inconsistencia visual**

2. **Colores ligeramente diferentes**
   - Usa `var(--color-neutral-100)` y `var(--color-neutral-50)`
   - Otros usan `var(--color-neutral-200)` y `var(--color-neutral-100)`
   - **Inconsistencia de tonos**

3. **Falta de accesibilidad**
   - No tiene `aria-label` en el contenedor
   - Podría usar `role="status"`

4. **Cantidad hardcodeada**
   - Siempre muestra 8 elementos
   - Podría ser prop configurable

5. **No respeta `prefers-reduced-motion`**
   - Animación siempre activa
   - Debería desactivarse para usuarios sensibles

#### 🎯 Mejoras Sugeridas
- [ ] **URGENTE:** Estandarizar animación (usar `shimmer` como los demás)
- [ ] Estandarizar colores (usar misma paleta que otros)
- [ ] Agregar `prefers-reduced-motion` media query
- [ ] Agregar atributos de accesibilidad
- [ ] Hacer cantidad configurable (prop opcional)
- [ ] Verificar que todos los elementos tengan `aria-hidden="true"`

#### 📊 Prioridad: **ALTA** (Inconsistencias visuales importantes)

---

### **5. `SimilarVehiclesCarousel` - Carrusel Similar**

**Ubicación:** `indiana-next/src/components/vehicles/SimilarVehiclesCarousel/SimilarVehiclesCarousel.jsx`  
**Estilos:** `SimilarVehiclesCarousel.module.css` (líneas 192-382)

#### 📐 Estructura Actual
```jsx
SkeletonCard
  - skeletonCard (320px fijo)
    - skeletonImage (180px altura fija)
    - skeletonBody
      - skeletonContainer1
        - skeletonRow1 (marca | modelo)
        - skeletonRow3 (caja, km, año)
      - skeletonPriceContainer
```

#### ✅ Aspectos Positivos
- Estructura idéntica a `CardSimilar`
- Ancho fijo correcto (320px)
- Altura de imagen fija (180px) igual al real
- Animación `shimmer` consistente
- Responsive con `clamp()`

#### ⚠️ Problemas Identificados
1. **Colores inconsistentes**
   - Usa `var(--color-neutral-100)` y `var(--color-neutral-50)`
   - Debería usar misma paleta que otros

2. **Falta de accesibilidad**
   - No tiene `aria-label`
   - Elementos individuales sin `aria-hidden`

3. **No respeta `prefers-reduced-motion`**
   - Animación siempre activa

4. **Cantidad hardcodeada en uso**
   - En el componente se renderizan varios `SkeletonCard`
   - Cantidad debería ser configurable

#### 🎯 Mejoras Sugeridas
- [ ] Estandarizar colores (usar misma paleta)
- [ ] Agregar `prefers-reduced-motion`
- [ ] Agregar atributos de accesibilidad
- [ ] Hacer cantidad configurable
- [ ] Verificar que coincida exactamente con `CardSimilar`

#### 📊 Prioridad: **MEDIA** (Funciona bien, mejoras menores)

---

### **6. `PriceRangeCarousel` - Carrusel por Precio**

**Ubicación:** `indiana-next/src/components/vehicles/PriceRangeCarousel/PriceRangeCarousel.jsx`  
**Estilos:** `PriceRangeCarousel.module.css` (líneas 162-352)

#### 📐 Estructura Actual
```jsx
SkeletonCard (idéntico a SimilarVehiclesCarousel)
```

#### ✅ Aspectos Positivos
- Estructura idéntica a `CardSimilar`
- Mismo código que `SimilarVehiclesCarousel` (consistente)

#### ⚠️ Problemas Identificados
**MISMOS PROBLEMAS QUE `SimilarVehiclesCarousel`:**
1. Colores inconsistentes
2. Falta de accesibilidad
3. No respeta `prefers-reduced-motion`
4. Cantidad hardcodeada

#### 🎯 Mejoras Sugeridas
- [ ] **OPORTUNIDAD:** Extraer `SkeletonCard` a componente compartido
- [ ] Aplicar mismas mejoras que `SimilarVehiclesCarousel`
- [ ] Estandarizar colores
- [ ] Agregar accesibilidad
- [ ] Agregar `prefers-reduced-motion`

#### 📊 Prioridad: **MEDIA** (Duplicación de código con SimilarVehiclesCarousel)

---

### **7. `ModelGallery` - Galería de Imágenes**

**Ubicación:** `indiana-next/src/components/ceroKm/ModelGallery.jsx`  
**Estilos:** `ModelGallery.module.css` (líneas 86-120)

#### 📐 Estructura Actual
```jsx
Por cada imagen:
  - imageSkeleton (absoluto, mientras carga)
    - skeletonShimmer
```

#### ✅ Aspectos Positivos
- **Excelente:** Skeleton por imagen individual (no bloquea toda la galería)
- **Excelente:** Se oculta cuando la imagen carga
- **Excelente:** Posición absoluta correcta
- Animación `shimmer` consistente
- Ya tiene `aria-hidden="true"`

#### ⚠️ Problemas Identificados
1. **Colores hardcodeados**
   - Usa `#f0f0f0` y `#e0e0e0` directamente
   - Debería usar variables CSS

2. **Doble animación innecesaria**
   - `.imageSkeleton` tiene animación
   - `.skeletonShimmer` también tiene animación
   - **Redundante**

3. **No respeta `prefers-reduced-motion`**
   - Animación siempre activa

#### 🎯 Mejoras Sugeridas
- [ ] Reemplazar colores hardcodeados por variables CSS
- [ ] Simplificar animación (eliminar redundancia)
- [ ] Agregar `prefers-reduced-motion`
- [ ] Verificar que `aria-hidden` esté en todos los elementos

#### 📊 Prioridad: **BAJA** (Funciona muy bien, mejoras menores)

---

## 🎯 Plan de Acción - Orden de Mejora

### **FASE 1: Estandarización y Consistencia** (Prioridad Alta)

#### ✅ **Paso 1.1: Crear Componente Base Reutilizable**
- [ ] Crear `src/components/ui/Skeleton/Skeleton.jsx`
- [ ] Crear `src/components/ui/Skeleton/Skeleton.module.css`
- [ ] Incluir variantes: Text, Title, Image, Button, Card
- [ ] Incluir soporte para `prefers-reduced-motion`
- [ ] Estandarizar colores y animación

#### ✅ **Paso 1.2: Estandarizar Animación Shimmer**
- [ ] Crear animación `shimmer` global en CSS
- [ ] Reemplazar `skeleton-loading` en `AutosGrid` por `shimmer`
- [ ] Verificar que todos usen la misma animación
- [ ] Agregar `prefers-reduced-motion` a todos

#### ✅ **Paso 1.3: Estandarizar Colores**
- [ ] Definir paleta de colores skeleton en variables CSS
- [ ] Actualizar todos los skeletons para usar las mismas variables
- [ ] Eliminar colores hardcodeados

---

### **FASE 2: Mejoras Individuales** (Prioridad Media)

#### ✅ **Paso 2.1: AutosGrid** (Prioridad ALTA)
- [ ] Cambiar animación de `skeleton-loading` a `shimmer`
- [ ] Estandarizar colores
- [ ] Agregar `prefers-reduced-motion`
- [ ] Agregar accesibilidad
- [ ] Hacer cantidad configurable

#### ✅ **Paso 2.2: SimilarVehiclesCarousel y PriceRangeCarousel**
- [ ] Extraer `SkeletonCard` a componente compartido
- [ ] Estandarizar colores
- [ ] Agregar `prefers-reduced-motion`
- [ ] Agregar accesibilidad
- [ ] Hacer cantidad configurable

#### ✅ **Paso 2.3: Loading States (0km)**
- [ ] Estandarizar colores
- [ ] Agregar accesibilidad
- [ ] Verificar responsive

#### ✅ **Paso 2.4: ModelGallery**
- [ ] Reemplazar colores hardcodeados
- [ ] Simplificar animación
- [ ] Agregar `prefers-reduced-motion`

---

### **FASE 3: Optimización y Documentación** (Prioridad Baja)

#### ✅ **Paso 3.1: Documentación**
- [ ] Documentar componente base `Skeleton`
- [ ] Crear guía de uso de skeletons
- [ ] Documentar mejores prácticas

#### ✅ **Paso 3.2: Testing**
- [ ] Verificar todos los skeletons en diferentes breakpoints
- [ ] Verificar accesibilidad
- [ ] Verificar `prefers-reduced-motion`

---

## 📝 Resumen de Problemas por Categoría

### **🔴 Críticos (Alta Prioridad)**
1. ❌ **AutosGrid:** Animación diferente (`skeleton-loading` vs `shimmer`)
2. ❌ **AutosGrid:** Colores inconsistentes
3. ❌ **Todos:** Falta `prefers-reduced-motion`

### **🟡 Importantes (Media Prioridad)**
1. ⚠️ **Todos:** Colores inconsistentes entre skeletons
2. ⚠️ **Todos:** Falta de accesibilidad (`aria-label`, `role="status"`)
3. ⚠️ **SimilarVehiclesCarousel/PriceRangeCarousel:** Duplicación de código

### **🟢 Menores (Baja Prioridad)**
1. ℹ️ **ModelGallery:** Colores hardcodeados
2. ℹ️ **ModelGallery:** Doble animación redundante
3. ℹ️ **Todos:** Cantidad hardcodeada (debería ser configurable)

---

## 🚀 Progreso de Mejoras

### ✅ **COMPLETADO - Fase 1: Estandarización**

#### ✅ **Paso 1.1: Componente Base Reutilizable** (COMPLETADO)
- ✅ Creado `src/components/ui/Skeleton/Skeleton.jsx`
- ✅ Creado `src/components/ui/Skeleton/Skeleton.module.css`
- ✅ Incluye variantes: Text, Title, Image, Button
- ✅ Soporte para `prefers-reduced-motion`
- ✅ Accesibilidad integrada (`aria-label`, `aria-hidden`, `role="status"`)
- ✅ Colores estandarizados usando variables CSS

#### ✅ **Paso 1.2: Estandarizar Animación Shimmer** (COMPLETADO)
- ✅ Cambiada animación en `AutosGrid` de `skeleton-loading` a `shimmer`
- ✅ Keyframe `shimmer` estandarizado (dirección: -200% → 200%)
- ✅ Todos los skeletons ahora usan la misma animación

#### ✅ **Paso 1.3: Estandarizar Colores** (COMPLETADO)
- ✅ `AutosGrid` ahora usa `var(--color-neutral-200)` y `var(--color-neutral-100)`
- ✅ Consistente con otros skeletons

#### ✅ **Paso 1.4: Agregar prefers-reduced-motion** (COMPLETADO)
- ✅ Agregado `@media (prefers-reduced-motion: reduce)` en `AutosGrid`
- ✅ Desactiva animación para usuarios sensibles

#### ✅ **Paso 1.5: Mejorar Accesibilidad** (COMPLETADO)
- ✅ Agregado `role="status"` y `aria-label` en `AutosGrid`
- ✅ Agregado `aria-live="polite"` para lectores de pantalla
- ✅ Agregado `aria-hidden="true"` en elementos skeleton individuales

---

### 🔄 **EN PROGRESO - Fase 2: Mejoras Individuales**

#### ⏳ **Paso 2.1: SimilarVehiclesCarousel y PriceRangeCarousel**
- [ ] Extraer `SkeletonCard` a componente compartido
- [ ] Estandarizar colores
- [ ] Agregar `prefers-reduced-motion`
- [ ] Agregar accesibilidad

#### ⏳ **Paso 2.2: ModelGallery**
- [ ] Reemplazar colores hardcodeados
- [ ] Simplificar animación (eliminar redundancia)
- [ ] Agregar `prefers-reduced-motion`

---

## 📊 Resumen de Cambios Aplicados

### **AutosGrid - Mejoras Aplicadas:**
1. ✅ Animación cambiada de `skeleton-loading` a `shimmer`
2. ✅ Colores estandarizados (`--color-neutral-200` y `--color-neutral-100`)
3. ✅ Agregado `prefers-reduced-motion` support
4. ✅ Mejorada accesibilidad (`role="status"`, `aria-label`, `aria-live`)

### **Componente Base Creado:**
- ✅ `Skeleton.jsx` - Componente base reutilizable
- ✅ `Skeleton.module.css` - Estilos estandarizados
- ✅ Variantes: `SkeletonText`, `SkeletonTitle`, `SkeletonImage`, `SkeletonButton`
- ✅ Contenedores: `SkeletonGroup`, `SkeletonGrid`

---

## 🎯 Siguiente Paso

**Paso 2.1:** Extraer `SkeletonCard` compartido de `SimilarVehiclesCarousel` y `PriceRangeCarousel` para eliminar duplicación de código.

---

**Última actualización:** 2024

