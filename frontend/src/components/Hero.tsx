import Link from "next/link";
import { AppearanceSettings, HeroSettings } from "@/lib/settings-api";

interface HeroProps {
  settings?: HeroSettings;
  appearance?: AppearanceSettings;
}

const defaultSettings: HeroSettings = {
  title: "Hi, I'm a",
  highlight: "Full-Stack Developer",
  subtitle: "I build modern web applications with clean code and great user experiences. Passionate about creating solutions that make a difference.",
  cta_primary: "View My Work",
  cta_secondary: "Get in Touch",
};

export default function Hero({ settings, appearance }: HeroProps) {
  const hero = settings || defaultSettings;
  const sectionBg = appearance?.sections?.hero;
  const hasBackgroundImage = !!hero.background_image;
  const overlayOpacity = hero.background_overlay ?? 50;

  // Determine text colors - custom colors take priority, then background image (white), then CSS vars
  const titleColor = hero.use_custom_colors && hero.text_color
    ? hero.text_color
    : hasBackgroundImage
      ? "#ffffff"
      : undefined;

  const subtitleColor = hero.use_custom_colors && hero.subtitle_color
    ? hero.subtitle_color
    : hasBackgroundImage
      ? "rgba(255,255,255,0.8)"
      : undefined;

  const highlightColor = hero.use_custom_colors && hero.highlight_color
    ? hero.highlight_color
    : undefined;

  const buttonTextColor = hasBackgroundImage ? "#ffffff" : undefined;
  const buttonBorderColor = hasBackgroundImage ? "rgba(255,255,255,0.3)" : undefined;

  return (
    <section
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 relative"
      style={sectionBg && !hasBackgroundImage ? { background: sectionBg } : undefined}
    >
      {/* Background Image */}
      {hasBackgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${hero.background_image})` }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </>
      )}

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
          style={{ color: titleColor }}
        >
          <span className={titleColor ? "" : "text-[var(--app-text)]"}>
            {hero.title}{" "}
          </span>
          <span
            className={highlightColor ? "" : "text-[var(--app-accent)]"}
            style={highlightColor ? { color: highlightColor } : undefined}
          >
            {hero.highlight}
          </span>
        </h1>

        <p
          className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto"
          style={{ color: subtitleColor }}
        >
          <span className={subtitleColor ? "" : "text-[var(--app-muted)]"}>
            {hero.subtitle}
          </span>
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#projects"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-[var(--app-accent)] rounded-full hover:opacity-90 transition-colors"
          >
            {hero.cta_primary}
          </Link>
          <Link
            href="#contact"
            className={`inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-full hover:opacity-90 transition-colors border ${
              hasBackgroundImage ? "" : "text-[var(--app-text)] border-[var(--app-border)] hover:bg-[var(--app-card)]"
            }`}
            style={hasBackgroundImage ? { color: buttonTextColor, borderColor: buttonBorderColor } : undefined}
          >
            {hero.cta_secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
