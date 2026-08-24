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

Remoto GitHub, se dice PR. La rama base de trabajo es `staging`.

Nunca commitear directo a `staging`. Rama por cambio, con prefijo:
`feat/` `fix/` `refactor/` `chore/` `docs/` `test/`

Commits en Conventional Commits, español, imperativo y minúscula:
`fix(filtros): ajustar los topes de las barras a valores utiles`

Claude propone el nombre de rama y el mensaje de commit, no los pide.

## Decisiones

Lo aditivo y reversible se hace sin preguntar, y se reporta después.
Se pregunta antes solo si: borra algo, reescribe historia compartida,
toca producción, o hay una condición que no se pudo verificar.

## Entorno

Windows, PowerShell (Bash también disponible). Node 22.
`npm run dev` → http://localhost:3000
