/** @type {import('next').NextConfig} */
const nextConfig = {
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
    qualities: [75, 80, 85],
    // ✅ OPTIMIZADO: Tamaños de dispositivo para mejor srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
