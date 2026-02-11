export interface PlatformHeroSettings {
  title: string;
  highlight: string;
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  background_image?: string;
  background_overlay?: number;
  use_custom_colors?: boolean;
  text_color?: string;
  highlight_color?: string;
  subtitle_color?: string;
}

export interface EdgePlatformConfig {
  version: number;
  updatedAt: string;
  hero: PlatformHeroSettings;
  flags: {
    maintenance: boolean;
  };
  banner: {
    enabled: boolean;
    text: string;
  };
}

export const defaultPlatformHero: PlatformHeroSettings = {
  title: "Your portfolio,",
  highlight: "your way",
  subtitle:
    "Create a beautiful developer portfolio in minutes. Showcase your projects, designs, and skills — all from one simple dashboard.",
  cta_primary: "Get started free",
  cta_secondary: "Log in",
  background_image: "",
  background_overlay: 45,
  use_custom_colors: false,
  text_color: "",
  highlight_color: "",
  subtitle_color: "",
};

export function normalizePlatformHero(input?: Partial<PlatformHeroSettings> | null): PlatformHeroSettings {
  return {
    ...defaultPlatformHero,
    ...(input || {}),
  };
}

export function buildEdgePlatformConfig(hero: PlatformHeroSettings): EdgePlatformConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    hero: normalizePlatformHero(hero),
    flags: {
      maintenance: false,
    },
    banner: {
      enabled: false,
      text: "",
    },
  };
}
