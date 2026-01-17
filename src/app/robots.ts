import { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  return {
    rules: [
      {
        userAgent: "*",
        allow: isProduction ? "/" : "",
        disallow: isProduction ? "" : "/",
      },
    ],
    sitemap: isProduction ? `${getSiteUrl()}/sitemap.xml` : undefined,
  };
}
