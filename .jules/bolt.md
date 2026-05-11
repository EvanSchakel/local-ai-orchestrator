## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.
## 2026-05-11 - Cache available memory per request to avoid multiple vm_stat executions
**Learning:** The router previously called 'canLoadModel' sequentially for each model configuration inside a loop. Since 'canLoadModel' internally executes the shell command 'vm_stat' via 'child_process.exec' to read macOS memory, this led to multiple expensive process creations per request. Shell commands have significant process creation overhead and shouldn't be inside loops.
**Action:** Extract the shell execution out of loops. Fetch available memory once per request, and pass the cached value down to any functions requiring memory stats.
