import path from "node:path";

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // base apunta a ./src para evitar que Oxide escanee la raíz del proyecto.
    // En Windows, el escaneo de la raíz produce un "fantasma" del nombre de
    // dispositivo reservado `nul`, lo que rompe Turbopack al intentar leerlo.
    "@tailwindcss/postcss": {
      base: path.join(process.cwd(), "src"),
    },
  },
};

export default config;
