function toast(message, type = "success") {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

const SUBSETS = ["FD001", "FD002", "FD004"];

const Router = (() => {
  let currentSubset = "FD001";

  function parse() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const engineMatch = hash.match(/^\/(?:(FD00[124])\/)?engine\/(\d+)$/);
    if (engineMatch) {
      return { view: "engine", subset: engineMatch[1] || "FD001", unit: Number(engineMatch[2]) };
    }
    const dashMatch = hash.match(/^\/(FD00[124])?$/);
    return { view: "dashboard", subset: (dashMatch && dashMatch[1]) || "FD001" };
  }

  function go(path) {
    location.hash = path;
  }

  function goEngine(unit) {
    go(currentSubset === "FD001" ? `/engine/${unit}` : `/${currentSubset}/engine/${unit}`);
  }

  function goSubset(subset) {
    go(subset === "FD001" ? "/" : `/${subset}`);
  }

  async function dispatch() {
    const route = parse();
    currentSubset = route.subset;
    document.getElementById("app").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (route.view === "engine") {
      EngineView.resetChat();
      await EngineView.render(route.unit, route.subset);
    } else {
      await Dashboard.render(route.subset);
    }
  }

  function init() {
    window.addEventListener("hashchange", dispatch);
    dispatch();
  }

  return { go, goEngine, goSubset, init, get subset() { return currentSubset; } };
})();

function initTheme() {
  const saved = localStorage.getItem("turbinesense-theme");
  const theme = saved || "dark";
  applyTheme(theme);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("turbinesense-theme", theme);
  document.getElementById("theme-toggle").textContent = theme === "dark" ? "☀" : "☾";
}

async function pollHealth() {
  const pill = document.getElementById("live-status");
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error();
    pill.querySelector(".dot").style.background = "var(--risk-low)";
    pill.lastChild.textContent = " LIVE";
    pill.style.color = "var(--risk-low)";
  } catch {
    pill.style.color = "var(--risk-high)";
    pill.lastChild.textContent = " OFFLINE";
  }
}

initTheme();
Router.init();
pollHealth();
setInterval(pollHealth, 20000);
