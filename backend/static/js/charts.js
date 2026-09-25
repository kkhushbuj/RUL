const Charts = (() => {
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  const registry = new Map();

  function destroy(canvasId) {
    const existing = registry.get(canvasId);
    if (existing) {
      existing.destroy();
      registry.delete(canvasId);
    }
  }

  function baseGrid() {
    return { color: cssVar("--border"), drawTicks: false };
  }
  function baseTicks() {
    return { color: cssVar("--text-dim"), font: { size: 11, family: "JetBrains Mono" } };
  }

  function shapChart(canvasId, sensors) {
    destroy(canvasId);
    const sorted = [...sensors].sort((a, b) => a.importance - b.importance);
    const labels = sorted.map((s) => s.sensor.replace("sensor_", "S"));
    const values = sorted.map((s) => s.signed_contribution);
    const colors = sorted.map((s) =>
      s.direction === "increases_risk" ? cssVar("--risk-high") : cssVar("--risk-low")
    );

    const ctx = document.getElementById(canvasId).getContext("2d");
    const chart = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 5, barThickness: 22 }] },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const s = sorted[item.dataIndex];
                const dir = s.direction === "increases_risk" ? "Pushes RUL down (higher risk)" : "Pushes RUL up (lower risk)";
                return `${item.formattedValue}  ·  ${dir}`;
              },
            },
          },
        },
        scales: {
          x: { grid: baseGrid(), ticks: baseTicks() },
          y: { grid: { display: false }, ticks: { color: cssVar("--text"), font: { size: 12.5, weight: 600 } } },
        },
      },
    });
    registry.set(canvasId, chart);
    return chart;
  }

  function sensorTrendChart(canvasId, rows, sensorKey) {
    destroy(canvasId);
    const labels = rows.map((r) => r.cycle);
    const values = rows.map((r) => r[sensorKey]);

    const ctx = document.getElementById(canvasId).getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, cssVar("--accent") + "55");
    gradient.addColorStop(1, cssVar("--accent") + "00");

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: cssVar("--accent"),
            backgroundColor: gradient,
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            title: { display: true, text: "Cycle", color: cssVar("--text-faint"), font: { size: 10.5 } },
            grid: { display: false },
            ticks: { ...baseTicks(), maxTicksLimit: 10 },
          },
          y: { grid: baseGrid(), ticks: baseTicks() },
        },
      },
    });
    registry.set(canvasId, chart);
    return chart;
  }

  function calibrationChart(canvasId, engines) {
    destroy(canvasId);
    const tiers = { low: [], medium: [], high: [] };
    let maxRul = 0;
    for (const e of engines) {
      tiers[riskTier(e.risk_score)].push({ x: e.true_RUL, y: e.predicted_RUL });
      maxRul = Math.max(maxRul, e.true_RUL, e.predicted_RUL);
    }
    maxRul += 5;

    const ctx = document.getElementById(canvasId).getContext("2d");
    const chart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          { label: "High", data: tiers.high, backgroundColor: cssVar("--risk-high") + "cc" },
          { label: "Medium", data: tiers.medium, backgroundColor: cssVar("--risk-medium") + "cc" },
          { label: "Low", data: tiers.low, backgroundColor: cssVar("--risk-low") + "cc" },
          {
            label: "Perfect prediction",
            data: [{ x: 0, y: 0 }, { x: maxRul, y: maxRul }],
            type: "line",
            borderColor: cssVar("--text-faint"),
            borderDash: [5, 5],
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: maxRul, title: { display: true, text: "True RUL", color: cssVar("--text-faint"), font: { size: 10.5 } }, grid: baseGrid(), ticks: baseTicks() },
          y: { min: 0, max: maxRul, title: { display: true, text: "Predicted RUL", color: cssVar("--text-faint"), font: { size: 10.5 } }, grid: baseGrid(), ticks: baseTicks() },
        },
      },
    });
    registry.set(canvasId, chart);
    return chart;
  }

  function gaugeChart(canvasId, score) {
    destroy(canvasId);
    const tier = riskTier(score);
    const color = cssVar(`--risk-${tier}`);
    const ctx = document.getElementById(canvasId).getContext("2d");
    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [score, 100 - score],
            backgroundColor: [color, cssVar("--border")],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "78%",
        circumference: 360,
        rotation: -90,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, duration: 800 },
      },
    });
    registry.set(canvasId, chart);
    return chart;
  }

  function riskTier(score) {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  return { shapChart, sensorTrendChart, calibrationChart, gaugeChart, riskTier, destroy };
})();
