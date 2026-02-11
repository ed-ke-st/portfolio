import Link from "next/link";
import { get } from "@vercel/edge-config";
import { defaultPlatformHero, normalizePlatformHero, PlatformHeroSettings } from "@/lib/platform-config";

interface EdgePlatformConfig {
  hero?: Partial<PlatformHeroSettings>;
}

async function getPlatformHero(): Promise<PlatformHeroSettings> {
  if (process.env.EDGE_CONFIG) {
    try {
      const platform = await get<EdgePlatformConfig>("platform");
      if (platform?.hero) {
        return normalizePlatformHero(platform.hero);
      }
    } catch {
      // Fallback to API source of truth if Edge Config is unavailable.
    }
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiBaseUrl}/api/platform/hero`, {
      cache: "no-store",
    });
    if (!res.ok) return defaultPlatformHero;
    const data = await res.json();
    return normalizePlatformHero(data);
  } catch {
    return defaultPlatformHero;
  }
}

export default async function LandingPage() {
  const hero = await getPlatformHero();
  const hasBackground = Boolean(hero.background_image);
  const titleColor = hero.use_custom_colors && hero.text_color
    ? hero.text_color
    : hasBackground ? "#ffffff" : undefined;
  const subtitleColor = hero.use_custom_colors && hero.subtitle_color
    ? hero.subtitle_color
    : hasBackground ? "rgba(255,255,255,0.85)" : undefined;
  const highlightColor = hero.use_custom_colors && hero.highlight_color
    ? hero.highlight_color
    : undefined;

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 overflow-hidden"
    >
      {hasBackground && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${hero.background_image})` }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: (hero.background_overlay ?? 45) / 100 }}
          />
        </>
      )}
      <div className="relative z-10 text-center max-w-2xl">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight"
          style={titleColor ? { color: titleColor } : undefined}
        >
          <span className={titleColor ? "" : "text-zinc-900 dark:text-white"}>
            {hero.title}{" "}
          </span>
          <span
            className={highlightColor ? "" : "text-blue-600 dark:text-blue-400"}
            style={highlightColor ? { color: highlightColor } : undefined}
          >
            {hero.highlight}
          </span>
        </h1>
        <p
          className={`mt-6 text-lg leading-relaxed ${subtitleColor ? "" : "text-zinc-600 dark:text-zinc-400"}`}
          style={subtitleColor ? { color: subtitleColor } : undefined}
        >
          {hero.subtitle}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium text-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            {hero.cta_primary}
          </Link>
          <Link
            href="/login"
            className={`px-8 py-3 border rounded-lg font-medium text-lg transition-colors ${
              hasBackground
                ? "border-white/40 text-white hover:border-white/60"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            {hero.cta_secondary}
          </Link>
        </div>
      </div>
    </div>
  );
}
