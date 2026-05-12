## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.
## 2024-05-12 - Node.js Default keepAlive Behavior Causes Latency
**Learning:** Node.js `http`/`https` requests use a default global agent that disables `keepAlive` (`keepAlive: false`), causing a new TCP connection and TLS handshake for every single outbound proxy request. This is a significant bottleneck in a proxy router handling high throughput.
**Action:** Use shared module-level `http.Agent` and `https.Agent` instances configured with `{ keepAlive: true }` for outbound requests to enable connection pooling and avoid repeated handshake overhead.
