## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.
## 2026-05-13 - Missing keep-alive agents block Node HTTP proxy throughput
**Learning:** Default instantiations of `http.request` and `https.request` in high-throughput node proxies do not pool connections, causing a new TCP connection (and potentially TLS handshake) to be negotiated on every incoming proxy request. This acts as a significant bottleneck.
**Action:** Define module-level `http.Agent({ keepAlive: true })` and `https.Agent({ keepAlive: true })` and pass them into the `request` options inside proxy wrappers to reuse sockets properly.
