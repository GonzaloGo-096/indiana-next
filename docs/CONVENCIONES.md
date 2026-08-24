# Convenciones del frontend

Este documento es **la vara**. Sirve para que "limpio" y "ordenado" dejen de ser opinión
y se puedan comprobar: cuando dos formas de hacer algo compiten, gana la que está acá.

No describe cómo está el código hoy. Describe hacia dónde va, y es el criterio con el que
se audita cada parte del proyecto.

Cada regla dice **qué se espera**, **por qué** y **qué se hace cuando no da**. Si una regla
no se puede comprobar mirando el código, no es una regla: es una preferencia, y no entra.

---

## 1. Tamaño de los archivos

**Se espera:** menos de 300 líneas por archivo de código.

**Por qué:** un archivo que no entra en la cabeza de un lector no se revisa, se hojea. Los
tres archivos más grandes del proyecto (987, 653 y 634 líneas) son justamente donde más
cuesta saber si un cambio rompe algo.

**Cuando no da:** se parte, o se deja un comentario arriba del archivo explicando por qué
tiene que seguir junto. Un archivo grande con motivo escrito es aceptable; uno grande
porque sí, no.

---

## 2. Repetición

**Se espera:** ninguna lógica copiada. Se extrae una pieza compartida cuando hay **tres
copias**, o **dos de más de 50 líneas**.

**Por qué:** las copias no se actualizan juntas. El precio de oferta se arregló tres veces
esta semana porque vivía en tres fichas distintas.

**Cuando no da:** se extrae la parte común y las diferencias entran por parámetro. Si las
diferencias son tantas que el parámetro se vuelve un disfraz, entonces no era repetición
y se documenta por qué son dos cosas distintas.

---

## 3. Comentarios

**Se espera:** comentarios que expliquen **por qué**, no **qué**.

Se conserva el que evita que alguien rompa algo sin darse cuenta: una decisión con
motivo, una trampa conocida, un dato verificado.

Se saca: los que narran lo que la línea de abajo ya dice, los marcadores decorativos
(✅ ⚠️ 🔑 🎯), los separadores de adorno, y las cabeceras `@author` / `@version` con
historial de versiones — esa historia la lleva git, y la del archivo casi siempre miente.

**Por qué:** hay 620 líneas de comentario decorativo en 66 archivos. Compiten por la
atención con los pocos comentarios que sí importan, y hacen que se lean todos por encima.

---

## 4. Qué corre en el navegador

**Se espera:** que `'use client'` sea la excepción y esté justificado.

Un componente va al navegador solo si necesita **estado propio, un evento del usuario, o
una API del navegador**. Mostrar datos no alcanza como motivo.

**Por qué:** hoy 76 de 121 componentes corren en el navegador. Cada uno que sobra es
código que el visitante descarga y ejecuta para ver algo que podría haber llegado ya
armado. Es también lo que hizo que la sección de usados del inicio apareciera vacía: se
pedían los datos desde el navegador cuando el servidor podía traerlos.

**Cuando no da:** se sube el `'use client'` lo más abajo posible en el árbol, para que
solo la parte interactiva viaje.

---

## 5. Estilos

**Se espera:**

- **Cero clases sin usar.** Hoy son 241 de 1.433 (17%).
- **Variables, no números sueltos.** Si hay un token de color o espaciado, se usa.
- **Sin `!important`** salvo con comentario que explique contra qué está peleando. Hoy hay 268.
- Cada componente con su `.module.css` al lado. Nada de estilos globales nuevos.

**Por qué:** una hoja de estilos con un tercio de clases muertas no se puede leer: no se
sabe qué está vivo. Y cada número suelto es un lugar donde el diseño se desincroniza.

**Cuando no da:** se verifica clase por clase antes de proponer borrarla, porque una clase
puede usarse por composición o desde un selector anidado. **Ninguna se borra sin lista
previa y aprobación.**

---

## 6. Nombres y ubicación

**Se espera:** un solo idioma y un solo criterio por carpeta. Un tema, una carpeta.

**Por qué:** hoy conviven `components/0km` y `components/ceroKm` para lo mismo. Cuando hay
dos lugares posibles, el siguiente archivo cae en cualquiera de los dos y el desorden crece
solo.

**Cuando no da:** se renombra junto con todos sus usos, en un commit que no haga otra cosa,
para que el cambio sea fácil de revisar y de revertir.

---

## 7. Errores

**Se espera:** ningún `catch` mudo. Todo error se registra con el logger (`createLogger`),
nunca con `console` suelto.

**Por qué:** durante meses los errores en producción fueron invisibles. El logger ya tiene
enganchado el lugar donde se conectará el servicio de avisos, así que registrar bien hoy es
lo que va a permitir enterarse mañana.

**Cuando no da:** si un error de verdad se puede ignorar, se escribe **por qué** en el
propio `catch`.

---

## 8. Tests

**Se espera:** que toda lógica que decida algo (precios, filtros, transformaciones,
reductores) tenga test. Los componentes se cubren por comportamiento, no por píxel.

**Por qué:** sin red, reestructurar es apostar. Hoy hay 1 archivo de test para 106
componentes y 0 para 13 hooks.

---

## Cómo se aplica

- Estas reglas se aplican **a la parte que se está auditando**, no a todo el proyecto de
  golpe. Nadie reescribe 28.000 líneas de una sentada.
- El código que ya cumple no se toca. **Simplificar lo necesario, no todo lo posible.**
- Cuando una regla choca con que algo funcione, gana que funcione, y se anota la excepción.

## Estado

Propuestas como parte 0 del plan de limpieza y **aceptadas por Gonzalo el 2026-08-12**, las
ocho. Desde acá son el criterio con el que se audita cada parte del proyecto.

Si alguna resulta impracticable en la práctica, se discute y se cambia el documento. Lo que
no se hace es ignorarla en silencio: una regla que no se cumple es peor que no tenerla.
