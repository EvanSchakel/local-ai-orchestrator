## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.

## 2024-05-16 - Prevent repeated process creation in loops
**Learning:** Checking system memory (`vm_stat`) repeatedly in a loop over models using `canLoadModel` creates significant overhead due to process creation for each model.
**Action:** Always hoist system metric checks out of loops when the metric won't realistically change within the loop's execution timeframe. Pass the pre-fetched metric into validation functions.
