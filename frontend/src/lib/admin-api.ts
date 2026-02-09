import { Project } from "@/types/project";
import { getToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Projects
export async function createProject(data: Omit<Project, "id">): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/admin/projects`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/api/admin/projects/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/projects/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to delete project");
}

// Design Work
export interface DesignWork {
  id: number;
  title: string;
  description: string | null;
  category: string;
  images: string[];
  primary_image: number;
  client: string | null;
  year: number | null;
  featured: boolean;
  order: number;
}

export async function getDesigns(category?: string): Promise<DesignWork[]> {
  const url = category
    ? `${API_BASE_URL}/api/designs?category=${category}`
    : `${API_BASE_URL}/api/designs`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch designs");
  return res.json();
}

export async function createDesign(data: Omit<DesignWork, "id">): Promise<DesignWork> {
  const res = await fetch(`${API_BASE_URL}/api/admin/designs`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create design");
  return res.json();
}

export async function updateDesign(id: number, data: Partial<DesignWork>): Promise<DesignWork> {
  const res = await fetch(`${API_BASE_URL}/api/admin/designs/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update design");
  return res.json();
}

export async function deleteDesign(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/designs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to delete design");
}

// File Upload
export async function uploadFile(file: File): Promise<{ filename: string; url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/admin/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload file");
  return res.json();
}

export async function captureProjectScreenshot(url: string): Promise<Blob> {
  const token = getToken();
  const formData = new FormData();
  formData.append("url", url);

  const res = await fetch(`${API_BASE_URL}/api/admin/projects/screenshot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let detail = "Failed to capture screenshot";
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      // ignore json parse errors
    }
    throw new Error(detail);
  }
  return res.blob();
}

// PDF Processing
export interface PdfPage {
  page: number;
  preview: string;
  width: number;
  height: number;
}

export interface PdfPreviewResponse {
  page_count: number;
  pages: PdfPage[];
}

export interface ExtractedImage {
  page: number;
  url: string;
}

export interface FailedPage {
  page: number;
  error: string;
}

export interface ExtractPdfResponse {
  images: ExtractedImage[];
  failed: FailedPage[];
  total_requested: number;
  total_extracted: number;
}

export async function previewPdf(file: File): Promise<PdfPreviewResponse> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/admin/pdf/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to preview PDF");
  return res.json();
}

export async function extractPdfPages(
  file: File,
  pages: number[]
): Promise<ExtractPdfResponse> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pages", pages.join(","));

  const res = await fetch(`${API_BASE_URL}/api/admin/pdf/extract`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to extract PDF pages");
  return res.json();
}
