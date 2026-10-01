// Weekly traffic report, built from Cloudflare's edge request logs: no cookies,
// no JS beacon, nothing stored about visitors. Numbers are what Cloudflare saw
// at the edge, with bots and vulnerability scanners filtered out as best we can.

const REPORT_TO = "yoavschne@gmail.com";
const REPORT_FROM = { email: "reports@yoavschneider.dev", name: "Traffic Report" };

// Zone ID → the host(s) to count. Other hosts on a zone (www., m., test., :8443…)
// get almost exclusively scanner traffic, so they're left out on purpose.
const SITES: { zone: string; hosts: string[] }[] = [
  { zone: "26bc873f40d388f83a52b1434c074caf", hosts: ["yoavschneider.dev"] },
  { zone: "37a17b39eadb7c48665db2b3412508be", hosts: ["klimaantrag.de"] },
  { zone: "992032bce8ff1bca9cae1ebd0e02e6b0", hosts: ["faxoff.app"] },
  { zone: "663a93b0043d762c7540f392cf0cf41d", hosts: ["repoguide.dev"] },
  { zone: "750d9cf58d0fc76a8b8f06cf1cf74b53", hosts: ["hyphal.dev", "www.hyphal.dev"] },
  { zone: "69f5f233e43b0102d16d6b67945bf39c", hosts: ["ratsfashion.art"] },
  { zone: "df8c089f4eee562e0beb9bd2a136e459", hosts: ["vhs-dreams.xyz"] },
  { zone: "cdb90ed215ab36e030ed712340ce1d8d", hosts: ["mosqai.xyz"] },
  { zone: "91181afd6fab9bde948ebab258fdf1b7", hosts: ["flowgeo.io"] },
  { zone: "2f7a72c5792eaaf76f7cbf468f5c4fd3", hosts: ["fodo.info"] },
  { zone: "acb949d1c9d0bc503c8a619af20feb75", hosts: ["campfire.cv"] },
];

// Paths that only scanners ask for. SPAs answer these with a 200 + index.html,
// so they'd otherwise show up as "pages".
const JUNK_PATHS = [
  "%.php%", "%.env%", "%wp-%", "%wordpress%", "%.git%", "%.aws%", "%.zip", "%.tar%",
  "%.gz", "%.bak%", "%.sql%", "%.old", "%.save", "%.swp", "%.yml", "%.yaml", "%.json",
  "%.xml", "%.ini", "%.cfg", "%.conf%", "%.asp%", "%.jsp", "%.cgi", "%cgi-bin%",
  "%phpmyadmin%", "%/admin%", "%/owa/%", "%/.well-known/%", "/cdn-cgi/%",
];

// Browsers Cloudflare's UA parser couldn't identify, or tools that aren't people.
const NON_BROWSERS = ["Unknown", "Curl", "ChromeHeadless", "GoogleBot", "BingBot", "Wget", "PythonRequests"];

// Spoofed UA strings used by mass scanners (hundreds of hits a week, all on "/").
const SCANNER_UAS = ["%iPhone OS 13_2_3%"];

const TOP_PAGES = 12;

// Cloudflare's parser names → something readable; mobile and desktop merge.
const BROWSER_NAMES: Record<string, string> = {
  ChromeMobile: "Chrome", ChromeMobileWebView: "Chrome", ChromeDerivative: "Chrome-based",
  MobileSafari: "Safari", FirefoxMobile: "Firefox", EdgeMobile: "Edge", OperaMobile: "Opera",
};

interface Env {
  EMAIL: SendEmail;
  CF_API_TOKEN: string;
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(sendReport(env));
  },
  // Only reachable via `wrangler dev` (workers_dev is off): / previews, /send mails it.
  async fetch(request: Request, env: Env) {
    if (new URL(request.url).pathname === "/send") {
      await sendReport(env);
      return new Response("sent\n");
    }
    const report = await buildReport(env);
    return new Response(renderHtml(report), { headers: { "content-type": "text/html; charset=utf-8" } });
  },
} satisfies ExportedHandler<Env>;

async function sendReport(env: Env) {
  const report = await buildReport(env);
  const { views, visits } = report.total;
  await env.EMAIL.send({
    to: REPORT_TO,
    from: REPORT_FROM,
    subject: `📊 ${fmt(views.cur)} page views, ${fmt(visits.cur)} visits · ${report.label}`,
    text: renderText(report),
    html: renderHtml(report),
  });
}

// ---------------------------------------------------------------- data

interface Pair { cur: number; prev: number }
interface Page { path: string; views: Pair; visits: Pair; daily: number[] }
interface Site {
  host: string;
  views: Pair;
  visits: Pair;
  daily: number[];
  prevDaily: number[];
  pages: Page[];
  browsers: [string, number][];
  countries: [string, number][];
  devices: [string, number][];
}
interface Report { label: string; days: string[]; total: { views: Pair; visits: Pair; daily: number[]; prevDaily: number[] }; sites: Site[] }

interface Group { count: number; sum: { visits: number }; dimensions: Record<string, string> }

async function buildReport(env: Env): Promise<Report> {
  // The last 7 full UTC days, plus the 7 before that for comparison.
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const day = (offset: number) => new Date(today.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => day(i - 7));
  const prevDays = Array.from({ length: 7 }, (_, i) => day(i - 14));

  const sites = await Promise.all(SITES.map((s) => fetchSite(env, s.zone, s.hosts, prevDays[0], days[0], day(0), days, prevDays)));
  sites.sort((a, b) => b.views.cur - a.views.cur);

  const sum = (f: (s: Site) => number) => sites.reduce((n, s) => n + f(s), 0);
  const sumDaily = (f: (s: Site) => number[]) => days.map((_, i) => sum((s) => f(s)[i]));
  return {
    label: `${fmtDay(days[0])} – ${fmtDay(days[6])}`,
    days,
    total: {
      views: { cur: sum((s) => s.views.cur), prev: sum((s) => s.views.prev) },
      visits: { cur: sum((s) => s.visits.cur), prev: sum((s) => s.visits.prev) },
      daily: sumDaily((s) => s.daily),
      prevDaily: sumDaily((s) => s.prevDaily),
    },
    sites,
  };
}

async function fetchSite(
  env: Env, zone: string, hosts: string[],
  from: string, weekStart: string, until: string, days: string[], prevDays: string[],
): Promise<Site> {
  const base = {
    requestSource: "eyeball",
    clientRequestHTTPMethodName: "GET",
    edgeResponseStatus: 200,
    edgeResponseContentTypeName: "html",
    verifiedBotCategory: "",
    clientRequestHTTPHost_in: hosts,
    userAgentBrowser_notin: NON_BROWSERS,
    AND: [
      ...JUNK_PATHS.map((p) => ({ clientRequestPath_notlike: p })),
      ...SCANNER_UAS.map((p) => ({ userAgent_notlike: p })),
    ],
  };
  const fortnight = { ...base, date_geq: from, date_lt: until };
  const week = { ...base, date_geq: weekStart, date_lt: until };

  const query = `query ($zone: String!, $fortnight: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!, $week: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject!) {
    viewer { zones(filter: { zoneTag: $zone }) {
      pages: httpRequestsAdaptiveGroups(limit: 10000, filter: $fortnight) { count sum { visits } dimensions { date clientRequestPath } }
      browsers: httpRequestsAdaptiveGroups(limit: 50, filter: $week, orderBy: [count_DESC]) { count sum { visits } dimensions { userAgentBrowser } }
      countries: httpRequestsAdaptiveGroups(limit: 50, filter: $week, orderBy: [count_DESC]) { count sum { visits } dimensions { clientCountryName } }
      devices: httpRequestsAdaptiveGroups(limit: 10, filter: $week, orderBy: [count_DESC]) { count sum { visits } dimensions { clientDeviceType } }
    } }
  }`;
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { zone, fortnight, week } }),
  });
  const body = await res.json<{ data?: { viewer: { zones: Record<string, Group[]>[] } }; errors?: { message: string }[] | null }>();
  if (body.errors?.length || !body.data) throw new Error(`GraphQL ${hosts[0]}: ${JSON.stringify(body.errors ?? res.status)}`);
  const z = body.data.viewer.zones[0] ?? { pages: [], browsers: [], countries: [], devices: [] };

  const pages = new Map<string, Page>();
  const daily = days.map(() => 0);
  const prevDaily = days.map(() => 0);
  const views = { cur: 0, prev: 0 };
  const visits = { cur: 0, prev: 0 };
  for (const g of z.pages) {
    const path = normalizePath(g.dimensions.clientRequestPath);
    const page = pages.get(path) ?? { path, views: { cur: 0, prev: 0 }, visits: { cur: 0, prev: 0 }, daily: days.map(() => 0) };
    pages.set(path, page);
    const i = days.indexOf(g.dimensions.date);
    if (i >= 0) {
      page.views.cur += g.count; page.visits.cur += g.sum.visits; page.daily[i] += g.count;
      views.cur += g.count; visits.cur += g.sum.visits; daily[i] += g.count;
    } else {
      page.views.prev += g.count; page.visits.prev += g.sum.visits;
      views.prev += g.count; visits.prev += g.sum.visits;
      prevDaily[prevDays.indexOf(g.dimensions.date)] += g.count;
    }
  }

  const tally = (groups: Group[], key: string, label: (v: string) => string) => {
    const out = new Map<string, number>();
    for (const g of groups) {
      const l = label(g.dimensions[key]);
      if (l) out.set(l, (out.get(l) ?? 0) + g.count);
    }
    return [...out].sort((a, b) => b[1] - a[1]);
  };

  return {
    host: hosts[0],
    views, visits, daily, prevDaily,
    pages: [...pages.values()].filter((p) => p.views.cur > 0).sort((a, b) => b.views.cur - a.views.cur),
    // Referrers would be nicer, but the Free plan doesn't expose them.
    browsers: tally(z.browsers, "userAgentBrowser", (b) => BROWSER_NAMES[b] ?? b),
    countries: tally(z.countries, "clientCountryName", (c) => c || "??"),
    devices: tally(z.devices, "clientDeviceType", (d) => d || "unknown"),
  };
}

function normalizePath(p: string) {
  p = p.replace(/\/index\.html$/, "/");
  return p.length > 1 ? p.replace(/\/$/, "") : p;
}

// ---------------------------------------------------------------- rendering
// Email clients ignore <style> blocks and strip SVG/JS, so everything is inline
// styles and charts are table cells with fixed-height divs.

const C = {
  bg: "#f4f3ef", card: "#fcfcfb", ink: "#0b0b0b", ink2: "#52514e", muted: "#8a8983", rule: "#e6e5df",
  bar: "#2a78d6", barPrev: "#d9d8d2", track: "#eeede8", up: "#1a7f37", down: "#c4332f",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function renderHtml(r: Report) {
  const active = r.sites.filter((s) => s.views.cur + s.views.prev > 0);
  const quiet = r.sites.filter((s) => s.views.cur + s.views.prev === 0);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Traffic report</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px">
  <tr><td style="padding:0 4px 16px">
    <div style="font-size:13px;color:${C.ink2};letter-spacing:.02em">WEEKLY TRAFFIC · ${esc(r.label)}</div>
  </td></tr>
  ${card(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${heroStat("Page views", r.total.views)}
      ${heroStat("Visits", r.total.visits)}
    </tr></table>
    <div style="height:20px"></div>
    ${dailyChart(r.days, r.total.daily, r.total.prevDaily, 120)}
  `)}
  ${active.map((s) => siteCard(s, r.days)).join("")}
  ${quiet.length ? `<tr><td style="padding:4px 4px 16px;font-size:13px;color:${C.muted}">No human page views: ${quiet.map((s) => esc(s.host)).join(", ")}</td></tr>` : ""}
  <tr><td style="padding:8px 4px 24px;font-size:12px;line-height:1.5;color:${C.muted}">
    From Cloudflare edge logs, so no cookies or scripts on the sites. <b>Page views</b> are successful HTML GETs from real browsers;
    known bots, scanner paths and spoofed scanner user agents are filtered out, though some will still slip through.
    <b>Visits</b> are page views arriving from another site or with no referrer, a stand-in for sessions; there is no way to count unique people without tracking them.
    Compared with the 7 days before.
  </td></tr>
</table></td></tr></table></body></html>`;
}

function card(inner: string) {
  return `<tr><td style="padding-bottom:16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.card};border:1px solid ${C.rule};border-radius:12px"><tr><td style="padding:18px 16px">${inner}</td></tr></table></td></tr>`;
}

function heroStat(label: string, p: Pair) {
  return `<td width="50%" valign="top">
    <div style="font-size:13px;color:${C.ink2}">${label}</div>
    <div style="font-size:34px;font-weight:600;line-height:1.15;font-variant-numeric:tabular-nums">${fmt(p.cur)}</div>
    <div style="font-size:13px;margin-top:2px">${delta(p)} <span style="color:${C.muted}">vs ${fmt(p.prev)}</span></div>
  </td>`;
}

function siteCard(s: Site, days: string[]) {
  const shown = s.pages.slice(0, TOP_PAGES);
  const rest = s.pages.slice(TOP_PAGES);
  const max = Math.max(1, ...shown.map((p) => p.views.cur));
  const th = (t: string, align = "right") => `<td style="padding:0 0 6px;font-size:11px;color:${C.muted};text-align:${align};text-transform:uppercase;letter-spacing:.04em">${t}</td>`;
  const rows = shown.map((p) => `<tr>
      <td style="padding:7px 8px 7px 0;border-top:1px solid ${C.rule};font-size:13px">
        <div style="font-family:ui-monospace,Menlo,monospace;font-size:12px;word-break:break-all">${esc(p.path)}</div>
        <div style="margin-top:4px;height:4px;background:${C.track};border-radius:2px"><div style="width:${Math.max(1, Math.round((p.views.cur / max) * 100))}%;height:4px;background:${C.bar};border-radius:2px"></div></div>
      </td>
      <td style="padding:7px 4px;border-top:1px solid ${C.rule}" width="46">${sparkline(p.daily)}</td>
      <td style="padding:7px 0 7px 8px;border-top:1px solid ${C.rule};text-align:right;font-size:13px;font-variant-numeric:tabular-nums" width="44"><b>${fmt(p.views.cur)}</b></td>
      <td style="padding:7px 0 7px 8px;border-top:1px solid ${C.rule};text-align:right;font-size:13px;color:${C.ink2};font-variant-numeric:tabular-nums" width="44">${fmt(p.visits.cur)}</td>
      <td style="padding:7px 0 7px 8px;border-top:1px solid ${C.rule};text-align:right;font-size:12px;white-space:nowrap" width="48">${delta(p.views)}</td>
    </tr>`).join("");
  const restViews = rest.reduce((n, p) => n + p.views.cur, 0);
  const restRow = rest.length
    ? `<tr><td colspan="5" style="padding:7px 0;border-top:1px solid ${C.rule};font-size:12px;color:${C.muted}">+ ${rest.length} more pages, ${fmt(restViews)} views</td></tr>`
    : "";

  return card(`
    <div style="font-size:18px;font-weight:600">${esc(s.host)}</div>
    <div style="font-size:13px;color:${C.ink2};margin-top:4px">
      <b style="color:${C.ink};font-size:15px">${fmt(s.views.cur)}</b> views ${delta(s.views)} &nbsp;·&nbsp; <b style="color:${C.ink};font-size:15px">${fmt(s.visits.cur)}</b> visits ${delta(s.visits)}
    </div>
    <div style="height:14px"></div>
    ${dailyChart(days, s.daily, s.prevDaily, 64)}
    <div style="height:18px"></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>${th("Page", "left")}${th("Daily", "left")}${th("Views")}${th("Visits")}${th("Δ")}</tr>
      ${rows}${restRow}
    </table>
    <div style="height:14px"></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${breakdown("Browsers", s.browsers, 5)}
      ${breakdown("Countries", s.countries, 5)}
      ${breakdown("Devices", s.devices, 3)}
    </tr></table>
  `);
}

function breakdown(title: string, items: [string, number][], n: number) {
  const total = items.reduce((a, [, v]) => a + v, 0) || 1;
  const lines = items.slice(0, n).map(([k, v]) => `<div style="padding:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="display:inline-block;width:34px;color:${C.muted};font-variant-numeric:tabular-nums">${Math.round((v / total) * 100)}%</span>${esc(k)}</div>`).join("");
  return `<td valign="top" width="33%" style="padding-right:8px;font-size:12px;color:${C.ink2}">
    <div style="font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:.04em;padding-bottom:4px">${title}</div>
    ${lines || `<div style="color:${C.muted}">–</div>`}
  </td>`;
}

// Seven bars for this week, each with last week's same weekday as a gray bar beside it.
function dailyChart(days: string[], cur: number[], prev: number[], height: number) {
  const max = Math.max(1, ...cur, ...prev);
  const h = (v: number) => (v === 0 ? 0 : Math.max(2, Math.round((v / max) * height)));
  const bar = (v: number, color: string) =>
    `<div style="height:${h(v)}px;line-height:0;font-size:0;background:${color};border-radius:3px 3px 0 0"></div>`;
  const cols = days.map((d, i) => `<td valign="bottom" align="center" width="14%" style="padding:0 3px">
      <div style="font-size:11px;color:${C.ink2};font-variant-numeric:tabular-nums;padding-bottom:3px">${fmt(cur[i])}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:${height}px"><tr>
        <td valign="bottom" width="40%" style="padding-right:2px">${bar(prev[i], C.barPrev)}</td>
        <td valign="bottom" width="60%">${bar(cur[i], C.bar)}</td>
      </tr></table>
    </td>`).join("");
  const labels = days.map((d) => `<td align="center" style="padding-top:5px;font-size:11px;color:${C.muted};border-top:1px solid ${C.rule}">${weekday(d)}</td>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"><tr>${cols}</tr><tr>${labels}</tr></table>
    <div style="font-size:11px;color:${C.muted};padding-top:6px">
      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${C.bar}"></span> this week &nbsp;
      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${C.barPrev}"></span> week before
    </div>`;
}

function sparkline(values: number[]) {
  const max = Math.max(1, ...values);
  return `<div style="height:18px;line-height:0;font-size:0;white-space:nowrap">${values.map((v) =>
    `<div style="display:inline-block;vertical-align:bottom;width:5px;margin-right:1px;height:${v === 0 ? 1 : Math.max(2, Math.round((v / max) * 18))}px;background:${v === 0 ? C.rule : C.bar};border-radius:1px"></div>`,
  ).join("")}</div>`;
}

function delta({ cur, prev }: Pair) {
  if (prev === 0) return cur === 0 ? `<span style="color:${C.muted}">–</span>` : `<span style="color:${C.muted}">new</span>`;
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return `<span style="color:${C.muted}">±0%</span>`;
  return pct > 0 ? `<span style="color:${C.up}">▲ ${pct}%</span>` : `<span style="color:${C.down}">▼ ${-pct}%</span>`;
}

function renderText(r: Report) {
  const lines = [`Weekly traffic · ${r.label}`, "", `Page views: ${fmt(r.total.views.cur)} (prev ${fmt(r.total.views.prev)})`, `Visits: ${fmt(r.total.visits.cur)} (prev ${fmt(r.total.visits.prev)})`];
  for (const s of r.sites.filter((s) => s.views.cur > 0)) {
    lines.push("", `${s.host}: ${fmt(s.views.cur)} views, ${fmt(s.visits.cur)} visits`);
    for (const p of s.pages.slice(0, TOP_PAGES)) lines.push(`  ${String(p.views.cur).padStart(6)}  ${p.path}`);
  }
  return lines.join("\n");
}

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtDay = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const weekday = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
