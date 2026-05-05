const { test, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadRegistry, reloadRegistry } = require('../src/modelRegistry');

test('modelRegistry', async (t) => {
  const CONFIG_PATH = path.join(__dirname, '..', 'config', 'models.yaml');
  const EXAMPLE_PATH = path.join(__dirname, '..', 'config', 'models.example.yaml');

  beforeEach(() => {
    mock.restoreAll();
    // Suppress console logs during tests to keep output clean
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});

  });

  afterEach(() => {
    mock.restoreAll();
  });

  await t.test('loads models from models.yaml if it exists', () => {
    // Clear cache
    mock.method(fs, 'existsSync', () => true);
    mock.method(fs, 'readFileSync', () => '');

    mock.restoreAll();
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});

    mock.method(fs, 'existsSync', (filePath) => {
      if (filePath === CONFIG_PATH) return true;
      return false;
    });

    mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath === CONFIG_PATH) {
        return `
models:
  - id: custom-model-1
    model_name: test1
        `;
      }
      return '';
    });

    const registry = reloadRegistry();
    assert.strictEqual(registry.models.length, 1);
    assert.strictEqual(registry.models[0].id, 'custom-model-1');
    assert.strictEqual(fs.existsSync.mock.callCount(), 1);
    assert.strictEqual(fs.readFileSync.mock.callCount(), 1);
  });

  await t.test('falls back to models.example.yaml if models.yaml does not exist', () => {
    mock.restoreAll();
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});

    mock.method(fs, 'existsSync', (filePath) => {
      if (filePath === CONFIG_PATH) return false;
      return true;
    });

    mock.method(fs, 'readFileSync', (filePath, encoding) => {
      if (filePath === EXAMPLE_PATH) {
        return `
models:
  - id: example-model-1
    model_name: example1
        `;
      }
      return '';
    });

    const registry = reloadRegistry();
    assert.strictEqual(registry.models.length, 1);
    assert.strictEqual(registry.models[0].id, 'example-model-1');
    assert.strictEqual(fs.existsSync.mock.callCount(), 1);
    assert.strictEqual(fs.readFileSync.mock.callCount(), 1);
  });

  await t.test('caches the registry after first load', () => {
    mock.restoreAll();
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});

    mock.method(fs, 'existsSync', () => true);
    mock.method(fs, 'readFileSync', () => `
models:
  - id: cache-test
    `);

    // First load
    const registry1 = reloadRegistry();
    assert.strictEqual(registry1.models.length, 1);
    assert.strictEqual(fs.readFileSync.mock.callCount(), 1);

    // Second load should use cache
    const registry2 = loadRegistry();
    assert.strictEqual(registry2.models.length, 1);
    assert.strictEqual(registry1, registry2); // Should be the exact same object reference
    assert.strictEqual(fs.readFileSync.mock.callCount(), 1); // Not called again
  });

  await t.test('reloadRegistry clears the cache and reloads', () => {
    mock.restoreAll();
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});

    mock.method(fs, 'existsSync', () => true);
    mock.method(fs, 'readFileSync', () => `
models:
  - id: reload-test
    `);

    // First load
    reloadRegistry();
    assert.strictEqual(fs.readFileSync.mock.callCount(), 1);

    // Reload
    reloadRegistry();
    assert.strictEqual(fs.readFileSync.mock.callCount(), 2);
  });

  await t.test('handles invalid YAML gracefully and returns empty array', () => {
    mock.restoreAll();
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});

    mock.method(fs, 'existsSync', () => true);
    mock.method(fs, 'readFileSync', () => `
models:
  - id: invalid
    model_name:
      - bad-indentation
     broken: true
    `); // Malformed YAML

    const registry = reloadRegistry();
    assert.ok(Array.isArray(registry.models));
    assert.strictEqual(registry.models.length, 0);
    assert.strictEqual(console.error.mock.callCount(), 1);
  });

  await t.test('handles missing file gracefully when reading throws', () => {
    mock.restoreAll();
    mock.method(console, 'log', () => {});
    mock.method(console, 'error', () => {});

    mock.method(fs, 'existsSync', () => true); // Pretend it exists
    mock.method(fs, 'readFileSync', () => {
      throw new Error('EACCES: permission denied');
    });

    const registry = reloadRegistry();
    assert.ok(Array.isArray(registry.models));
    assert.strictEqual(registry.models.length, 0);
    assert.strictEqual(console.error.mock.callCount(), 1);
  });
});
