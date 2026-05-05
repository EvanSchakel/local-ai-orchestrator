/**
 * Model Registry
 * Loads and validates config/models.yaml
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'models.yaml');
const EXAMPLE_PATH = path.join(__dirname, '..', 'config', 'models.example.yaml');

let _cache = null;

function loadRegistry() {
  if (_cache) return _cache;

  const filePath = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_PATH;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    _cache = yaml.load(raw);
    console.log(`[registry] Loaded ${_cache.models?.length || 0} models from ${path.basename(filePath)}`);
    return _cache;
  } catch (err) {
    console.error('[registry] Failed to load model config:', err.message);
    return { models: [] };
  }
}

function reloadRegistry() {
  _cache = null;
  return loadRegistry();
}

module.exports = { loadRegistry, reloadRegistry };
