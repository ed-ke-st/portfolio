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
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--app-text)] leading-tight">
          {hero.title}{" "}
          <span className="text-[var(--app-accent)]">
            {hero.highlight}
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[var(--app-muted)] max-w-2xl mx-auto">
          {hero.subtitle}
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
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-[var(--app-text)] border border-[var(--app-border)] rounded-full hover:bg-[var(--app-card)] transition-colors"
          >
            {hero.cta_secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
