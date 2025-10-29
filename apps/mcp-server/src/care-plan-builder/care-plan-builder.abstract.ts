
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
  onProgress?: (progress: string) => void;
}
