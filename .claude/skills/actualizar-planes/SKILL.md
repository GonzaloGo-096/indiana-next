---
name: actualizar-planes
description: Actualizar los planes de ahorro (Peugeot Plan) de indiana.com.ar con los valores oficiales vigentes. Usar cuando Gonzalo diga "actualizá los planes", "revisá los planes", "cambiaron las cuotas", "valores de los planes", "peugeotindiana planes", o pida comparar los planes del sitio con los de Peugeot. Lo pide a mano, más o menos cada dos semanas.
---

# Actualizar los planes de ahorro

Gonzalo dice "actualizá los planes" y espera el recorrido entero sin más
instrucciones: **buscar → comparar → actualizar → controlar → reportar**.
Decidir solo; preguntarle únicamente lo marcado como "preguntar".

## 1. Buscar: de dónde salen los datos

**Fuente: la API pública de www.peugeotplan.com.ar** (Círculo de Inversores, la
administradora). Es de donde peugeotindiana.com.ar copia a mano sus planes.

No usar peugeotindiana.com.ar: está detrás de Cloudflare y bloquea curl,
WebFetch y el Chrome de Gonzalo (comprobado el 2026-10-06). Además se
actualiza tarde. No hace falta navegador.

```
npm run planes            # lista cada plan vigente + compara con el sitio
```

Datos de cada plan: modelo, cuota desde, valor móvil con y sin impuestos,
cantidad de cuotas, tipo (70/30, 80/20, 100%), adjudicación pactada,
licitación mínima, meses de derecho de inscripción y sellado, diferimiento,
recupero, extras (bonificaciones) y el cuadro de cuotas por tramo.

El servidor de Peugeot tira 502 con pedidos en paralelo y a veces tarda: el
script va de a uno y reintenta. Correrlo con timeout largo (5 min) o en
segundo plano. Si igual falla, reintentar más tarde; no inventar valores.

## 2. Comparar

La salida de `npm run planes` termina con la comparación contra
`src/data/planes.js`, vinculando por `id_oficial`:

- `✗ id` con líneas `campo: antes -> ahora` → hay que actualizar.
- `modelo: X -> Y` → cambió el auto del plan (pasó con 2008 Active → Like).
- `+ NUEVO` → plan que el sitio no tiene.
- `id_oficial N ya no está vigente` → Peugeot lo dio de baja.
- Avisos `⚠` → el texto de Peugeot y su cuadro de cuotas no coinciden. El
  script usa el cuadro (es lo que paga el cliente). Anotarlo para el reporte.

Si dice "El sitio está al día.", se reporta eso y se termina.

## 3. Actualizar

Trabajar en una rama `chore/planes-actualizar-AAAA-MM-DD` desde `staging`.
**Usar un git worktree** (`git worktree add`): en este repo suele haber otra
sesión trabajando y cambiando de rama en la carpeta principal (pasó el
2026-10-06). No tocar archivos ajenos sin commitear. En el worktree correr
`npm ci`: enlazar el `node_modules` de la carpeta principal hace fallar el
build (Turbopack rechaza el symlink). Copiar también `.env.local` de la
carpeta principal (sin él el build falla en /0km por NEXT_PUBLIC_SITE_URL) y
borrar el worktree al terminar (`git worktree remove --force`).

Editar `src/data/planes.js`, copiando los valores que da el script:

- `cuotas_desde` = total de la cuota 1 ("Cuota desde" de Peugeot).
- Los `id` **no se cambian**: son la URL `/planes/[id]` (SEO, links
  compartidos). Si cambia el modelo de un plan, se actualizan `modelos` y
  `plan`, y el id queda.
- Rangos de una sola cuota (`cuotas_13_13`): la ficha los muestra como
  "Cts. 13 a 13". Dejarlo así o, si molesta, ajustar `formatearRangoCuotas`.
- Si Peugeot no publica el valor sin impuestos, poner `null` (la ficha lo
  oculta). No calcularlo.
- **Preguntar** antes de: sacar un plan que Peugeot dio de baja (borra una
  página) y publicar un plan nuevo. Para un plan nuevo hace falta id, que su
  modelo matchee en `MODELO_MAP` (si no, no aparece en la ficha del 0km) y
  una imagen.

Volver a correr `npm run planes`: solo pueden quedar las diferencias que se
decidió no aplicar (planes nuevos sin publicar). Cualquier otra, corregir.

## 4. Controlar

1. `npm run check` en verde (typecheck + lint + tests + build).
2. Levantar el sitio en un puerto libre (la otra sesión puede tener el 3000):
   `npx next dev -p 3100` en segundo plano.
3. `npm run planes:verificar -- http://localhost:3100`: pide `/planes` y cada
   `/planes/[id]` y confirma que se ven cuota, valor con y sin impuestos.
   Tiene que terminar en "Todo lo que dice planes.js se ve en el sitio."
4. `npm run smoke`.
5. Commit `chore(planes): actualizar valores a <fecha>` y push de la rama.
   Vercel arma la preview; se puede repetir el paso 3 contra la URL de la
   preview. Mezclar a staging/main sigue el flujo de pre-producción del
   CLAUDE.md: **publicar en main solo con OK de Gonzalo.**

## 5. Reportar

En lenguaje no técnico:

- Tabla: plan | cuota desde antes → ahora | valor móvil antes → ahora.
- Cambios de condiciones o de modelo.
- Planes nuevos o dados de baja, con la pregunta concreta.
- Discrepancias de Peugeot (avisos ⚠).
- Evidencia de los controles (qué comando, qué devolvió) y lo que no se pudo
  verificar.
- Qué falta para publicar ("decime y lo paso a producción").
