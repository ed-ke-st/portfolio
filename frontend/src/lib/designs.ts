import { DesignWork } from "@/types/design";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getDesignsForUser(username: string, category?: string): Promise<DesignWork[]> {
  const url = category
    ? `${API_BASE_URL}/api/u/${username}/designs?category=${category}`
    : `${API_BASE_URL}/api/u/${username}/designs`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch designs");
  }

  return res.json();
}

export async function getDesignForUser(username: string, id: number): Promise<DesignWork> {
  const res = await fetch(`${API_BASE_URL}/api/u/${username}/designs/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch design");
  }

  return res.json();
}

export function designSlugPart(title: string): string {
  const cleaned = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "design";
}

export function buildDesignPathSegment(design: Pick<DesignWork, "id" | "title">): string {
  return `${designSlugPart(design.title)}-${design.id}`;
}

export function parseDesignIdFromPathSegment(segment: string): number | null {
  const match = segment.match(/-(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const DESIGN_CATEGORIES = [
  { value: "logo", label: "Logos" },
  { value: "branding", label: "Branding" },
  { value: "ui", label: "UI/UX" },
  { value: "print", label: "Print" },
  { value: "other", label: "Other" },
];
