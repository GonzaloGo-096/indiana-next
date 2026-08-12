import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Silenciar temporalmente hasta ETAPA 4 (migración a next/image)
      "@next/next/no-img-element": "off",

      // Regla invertida a propósito respecto del uso habitual de no-console.
      //
      // Lo que rompe acá no es console.log (esos están gateados a dev y mueren
      // en el build), sino console.error/warn: esos SÍ corren en producción y,
      // si no pasan por lib/logger, no llegan a telemetría. Así fue como la
      // home estuvo sin usados sin que nadie se enterara.
      //
      // Por eso se prohíben error/warn y se permiten log/info/debug.
      //
      // Queda en "warn" y no en "error" porque hoy hay ~53 console.error/warn
      // gateados a mano en bloques `if (dev)`, repartidos en 20 archivos. Esos
      // deberían usar logger.debug (el logger ya hace el gating), pero migrarlos
      // no es mecánico: cada sitio hay que decidir si va gateado o no, y
      // equivocarse llena los logs de producción. Es trabajo del Bloque 7.
      // Mientras tanto la regla cumple su función: cualquier console.error
      // nuevo aparece en la revisión.
      "no-console": ["warn", { allow: ["log", "info", "debug"] }],
    },
  },
  {
    // El logger es el único que puede escribir a consola sin restricción:
    // es justamente su trabajo.
    files: ["src/lib/logger.js"],
    rules: { "no-console": "off" },
  },
]);

export default eslintConfig;
