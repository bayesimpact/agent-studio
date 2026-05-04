export enum DeskRouteNames {
  HOME = "/app",
}

export const buildDeskPath = (path: string) => {
  return `${DeskRouteNames.HOME}${path}`
}
