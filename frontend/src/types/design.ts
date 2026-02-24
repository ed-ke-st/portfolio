export interface DesignWork {
  id: number;
  title: string;
  description: string | null;
  category: string;
  images: string[];
  primary_image: number;
  videos?: string[];
  client: string | null;
  year: number | null;
  featured: boolean;
  order: number;
}
