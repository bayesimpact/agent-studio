export enum DeskRouteNames {
  APP = "/app",
}

export const buildDeskPath = (path: string) => {
  return `${DeskRouteNames.APP}${path}`
}
