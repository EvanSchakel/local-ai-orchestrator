/**
 * Configuration Loader
 * Loads config/orchestrator.yaml
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'orchestrator.yaml');

const DEFAULT_CONFIG = {
  server: {
    port: 3131,
    bind_address: '127.0.0.1'
  }
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return DEFAULT_CONFIG;
  }

  try {
    const yaml = require('js-yaml');
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const loaded = yaml.load(raw);

    return {
      server: { ...DEFAULT_CONFIG.server, ...loaded.server }
    };
  } catch (err) {
    // If js-yaml is not available or file is malformed, use defaults
    return DEFAULT_CONFIG;
  }
}

const config = loadConfig();

module.exports = config;
