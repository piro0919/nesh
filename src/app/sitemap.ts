import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const baseUrl = "https://nesh.kkweb.io";

const publicPaths = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/sign-in", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/sign-up", priority: 0.7, changeFrequency: "yearly" as const },
  { path: "/docs", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/docs/quick-start", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/docs/sdk", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/docs/rest-api", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/docs/webhooks", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/docs/limits", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/docs/self-host", priority: 0.7, changeFrequency: "monthly" as const },
];

function localizedUrl(locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${baseUrl}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicPaths.flatMap(({ path, priority, changeFrequency }) => {
    const alternates = {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, localizedUrl(locale, path)]),
      ),
    };

    return routing.locales.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates,
    }));
  });
}
