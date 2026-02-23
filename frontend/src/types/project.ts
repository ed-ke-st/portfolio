export interface ProjectGalleryItem {
  type: "image" | "video";
  url: string;
  caption?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack: string[];
  image_url: string | null;
  video_url: string | null;
  gallery?: ProjectGalleryItem[];
  github_link: string | null;
  live_url: string | null;
  featured: boolean;
}
