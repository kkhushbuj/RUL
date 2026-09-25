const Dashboard = (() => {
  let engines = [];
  let sortKey = "risk_rank";
  let query = "";
  let onlyDeep = false;

  function riskBadge(score) {
    const tier = Charts.riskTier(score);
    const label = tier === "high" ? "High risk" : tier === "medium" ? "Medium risk" : "Low risk";
    return `<span class="risk-badge ${tier}"><span class="rb-dot"></span>${label}</span>`;
  }

  async function render() {
    const app = document.getElementById("app");
    app.innerHTML = `
      <section class="hero fade-in">
        <p class="eyebrow">Predictive Maintenance</p>
        <h1>Turbofan Fleet — Remaining Useful Life</h1>
        <p>LSTM-based RUL prediction over the NASA C-MAPSS FD001 fleet (100 engines), explained with SHAP and cross-checked against published literature by a multi-agent research pipeline.</p>
      </section>

      <section class="stat-grid" id="stat-grid">
        ${["Test RMSE", "NASA Score", "Confirmed", "Contradicted / Novel"]
          .map(
            (label, i) => `
          <div class="stat-card fade-in" style="animation-delay:${i * 60}ms">
            <p class="stat-label">${label}</p>
            <p class="stat-value"><span class="skeleton" style="display:inline-block;width:60px;height:30px;"></span></p>
            <p class="stat-hint">&nbsp;</p>
          </div>`
          )
          .join("")}
      </section>

      <section class="two-col">
        <div class="panel fade-in" style="animation-delay:120ms">
          <div class="panel-header">
            <div>
              <p class="panel-title">Fleet health at a glance</p>
              <p class="panel-sub">All 100 engines, ordered by unit ID · ring = flagged for deep AI analysis</p>
            </div>
            <div class="legend">
              <span class="legend-item"><span class="legend-swatch" style="background:var(--risk-low)"></span>low</span>
              <span class="legend-item"><span class="legend-swatch" style="background:var(--risk-medium)"></span>medium</span>
              <span class="legend-item"><span class="legend-swatch" style="background:var(--risk-high)"></span>high</span>
            </div>
          </div>
          <div class="fleet-grid" id="fleet-grid"></div>
        </div>
        <div class="panel fade-in" style="animation-delay:160ms">
          <div class="panel-header">
            <div>
              <p class="panel-title">Predicted vs. true RUL</p>
              <p class="panel-sub">Every test engine · points on the diagonal are perfect predictions</p>
            </div>
          </div>
          <div class="chart-box"><canvas id="calibration-chart"></canvas></div>
        </div>
      </section>

      <section class="panel fade-in" style="animation-delay:200ms">
        <div class="table-controls">
          <input class="search-input" id="engine-search" placeholder="Search by engine unit..." />
          <button class="filter-chip" id="deep-filter">✨ Deep-analyzed only</button>
          <span class="table-count" id="table-count"></span>
        </div>
        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr>
                <th data-sort="risk_rank">Rank ↕</th>
                <th data-sort="unit">Engine ↕</th>
                <th>Risk</th>
                <th data-sort="predicted_RUL">Predicted RUL ↕</th>
                <th>True RUL</th>
                <th style="text-align:right">Analysis</th>
              </tr>
            </thead>
            <tbody id="engine-tbody"></tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById("engine-search").addEventListener("input", (e) => {
      query = e.target.value.trim();
      renderTable();
    });
    document.getElementById("deep-filter").addEventListener("click", (e) => {
      onlyDeep = !onlyDeep;
      e.currentTarget.classList.toggle("active", onlyDeep);
      renderTable();
    });
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        sortKey = th.dataset.sort;
        renderTable();
      });
    });

    const [metrics, summary, engineList] = await Promise.all([
      API.modelMetrics().catch(() => null),
      API.agentSummary().catch(() => null),
      API.engines().catch(() => []),
    ]);
    engines = engineList;
    renderStats(metrics, summary);
    renderFleetGrid();
    Charts.calibrationChart("calibration-chart", engines);
    renderTable();
  }

  function countUp(el, target, decimals) {
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function renderStats(metrics, summary) {
    const cards = document.querySelectorAll("#stat-grid .stat-card");
    const set = (card, value, decimals, hint, cls) => {
      const el = card.querySelector(".stat-value");
      if (value == null) el.textContent = "—";
      else countUp(el, value, decimals);
      card.querySelector(".stat-hint").textContent = hint;
      if (cls) card.classList.add(cls);
    };
    set(cards[0], metrics?.test_rmse, 2, "cycles, FD001 test set");
    set(cards[1], metrics?.test_nasa_score, 0, "asymmetric PHM08 metric");
    set(
      cards[2],
      summary?.confirmed,
      0,
      `of ${summary?.total_engines_analyzed ?? 0} deep-analyzed engines`,
      "risk-low"
    );
    set(
      cards[3],
      summary?.contradicted != null ? summary.contradicted + summary.novel : null,
      0,
      `${summary?.contradicted ?? 0} contradicted, ${summary?.novel ?? 0} novel`,
      "risk-high"
    );
  }

  function renderFleetGrid() {
    const grid = document.getElementById("fleet-grid");
    const byUnit = [...engines].sort((a, b) => a.unit - b.unit);
    const tooltip = ensureTooltip();

    grid.innerHTML = byUnit
      .map((e, i) => {
        const tier = Charts.riskTier(e.risk_score);
        return `<button class="fleet-cell ${tier} ${e.deep_analysis ? "deep" : ""}" style="animation-delay:${i * 8}ms" data-unit="${e.unit}" data-rul="${e.predicted_RUL.toFixed(1)}" data-risk="${e.risk_score.toFixed(0)}"></button>`;
      })
      .join("");

    grid.querySelectorAll(".fleet-cell").forEach((cell) => {
      cell.addEventListener("click", () => Router.go(`/engine/${cell.dataset.unit}`));
      cell.addEventListener("mousemove", (ev) => {
        tooltip.style.display = "block";
        tooltip.style.left = ev.clientX + 14 + "px";
        tooltip.style.top = ev.clientY + 14 + "px";
        tooltip.innerHTML = `<strong>Engine ${cell.dataset.unit}</strong><br/>Predicted RUL ${cell.dataset.rul} · risk ${cell.dataset.risk}`;
      });
      cell.addEventListener("mouseleave", () => (tooltip.style.display = "none"));
    });
  }

  function ensureTooltip() {
    let tooltip = document.getElementById("cell-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "cell-tooltip";
      tooltip.className = "cell-tooltip";
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function renderTable() {
    let rows = engines;
    if (query) rows = rows.filter((e) => String(e.unit).includes(query));
    if (onlyDeep) rows = rows.filter((e) => e.deep_analysis);
    rows = [...rows].sort((a, b) => a[sortKey] - b[sortKey]);

    document.getElementById("table-count").textContent = `${rows.length} of ${engines.length} engines`;
    document.getElementById("engine-tbody").innerHTML = rows
      .map((e) => {
        const tier = Charts.riskTier(e.risk_score);
        return `
        <tr data-unit="${e.unit}">
          <td class="mono text-dim">#${e.risk_rank}</td>
          <td style="font-weight:600">Engine ${e.unit}</td>
          <td>
            <span class="risk-bar"><span class="risk-bar-fill" style="width:${e.risk_score}%;background:var(--risk-${tier})"></span></span>
            ${riskBadge(e.risk_score)}
          </td>
          <td class="mono">${e.predicted_RUL.toFixed(1)} cycles</td>
          <td class="mono text-dim">${e.true_RUL.toFixed(0)} cycles</td>
          <td style="text-align:right">${
            e.deep_analysis
              ? `<span class="badge-deep">✨ Deep AI</span>`
              : `<span class="text-dim" style="font-size:12px">ML only</span>`
          }</td>
        </tr>`;
      })
      .join("");

    document.querySelectorAll("#engine-tbody tr").forEach((tr) => {
      tr.addEventListener("click", () => Router.go(`/engine/${tr.dataset.unit}`));
    });
  }

  return { render };
})();
