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

export const DESIGN_CATEGORIES = [
  { value: "logo", label: "Logos" },
  { value: "branding", label: "Branding" },
  { value: "ui", label: "UI/UX" },
  { value: "print", label: "Print" },
  { value: "other", label: "Other" },
];
