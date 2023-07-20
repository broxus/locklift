export interface IEntityCard {
  name: string;
  npmPackage?: string;
  githubUrl?: string;
  author: string;
  authorUrl: string;
  description?: string;
  tags?: string[];
}

export interface IProject {
  title: string;
  description: string;
  link: string;
}
