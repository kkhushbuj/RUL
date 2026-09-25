const EngineView = (() => {
  let engine = null;
  let subset = "FD001";
  let sensorRows = null;
  let activeSensor = null;
  let chatMessages = [];
  let chatLoading = false;

  const STAGES = [
    "Comparing SHAP attribution against the literature knowledge base...",
    "Running independent critique review...",
    "Finalizing verdict...",
  ];

  async function render(unit, engineSubset) {
    subset = engineSubset || "FD001";
    const app = document.getElementById("app");
    app.innerHTML = `
      <a href="#/${subset === "FD001" ? "" : subset}" class="back-link">← Back to fleet overview</a>
      <div id="engine-content">
        <div class="skeleton" style="height:32px;width:220px;margin-bottom:12px;"></div>
        <div class="skeleton" style="height:280px;width:100%;"></div>
      </div>
    `;

    try {
      const [engineData, sensors] = await Promise.all([
        API.engine(unit, subset),
        API.engineSensors(unit, subset).catch(() => null),
      ]);
      engine = engineData;
      sensorRows = sensors;
      activeSensor = engine.shap?.top_sensors?.[0]?.sensor ?? null;
      renderContent();
    } catch (err) {
      document.getElementById("engine-content").innerHTML = `<div class="panel">Engine ${unit} not found.</div>`;
    }
  }

  function riskBadge(score) {
    const tier = Charts.riskTier(score);
    const label = tier === "high" ? "High risk" : tier === "medium" ? "Medium risk" : "Low risk";
    return `<span class="risk-badge ${tier}"><span class="rb-dot"></span>${label}</span>`;
  }

  function renderContent() {
    const topSensors = engine.shap?.top_sensors?.map((s) => s.sensor) ?? [];

    document.getElementById("engine-content").innerHTML = `
      <div class="engine-header fade-in">
        <div>
          <div class="engine-title">
            <h1>Engine ${engine.unit}</h1>
            ${riskBadge(engine.risk_score)}
            ${engine.deep_analysis ? `<span class="badge-deep">✨ Deep AI analysis</span>` : ""}
          </div>
          <p class="engine-sub">Risk rank #${engine.risk_rank} · ${subset}</p>
        </div>
        <div class="metrics-cluster">
          <div class="metric-block">
            <p class="metric-label">Predicted RUL</p>
            <p class="metric-value">${engine.predicted_RUL.toFixed(1)} cycles</p>
          </div>
          <div class="metric-block">
            <p class="metric-label">True RUL</p>
            <p class="metric-value" style="color:var(--text-dim)">${engine.true_RUL.toFixed(0)} cycles</p>
          </div>
          <div class="gauge-wrap">
            <canvas id="risk-gauge"></canvas>
            <div class="gauge-center">
              <span class="gauge-value">${engine.risk_score.toFixed(0)}</span>
              <span class="gauge-caption">RISK</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-col fade-in" style="animation-delay:80ms">
          <div class="panel">
            <div class="panel-header">
              <div>
                <p class="panel-title">Which sensors drove this prediction</p>
                <p class="panel-sub">SHAP attribution — bars pushing right increase predicted risk (lower RUL), bars pushing left decrease it.</p>
              </div>
            </div>
            ${engine.shap ? `<div class="chart-box"><canvas id="shap-chart"></canvas></div>` : `<p class="text-dim">No SHAP data for this engine.</p>`}
          </div>

          <div class="panel">
            <div class="panel-header">
              <p class="panel-title">Sensor trend over engine life</p>
              ${
                topSensors.length
                  ? `<select class="select-input" id="sensor-select">
                      ${topSensors.map((s) => `<option value="${s}" ${s === activeSensor ? "selected" : ""}>${s.replace("sensor_", "Sensor ")}</option>`).join("")}
                    </select>`
                  : ""
              }
            </div>
            ${sensorRows && activeSensor ? `<div class="chart-box tall"><canvas id="sensor-chart"></canvas></div>` : `<div class="skeleton" style="height:220px;"></div>`}
          </div>
        </div>

        <div class="detail-col fade-in" style="animation-delay:140ms">
          <div id="analysis-slot"></div>
          <div id="chat-slot"></div>
        </div>
      </div>
    `;

    if (engine.shap) Charts.shapChart("shap-chart", engine.shap.top_sensors);
    if (sensorRows && activeSensor) Charts.sensorTrendChart("sensor-chart", sensorRows, activeSensor);
    Charts.gaugeChart("risk-gauge", engine.risk_score);

    const sensorSelect = document.getElementById("sensor-select");
    if (sensorSelect) {
      sensorSelect.addEventListener("change", (e) => {
        activeSensor = e.target.value;
        Charts.sensorTrendChart("sensor-chart", sensorRows, activeSensor);
      });
    }

    renderAnalysisSlot();
    renderChatSlot();
  }

  function renderAnalysisSlot() {
    const slot = document.getElementById("analysis-slot");
    if (engine.agent_analysis) {
      slot.innerHTML = agentAnalysisHTML(engine.agent_analysis);
    } else {
      slot.innerHTML = `
        <div class="run-analysis-card">
          <div class="run-analysis-icon">✨</div>
          <div>
            <p style="font-weight:600;margin:0 0 4px;">No deep analysis yet</p>
            <p>${
              engine.deep_analysis
                ? "This engine is flagged as high-risk but hasn't been analyzed yet."
                : "This engine wasn't in the top 15 highest-risk engines, so it only got the cheap ML-only risk score. You can still run the full literature cross-check on demand."
            }</p>
          </div>
          <button class="btn" id="run-analysis-btn">✨ Run deep analysis</button>
        </div>
      `;
      document.getElementById("run-analysis-btn").addEventListener("click", runAnalysis);
    }
  }

  async function runAnalysis() {
    const slot = document.getElementById("analysis-slot");
    let stage = 0;
    slot.innerHTML = `
      <div class="loading-analysis">
        <div class="spinner light" style="width:22px;height:22px;"></div>
        <div>
          <p style="font-weight:600;margin:0 0 6px;">Running Synthesis → Hypothesis → Critique…</p>
          <p class="stage" id="analysis-stage">${STAGES[0]}</p>
        </div>
        <p class="stage">Usually takes 15–30 seconds.</p>
      </div>
    `;
    const interval = setInterval(() => {
      stage = Math.min(stage + 1, STAGES.length - 1);
      const el = document.getElementById("analysis-stage");
      if (el) el.textContent = STAGES[stage];
    }, 4000);

    try {
      const analysis = await API.analyzeEngine(engine.unit, subset);
      engine.agent_analysis = analysis;
      renderAnalysisSlot();
      toast(`Deep analysis complete — verdict: ${analysis.synthesis_result?.verdict}`, "success");
    } catch (err) {
      toast(err.message || "Deep analysis failed.", "error");
      renderAnalysisSlot();
    } finally {
      clearInterval(interval);
    }
  }

  function agentAnalysisHTML(a) {
    const s = a.synthesis_result;
    const h = a.hypothesis_result;
    const c = a.critique_result;
    let html = "";

    if (s) {
      html += `
        <div class="agent-card">
          <div class="agent-card-head">
            <span class="agent-card-label">🧠 Synthesis Agent</span>
            <span class="verdict-badge ${s.verdict}">${
              s.verdict === "Confirmed" ? "✓ Confirmed by literature" : s.verdict === "Contradicted" ? "✕ Contradicts literature" : "? Novel — no literature coverage"
            }</span>
          </div>
          <p>${escapeHTML(s.reasoning)}</p>
          ${(s.matched_sources || []).map((src) => `<span class="source-chip">${escapeHTML(src)}</span>`).join("")}
        </div>`;
    }
    if (h) {
      html += `
        <div class="agent-card">
          <div class="agent-card-head"><span class="agent-card-label">🧪 Hypothesis Agent</span></div>
          <p>${escapeHTML(h.hypothesis)}</p>
          <p style="color:var(--text-dim);margin-top:8px;">${escapeHTML(h.physical_reasoning)}</p>
          ${
            h.next_checks?.length
              ? `<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-faint);margin-top:12px;">Next checks</p>
                 <ul>${h.next_checks.map((n) => `<li>${escapeHTML(n)}</li>`).join("")}</ul>`
              : ""
          }
        </div>`;
    }
    if (c) {
      html += `
        <div class="agent-card" style="background:var(--accent-dim);border-color:var(--accent-dim);">
          <div class="agent-card-head">
            <span class="agent-card-label">🛡 Critique Agent (independent review)</span>
            <span class="agree-badge ${c.agrees_with_pipeline ? "agree" : "disagree"}">${c.agrees_with_pipeline ? "Agrees" : "Disagrees"}</span>
          </div>
          <p>${escapeHTML(c.critique)}</p>
          ${c.alternative_explanation ? `<p style="color:var(--text-dim);margin-top:8px;"><strong style="color:var(--text)">Alternative explanation: </strong>${escapeHTML(c.alternative_explanation)}</p>` : ""}
        </div>`;
    }
    return html;
  }

  function renderChatSlot() {
    const slot = document.getElementById("chat-slot");
    slot.innerHTML = `
      <div class="chat-panel">
        <div class="chat-head">💬 Ask about Engine ${engine.unit}</div>
        <div class="chat-body" id="chat-body">
          ${
            chatMessages.length === 0
              ? `<p class="chat-empty">Ask a follow-up question — e.g. "why is this engine high risk?" or "what does the critique agent think?"</p>`
              : chatMessages.map((m) => `<div class="chat-msg ${m.role}">${escapeHTML(m.content)}</div>`).join("")
          }
          ${chatLoading ? `<div class="chat-thinking"><span class="spinner light" style="width:12px;height:12px;"></span> thinking...</div>` : ""}
        </div>
        <div class="chat-input-row">
          <input type="text" id="chat-input" placeholder="Ask a question about this engine..." />
          <button class="send-btn" id="chat-send">➤</button>
        </div>
      </div>
    `;
    const input = document.getElementById("chat-input");
    const send = async () => {
      const question = input.value.trim();
      if (!question || chatLoading) return;
      input.value = "";
      chatMessages.push({ role: "user", content: question });
      chatLoading = true;
      renderChatSlot();
      document.getElementById("chat-input").focus();
      try {
        const { answer } = await API.chat(engine.unit, question, subset);
        chatMessages.push({ role: "assistant", content: answer });
      } catch {
        toast("Couldn't reach the chat backend.", "error");
        chatMessages.pop();
      } finally {
        chatLoading = false;
        renderChatSlot();
        const body = document.getElementById("chat-body");
        if (body) body.scrollTop = body.scrollHeight;
      }
    };
    document.getElementById("chat-send").addEventListener("click", send);
    input.addEventListener("keydown", (e) => e.key === "Enter" && send());
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function resetChat() {
    chatMessages = [];
    chatLoading = false;
  }

  return { render, resetChat };
})();
