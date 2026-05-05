# Routing Logic

## How the Router Decides

The router uses a three-step decision pipeline:

### Step 1 — Task Classification

The prompt (specifically the user-role messages) is analyzed by `classifier.js` using a set of keyword/pattern rules. The system message length is also checked: if it's longer than 800 characters, the request is assumed to come from a RAG context (AnythingLLM) and classified as `rag`.

**Task types:**
- `code` — programming, debugging, file types, language keywords
- `math` — calculus, algebra, equations, proofs
- `science` — physics, chemistry, biology, scientific terms
- `writing` — drafting, summarizing, essays, emails
- `quick` — fewer than 12 words, simple lookups
- `rag` — large system message context injection

### Step 2 — Model Scoring

Each model in `config/models.yaml` has a `tags` array (e.g., `[code, math, reasoning, fast]`). The router maps each task type to an ordered list of preferred tags:

```
code    → [code, reasoning, fast]
math    → [math, reasoning, code]
science → [reasoning, math, code]
writing → [fast, code]
quick   → [fast, code]
rag     → [code, reasoning, fast]
```

Models are scored by how many of their tags match the preferred tag list, weighted by position (earlier tags = higher weight). Only models that pass the Memory Guard check are eligible.

### Step 3 — Memory Guard

Before a model is considered, `memoryGuard.js` calls `vm_stat` to read live macOS page statistics. A model is blocked if:

```
available_GB < model.memory_gb + buffer_gb
```

The default buffer is 1.5 GB. This prevents swap thrashing which would make responses extremely slow on a 16GB machine.

## Failover

If the top-scored model's HTTP request fails, the router does not yet automatically retry with the next model (this is planned for v0.2). For now, an error is returned to the client.

## Bypassing Auto-Routing

Set `"model": "<model_id>"` in your request instead of `"auto"` to target a specific model directly, bypassing classification entirely.
