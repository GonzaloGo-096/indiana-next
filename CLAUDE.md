@AGENTS.md
@docs/CONVENCIONES.md

# Cómo trabajamos en este repo

Claude lee este archivo al inicio de cada sesión y sigue esto por defecto,
sin que Gonzalo tenga que pedirlo.

## Puerta de calidad

Antes de decir que algo está listo: `npm run check`
(typecheck + lint + tests + build). **Si falla, no está listo.**

Mostrar siempre la evidencia: qué comando corrí y qué devolvió.
Decir "listo" sin evidencia no vale.

Si toqué la interfaz: `npm run smoke`, o una captura comparada con cómo estaba antes.

Lo que no pude verificar, decirlo sin que me lo pregunten.

## Git

Remoto GitHub. La rama base de trabajo es `staging`; `main` es producción
(Vercel publica indiana.com.ar desde `main`).

Nunca commitear directo a `staging` ni a `main`. Rama por cambio, con prefijo:
`feat/` `fix/` `refactor/` `chore/` `docs/` `test/`

Commits en Conventional Commits, español, imperativo y minúscula:
`fix(filtros): ajustar los topes de las barras a valores utiles`

Claude propone el nombre de rama y el mensaje de commit, no los pide.

**Sin PR** (decisión de Gonzalo, 2026-09-24). Cuando un cambio está comprobado
(`npm run check` en verde y probado), Claude lo commitea en su rama y la sube
a GitHub; cada rama tiene su preview en Vercel. Mezclar a `staging` y a `main`
va en una etapa de **pre-producción**: se revisan los commits con Gonzalo y
recién con su OK se mezcla. Publicar (`main`) se confirma aparte, siempre.

## Decisiones

Lo aditivo y reversible se hace sin preguntar, y se reporta después.
Se pregunta antes solo si: borra algo, reescribe historia compartida,
toca producción, o hay una condición que no se pudo verificar.

## Entorno

Windows, PowerShell (Bash también disponible). Node 22.
`npm run dev` → http://localhost:3000
