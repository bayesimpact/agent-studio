import type { TimeType } from "../generic"

export type DocumentDto = {
  createdAt: TimeType
  id: string
  projectId: string
  updatedAt: TimeType
  deletedAt?: TimeType
  title: string
  content?: string
  fileName?: string
  language: "en" | "fr"
  mimeType?: MimeTypes
  size?: number
  storageRelativePath?: string
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
export enum MimeTypes {
  aac = "audio/aac",
  abw = "application/x-abiword",
  arc = "application/x-freearc",
  avi = "video/x-msvideo",
  azw = "application/vnd.amazon.ebook",
  bin = "application/octet-stream",
  bmp = "image/bmp",
  bz = "application/x-bzip",
  bz2 = "application/x-bzip2",
  csh = "application/x-csh",
  css = "text/css",
  csv = "text/csv",
  doc = "application/msword",
  docx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  eot = "application/vnd.ms-fontobject",
  epub = "application/epub+zip",
  gz = "application/gzip",
  gif = "image/gif",
  htm = "text/html",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  html = "text/html",
  ico = "image/vnd.microsoft.icon",
  ics = "text/calendar",
  jar = "application/java-archive",
  jpg = "image/jpeg",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  jpeg = "image/jpeg",
  js = "text/javascript",
  json = "application/json",
  jsonld = "application/ld+json",
  mid = "audio/midi",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  midi = "audio/midi",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  mjs = "text/javascript",
  mp3 = "audio/mpeg",
  mpeg = "video/mpeg",
  mpkg = "application/vnd.apple.installer+xml",
  odp = "application/vnd.oasis.opendocument.presentation",
  ods = "application/vnd.oasis.opendocument.spreadsheet",
  odt = "application/vnd.oasis.opendocument.text",
  oga = "audio/ogg",
  ogv = "video/ogg",
  ogx = "application/ogg",
  opus = "audio/opus",
  otf = "font/otf",
  png = "image/png",
  pdf = "application/pdf",
  php = "application/php",
  ppt = "application/vnd.ms-powerpoint",
  pptx = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  rar = "application/vnd.rar",
  rtf = "application/rtf",
  sh = "application/x-sh",
  svg = "image/svg+xml",
  swf = "application/x-shockwave-flash",
  tar = "application/x-tar",
  tif = "image/tiff",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  tiff = "image/tiff",
  ts = "video/mp2t",
  ttf = "font/ttf",
  txt = "text/plain",
  vsd = "application/vnd.visio",
  wav = "audio/wav",
  weba = "audio/webm",
  webm = "video/webm",
  webp = "image/webp",
  woff = "font/woff",
  woff2 = "font/woff2",
  xhtml = "application/xhtml+xml",
  xls = "application/vnd.ms-excel",
  xlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xml = "application/xml",
  xul = "application/vnd.mozilla.xul+xml",
  zip = "application/zip",
  _3gp = "video/3gpp",
  _3g2 = "video/3gpp2",
  _7z = "application/x-7z-compressed",
}
