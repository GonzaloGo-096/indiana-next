# Pendientes que necesitan a Gonzalo

Lista viva. Nada de acá frena el trabajo: son decisiones o acciones que solo
podés hacer vos, y las voy anotando a medida que aparecen.

Estado: 🟡 pendiente · ✅ resuelto

---

## 🟡 1. ¿Dónde querés que lleguen los avisos de error?

**De qué se trata.** Cuando algo se rompe en el sitio, ahora queda anotado.
Hoy esas anotaciones van a un registro técnico de Vercel que hay que ir a
buscar a mano. Lo normal es usar un servicio que te mande un mail.

**Qué necesito.** Que decidas entre:

- **Sentry** (lo más usado, gratis para un sitio de este tamaño). Tenés que
  crear la cuenta y pasarme una clave que te da. Contra: suma ~30 KB al peso
  del sitio.
- **Dejarlo como está.** Los errores se siguen guardando, solo que hay que ir
  a mirarlos a Vercel. Cero costo, cero peso.

**Bloquea algo?** No. Ya está toda la cañería puesta: el día que decidas, es
un cambio de 10 líneas.

**Mi recomendación.** Sentry, pero no corre apuro.

---

## 🟡 2. Tres cosas para pedirle al equipo del backend

Son del otro repo (el servidor), así que yo no las puedo hacer.

1. **Permitir el desarrollo local.** Hoy el servidor de pruebas rechaza las
   consultas que salen de mi máquina. Por eso no puedo ver el inicio con
   autos cargados mientras trabajo.
2. **Una forma sana de verificar el login.** Hoy el sitio comprueba si tu
   sesión es válida intentando *borrar* un auto con un código inexistente. Si
   alguien configura mal ese código, cada verificación borraría un auto real.
   Habría que pedirles un `GET /user/me` (una consulta que solo responde
   "sí, sos vos" sin tocar nada).
3. **Guardar la sesión de forma más segura** (a futuro, es el más grande).

**Bloquea algo?** Los puntos 1 y 2 no frenan nada. El 3 es a futuro.

---

## 🟡 3. ¿Autorizás que use agentes de revisión?

**De qué se trata.** Tenés configurados unos revisores automáticos
(`reviewer`, `qa`, `security`). La idea es que **revise el código alguien que
no lo escribió** — o sea, que no me apruebe yo solo.

**Qué necesito.** Un "dale" para usarlos al cerrar cada bloque.

**Bloquea algo?** No, pero es la forma más barata de que no se me pase algo.

---

## 🟡 4. Decisiones de limpieza (para el Bloque 7, más adelante)

Cuatro cosas instaladas que no se usan y que conviene sacar. Te las listo
ahora para que no te sorprendan después. **Ninguna se borra sin tu OK.**

- **Tailwind**: una herramienta de estilos que está cargada pero no se usa en
  ningún lado. Sacarla hace el sitio más liviano.
- **TypeScript**: está a medio poner. O lo adoptamos en serio (mejora la
  calidad, lleva tiempo) o sacamos lo que sobra.
- **Modo mantenimiento**: hay una página de "sitio en mantenimiento" que
  nunca se puede activar porque falta conectarla. ¿La conectamos o la
  borramos?
- **Un archivo de log viejo** (`dev-output.log`) que quedó guardado en el
  repositorio por error.

**Bloquea algo?** No, es lo último del plan.

---

## 🟡 5. Revisión visual tuya después de un cambio puntual

**De qué se trata.** Hay 15 reglas de diseño responsive (las que adaptan el
sitio al celular) que están mal escritas y **nunca funcionaron**. Al
arreglarlas, van a empezar a aplicarse estilos que nadie vio nunca.

**Qué necesito.** Que después de ese cambio mires el sitio en el celular y me
digas si algo se ve raro. Yo lo voy a revisar igual, pero cuatro ojos ven
mejor y vos conocés cómo tiene que verse.

**Bloquea algo?** No, avisa cuando llegue (Bloque 3).

---

## 🟡 6. Probar una carga de auto en el panel (5 minutos)

**De qué se trata.** Cerré el agujero de seguridad de las fotos: ahora el
servidor exige que estés logueado **antes** de procesar el archivo. Verificado:
un pedido anónimo con una foto de 3 MB se rechaza en 28 milisegundos y el
servidor ni siquiera termina de recibir el archivo. Antes lo procesaba entero
y recién después lo rechazaba.

**Qué necesito.** Que cargues un auto de prueba en el panel, con fotos, y
confirmes que sigue funcionando igual. Yo probé el mecanismo con tests y con
pedidos directos al servidor, pero **la subida real desde el panel necesita tu
usuario** y no tengo forma de hacerla.

Si algo falla, avisame y lo reviso — el cambio se revierte en un comando.

**Bloquea algo?** No, pero es la única parte del arreglo que no pude
verificar yo.

---

## 🟡 7. Un archivo quedó sin uso: ¿lo borro?

**De qué se trata.** Al arreglar el inicio, el archivo que pedía los autos
desde el navegador (`src/components/home/HomeUsadosSectionClient.jsx`, 44
líneas) dejó de usarse. Ya no lo llama nadie.

**Qué necesito.** Tu OK para borrarlo. No lo elimino por mi cuenta porque tu
regla es que nada se borra sin avisar.

**Bloquea algo?** No. Ahí quedó, sin molestar: como no lo importa nadie, no
entra en el sitio ni suma peso.

---

## 🟡 8. El chequeo de calidad automático está apagado

**De qué se trata.** El proyecto tiene un revisor automático de código
(`lint`) que hoy marca **15 errores**. No los hice yo: ya venían. Nadie los
ve porque ese chequeo no corre solo.

**Qué necesito.** Decidir si los arreglamos (son de código antiguo, hay que
mirarlos uno por uno) o los dejamos anotados y solo evitamos que aparezcan
nuevos.

**Bloquea algo?** No.

**Mi recomendación.** Dejarlos por ahora y encararlos en el Bloque 7.
