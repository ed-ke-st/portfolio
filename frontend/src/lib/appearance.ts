import { AppearanceSettings } from "@/lib/settings-api";

export interface ResolvedAppearance {
  mode: "light" | "dark";
  active: {
    accent: string;
    background: string;
    text: string;
    muted: string;
    card: string;
    border: string;
    sections?: {
      hero?: string;
      projects?: string;
      designs?: string;
      skills?: string;
      footer?: string;
    };
  };
}

const defaultLight = {
  accent: "#2563eb",
  background: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  card: "#f4f4f5",
  border: "#e4e4e7",
  sections: {
    hero: "",
    projects: "",
    designs: "",
    skills: "",
    footer: "",
  },
};

const defaultDark = {
  accent: "#60a5fa",
  background: "#0b0f1a",
  text: "#e5e7eb",
  muted: "#9ca3af",
  card: "#111827",
  border: "#1f2937",
  sections: {
    hero: "",
    projects: "",
    designs: "",
    skills: "",
    footer: "",
  },
};

const isHexColor = (value: string) =>
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

const resolveColor = (value: string | undefined, fallback: string) =>
  value && isHexColor(value) ? value : fallback;

export function resolveAppearance(
  appearance?: AppearanceSettings
): ResolvedAppearance {
  const light = {
    accent: resolveColor(appearance?.accent, defaultLight.accent),
    background: resolveColor(appearance?.background, defaultLight.background),
    text: resolveColor(appearance?.text, defaultLight.text),
    muted: resolveColor(appearance?.muted, defaultLight.muted),
    card: resolveColor(appearance?.card, defaultLight.card),
    border: resolveColor(appearance?.border, defaultLight.border),
    sections: {
      ...defaultLight.sections,
      ...(appearance?.sections || {}),
    },
  };

  const dark = {
    accent: resolveColor(appearance?.dark?.accent, defaultDark.accent),
    background: resolveColor(appearance?.dark?.background, defaultDark.background),
    text: resolveColor(appearance?.dark?.text, defaultDark.text),
    muted: resolveColor(appearance?.dark?.muted, defaultDark.muted),
    card: resolveColor(appearance?.dark?.card, defaultDark.card),
    border: resolveColor(appearance?.dark?.border, defaultDark.border),
    sections: {
      ...defaultDark.sections,
      ...(appearance?.dark?.sections || {}),
    },
  };

  const mode = appearance?.dark_mode ? "dark" : "light";
  return { mode, active: mode === "dark" ? dark : light };
}
