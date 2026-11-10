#!/usr/bin/env node
/**
 * Local development counterpart to a Cloudflare cron trigger.
 *
 * `wrangler dev` does not run scheduled handlers automatically. This loop hits the
 * dev scheduled route every two minutes so the local dashboard behaves like the
 * deployed Worker.
 */
const base = (process.env.WORKER_URL ?? "http://127.0.0.1:8788").replace(/\/$/, "");
const interval = Number(process.env.TICK_MS ?? 120_000);

async function tick() {
  try {
    const response = await fetch(
      `${base}/__scheduled?cron=${encodeURIComponent("*/2 * * * *")}`,
    );
    console.log(
      `${new Date().toISOString()} scheduled ${response.status} ${(await response.text()).trim()}`,
    );
  } catch (error) {
    console.error(`${new Date().toISOString()} tick failed: ${error.message}`);
  }
}

await tick();
setInterval(tick, interval);
