import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Configuración mínima de Vitest.
 *
 * - Resuelve el alias `@/*` igual que jsconfig.json para que los tests
 *   puedan importar archivos que usan `@/lib/...`.
 * - Entorno `node` (los tests actuales no necesitan DOM).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
  },
});
