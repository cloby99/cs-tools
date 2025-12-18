export interface Project {
  sysId: string;
  name: string;
  description: string | null;
  projectKey: string;
  createdOn: string;
  activeChatsCount: number;
  openCasesCount: number;
}

export interface ProjectResponse {
  projects: Project[];
  pagination: {
    offset: number;
    limit: number;
    totalRecords: number;
  };
}
