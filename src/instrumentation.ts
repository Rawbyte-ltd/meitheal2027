/** Runs once when the server starts (Next.js instrumentation). Starts the daily brief's clock and the retention job. */
export async function register() {
  // Keep the imports inside this exact check: the bundler drops the block from the edge build only in this form. An
  // early `return` for other runtimes pulled pg into the edge bundle (found 5 Nov 2026, as a 500 under `next dev`).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    (await import("./lib/brief")).startBriefScheduler();
    (await import("./lib/retention")).startRetentionScheduler();
  }
}
