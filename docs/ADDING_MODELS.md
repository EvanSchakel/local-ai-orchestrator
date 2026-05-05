# Adding Models to the Registry

All models are configured in `config/models.yaml`. The orchestrator hot-reloads on each request cycle (cache is invalidated when you call `npm run reload` in future versions; for now, restart the service).

## Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier used in API calls |
| `provider` | string | `ollama`, `lmstudio`, or `mlx` |
| `endpoint` | string | Base URL of the provider's HTTP server |
| `model_name` | string | Exact model name as the provider expects |
| `context_length` | integer | Maximum context window in tokens |
| `memory_gb` | float | Estimated RAM usage when loaded |
| `tags` | list | Capability tags: `code`, `math`, `reasoning`, `fast`, `writing`, `science` |

## Provider Endpoints

| Provider | Default Port | Notes |
|---|---|---|
| Ollama | `http://localhost:11434` | OpenAI-compatible via `/v1/chat/completions` |
| LM Studio | `http://localhost:1234` | Enable OpenAI server in LM Studio settings |
| MLX | `http://localhost:8081` | Start with `mlx-server` alias or `mlx_lm.server` |

## Example: Adding a New Ollama Model

```yaml
- id: phi4-mini
  provider: ollama
  endpoint: http://localhost:11434
  model_name: "phi4-mini:3.8b-q4_K_M"
  context_length: 16384
  memory_gb: 2.5
  tags: [fast, code, math]
  preferred_for: [quick, math]
  notes: "Microsoft Phi-4 Mini. Great math/code at very low memory."
```
