export enum EvalRouteNames {
  APP = "/eval",
  EXTRACTION = "/o/:organizationId/p/:projectId/extraction",
  EXTRACTION_DATASET = "/o/:organizationId/p/:projectId/extraction/:datasetId",
  EVALUATION_RUN = "/o/:organizationId/p/:projectId/extraction/:datasetId/runs/:runId",
}

export const buildEvalPath = (path: string) => {
  return `${EvalRouteNames.APP}${path}`
}
