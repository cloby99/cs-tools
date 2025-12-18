export interface Case {
  sysId: string;
  number: string;
  title: string;
  description?: string;
  status: string;
  severity: string;
  createdDate: string;
  lastUpdated: string;
  assignee?: string;
  category: string;
  product: string;
}

export interface CaseResponse {
  cases: Case[];
  pagination: {
    offset: number;
    limit: number;
    totalRecords: number;
  };
}
