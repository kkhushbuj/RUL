const API = (() => {
  async function getJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return res.json();
  }

  return {
    engines: () => getJSON("/api/engines"),
    engine: (unit) => getJSON(`/api/engines/${unit}`),
    engineSensors: (unit) => getJSON(`/api/engines/${unit}/sensors`),
    modelMetrics: () => getJSON("/api/model/metrics"),
    agentSummary: () => getJSON("/api/model/agent-summary"),
    knowledgeBase: () => getJSON("/api/model/knowledge-base"),

    analyzeEngine: async (unit) => {
      const res = await fetch(`/api/engines/${unit}/analyze`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `analyze -> ${res.status}`);
      }
      return res.json();
    },

    chat: async (unit, question) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit, question }),
      });
      if (!res.ok) throw new Error(`chat -> ${res.status}`);
      return res.json();
    },
  };
})();
