---
name: actualizar-planes
description: Actualizar los planes de ahorro (Peugeot Plan) de indiana.com.ar con los valores oficiales vigentes. Usar cuando Gonzalo diga "actualizá los planes", "revisá los planes", "cambiaron las cuotas", "valores de los planes", "peugeotindiana planes", o pida comparar los planes del sitio con los de Peugeot.
---

# Actualizar los planes de ahorro

## De dónde sale la información

**Fuente: la API pública de www.peugeotplan.com.ar** (Círculo de Inversores, la
administradora). Es de donde peugeotindiana.com.ar copia a mano sus planes.

No usar peugeotindiana.com.ar: está detrás de Cloudflare y bloquea tanto a
curl/WebFetch como al Chrome de Gonzalo (comprobado el 2026-10-06). Además se
actualiza tarde: en mayo 2026 tenía valores más viejos que los oficiales.

Todo lo hace el script, no hace falta navegador:

```
node --no-warnings scripts/planes-oficiales.mjs [--json salida.json]
```

Imprime cada plan vigente con todos sus datos y lo compara con
`src/data/planes.js`. Sale con código 1 si hay diferencias. El servidor de
Peugeot tira 502 si se le pega en paralelo y a veces tarda; el script va de a
uno y reintenta. Correrlo con timeout largo o en segundo plano.

## Cómo se actualiza

1. Rama desde `staging`: `chore/planes-actualizar-AAAA-MM`.
2. Correr el script y leer **los avisos ⚠** antes de copiar nada:
   - El texto de Peugeot y su cuadro de cuotas a veces no coinciden
     (diferimiento o recupero). El script usa el cuadro, porque es lo que
     paga el cliente. Mencionarle a Gonzalo cada discrepancia.
   - Si un plan no publica valor sin impuestos, dejar el anterior o `null`
     y avisar; no calcularlo.
3. Editar `src/data/planes.js`:
   - Cada plan se vincula con el oficial por `id_oficial`. Con eso el script
     compara campo por campo.
   - Los `id` del sitio **no se cambian**: son la URL `/planes/[id]`
     (SEO y links compartidos). Si cambia el modelo de un plan existente
     (ej. 2008 Active → 2008 Like), se actualiza el contenido y se mantiene el id.
   - Plan **nuevo** en Peugeot → id nuevo, y revisar que el modelo esté en
     `MODELO_MAP` (si no, no aparece en la ficha del 0km) y que haya imagen.
   - Plan que **ya no está** en Peugeot → preguntarle a Gonzalo antes de
     sacarlo (borrar requiere OK).
   - `cuotas_desde` = total de la cuota 1 del cuadro (lo que Peugeot llama
     "Cuota desde").
4. Volver a correr el script: tiene que decir "El sitio está al día."
5. `npm run check` y `npm run smoke`; mirar `/planes` y un `/planes/[id]`.
6. Commit `chore(planes): actualizar valores a <mes año>`, push de la rama.
   Mezclar a staging/main sigue el flujo de pre-producción del CLAUDE.md.

## Qué devolverle a Gonzalo

Tabla corta: plan, cuota desde antes → ahora, valor móvil antes → ahora.
Aparte: planes nuevos, planes que desaparecieron, discrepancias de Peugeot,
y lo que no se pudo verificar.
