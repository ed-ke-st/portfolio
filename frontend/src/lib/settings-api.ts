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
  use_custom_colors?: boolean;
  text_color?: string;
  highlight_color?: string;
  subtitle_color?: string;
}

export interface Skill {
  name: string;
  category: string;
  mainCategory?: string;
  level?: number;
  abbreviation?: string;
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

export interface CVExperience {
  id?: string;
  company: string;
  role: string;
  location?: string;
  start: string;
  end?: string;
  summary?: string;
  highlights?: string[];
}

export interface CVEducation {
  id?: string;
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  start?: string;
  end?: string;
  summary?: string;
}

export interface CVCertification {
  id?: string;
  name: string;
  issuer?: string;
  year?: string;
  url?: string;
}

export interface CVAward {
  id?: string;
  title: string;
  issuer?: string;
  year?: string;
  description?: string;
}

export interface CVLanguage {
  id?: string;
  language: string;
  spoken?: string;
  written?: string;
}

export interface CVSettings {
  enabled: boolean;
  show_on_home?: boolean;
  title: string;
  headline: string;
  summary: string;
  location: string;
  website: string;
  photo_url?: string;
  pdf_url?: string;
  use_custom_appearance?: boolean;
  appearance?: {
    accent?: string;
    background?: string;
    text?: string;
    muted?: string;
    card?: string;
    border?: string;
  };
  experience: CVExperience[];
  education: CVEducation[];
  certifications: CVCertification[];
  awards: CVAward[];
  languages: CVLanguage[];
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

export interface IntegrationsSettings {
  cloudinary_url?: string;
  screenshotone_access_key?: string;
}

export interface AllSettings {
  hero?: HeroSettings;
  skills?: Skill[];
  skill_categories?: string[] | SkillCategory[];
  contact?: ContactSettings;
  cv?: CVSettings;
  footer?: FooterSettings;
  appearance?: AppearanceSettings;
  integrations?: IntegrationsSettings;
}

export async function getSettingsForUser(username: string): Promise<AllSettings> {
  const res = await fetch(`${API_BASE_URL}/api/u/${username}/settings`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch settings");
  }

  return res.json();
}

export async function getAdminSettings(): Promise<AllSettings> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
