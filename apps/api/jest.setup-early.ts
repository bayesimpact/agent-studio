/**
 * Runs via Jest `setupFiles` **before** the test framework and before any spec module is loaded.
 * Prevents Bull Board `forFeature` from being registered without `forRoot` when `.env` / shell sets `BULL_BOARD_ENABLED`.
 */
delete process.env.BULL_BOARD_ENABLED
