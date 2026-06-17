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
  // CSP (Content Security Policy) — TODO opcional, fase 2
  // ============================================================
  // Activar headers() con CSP cuando se quiera endurecer la seguridad.
  // Importante: testear en Vercel Preview antes de prod, CSP estricta puede
  // romper scripts inline o estilos. Las directivas mínimas para GTM+GA4+Meta:
  //
  // async headers() {
  //   const csp = [
  //     "default-src 'self'",
  //     // GTM/GA4 requieren 'unsafe-inline' (snippets inline) y 'unsafe-eval' (custom HTML tags).
  //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
  //     "connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://www.facebook.com",
  //     "img-src 'self' data: https: https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://res.cloudinary.com",
  //     "frame-src https://www.googletagmanager.com",
  //     "style-src 'self' 'unsafe-inline'",
  //     "font-src 'self' data:",
  //   ].join("; ");
  //   return [
  //     { source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: csp }] },
  //   ];
  // },
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

    // NOTA: con loaderFile propio, remotePatterns / formats / qualities /
    // minimumCacheTTL ya NO aplican (no hay fetch al optimizador de Vercel).
    // Se eliminaron para no confundir; el formato y la calidad ahora los
    // resuelve Cloudinary (f_auto / q_auto) dentro del loader.
  },
  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
