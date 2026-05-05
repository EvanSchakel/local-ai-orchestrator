const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { routeRequest } = require('../src/router');
const { reloadRegistry } = require('../src/modelRegistry');

// Temporarily overwrite config/models.yaml for the test
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'models.yaml');
const TEMP_BACKUP = path.join(__dirname, '..', 'config', 'models.yaml.bak');

test('Router Failover Logic', async (t) => {
  // Start a local mock server
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const parsedBody = JSON.parse(body);

      // Simulate failure for model1
      if (parsedBody.model === 'model1') {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      // Simulate success for model2
      else if (parsedBody.model === 'model2') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: 'chatcmpl-123',
          choices: [{ message: { role: 'assistant', content: 'Success!' } }],
          usage: { completion_tokens: 10 }
        }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
  });

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  // Backup existing config
  if (fs.existsSync(CONFIG_PATH)) {
    fs.copyFileSync(CONFIG_PATH, TEMP_BACKUP);
  }

  // Write mock config
  const mockConfig = `
models:
  - id: test-model-1
    model_name: model1
    provider: test
    endpoint: http://localhost:${port}
    memory_gb: 1
    tags: [fast, code]
  - id: test-model-2
    model_name: model2
    provider: test
    endpoint: http://localhost:${port}
    memory_gb: 1
    tags: [fast, code]
`;
  fs.writeFileSync(CONFIG_PATH, mockConfig, 'utf8');

  // Reload registry to populate cache
  reloadRegistry();

  // Also we need to mock getAvailableMemoryGB so canLoadModel passes
  // We'll mock the child_process before calling memoryGuard... wait, we already saw this doesn't work well if already required.
  // Actually, since memoryGuard.js is required by router.js, it's already in the cache.
  // Let's just mock the child_process.exec on the cached module by using the require.cache trick,
  // or simply provide a mock that handles vm_stat.
  const childProcess = require('child_process');
  const util = require('util');
  const originalExec = childProcess.exec;
  childProcess.exec = (command, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (command === 'vm_stat') {
      const output = 'Mach Virtual Memory Statistics: (page size of 16384 bytes)\n' +
                     'Pages free:                               999999.\n' +
                     'Pages active:                             123456.\n' +
                     'Pages inactive:                           999999.\n' +
                     'Pages speculative:                        0.\n';
      if (callback) {
        callback(null, output, '');
      }
      return {};
    }
    return originalExec(command, options, callback);
  };
  childProcess.exec[util.promisify.custom] = (command, options) => {
    if (command === 'vm_stat') {
      const output = 'Mach Virtual Memory Statistics: (page size of 16384 bytes)\n' +
                     'Pages free:                               999999.\n' +
                     'Pages active:                             123456.\n' +
                     'Pages inactive:                           999999.\n' +
                     'Pages speculative:                        0.\n';
      return Promise.resolve({ stdout: output, stderr: '' });
    }
    return util.promisify(originalExec)(command, options);
  };

  const logs = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  console.log = (...args) => { logs.push(args.join(' ')); };
  console.error = (...args) => { logs.push(args.join(' ')); };

  try {
    const result = await routeRequest({
      model: 'auto',
      messages: [{ role: 'user', content: 'write a quick script' }],
      stream: false,
      options: {}
    });

    assert.ok(result.response, 'Should return a valid response');
    assert.strictEqual(result.response.choices[0].message.content, 'Success!');
    assert.strictEqual(result.meta.model_id, 'test-model-2', 'Should have fallen back to test-model-2');

    const hasFallbackLog = logs.some(log => log.includes('Fallback attempt'));
    assert.ok(hasFallbackLog, 'Should have logged a fallback attempt');

  } finally {
    // Restore mocks and close server
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    childProcess.exec = originalExec;
    server.close();

    // Restore config
    if (fs.existsSync(TEMP_BACKUP)) {
      fs.copyFileSync(TEMP_BACKUP, CONFIG_PATH);
      fs.unlinkSync(TEMP_BACKUP);
    } else {
      fs.unlinkSync(CONFIG_PATH);
    }
    reloadRegistry();
  }
});

test('Router Timeout Logic', async (t) => {
  // Start a local mock server that delays response indefinitely
  const server = http.createServer((req, res) => {
    // Do not respond to simulate a timeout
  });

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  // Backup existing config
  if (fs.existsSync(CONFIG_PATH)) {
    fs.copyFileSync(CONFIG_PATH, TEMP_BACKUP);
  }

  // Write mock config with a small timeout configuration
  const mockConfig = `
models:
  - id: timeout-model
    model_name: model-timeout
    provider: test
    endpoint: http://localhost:${port}
    memory_gb: 1
    tags: [fast]
`;
  fs.writeFileSync(CONFIG_PATH, mockConfig, 'utf8');

  // Reload registry to populate cache
  reloadRegistry();

  const childProcess = require('child_process');
  const originalExecSync = childProcess.execSync;
  childProcess.execSync = (command, options) => {
    if (command === 'vm_stat') {
      return 'Mach Virtual Memory Statistics: (page size of 16384 bytes)\n' +
             'Pages free:                               999999.\n';
    }
    return originalExecSync(command, options);
  };

  const logs = [];
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  console.log = (...args) => { logs.push(args.join(' ')); };
  console.error = (...args) => { logs.push(args.join(' ')); };

  try {
    await assert.rejects(
      routeRequest({
        model: 'auto',
        messages: [{ role: 'user', content: 'test timeout' }],
        stream: false,
        options: { timeout: 100 } // override timeout for test
      }),
      /Request timed out/
    );

    const hasErrorLog = logs.some(log => log.includes('Error with model timeout-model'));
    assert.ok(hasErrorLog, 'Should have logged an error about the model timeout');
  } finally {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    childProcess.execSync = originalExecSync;
    server.close();

    if (fs.existsSync(TEMP_BACKUP)) {
      fs.copyFileSync(TEMP_BACKUP, CONFIG_PATH);
      fs.unlinkSync(TEMP_BACKUP);
    } else {
      fs.unlinkSync(CONFIG_PATH);
    }
    reloadRegistry();
  }
});
