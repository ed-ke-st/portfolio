export interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack: string[];
  image_url: string | null;
  github_link: string | null;
  live_url: string | null;
}
