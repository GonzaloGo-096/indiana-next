import { MetadataRoute } from "next";
import { getSiteUrl } from "../lib/site-url";
import { getModelosSlugs } from "../data/modelos";
import { getAllPlanes } from "../data/planes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();
  const slugs = getModelosSlugs();
  const planes = getAllPlanes();

  const urls = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/0km`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    // Agregar URLs de cada modelo
    ...slugs.map((slug) => ({
      url: `${baseUrl}/0km/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
          {
            url: `${baseUrl}/planes`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.9,
          },
          {
            url: `${baseUrl}/usados`,
            lastModified: now,
            changeFrequency: "daily" as const,
            priority: 0.9,
          },
          {
            url: `${baseUrl}/postventa`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
    // Agregar URLs de cada plan
    ...planes.map((plan) => ({
      url: `${baseUrl}/planes/${plan.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return urls;
}
