export interface ProjectGalleryItem {
  type: "image" | "video" | "model";
  url: string;
  caption?: string;
  layout?: "full" | "side";
  background?: boolean;
  rounded?: boolean;
  model_orientation?: string;
  model_zoom?: string;
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
  github_releases?: boolean;
  featured: boolean;
  order?: number;
}
