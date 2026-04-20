/**
 * Bull Board is wired only when `BULL_BOARD_ENABLED=true`.
 * `.env` is loaded via `import "dotenv/config"` in `open-telemetry-init.ts` before `AppModule` is evaluated.
 *
 * Always off under Jest: transactional tests import domain modules with `BullBoardModule.forFeature` but not
 * `BullBoardModule.forRoot`, and some `.env.test` files may still set `BULL_BOARD_ENABLED=true`.
 */
export function isBullBoardEnabled(): boolean {
  if (process.env.BULL_BOARD_ENABLED !== "true") {
    return false
  }
  if (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined) {
    return false
  }
  return true
}
