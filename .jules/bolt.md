## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.

## 2025-05-15 - Optimize memory fetching to avoid process creation bottleneck
**Learning:** Fetching memory stats via `vm_stat` inside a loop spawns multiple child processes, which leads to significant process creation overhead when iterating through many registered models during the routing selection phase.
**Action:** Pre-calculate system metrics (like available memory) once per request and pass them down as arguments to validation functions like `canLoadModel()` to prevent redundant child process spawning inside loops.
