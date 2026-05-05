/**
 * Tests for memoryGuard
 * Run: node --test tests/memoryGuard.test.js
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const memoryGuard = require('../src/memoryGuard');

describe('memoryGuard.canLoadModel', () => {
  let originalGetAvailableMemoryGB;

  beforeEach(() => {
    originalGetAvailableMemoryGB = memoryGuard.getAvailableMemoryGB;
  });

  afterEach(() => {
    memoryGuard.getAvailableMemoryGB = originalGetAvailableMemoryGB;
  });

  test('returns true when there is sufficient memory (happy path)', () => {
    memoryGuard.getAvailableMemoryGB = () => 10.0;
    // model (4GB) + buffer (1.5GB) = 5.5GB < 10.0GB
    assert.strictEqual(memoryGuard.canLoadModel(4), true);
  });

  test('returns false when memory is insufficient', () => {
    memoryGuard.getAvailableMemoryGB = () => 4.0;
    // model (4GB) + buffer (1.5GB) = 5.5GB > 4.0GB
    assert.strictEqual(memoryGuard.canLoadModel(4), false);
  });

  test('returns true when available memory exactly equals required + buffer', () => {
    memoryGuard.getAvailableMemoryGB = () => 5.5;
    // model (4.0GB) + buffer (1.5GB) = 5.5GB
    assert.strictEqual(memoryGuard.canLoadModel(4.0), true);
  });

  test('respects custom buffer size', () => {
    memoryGuard.getAvailableMemoryGB = () => 5.0;
    // model (4GB) + custom buffer (0.5GB) = 4.5GB < 5.0GB
    assert.strictEqual(memoryGuard.canLoadModel(4, 0.5), true);

    // model (4GB) + custom buffer (2.0GB) = 6.0GB > 5.0GB
    assert.strictEqual(memoryGuard.canLoadModel(4, 2.0), false);
  });

  test('uses default 1.5GB buffer when not specified', () => {
    memoryGuard.getAvailableMemoryGB = () => 5.4;
    // 5.4 < 4 + 1.5 (5.5)
    assert.strictEqual(memoryGuard.canLoadModel(4), false);

    memoryGuard.getAvailableMemoryGB = () => 5.5;
    // 5.5 >= 4 + 1.5 (5.5)
    assert.strictEqual(memoryGuard.canLoadModel(4), true);
  });
});
