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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Optimizaciones de imágenes
    formats: ["image/webp", "image/avif"],
    // ✅ OPTIMIZADO: Aumentar cache TTL para mejor rendimiento
    minimumCacheTTL: 31536000, // 1 año (máximo recomendado)
    // Calidades permitidas (debe incluir todas las usadas en el código)
    qualities: [75, 80, 85, 90],
    // ✅ OPTIMIZADO: Tamaños de dispositivo para mejor srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
