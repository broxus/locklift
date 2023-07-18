export interface IPlugin {
  name: string;
  npmPackage?: string;
  author: string;
  authorUrl: string;
  description: string;
  tags: string[];
  normalizedName?: string;
}
