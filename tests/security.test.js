/**
 * Security tests for server binding
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'config');
const CONFIG_PATH = path.join(CONFIG_DIR, 'orchestrator.yaml');
const CONFIG_BACKUP = `${CONFIG_PATH}.bak`;

test('config respects bind_address from orchestrator.yaml', () => {
  // Ensure config directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Backup existing config
  let originalConfig = null;
  if (fs.existsSync(CONFIG_PATH)) {
    originalConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
    fs.renameSync(CONFIG_PATH, CONFIG_BACKUP);
  }

  try {
    // Create a test config
    const yaml = require('js-yaml');
    const testConfig = {
      server: {
        port: 3132,
        bind_address: '127.0.0.1'
      }
    };
    fs.writeFileSync(CONFIG_PATH, yaml.dump(testConfig));

    // Delete cache for the module to reload it
    delete require.cache[require.resolve('../src/config')];
    const config = require('../src/config');

    assert.equal(config.server.bind_address, '127.0.0.1');
    assert.equal(config.server.port, 3132);

  } finally {
    // Restore original config
    if (originalConfig) {
      fs.writeFileSync(CONFIG_PATH, originalConfig);
      if (fs.existsSync(CONFIG_BACKUP)) fs.unlinkSync(CONFIG_BACKUP);
    } else {
      if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
    }
    // Cleanup cache
    delete require.cache[require.resolve('../src/config')];
  }
});

test('config defaults to 127.0.0.1 when bind_address is missing', () => {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Backup existing config
    let originalConfig = null;
    if (fs.existsSync(CONFIG_PATH)) {
      originalConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
      fs.renameSync(CONFIG_PATH, CONFIG_BACKUP);
    }

    try {
      // Create a test config without bind_address
      const yaml = require('js-yaml');
      const testConfig = {
        server: {
          port: 3133
        }
      };
      fs.writeFileSync(CONFIG_PATH, yaml.dump(testConfig));

      // Delete cache for the module to reload it
      delete require.cache[require.resolve('../src/config')];
      const config = require('../src/config');

      assert.equal(config.server.bind_address, '127.0.0.1');
      assert.equal(config.server.port, 3133);

    } finally {
      // Restore original config
      if (originalConfig) {
        fs.writeFileSync(CONFIG_PATH, originalConfig);
        if (fs.existsSync(CONFIG_BACKUP)) fs.unlinkSync(CONFIG_BACKUP);
      } else {
        if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
      }
      // Cleanup cache
      delete require.cache[require.resolve('../src/config')];
    }
  });
