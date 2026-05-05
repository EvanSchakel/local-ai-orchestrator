const http = require('http');
const childProcess = require('child_process');
const util = require('util');
const originalExecSync = childProcess.execSync;
const originalExec = childProcess.exec;

// Mock to simulate slow vm_stat execution (50ms)
childProcess.execSync = (command, options) => {
  if (command === 'vm_stat') {
    // Synchronous sleep
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    return 'Pages free: 1000\nPages inactive: 1000\nPages speculative: 1000\n';
  }
  return originalExecSync(command, options);
};

childProcess.exec = (command, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (command === 'vm_stat') {
    setTimeout(() => {
      callback(null, 'Pages free: 1000\nPages inactive: 1000\nPages speculative: 1000\n', '');
    }, 50);
    return {}; // Mock ChildProcess
  }
  return originalExec(command, options, callback);
};

childProcess.exec[util.promisify.custom] = (command, options) => {
  if (command === 'vm_stat') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ stdout: 'Pages free: 1000\nPages inactive: 1000\nPages speculative: 1000\n', stderr: '' });
      }, 50);
    });
  }
  return util.promisify(originalExec)(command, options);
};

const app = require('./src/server');
const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;

  const makeRequest = () => {
    return new Promise((resolve) => {
      http.get(`http://localhost:${port}/api/memory`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
    });
  };

  const start = Date.now();
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(makeRequest());
  }

  await Promise.all(promises);
  const duration = Date.now() - start;

  console.log(`Benchmark completed in ${duration}ms`);
  server.close();
  process.exit(0);
});
