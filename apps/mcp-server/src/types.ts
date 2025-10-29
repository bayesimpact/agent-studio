export interface Action {
  id: string;
  categories: string[];
  content: string;
  title: string;
  cta?: {
    name: string;
    link?: string;
  };
}

export interface CarePlanBuilderArgs {
  currentCarePlan?: Action[];
  profileText: string;
}

export interface CarePlanBuilderOptions {
  onProgress?: (message: string) => void;
}

export interface Location {
  citycode: string;
  departmentCode: string;
  name: string;
}