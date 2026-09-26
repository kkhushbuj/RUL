const API = (() => {
  async function getJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
  }

  return {
    subsets: () => getJSON("/api/model/subsets"),
    engines: (subset) => getJSON(`/api/engines?subset=${subset}`),
    engine: (unit, subset) => getJSON(`/api/engines/${unit}?subset=${subset}`),
    engineSensors: (unit, subset) => getJSON(`/api/engines/${unit}/sensors?subset=${subset}`),
    modelMetrics: (subset) => getJSON(`/api/model/metrics?subset=${subset}`),
    agentSummary: (subset) => getJSON(`/api/model/agent-summary?subset=${subset}`),
    knowledgeBase: (subset) => getJSON(`/api/model/knowledge-base?subset=${subset}`),

    analyzeEngine: async (unit, subset) => {
      const res = await fetch(`/api/engines/${unit}/analyze?subset=${subset}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `analyze -> ${res.status}`);
      }
      return res.json();
    },

    chat: async (unit, question, subset) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit, question, subset }),
      });
      if (!res.ok) throw new Error(`chat -> ${res.status}`);
      return res.json();
    },
  };
})();
