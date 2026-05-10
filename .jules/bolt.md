## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.
## 2025-05-07 - HTTP Connection Pooling for Core Router
**Learning:** The core orchestrator acts as a high-throughput proxy to multiple backend model APIs. Without connection pooling, the application incurs significant latency overhead by repeatedly tearing down and establishing new TCP/TLS connections for every proxied request under load.
**Action:** Use shared `http.Agent` and `https.Agent` with `keepAlive: true` to maintain open sockets across multiple requests, improving response time and maximizing throughput for frequently used endpoints.
