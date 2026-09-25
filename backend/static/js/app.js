function toast(message, type = "success") {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

const Router = (() => {
  function parse() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const engineMatch = hash.match(/^\/engine\/(\d+)$/);
    if (engineMatch) return { view: "engine", unit: Number(engineMatch[1]) };
    return { view: "dashboard" };
  }

  function go(path) {
    location.hash = path;
  }

  async function dispatch() {
    const route = parse();
    document.getElementById("app").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
    if (route.view === "engine") {
      EngineView.resetChat();
      await EngineView.render(route.unit);
    } else {
      await Dashboard.render();
    }
  }

  function init() {
    window.addEventListener("hashchange", dispatch);
    dispatch();
  }

  return { go, init };
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
