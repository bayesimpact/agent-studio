export enum EvalRouteNames {
  APP = "/eval",
}

export const buildEvalPath = (path: string) => {
  return `${EvalRouteNames.APP}${path}`
}
