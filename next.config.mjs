/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination:
          "/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp",
        permanent: false,
      },
      // Rutas heredadas del sitio WordPress anterior (siguen apareciendo en GA4)
      { source: "/archivos", destination: "/", permanent: true },
      { source: "/archivos/:path*", destination: "/", permanent: true },
      { source: "/venta-directa", destination: "/usados", permanent: true },
      { source: "/venta-directa/:path*", destination: "/usados", permanent: true },
      { source: "/category/:path*", destination: "/", permanent: true },
      { source: "/tag/:path*", destination: "/", permanent: true },
      { source: "/feed", destination: "/", permanent: true },
      { source: "/feed/:path*", destination: "/", permanent: true },
      { source: "/wp-admin", destination: "/", permanent: true },
      { source: "/wp-admin/:path*", destination: "/", permanent: true },
      { source: "/wp-content/:path*", destination: "/", permanent: true },
      { source: "/wp-login.php", destination: "/", permanent: true },
    ];
  },
  // ============================================================
  // Cabeceras de seguridad
  // ============================================================
  async headers() {
    // La CSP arranca en modo REPORTE, no bloqueo. Motivo: el sitio depende de
    // GTM, GA4 y Meta Pixel, y una CSP estricta mal calibrada los apaga sin
    // aviso. En Report-Only el navegador reporta lo que habría bloqueado pero
    // no rompe nada. Después de leer los reportes se pasa a bloqueo cambiando
    // el nombre de la cabecera a "Content-Security-Policy".
    const csp = [
      "default-src 'self'",
      // GTM/GA4 necesitan 'unsafe-inline' (snippets inline) y 'unsafe-eval'
      // (custom HTML tags). No es negociable mientras se use GTM.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
      "connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.facebook.com https://back-indiana.vercel.app https://back-indiana-preview.vercel.app",
      "img-src 'self' data: blob: https:",
      "frame-src https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          // Reportar violaciones sin bloquear. Ver comentario de arriba.
          { key: "Content-Security-Policy-Report-Only", value: csp },

          // Impide que el sitio se cargue dentro de un iframe ajeno
          // (clickjacking). frame-ancestors de la CSP hace lo mismo en
          // navegadores modernos; esto cubre a los viejos.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },

          // El navegador no adivina el tipo de archivo: usa el declarado.
          { key: "X-Content-Type-Options", value: "nosniff" },

          // No filtrar la URL completa al navegar a otro dominio.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Apaga APIs que el sitio no usa.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },

          // HTTPS obligatorio por 2 años, incluidos subdominios.
          // Vercel ya fuerza HTTPS; esto además protege el primer pedido.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  // Desactivar reactCompiler para acelerar build (puede reactivarse si es necesario)
  reactCompiler: false,
  images: {
    // 🔑 Delega el resize a Cloudinary mediante src/lib/imageLoader.js.
    // Apaga el optimizador de Vercel (/_next/image) → adiós 402 y costo $0.
    loaderFile: "./src/lib/imageLoader.js",

    // deviceSizes / imageSizes SE MANTIENEN: Next los usa para decidir qué
    // anchos pide el srcset y se los pasa al loader. Siguen siendo relevantes.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // qualities: el loader propio SÍ recibe y usa el `quality` de cada
    // <Image> (lo traduce a q_<n> de Cloudinary), pero Next igual valida el
    // valor contra esta lista y avisa en desarrollo si no está declarado.
    // Sin esto, la consola se llenaba de "quality 80 is not configured".
    // Son las cinco calidades que usa el código hoy.
    qualities: [70, 75, 80, 85, 90],

    // NOTA: con loaderFile propio, remotePatterns / formats / minimumCacheTTL
    // ya NO aplican (no hay fetch al optimizador de Vercel). Se eliminaron
    // para no confundir; el formato lo resuelve Cloudinary (f_auto) dentro
    // del loader.
  },
  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
