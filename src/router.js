/**
 * Core Router
 * Picks the best model for a given prompt, then proxies the request.
 */

const https = require('https');
const http = require('http');
const { classifyTask } = require('./classifier');
const { canLoadModel } = require('./memoryGuard');
const { loadRegistry } = require('./modelRegistry');

// Task → ordered list of model tags to prefer
const TASK_ROUTING = {
  code:    ['code', 'reasoning', 'fast'],
  math:    ['math', 'reasoning', 'code'],
  science: ['reasoning', 'math', 'code'],
  writing: ['fast', 'code'],
  quick:   ['fast', 'code'],
  rag:     ['code', 'reasoning', 'fast'],
};

/**
 * Selects the best available model for the task, respecting memory constraints.
 * @param {string} taskType
 * @returns {object|null} model config object
 */
function selectModel(taskType) {
  const registry = loadRegistry();
  const preferredTags = TASK_ROUTING[taskType] || ['fast'];

  // Score models: higher score = more preferred tags matched, in order
  const scored = registry.models
    .filter(m => canLoadModel(m.memory_gb))
    .map(m => {
      const score = preferredTags.reduce((acc, tag, idx) => {
        if (m.tags?.includes(tag)) acc += (preferredTags.length - idx);
        return acc;
      }, 0);
      return { ...m, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0] || null;
}

/**
 * Proxies a chat completion request to the selected model's endpoint.
 */
async function proxyRequest(model, messages, stream, options) {
  const url = new URL(`${model.endpoint}/v1/chat/completions`);
  const body = JSON.stringify({
    model: model.model_name,
    messages,
    stream: stream || false,
    ...options,
  });

  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    const req = lib.request(
      { hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          const elapsed = Date.now() - startTime;
          try {
            const parsed = JSON.parse(data);
            resolve({
              response: parsed,
              meta: {
                model_id: model.id,
                provider: model.provider,
                task_type: null, // filled in by routeRequest
                latency_ms: elapsed,
                tokens: parsed.usage?.completion_tokens || 0,
                timestamp: new Date().toISOString(),
              }
            });
          } catch (e) {
            reject(new Error(`Failed to parse response from ${model.id}: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Main entry point: classify task, select model, proxy request.
 */
async function routeRequest({ model, messages, stream, options }) {
  // If caller specified a model ID directly (not 'auto'), find it
  const registry = loadRegistry();
  let selectedModel;

  if (model && model !== 'auto') {
    selectedModel = registry.models.find(m => m.id === model || m.model_name === model);
    if (!selectedModel) throw new Error(`Model '${model}' not found in registry`);
  } else {
    const taskType = classifyTask(messages);
    console.log(`[router] Classified as: ${taskType}`);
    selectedModel = selectModel(taskType);
    if (!selectedModel) throw new Error('No model available (memory pressure or empty registry)');
    console.log(`[router] Selected: ${selectedModel.id} (${selectedModel.provider})`);

    const result = await proxyRequest(selectedModel, messages, stream, options);
    result.meta.task_type = taskType;
    return result;
  }

  return proxyRequest(selectedModel, messages, stream, options);
}

module.exports = { routeRequest, selectModel, classifyTask };
