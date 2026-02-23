import { Project } from "@/types/project";

export function projectSlugPart(title: string): string {
  const cleaned = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "project";
}

export function buildProjectPathSegment(project: Pick<Project, "id" | "title">): string {
  return `${projectSlugPart(project.title)}-${project.id}`;
}

export function parseProjectIdFromPathSegment(segment: string): number | null {
  const match = segment.match(/-(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}
