// HTML recreations of the Airlock widget, for the landing page.
//
// These are drawn from the app's own source, not from memory:
//   pill       agent-macos/.../WidgetStyle.swift        (PillView, buildStatusPill, makeUrgent, makeMeetingSoon)
//   list       agent-macos/.../WidgetPresentation.swift (widgetListContents: row detail, indicator, stats)
//   panel      agent-macos/.../AppDelegate+Widget.swift and +WidgetRendering.swift (layout, banner, buttons)
//   alerts     coordinator/internal/rules/engine.go     (alert titles, word for word)
// The widget's own text is English in every build, so it stays English here
// regardless of the app's own localization.
//
// Usage: <div data-aw-pill="collision"></div>, <div data-aw-panel="collision"></div>,
// <div data-aw-style="cpu"></div>. Add data-aw-theme="dark" for the dark appearance.

(function () {
  "use strict";

  // SF Symbol stand-ins, drawn on a 24 grid in currentColor.
  const ICONS = {
    phoneFill:
      '<path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.3 1z"/>',
    phone:
      '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.3 1z"/>',
    computers:
      '<rect x="8" y="3.5" width="13" height="10.5" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5 8.5v8.3A2.2 2.2 0 0 0 7.2 19H16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><rect x="3" y="8" width="13" height="10.5" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.9"/>',
    calendar:
      '<rect x="3" y="4.5" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M3 9h18" stroke="currentColor" stroke-width="3.4"/><g fill="currentColor"><circle cx="8" cy="13" r="1.1"/><circle cx="12" cy="13" r="1.1"/><circle cx="16" cy="13" r="1.1"/><circle cx="8" cy="16.8" r="1.1"/><circle cx="12" cy="16.8" r="1.1"/><circle cx="16" cy="16.8" r="1.1"/></g>',
    warning:
      '<path fill="currentColor" d="M10.3 3.3a2 2 0 0 1 3.4 0l8.4 14.6a2 2 0 0 1-1.7 3H3.6a2 2 0 0 1-1.7-3z"/><path d="M12 8.5v5.2" stroke="var(--aw-cut)" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.4" fill="var(--aw-cut)"/>',
    mic:
      '<rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    micSlash:
      '<rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5M4 3l16 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    micOutline:
      '<rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    speaker: '<path fill="currentColor" d="M4 9h3.5L13 4.5v15L7.5 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/>',
    speakerSlash:
      '<path fill="currentColor" d="M4 9h3.5L13 4.5v15L7.5 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    headphones:
      '<path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="1.9"/><rect x="3" y="14" width="5" height="7" rx="1.6" fill="currentColor"/><rect x="16" y="14" width="5" height="7" rx="1.6" fill="currentColor"/>',
    wave3:
      '<path fill="currentColor" d="M2.5 9h3L10 5v14l-4.5-4h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/><path d="M13.5 9.2a4 4 0 0 1 0 5.6M16.3 6.6a7.8 7.8 0 0 1 0 10.8M19.1 4a11.6 11.6 0 0 1 0 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    wave1:
      '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M4 9h3l4.5-4v14L7 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/><path d="M15 9.5a3.6 3.6 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    video: '<rect x="2" y="6" width="13.5" height="12" rx="2.5" fill="currentColor"/><path fill="currentColor" d="M16.5 10.5 22 7v10l-5.5-3.5z"/>',
    videoSlash:
      '<rect x="2" y="6" width="13.5" height="12" rx="2.5" fill="currentColor"/><path fill="currentColor" d="M16.5 10.5 22 7v10l-5.5-3.5z"/><path d="M3 3l18 18" stroke="var(--aw-cut)" stroke-width="3.2" stroke-linecap="round"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    desktop:
      '<rect x="2" y="3.5" width="20" height="13" rx="2" fill="currentColor"/><path d="M9 20.5h6M12 16.5v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    bell:
      '<path fill="currentColor" d="M12 2.5a6 6 0 0 0-6 6v4.2L4.3 16a.8.8 0 0 0 .7 1.2h14a.8.8 0 0 0 .7-1.2L18 12.7V8.5a6 6 0 0 0-6-6zM9.5 18.5a2.5 2.5 0 0 0 5 0z"/>',
    wifiSlash:
      '<path d="M2.5 9a14 14 0 0 1 19 0M5.8 12.5a9.5 9.5 0 0 1 12.4 0M9.2 16a4.6 4.6 0 0 1 5.6 0M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="19.5" r="1.4" fill="currentColor"/>',
    chevronUp: '<path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    xmark: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    gear:
      '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-dasharray="2.9 3.07"/><circle cx="12" cy="12" r="6.3" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    laptopDown:
      '<path d="M5 6.5V16h14V6.5M2.5 19h19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 3.5v8M9 8.7l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    eyeSlash:
      '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 3.5l16 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    cpu:
      '<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.9"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor"/><path d="M9 2.5v3M12 2.5v3M15 2.5v3M9 18.5v3M12 18.5v3M15 18.5v3M2.5 9h3M2.5 12h3M2.5 15h3M18.5 9h3M18.5 12h3M18.5 15h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    memory:
      '<rect x="2.5" y="7" width="19" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M6.5 10h2v3h-2zM11 10h2v3h-2zM15.5 10h2v3h-2z" fill="currentColor"/><path d="M5 16v2.5M8 16v2.5M11 16v2.5M14 16v2.5M17 16v2.5M20 16v2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    battery:
      '<rect x="2" y="7" width="18" height="10" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="9" width="11" height="6" rx="1.2" fill="currentColor"/><path d="M21.5 10.2v3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    network:
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="3.8" ry="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 9h17M3.5 15h17" stroke="currentColor" stroke-width="1.6"/>',
  };

  function icon(name, size, color, cls) {
    return (
      `<svg class="aw-i${cls ? " " + cls : ""}" viewBox="0 0 24 24" width="${size}" height="${size}" ` +
      `style="color:${color}" aria-hidden="true">${ICONS[name]}</svg>`
    );
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // ---- The collapsed pill (WidgetStyle.statusPill and friends) ------------
  //
  // Each named state is a WidgetPresentation the app can actually produce.
  // Note: a meeting-soon pill carries no minute count in practice. derive()
  // only shows one if the alert title holds digits, and the coordinator's
  // titles never do, so none is drawn here.
  const PILLS = {
    allClear: { dot: "green", glyph: "computers" },
    inCallJ1: { dot: "green", phone: true, label: "J1" },
    singleActiveJ1: { dot: "green", label: "J1" },
    collision: { dot: "red", phone: true, label: "J1 · J2" },
    urgentCollision: { urgent: true, phone: true, label: "J1 · J2" },
    micOpenInCall: { dot: "red", phone: true, label: "J1" },
    micOpenUrgent: { urgent: true, phone: true, label: "J1" },
    warningInCall: { dot: "orange", phone: true, label: "J1" },
    warning: { dot: "orange", glyph: "computers" },
    critical: { dot: "red", glyph: "computers" },
    criticalUrgent: { urgent: true },
    meetingSoon: { soon: true, label: "J2" },
    meetingSoonTogether: { soon: true, label: "J1" },
    notConnected: { dot: "grey", glyph: "computers" },
    noHive: { dot: "grey", glyph: "computers" },
    stale: { dot: "grey", glyph: "computers" },
    audioUnavailable: { dot: "grey", glyph: "computers" },
    twoActive: { dot: "green", glyph: "computers", badge: 2 },
  };

  const DOT = { green: "var(--aw-green)", red: "var(--aw-red)", orange: "var(--aw-orange)", grey: "var(--aw-secondary)", blue: "var(--aw-blue)", white: "#fff" };

  function pillHTML(spec, opts) {
    const s = typeof spec === "string" ? PILLS[spec] : spec;
    const small = opts && opts.header; // the pill atop the expanded view never pulses (urgent is cleared)
    const urgent = s.urgent && !small;
    const parts = [];
    if (s.soon) {
      parts.push(icon("calendar", 16, "var(--aw-blue)"));
      parts.push(`<span class="aw-pill__label">${esc(s.label)}</span>`);
    } else {
      if (urgent) parts.push(icon("warning", 20, "#fff", "aw-i--cut-red"));
      const dotColor = urgent ? DOT.white : DOT[s.urgent ? "red" : s.dot];
      const d = urgent ? 14 : 10;
      parts.push(`<span class="aw-dot" style="width:${d}px;height:${d}px;background:${dotColor}"></span>`);
      if (s.phone) {
        parts.push(icon("phoneFill", urgent ? 16 : 12, urgent ? "#fff" : "var(--aw-label)"));
        parts.push(`<span class="aw-pill__label"${urgent ? ' style="color:#fff"' : ""}>${esc(s.label)}</span>`);
      } else if (s.label) {
        parts.push(`<span class="aw-pill__label">${esc(s.label)}</span>`);
      } else {
        const g = icon("computers", urgent ? 18 : 15, urgent ? "#fff" : "var(--aw-label)");
        parts.push(s.badge > 1 ? `<span class="aw-badge-host">${g}<span class="aw-badge">${s.badge}</span></span>` : g);
      }
    }
    const cls = ["aw-pill", urgent ? "aw-pill--urgent" : "", s.soon ? "aw-pill--soon" : ""].join(" ").trim();
    return `<span class="${cls}">${parts.join("")}</span>`;
  }

  // The disguised styles (WidgetStyle.cpuMonitor etc.): a real local reading,
  // with the presence signal carried only in the icon's tint. The numbers
  // below are the gallery's own sample readings (WidgetPreviewFixtures).
  function styleHTML(name, state) {
    const tint = DOT[state || "green"];
    const pill = (inner) => `<span class="aw-pill">${inner}</span>`;
    const label = (t) => `<span class="aw-pill__label">${t}</span>`;
    switch (name) {
      case "pill":
        return pillHTML("allClear");
      case "dot":
        return pill(`<span class="aw-dot" style="width:10px;height:10px;background:${tint}"></span>`);
      case "cpu":
        return pill(icon("cpu", 15, tint) + label("34%"));
      case "memory":
        return pill(icon("memory", 15, tint) + label("62%"));
      case "battery":
        return pill(`<span class="aw-dot" style="width:6px;height:6px;background:${tint}"></span>` + icon("battery", 17, "var(--aw-label)") + label("81%"));
      case "network":
        return pill(icon("network", 15, tint) + label("182 KB/s"));
    }
    return "";
  }

  // ---- The expanded list (widgetListContents, ported) ---------------------

  function describe(d) {
    const unknownAudio = d.audioStatus && d.audioStatus !== "available";
    let detail;
    if (!d.connected) detail = "Offline";
    else if (d.inCall && d.micMuted === true) detail = "In a call · mic muted";
    else if (d.inCall && d.micMuted === false) detail = "In a call · mic on";
    else if (d.inCall && d.loud) detail = "In a call · playing audio";
    else if (d.inCall) detail = "In a call · mic unknown";
    else if (d.possible) detail = "Maybe in a call";
    else if (unknownAudio) detail = "Audio sensing unavailable";
    else if (d.loud) detail = "Playing audio";
    else if (d.micMuted === false) detail = "Quiet · mic on";
    else if (d.micMuted === true) detail = "Quiet · mic muted";
    else detail = "Quiet · mic unknown";
    return { detail, unknownAudio };
  }

  function buildList(scene) {
    const stats = { computers: scene.devices.length, inCall: 0, micOpen: 0, speakerOn: 0, cameraOn: 0, unread: 0, playing: 0, offline: 0, unknown: 0 };
    const alert = scene.alert;
    const rows = scene.devices.map((d) => {
      const { detail, unknownAudio } = describe(d);
      const named = alert && alert.devices.includes(d.tag);
      const unread = d.connected && !d.self && d.unread ? d.unread : null;
      let indicator;
      if (named && alert.severity === "critical") indicator = "critical";
      else if (named) indicator = "warning";
      else if (unread) indicator = "warning";
      else if (!d.connected || unknownAudio) indicator = "unknown";
      else if (d.inCall || d.loud) indicator = "active";
      else if (d.micMuted === false) indicator = "warning";
      else indicator = "calm";
      const audible = d.speakerMuted === false && !d.headphones;
      if (!d.connected) stats.offline++;
      else {
        if (d.inCall) stats.inCall++;
        else if (d.loud) stats.playing++;
        if (d.micMuted === false) stats.micOpen++;
        if (!unknownAudio && audible) stats.speakerOn++;
        if (d.camera === true) stats.cameraOn++;
        if (unread) stats.unread += unread.count;
        if (unknownAudio) stats.unknown++;
      }
      return { d, detail, indicator, unread, audible, known: d.connected && !unknownAudio };
    });
    return { rows, stats };
  }

  const ROW_DOT = { calm: "var(--aw-green)", active: "var(--aw-green)", unknown: "var(--aw-tertiary)", warning: "var(--aw-orange)", critical: "var(--aw-red)" };

  function rowDot(ind) {
    if (ind === "unknown") return `<span class="aw-rowdot"><span style="width:9px;height:9px;border:1.5px solid ${ROW_DOT.unknown};background:transparent"></span></span>`;
    if (ind === "calm") return `<span class="aw-rowdot"><span style="width:6px;height:6px;background:${ROW_DOT.calm};opacity:.5"></span></span>`;
    return `<span class="aw-rowdot"><span style="width:9px;height:9px;background:${ROW_DOT[ind]}"></span></span>`;
  }

  function rowIcons(r) {
    const d = r.d;
    const out = [];
    if (d.inCall) out.push(icon("phoneFill", 13, "var(--aw-green)"));
    else if (d.possible) out.push(icon("phone", 13, "var(--aw-secondary)"));
    if (d.micMuted === false) out.push(icon("mic", 13, d.inCall ? "var(--aw-label)" : "var(--aw-orange)"));
    else if (d.micMuted === true) out.push(icon("micSlash", 13, "var(--aw-secondary)"));
    else out.push(icon("micOutline", 13, "var(--aw-tertiary)"));
    if (d.speakerMuted === true) out.push(icon("speakerSlash", 13, "var(--aw-secondary)"));
    else if (d.headphones) out.push(icon("headphones", 13, "var(--aw-label)"));
    else out.push(icon("speaker", 13, "var(--aw-label)"));
    if (d.camera === true) out.push(icon("video", 13, d.inCall ? "var(--aw-label)" : "var(--aw-orange)"));
    else if (d.camera === false) out.push(icon("videoSlash", 13, "var(--aw-secondary)"));
    out.push(d.loud ? icon("wave3", 13, "var(--aw-blue)") : icon("wave1", 13, "var(--aw-quaternary)"));
    return out.join("");
  }

  function statsHTML(s) {
    const seg = [["desktop", s.computers, "var(--aw-secondary)"]];
    if (s.inCall) seg.push(["phoneFill", s.inCall, "var(--aw-green)"]);
    if (s.micOpen) seg.push(["mic", s.micOpen, "var(--aw-orange)"]);
    if (s.speakerOn) seg.push(["speaker", s.speakerOn, "var(--aw-label)"]);
    if (s.cameraOn) seg.push(["video", s.cameraOn, "var(--aw-orange)"]);
    if (s.unread) seg.push(["bell", s.unread, "var(--aw-yellow)"]);
    if (s.playing) seg.push(["wave3", s.playing, "var(--aw-blue)"]);
    if (s.offline) seg.push(["wifiSlash", s.offline, "var(--aw-tertiary)"]);
    return seg.map(([i, n, c]) => `<span class="aw-stat">${icon(i, 13, c)}<b>${n}</b></span>`).join("");
  }

  function panelHTML(name) {
    const scene = SCENES[name];
    const { rows, stats } = buildList(scene);
    const self = scene.devices.find((d) => d.self);
    const muteOthers = scene.devices.some((d) => !d.self && d.connected && d.speakerMuted === false && !d.headphones);
    const canMuteSelf = self && self.speakerMuted === false && !self.headphones;
    const alert = scene.alert;

    const rowsHTML = rows
      .map((r) => {
        const d = r.d;
        const tail = [];
        if (!r.known) tail.push(r.detail);
        if (d.self) tail.push("this computer");
        const unread = r.unread
          ? `<span class="aw-unread">${icon("bell", 11, "var(--aw-yellow)")}<b>${r.unread.count}</b></span>`
          : "";
        return (
          `<div class="aw-row" title="${esc(r.detail)}">` +
          `<div class="aw-row__top">${rowDot(r.indicator)}<span class="aw-row__name${r.indicator === "unknown" ? " is-unknown" : ""}">${esc(d.name)}</span>${unread}<span class="aw-spacer"></span><span class="aw-chip">${esc(d.tag)}</span><span class="aw-more">···</span></div>` +
          `<div class="aw-row__detail"><span class="aw-indent"></span>${r.known ? rowIcons(r) : ""}${tail.length ? `<span class="aw-row__words">${esc(tail.join(" · "))}</span>` : ""}</div>` +
          `</div>`
        );
      })
      .join("");

    let message = "";
    if (alert) {
      const related = alert.devices.map((t) => scene.devices.find((d) => d.tag === t).name).join(" and ");
      const fix = alert.fix ? `<button type="button" class="aw-btn aw-btn--fix" data-demo-mute="others" title="Try this in the example">${icon("speakerSlash", 11, "currentColor")}Mute ${esc(alert.fix)}</button>` : "";
      if (alert.severity === "critical") {
        message =
          `<div class="aw-banner" role="img" aria-label="Alert: ${esc(alert.title)}">` +
          `${icon("warning", 26, "var(--aw-red)", "aw-banner__glyph")}` +
          `<div><div class="aw-banner__title">${esc(alert.title)}</div><div class="aw-banner__detail">Check ${esc(related)}.</div>${fix}</div></div>`;
      } else {
        message = `<div class="aw-msg"><div class="aw-msg__title">${esc(alert.title)}</div><div class="aw-msg__detail">Check ${esc(related)}.</div>${fix}</div>`;
      }
    }

    return (
      `<div class="aw-panel">` +
      `<div class="aw-header">${pillHTML(scene.pill, { header: true })}<span class="aw-spacer"></span>${icon("chevronUp", 13, "var(--aw-secondary)")}${icon("xmark", 13, "var(--aw-secondary)")}</div>` +
      `<div class="aw-stats">${statsHTML(stats)}</div>` +
      (muteOthers || canMuteSelf
        ? `<div class="aw-mutebar"><button type="button" class="aw-btn${muteOthers ? "" : " is-disabled"}" data-demo-mute="others"${muteOthers ? "" : " disabled"} title="Try this in the example">${icon("speakerSlash", 11, "currentColor")}Mute others</button><button type="button" class="aw-btn" data-demo-mute="all" title="Try this in the example">Mute all</button></div>`
        : "") +
      `<hr class="aw-sep">` +
      `<div class="aw-rows">${rowsHTML}</div>` +
      message +
      `<hr class="aw-sep">` +
      `<div class="aw-footer"><span class="aw-btn">${icon("laptopDown", 11, "currentColor")}Computers</span><span class="aw-btn">${icon("gear", 11, "currentColor")}Settings</span></div>` +
      `<div class="aw-hint">${icon("eyeSlash", 10, "var(--aw-tertiary)")}Hidden from screenshots &amp; screen shares</div>` +
      `</div>`
    );
  }

  // Scenes. Alert titles are the coordinator's own strings
  // (coordinator/internal/rules/engine.go), with the computers' names filled in.
  const SCENES = {
    // Seen on J1, which is in one of the two meetings: the ordinary red dot,
    // not the pulsing strip (that goes to computers not in a meeting).
    collision: {
      pill: "collision",
      devices: [
        { name: "Work MacBook", tag: "J1", self: true, connected: true, inCall: true, micMuted: false, speakerMuted: false, camera: true },
        { name: "Contract ThinkPad", tag: "J2", connected: true, inCall: true, micMuted: false, speakerMuted: false, headphones: true, camera: false },
      ],
      alert: { title: "Two active meetings", severity: "critical", devices: ["J1", "J2"] },
    },
    // Audio on another computer while this one is in a call: the one alert
    // whose fix is a button (muting that computer's speakers).
    audio: {
      pill: "micOpenInCall",
      devices: [
        { name: "Work MacBook", tag: "J1", self: true, connected: true, inCall: true, micMuted: false, speakerMuted: false, headphones: true, camera: false },
        { name: "Contract ThinkPad", tag: "J2", connected: true, loud: true, micMuted: true, speakerMuted: false, camera: false },
      ],
      alert: { title: "Contract ThinkPad audio while Work MacBook is in a call", severity: "critical", devices: ["J2", "J1"], fix: "Contract ThinkPad" },
    },
    // Both computers connected and quiet; the expanded view is all clear.
    clear: {
      pill: "allClear",
      devices: [
        { name: "Work MacBook", tag: "J1", self: true, connected: true, micMuted: true, speakerMuted: true, camera: false },
        { name: "Contract ThinkPad", tag: "J2", connected: true, micMuted: true, speakerMuted: true, camera: false },
      ],
      alert: null,
    },
    // Nothing wrong: one computer in a call, the other quiet, Slack waiting on J2.
    quiet: {
      pill: "warningInCall",
      devices: [
        { name: "Work MacBook", tag: "J1", self: true, connected: true, inCall: true, micMuted: true, speakerMuted: false, headphones: true, camera: true },
        { name: "Contract ThinkPad", tag: "J2", connected: true, micMuted: true, speakerMuted: true, camera: false, unread: { count: 3 } },
      ],
      alert: null,
    },
  };

  function mount(root) {
    (root || document).querySelectorAll("[data-aw-pill]").forEach((el) => (el.innerHTML = pillHTML(el.dataset.awPill)));
    (root || document).querySelectorAll("[data-aw-style]").forEach((el) => (el.innerHTML = styleHTML(el.dataset.awStyle, el.dataset.awState)));
    (root || document).querySelectorAll("[data-aw-panel]").forEach((el) => (el.innerHTML = panelHTML(el.dataset.awPanel)));
    // Light/Dark switch, like the one above the app's own preview gallery.
    (root || document).querySelectorAll("[data-aw-appearance]").forEach((sw) => {
      const target = document.getElementById(sw.dataset.awAppearance);
      sw.querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => {
          target.dataset.awTheme = b.dataset.theme;
          sw.querySelectorAll("button").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
        }),
      );
    });
  }

  window.AirlockWidget = { mount, pillHTML, panelHTML };
  document.addEventListener("DOMContentLoaded", () => mount());
})();
