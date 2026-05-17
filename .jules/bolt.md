## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.## 2025-05-17 - Avoid process creation overhead in loops
**Learning:** Calling `vm_stat` via shell execution (`child_process.exec`) inside a loop over model configurations in `selectModels` creates significant repeated overhead for every request.
**Action:** Fetch the system reading once before the loop per request and pass the result to helper functions to avoid unnecessary repeated shell invocations.
