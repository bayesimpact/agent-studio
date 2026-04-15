export enum EvalRouteNames {
  APP = "/eval",
  EXTRACTION = "/o/:organizationId/p/:projectId/ed",
  EXTRACTION_DATASET = "/o/:organizationId/p/:projectId/ed/:datasetId",
}

export const buildEvalPath = (path: string) => {
  return `${EvalRouteNames.APP}${path}`
}
