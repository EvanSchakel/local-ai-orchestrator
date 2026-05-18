## 2025-05-07 - Avoid array allocations for text processing
**Learning:** String `split()` followed by array iteration (e.g. `trim().split(/\s+/).length`) causes notable memory allocation pressure in the orchestrator task classifier due to the high volume of request parsing.
**Action:** Use an optimized regex loop like `/\S+/g.exec()` with a manual counter to avoid allocating temporary arrays for text analysis logic.
## 2025-05-18 - Avoid process creation overhead in loops
**Learning:** Shell commands invoked repeatedly in a loop using `util.promisify(child_process.exec)` (like `vm_stat` for memory checking) create massive process creation overhead. Also, defining helper functions inside loops or frequently called functions creates memory allocation pressure.
**Action:** Fetch required system values (like available memory) once before the loop and pass the value down. Move helper functions out of the function body and to the module scope to reuse the function reference and minimize memory allocation.
