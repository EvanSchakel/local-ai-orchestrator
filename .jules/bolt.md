## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.
## 2024-05-09 - KeepAlive bottleneck in Node.js Proxy
**Learning:** Node.js `http` and `https` modules do not use `keepAlive` by default. When building a proxy router that makes frequent outbound requests to local models, this creates a major bottleneck due to repeated TCP handshakes and potential ephemeral port exhaustion.
**Action:** Use a shared `http.Agent` and `https.Agent` configured with `{ keepAlive: true }` and pass it to `http(s).request(..., { agent: ... })` to pool connections and improve proxy throughput.
