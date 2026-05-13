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

const app = express();

let orchestratorConfig = { server: {} };
try {
  const configPath = path.join(__dirname, '..', 'config', 'orchestrator.yaml');
  if (fs.existsSync(configPath)) {
    orchestratorConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) || { server: {} };
  }
} catch (err) {
  console.error('[orchestrator] failed to load orchestrator.yaml:', err.message);
}

const PORT = process.env.ORCHESTRATOR_PORT || orchestratorConfig.server?.port || 3131;
const BIND_ADDRESS = orchestratorConfig.server?.bind_address || '127.0.0.1';
const API_KEY = process.env.ORCHESTRATOR_API_KEY || orchestratorConfig.server?.api_key;

app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'dashboard')));

// ── Authentication Middleware ────────────────────────────────────────────────
app.use((req, res, next) => {
  if (API_KEY) {
    const normalizedPath = req.path.toLowerCase().replace(/\/+/g, '/');
    if (normalizedPath.startsWith('/v1/') || normalizedPath.startsWith('/api/')) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
  }
  next();
});

// ── OpenAI-compatible chat completions endpoint ──────────────────────────────
app.post('/v1/chat/completions', async (req, res) => {
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
app.get('/api/recent', (_req, res) => {
  res.json(benchmarkStore.recent(20));
});

// ── Dashboard API: benchmarks ────────────────────────────────────────────────
app.get('/api/benchmarks', (_req, res) => {
  res.json(benchmarkStore.averagesByModel());
});

// ── Dashboard API: memory stats ──────────────────────────────────────────────
app.get('/api/memory', async (_req, res) => {
  const available_gb = await getAvailableMemoryGB();
  const total_gb = parseFloat((os.totalmem() / (1024 ** 3)).toFixed(2));
  // Available vs free is complex on macOS, but we'll calculate pressure
  // roughly as (total - available) / total * 100
  const pressure_pct = parseFloat((((total_gb - available_gb) / total_gb) * 100).toFixed(1));
  res.json({ available_gb, total_gb, pressure_pct });
});

// ── Dashboard API: model registry ────────────────────────────────────────────
app.get('/api/models', (_req, res) => {
  res.json(loadRegistry());
});

// ── Registry Hot Reload ──────────────────────────────────────────────────────
app.get('/api/reload', (_req, res) => {
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

app.listen(PORT, BIND_ADDRESS, () => {
  console.log(`🧠 Local AI Orchestrator running at http://${BIND_ADDRESS}:${PORT}`);
  console.log(`   Dashboard: http://${BIND_ADDRESS}:${PORT}/dashboard`);
  console.log(`   API:       http://${BIND_ADDRESS}:${PORT}/v1/chat/completions`);
});

module.exports = app;
