/**
 * Bull Board is wired only when `BULL_BOARD_ENABLED=true`.
 * `.env` is loaded via `import "dotenv/config"` in `open-telemetry-init.ts` before `AppModule` is evaluated.
 */
export function isBullBoardEnabled(): boolean {
  return process.env.BULL_BOARD_ENABLED === "true"
}
