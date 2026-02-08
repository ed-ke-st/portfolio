import { Project } from "@/types/project";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }

  return res.json();
}

export async function getProject(id: number): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch project");
  }

  return res.json();
}
