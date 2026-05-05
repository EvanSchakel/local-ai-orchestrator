/**
 * Local AI Orchestrator — Express Gateway
 * Listens on port 3131, OpenAI-compatible /v1/chat/completions
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml');
const { routeRequest } = require('./router');
const { loadRegistry, reloadRegistry } = require('./modelRegistry');
const benchmarkStore = require('./benchmarkStore');
const { getAvailableMemoryGB } = require('./memoryGuard');

// Load Orchestrator Config
const orchestratorConfigPath = path.join(__dirname, '..', 'config', 'orchestrator.yaml');
let orchestratorConfig = {};
try {
  if (fs.existsSync(orchestratorConfigPath)) {
    orchestratorConfig = yaml.load(fs.readFileSync(orchestratorConfigPath, 'utf8')) || {};
  }
} catch (err) {
  console.warn('[orchestrator] Could not load orchestrator.yaml:', err.message);
}

const app = express();
const PORT = process.env.ORCHESTRATOR_PORT || orchestratorConfig?.server?.port || 3131;

app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'dashboard')));

// ── Authentication Middleware ────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const configuredKey = process.env.ORCHESTRATOR_API_KEY || orchestratorConfig?.server?.api_key;

  // If no key is configured, allow the request to proceed (open access)
  if (!configuredKey) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== configuredKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  next();
};

// ── OpenAI-compatible chat completions endpoint ──────────────────────────────
app.post('/v1/chat/completions', authMiddleware, async (req, res) => {
  const { model, messages, stream, ...rest } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const result = await routeRequest({ model, messages, stream, options: rest }, res);

    if (!stream) {
      res.json(result.response);
    }

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
app.get('/api/recent', authMiddleware, (_req, res) => {
  res.json(benchmarkStore.recent(20));
});

// ── Dashboard API: benchmarks ────────────────────────────────────────────────
app.get('/api/benchmarks', authMiddleware, (_req, res) => {
  res.json(benchmarkStore.averagesByModel());
});

// ── Dashboard API: memory stats ──────────────────────────────────────────────
app.get('/api/memory', authMiddleware, (_req, res) => {
  const available_gb = getAvailableMemoryGB();
  const total_gb = parseFloat((os.totalmem() / (1024 ** 3)).toFixed(2));
  // Available vs free is complex on macOS, but we'll calculate pressure
  // roughly as (total - available) / total * 100
  const pressure_pct = parseFloat((((total_gb - available_gb) / total_gb) * 100).toFixed(1));
  res.json({ available_gb, total_gb, pressure_pct });
});

// ── Dashboard API: model registry ────────────────────────────────────────────
app.get('/api/models', authMiddleware, (_req, res) => {
  res.json(loadRegistry());
});

// ── Registry Hot Reload ──────────────────────────────────────────────────────
app.get('/api/reload', authMiddleware, (_req, res) => {
  const registry = reloadRegistry();
  res.json({ status: 'reloaded', models_count: registry.models?.length || 0 });
});

// Watch config/models.yaml for changes
const modelsConfigPath = path.join(__dirname, '..', 'config', 'models.yaml');
if (fs.existsSync(modelsConfigPath)) {
  fs.watch(modelsConfigPath, (eventType, filename) => {
    if (eventType === 'change') {
      console.log(`[orchestrator] Detected change in ${filename}, reloading registry...`);
      reloadRegistry();
    }
  });
}

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
