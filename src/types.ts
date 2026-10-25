export interface Summary {
  id: string;
  title: string;
  url: string;
  description: string;
  text: string;
}
export interface Page extends Summary {
  html: string;
  toc: { id: string; text: string; level: number }[];
  links: string[];
  backlinks: Summary[];
}
export interface SiteData {
  title: string;
  base: string;
  home: string;
  page: Page;
  pages: Summary[];
}
