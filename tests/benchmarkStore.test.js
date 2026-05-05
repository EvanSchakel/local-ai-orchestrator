/**
 * Tests for the benchmarkStore module
 * Run: node --test tests/benchmarkStore.test.js
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Intercept path.join so that benchmarkStore creates an in-memory SQLite database
// instead of writing to data/benchmarks.db.
const originalJoin = path.join;
path.join = function(...args) {
  if (args[args.length - 1] === 'benchmarks.db') {
    return ':memory:';
  }
  return originalJoin.apply(this, args);
};

// Clear require cache so each test file run gets a fresh in-memory DB if needed,
// though node:test runs once per process by default.
delete require.cache[require.resolve('../src/benchmarkStore')];
const benchmarkStore = require('../src/benchmarkStore');

// We don't have a direct method to clear the DB between tests,
// so we'll rely on unique models or count assertions relative to previous tests,
// or we can test sequentially.

test('Benchmark Store', async (t) => {

  await t.test('records a new benchmark successfully and computes toks_per_sec', () => {
    benchmarkStore.record({
      model_id: 'llama3-8b',
      provider: 'ollama',
      task_type: 'code',
      latency_ms: 2000,
      tokens: 100,
      timestamp: '2023-10-01T12:00:00Z'
    });

    const results = benchmarkStore.recent(1);
    assert.equal(results.length, 1);

    const record = results[0];
    assert.equal(record.model_id, 'llama3-8b');
    assert.equal(record.provider, 'ollama');
    assert.equal(record.task_type, 'code');
    assert.equal(record.latency_ms, 2000);
    assert.equal(record.tokens, 100);
    // (100 / 2000) * 1000 = 50.00
    assert.equal(record.toks_per_sec, 50);
    assert.equal(record.timestamp, '2023-10-01T12:00:00Z');
  });

  await t.test('records null toks_per_sec if tokens or latency_ms is missing', () => {
    benchmarkStore.record({
      model_id: 'gpt-4',
      provider: 'openai',
      task_type: 'writing',
      latency_ms: null,
      tokens: null,
      timestamp: '2023-10-01T12:01:00Z'
    });

    const results = benchmarkStore.recent(1);
    assert.equal(results[0].model_id, 'gpt-4');
    assert.equal(results[0].toks_per_sec, null);
  });

  await t.test('averagesByModel calculates correct average toks_per_sec and orders by descending', () => {
    // We already have 'llama3-8b' with 50 toks_per_sec
    // Let's add another 'llama3-8b' record with 100 toks_per_sec
    benchmarkStore.record({
      model_id: 'llama3-8b',
      provider: 'ollama',
      task_type: 'math',
      latency_ms: 1000,
      tokens: 100,
      timestamp: '2023-10-01T12:02:00Z'
    });
    // Expected avg for llama3-8b: (50 + 100) / 2 = 75

    // Add another model 'mixtral-8x7b' with 200 toks_per_sec
    benchmarkStore.record({
      model_id: 'mixtral-8x7b',
      provider: 'lmstudio',
      task_type: 'science',
      latency_ms: 500,
      tokens: 100,
      timestamp: '2023-10-01T12:03:00Z'
    });

    const averages = benchmarkStore.averagesByModel();
    // We should have 2 models in the averages (gpt-4 had null, so it shouldn't be included in averages calculation if grouped by model with non-null, actually the query says WHERE toks_per_sec IS NOT NULL)
    assert.equal(averages.length, 2);

    // It should be ordered descending
    assert.equal(averages[0].model_id, 'mixtral-8x7b');
    assert.equal(averages[0].avg_toks_sec, 200);
    assert.equal(averages[0].request_count, 1);

    assert.equal(averages[1].model_id, 'llama3-8b');
    assert.equal(averages[1].avg_toks_sec, 75);
    assert.equal(averages[1].request_count, 2);
  });

  await t.test('gracefully handles database errors during record (logs warning)', () => {
    const originalWarn = console.warn;
    const logs = [];
    console.warn = (...args) => logs.push(args.join(' '));

    try {
      // Intentionally missing model_id, which is NOT NULL in the schema
      benchmarkStore.record({
        provider: 'ollama',
        task_type: 'code',
        latency_ms: 100,
        tokens: 10,
        timestamp: '2023-10-01T12:04:00Z'
      });

      const hasWarning = logs.some(log => log.includes('[benchmarkStore] Failed to record:'));
      assert.ok(hasWarning, 'Should have logged a warning about constraint failure');
    } finally {
      console.warn = originalWarn;
    }
  });

});
