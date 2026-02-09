import { getToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HeroSettings {
  title: string;
  highlight: string;
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  background_image?: string;
  background_overlay?: number; // 0-100 opacity for dark overlay
}

export interface Skill {
  name: string;
  category: string;
  mainCategory?: string;
  level?: number;
}

export interface SkillCategory {
  name: string;
  subcategories: string[];
}

export interface ContactSettings {
  heading: string;
  subheading: string;
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  phone: string;
}

export interface FooterSettings {
  copyright: string;
}

export interface AppearanceSettings {
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
  dark_mode?: boolean;
  dark?: {
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

export interface AllSettings {
  hero?: HeroSettings;
  skills?: Skill[];
  skill_categories?: string[] | SkillCategory[];
  contact?: ContactSettings;
  footer?: FooterSettings;
  appearance?: AppearanceSettings;
}

export async function getSettings(): Promise<AllSettings> {
  const res = await fetch(`${API_BASE_URL}/api/settings`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch settings");
  }

  return res.json();
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/settings/${key}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value }),
  });

  if (!res.ok) {
    throw new Error("Failed to update setting");
  }
}
