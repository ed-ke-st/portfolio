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
export async function getAdminProjects(): Promise<Project[]> {
  // Admin settings endpoint returns user-scoped data via token
  // But projects don't have an admin list endpoint, so we use the public one via username
  // Actually, let's just call the user-scoped route after getting the username from /me
  // For simplicity, admin pages will use the public user-scoped routes
  // This function is kept for backwards compat but callers should use getProjectsForUser
  throw new Error("Use getProjectsForUser instead");
}

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

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to upload file");
  }
  return res.json();
}

export async function testCloudinary(): Promise<{ ok: boolean }> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/integrations/cloudinary/test`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Cloudinary test failed");
  }
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
  preview_count?: number;
  truncated?: boolean;
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

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to preview PDF");
  }
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

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to extract PDF pages");
  }
  return res.json();
}

// Custom Domain
export async function setCustomDomain(domain: string): Promise<{ message: string; custom_domain: string | null }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("domain", domain);

  const res = await fetch(`${API_BASE_URL}/api/admin/domain`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to set custom domain");
  }
  return res.json();
}

export interface DomainStatus {
  status: "not_set" | "unconfigured" | "not_verified" | "verified";
  domain?: string | null;
  expected_cname?: string | null;
  expected_a?: string | null;
  found_cname?: string | null;
  found_a?: string[];
}

export async function getDomainStatus(): Promise<DomainStatus> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/domain/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch domain status");
  }
  return res.json();
}
