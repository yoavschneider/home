const ALERT_TO = "yoavschne@gmail.com";
const ALERT_FROM = { email: "alerts@yoavschneider.dev", name: "Uptime Monitor" };

const SITES = [
  "https://flowgeo.io",
  "https://fodo.info",
  "https://hyphal.dev",
  "https://mosqai.xyz",
  "https://ratsfashion.art",
  "https://repoguide.dev",
  "https://vhs-dreams.xyz",
  "https://yoavschneider.dev",
];

interface Env {
  STATE: KVNamespace;
  EMAIL: SendEmail;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(Promise.all(SITES.map((url) => checkSite(url, env))));
  },
  // manual trigger, e.g. `curl https://uptime-monitor.<subdomain>.workers.dev`
  async fetch(_request: Request, env: Env) {
    await Promise.all(SITES.map((url) => checkSite(url, env)));
    return new Response("checked\n");
  },
} satisfies ExportedHandler<Env>;

async function checkSite(url: string, env: Env) {
  let up: boolean;
  let detail: string;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    up = res.status < 500;
    detail = `HTTP ${res.status}`;
  } catch (err) {
    up = false;
    detail = err instanceof Error ? err.message : String(err);
  }

  const key = new URL(url).hostname;
  const prev = await env.STATE.get(key);
  const status = up ? "up" : "down";
  if (prev === status) return; // no change since last check

  await env.STATE.put(key, status);
  if (prev === null && up) return; // first-ever check and it's healthy, nothing to report

  await sendAlert(env, url, status, detail);
}

async function sendAlert(env: Env, url: string, status: "up" | "down", detail: string) {
  const subject = status === "down" ? `🔴 ${url} is DOWN` : `✅ ${url} is back up`;
  const when = new Date().toISOString();
  await env.EMAIL.send({
    to: ALERT_TO,
    from: ALERT_FROM,
    subject,
    text: `${url} is now ${status}.\n${detail}\n${when}`,
    html: `<p><b>${url}</b> is now <b>${status}</b>.</p><p>${detail}</p><p>${when}</p>`,
  });
}
