# 🧠 Local AI Orchestrator

> **Smart prompt routing for Apple Silicon — zero cloud, zero compromise.**

Local AI Orchestrator is a lightweight, local-first AI middleware layer built specifically for M4 Mac Mini (16GB unified memory). It automatically routes your prompts to the best available local model based on task classification, real-time memory availability, and historical performance benchmarks. No API keys. No subscriptions. No data leaving your machine.

---

## 🌟 Why This Exists

Running multiple local models (Ollama, LM Studio, MLX) is powerful — but manually deciding *which model* to use for each task is slow and error-prone. Should you use `qwen3.5:9b-q8_0` for a Java debugging session? Or spin up GPT-OSS 20B for a complex physics derivation? What if memory is already at 12GB?

This orchestrator answers those questions automatically, in real time.

---

## 🗺️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User / Client                          │
│          (Terminal, AnythingLLM, VS Code Roo, API)          │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTP POST /v1/chat/completions
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              🧠 Orchestrator Gateway (port 3131)            │
│                                                             │
│   ┌────────────────┐   ┌──────────────┐  ┌──────────────┐  │
│   │ Task Classifier│   │ Memory Guard │  │  Benchmarks  │  │
│   │  (NLP + rules) │   │ (real-time)  │  │  (SQLite DB) │  │
│   └────────┬───────┘   └──────┬───────┘  └──────┬───────┘  │
│            └──────────────────┴──────────────────┘          │
│                              │                              │
│                       ┌──────▼───────┐                      │
│                       │   Router     │                      │
│                       │  (Decision)  │                      │
│                       └──────┬───────┘                      │
└──────────────────────────────┼──────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
   │    Ollama     │   │   LM Studio   │   │  MLX Server   │
   │  :11434       │   │   :1234       │   │   :8081       │
   └───────────────┘   └───────────────┘   └───────────────┘
```

---

## ⚡ Features

- **Auto Task Classification** — Detects if a prompt is: `code`, `math`, `science`, `writing`, `quick`, or `rag`
- **Memory Guard** — Reads live macOS memory pressure; blocks large model loads if < 2GB free
- **Benchmark DB** — SQLite database logs tok/s and latency per model per task type; router uses this history
- **Failover Routing** — If primary model is unavailable, cascades to next best option
- **OpenAI-Compatible API** — Drop-in replacement at `http://localhost:3131/v1`; works with AnythingLLM, Roo Code, Continue.dev
- **Web Dashboard** — Live view of active model, memory pressure, recent requests, and benchmark history
- **Tailscale Ready** — Bind to Tailscale IP to access orchestrator from MacBook Air or iPad Pro
- **Model Registry** — YAML-based config for all available models with tags, context lengths, and quant types

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22+ |
| API Gateway | Express.js |
| Task Classifier | Simple keyword/regex rules + optional local LLM fallback |
| Memory Monitor | `vm_stat` parser (macOS native) |
| Benchmark Store | SQLite (via `better-sqlite3`) |
| Dashboard | Simple HTML/JS served by Express |
| Config | YAML (`js-yaml`) |
| Process Manager | `launchctl` plist (auto-start on login) |

---

## 📦 Installation

### Prerequisites

- macOS Tahoe 26+ (Apple Silicon)
- Node.js v22+ (`brew install node`)
- At least one of: Ollama, LM Studio, or MLX server running

### Quick Start

```bash
# Clone the repo
git clone https://github.com/EvanSchakel/local-ai-orchestrator.git
cd local-ai-orchestrator

# Install dependencies
npm install

# Copy and edit config
cp config/models.example.yaml config/models.yaml
# Edit config/models.yaml to match your installed models

# Start the orchestrator
npm start

# OR run as a background service (auto-start on login)
npm run install-service
```

The gateway will be available at `http://localhost:3131/v1`.

Dashboard: `http://localhost:3131/dashboard`

---

## ⚙️ Configuration (`config/models.yaml`)

See `config/models.example.yaml` for a full example. Key fields:

```yaml
models:
  - id: qwen3.5-9b-q8
    provider: ollama
    endpoint: http://localhost:11434
    model_name: qwen3.5:9b-q8_0
    context_length: 16384
    memory_gb: 9.5
    tags: [code, math, reasoning]
    preferred_for: [code, science]
```

---

## 🗂️ Project Structure

```
local-ai-orchestrator/
├── src/
│   ├── server.js           # Express gateway entrypoint
│   ├── router.js           # Core routing decision engine
│   ├── classifier.js       # Prompt task classifier
│   ├── memoryGuard.js      # macOS memory pressure reader
│   ├── benchmarkStore.js   # SQLite read/write for benchmarks
│   ├── modelRegistry.js    # Loads and validates models.yaml
│   └── dashboard/
│       ├── index.html      # Live dashboard UI
│       └── dashboard.js    # Client-side dashboard logic
├── config/
│   ├── models.example.yaml # Example model config
│   └── orchestrator.yaml   # Global settings
├── scripts/
│   ├── install-service.sh  # launchctl plist installer
│   └── benchmark-run.sh    # Manual benchmark runner
├── data/
│   └── .gitkeep            # SQLite DB stored here at runtime
├── tests/
│   ├── classifier.test.js
│   ├── router.test.js
│   └── memoryGuard.test.js
├── docs/
│   ├── ROUTING_LOGIC.md
│   ├── ADDING_MODELS.md
│   └── TAILSCALE_SETUP.md
├── package.json
└── README.md
```

---

## 🔌 API Usage

The orchestrator exposes a standard OpenAI-compatible endpoint:

```bash
curl http://localhost:3131/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Derive the kinematics equations from Newton's second law"}]
  }'
```

Set `"model": "auto"` to let the orchestrator choose. Or specify a model ID directly to bypass routing.

---

## 📊 Routing Logic Summary

| Task Type | Primary Model | Fallback | Notes |
|---|---|---|---|
| `code` | qwen3.5:9b-q8_0 | qwen3.5:4b-q4 | Best code bench on 16GB |
| `math` | GPT-OSS 20B | qwen3.5:9b-q8_0 | If 20B fits in memory |
| `science` | GPT-OSS 20B | qwen3.5:9b-q8_0 | Physics/chem reasoning |
| `writing` | qwen3.5:4b-q4 | mlx-qwen-4b | Fast, light |
| `quick` | qwen3.5:4b-q4 | mlx-qwen-4b | < 200 token prompts |
| `rag` | qwen3.5:9b-q8_0 | qwen3.5:4b-q4 | AnythingLLM context |

Full routing logic documented in `docs/ROUTING_LOGIC.md`.

---

## 🛣️ Roadmap

- [ ] v0.1 — Core routing, memory guard, Ollama + LM Studio support
- [ ] v0.2 — SQLite benchmark tracking + dashboard
- [ ] v0.3 — MLX server support + Tailscale bind option
- [ ] v0.4 — AnythingLLM auto-config injection
- [ ] v0.5 — iOS Shortcut integration (send from iPad Pro → orchestrator)
- [ ] v1.0 — Stable release with launchctl auto-service installer

---

## 📄 License

MIT © 2026 Evan Schakel
