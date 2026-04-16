import type { NestExpressApplication } from "@nestjs/platform-express"
import { auth } from "express-openid-connect"
import { isBullBoardEnabled } from "./bull-board-env"
import { buildBullBoardOpenIdConnectConfig } from "./bull-board-openid-config"

/**
 * Registers global OpenID Connect middleware so Bull Board can use {@link requiresAuth}.
 * Must run early in bootstrap (before `listen`), after `NestFactory.create`.
 */
export function registerBullBoardOpenIdConnect(app: NestExpressApplication): void {
  if (!isBullBoardEnabled()) {
    return
  }
  app.use(auth(buildBullBoardOpenIdConnectConfig()))
}
