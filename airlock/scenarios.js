document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-demo-widget]").forEach((host) => {
    const panel = window.AirlockWidget.panelHTML(host.dataset.demoPanel);
    const pill = window.AirlockWidget.pillHTML(host.dataset.demoPill);
    host.innerHTML = `<div class="demo-widget__open aw">${panel}</div><button type="button" class="demo-widget__closed" aria-label="Expand Airlock widget" title="Expand Airlock widget"><span class="aw">${pill}</span></button>`;
    const open = host.querySelector(".demo-widget__open");
    const closed = host.querySelector(".demo-widget__closed");
    const collapse = document.createElement("button");
    collapse.type = "button";
    collapse.className = "demo-widget__collapse";
    collapse.setAttribute("aria-label", "Collapse Airlock widget");
    collapse.title = "Collapse Airlock widget";
    collapse.textContent = "⌃";
    open.querySelector(".aw-header").append(collapse);
    function setExpanded(expanded) {
      open.hidden = !expanded;
      closed.hidden = expanded;
      host.dataset.expanded = String(expanded);
    }
    collapse.addEventListener("click", () => setExpanded(false));
    closed.addEventListener("click", () => setExpanded(true));
    open.querySelectorAll("[data-demo-mute]").forEach((button) => {
      button.addEventListener("click", () => {
        const all = button.dataset.demoMute === "all";
        button.textContent = all ? "All speakers muted (demo)" : "Other laptop muted (demo)";
        open.querySelectorAll("[data-demo-mute]").forEach((other) => { other.disabled = true; });
      });
    });
    setExpanded(host.dataset.demoInitial !== "collapsed");
  });
  const track = document.getElementById("scenario-track");
  const counter = document.getElementById("scenario-count");
  if (!track || !counter) return;
  const slides = [...track.querySelectorAll(".scenario")];
  const controls = [...document.querySelectorAll("[data-slide]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function activeIndex() {
    return slides.reduce((best, slide, index) =>
      Math.abs(slide.offsetLeft - slides[0].offsetLeft - track.scrollLeft) <
      Math.abs(slides[best].offsetLeft - slides[0].offsetLeft - track.scrollLeft) ? index : best, 0);
  }
  function update() {
    const index = activeIndex();
    counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    controls.forEach((control) => {
      control.disabled = control.dataset.slide === "previous" ? index === 0 : index === slides.length - 1;
    });
  }
  function goTo(index) {
    track.scrollTo({ left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: reducedMotion.matches ? "auto" : "smooth" });
  }
  controls.forEach((control) => control.addEventListener("click", () => {
    const next = activeIndex() + (control.dataset.slide === "next" ? 1 : -1);
    if (next >= 0 && next < slides.length) goTo(next);
  }));
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = activeIndex() + (event.key === "ArrowRight" ? 1 : -1);
    if (next >= 0 && next < slides.length) { event.preventDefault(); goTo(next); }
  });
  let pending = false;
  track.addEventListener("scroll", () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { update(); pending = false; });
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
});
