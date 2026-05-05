/**
 * Local AI Orchestrator — Express Gateway
 * Listens on port 3131, OpenAI-compatible /v1/chat/completions
 */

const express = require('express');
const path = require('path');
const { routeRequest } = require('./router');
const { loadRegistry } = require('./modelRegistry');
const benchmarkStore = require('./benchmarkStore');

const app = express();
const PORT = process.env.ORCHESTRATOR_PORT || 3131;

app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'dashboard')));

// ── OpenAI-compatible chat completions endpoint ──────────────────────────────
app.post('/v1/chat/completions', async (req, res) => {
  const { model, messages, stream, ...rest } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const result = await routeRequest({ model, messages, stream, options: rest });
    res.json(result.response);

    // Log benchmark data asynchronously
    if (result.meta) {
      benchmarkStore.record(result.meta);
    }
  } catch (err) {
    console.error('[orchestrator] routing error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── Dashboard API: recent requests ───────────────────────────────────────────
app.get('/api/recent', (_req, res) => {
  res.json(benchmarkStore.recent(20));
});

// ── Dashboard API: model registry ────────────────────────────────────────────
app.get('/api/models', (_req, res) => {
  res.json(loadRegistry());
});

// ── Dashboard UI ─────────────────────────────────────────────────────────────
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', port: PORT, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🧠 Local AI Orchestrator running at http://localhost:${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   API:       http://localhost:${PORT}/v1/chat/completions`);
});

module.exports = app;
