/**
 * Memory Guard
 * Reads live macOS memory stats via `vm_stat` and calculates free GB.
 * Used by the router to block large model loads under memory pressure.
 */

const child_process = require('child_process');
const util = require('util');

const PAGE_SIZE_BYTES = 16384; // Apple Silicon uses 16KB pages

/**
 * Returns available memory in GB (free + inactive pages)
 * @returns {Promise<number>} available GB
 */
async function getAvailableMemoryGB() {
  try {
    const execAsync = util.promisify(child_process.exec);
    const { stdout: output } = await execAsync('vm_stat', { encoding: 'utf8' });
    const lines = output.split('\n');

    const parse = (label) => {
      const line = lines.find(l => l.startsWith(label));
      if (!line) return 0;
      const match = line.match(/([\d]+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const freePages = parse('Pages free:');
    const inactivePages = parse('Pages inactive:');
    const speculativePages = parse('Pages speculative:');

    const availableBytes = (freePages + inactivePages + speculativePages) * PAGE_SIZE_BYTES;
    return parseFloat((availableBytes / (1024 ** 3)).toFixed(2));
  } catch (err) {
    console.warn('[memoryGuard] vm_stat failed:', err.message);
    return 4; // Conservative fallback
  }
}

/**
 * Returns true if there's enough memory to load a model of given size
 * @param {number} modelMemoryGB - estimated model memory requirement
 * @param {number} bufferGB - minimum free buffer to keep (default 1.5GB)
 * @returns {Promise<boolean>}
 */
async function canLoadModel(modelMemoryGB, bufferGB = 1.5, availableGB = null) {
  const available = availableGB !== null ? availableGB : await module.exports.getAvailableMemoryGB();
  const canLoad = available >= modelMemoryGB + bufferGB;
  if (!canLoad) {
    console.warn(
      `[memoryGuard] Blocked: model needs ${modelMemoryGB}GB, only ${available}GB available (buffer: ${bufferGB}GB)`
    );
  }
  return canLoad;
}

module.exports = { getAvailableMemoryGB, canLoadModel };
