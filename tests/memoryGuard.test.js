const test = require('node:test');
const assert = require('node:assert');

// Mock child_process BEFORE requiring memoryGuard
const childProcess = require('child_process');
const originalExecSync = childProcess.execSync;

let mockPagesFree = 0;

childProcess.execSync = (command, options) => {
  if (command === 'vm_stat') {
    return `Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                               ${mockPagesFree}.
Pages active:                             123456.
Pages inactive:                           0.
Pages speculative:                        0.
`;
  }
  return originalExecSync(command, options);
};

const memoryGuard = require('../src/memoryGuard');

test('Memory Guard Logic', async (t) => {
  const originalConsoleWarn = console.warn;
  const logs = [];
  console.warn = (...args) => logs.push(args.join(' '));

  try {
    // Test 1: Enough memory
    // 3GB available = (3 * 1024^3) / 16384 = 196608 pages
    mockPagesFree = 196608;
    const canLoad1 = memoryGuard.canLoadModel(1.0); // Needs 1GB + 1.5GB buffer = 2.5GB. We have 3GB.
    assert.strictEqual(canLoad1, true, 'Should allow loading when memory is sufficient');

    // Test 2: Not enough memory
    // 2GB available = (2 * 1024^3) / 16384 = 131072 pages
    mockPagesFree = 131072;
    const canLoad2 = memoryGuard.canLoadModel(1.0); // Needs 1GB + 1.5GB buffer = 2.5GB. We have 2GB.
    assert.strictEqual(canLoad2, false, 'Should block loading when memory is insufficient');

    const hasBlockedLog = logs.some(log => log.includes('[memoryGuard] Blocked:'));
    assert.ok(hasBlockedLog, 'Should have logged a warning when blocking');

  } finally {
    childProcess.execSync = originalExecSync;
    console.warn = originalConsoleWarn;
  }
});
