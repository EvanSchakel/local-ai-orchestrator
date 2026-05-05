/**
 * Core Router
 * Picks the best model for a given prompt, then proxies the request.
 */

const https = require('https');
const http = require('http');
const { classifyTask } = require('./classifier');
const { canLoadModel } = require('./memoryGuard');
const { loadRegistry } = require('./modelRegistry');

const MAX_RETRIES = 2;

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
 * Selects the best available models for the task, respecting memory constraints.
 * @param {string} taskType
 * @returns {Array<object>} array of model config objects, sorted by score descending
 */
function selectModels(taskType) {
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

  return scored;
}

// Keep selectModel for backward compatibility, returning just the top model
function selectModel(taskType) {
  const models = selectModels(taskType);
  return models.length > 0 ? models[0] : null;
}

/**
 * Proxies a chat completion request to the selected model's endpoint.
 */
async function proxyRequest(model, messages, stream, options, clientRes) {
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
        timeout: options.timeout !== undefined ? options.timeout : 300000, // default 5 minutes
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        if (stream && clientRes && isSuccess) {
          if (!clientRes.headersSent) {
            clientRes.writeHead(res.statusCode || 200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            });
          }
        }

        let data = '';
        res.on('data', chunk => {
          if (stream && clientRes && (res.statusCode >= 200 && res.statusCode < 300)) {
            clientRes.write(chunk);
          } else {
            data += chunk;
          }
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode} from ${model.id}: ${data}`));
          }

          const elapsed = Date.now() - startTime;
          if (stream) {
            if (clientRes) {
              clientRes.end();
            }
            resolve({
              response: null,
              meta: {
                model_id: model.id,
                provider: model.provider,
                task_type: null, // filled in by routeRequest
                latency_ms: elapsed,
                tokens: 0, // Streaming token counts can be more complex to parse
                timestamp: new Date().toISOString(),
              }
            });
          } else {
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
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Main entry point: classify task, select model, proxy request.
 */
async function routeRequest({ model, messages, stream, options }, clientRes) {
  // If caller specified a model ID directly (not 'auto'), find it
  const registry = loadRegistry();
  let selectedModel;

  if (model && model !== 'auto') {
    selectedModel = registry.models.find(m => m.id === model || m.model_name === model);
    if (!selectedModel) throw new Error(`Model '${model}' not found in registry`);
    return proxyRequest(selectedModel, messages, stream, options, clientRes);
  } else {
    const taskType = classifyTask(messages);
    console.log(`[router] Classified as: ${taskType}`);
    const availableModels = selectModels(taskType);

    if (availableModels.length === 0) {
      throw new Error('No model available (memory pressure or empty registry)');
    }

    let lastError = null;
    let retries = 0;

    for (const m of availableModels) {
      if (retries > MAX_RETRIES) {
        break;
      }

      try {
        if (retries === 0) {
          console.log(`[router] Selected: ${m.id} (${m.provider})`);
        } else {
          console.log(`[router] Fallback attempt (${retries}/${MAX_RETRIES}): trying ${m.id} (${m.provider})`);
        }

        const result = await proxyRequest(m, messages, stream, options, clientRes);
        result.meta.task_type = taskType;
        return result;
      } catch (err) {
        console.error(`[router] Error with model ${m.id}:`, err.message);
        lastError = err;
        retries++;
      }
    }

    throw new Error(`All suitable models failed (max retries: ${MAX_RETRIES}). Last error: ${lastError?.message}`);
  }
}

module.exports = { routeRequest, selectModel, classifyTask };
