# 🧠 Local AI Orchestrator

[![CI](https://github.com/EvanSchakel/local-ai-orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/EvanSchakel/local-ai-orchestrator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![Platform: Apple Silicon](https://img.shields.io/badge/Platform-Apple_Silicon-lightgrey.svg)](https://www.apple.com/mac/)

> **Smart prompt routing for Apple Silicon — zero cloud, zero compromise.**

Local AI Orchestrator is a lightweight, local-first AI middleware layer built specifically for M-series Mac hardware (optimized for M4, 16GB unified memory). It serves as an intelligent edge-computing gateway, automatically routing generative AI prompts to the optimal local model based on intent classification, real-time system memory, and historical benchmarking.

**Zero API keys. Zero subscriptions. Zero data exfiltration.**

---

## 🎯 Executive Summary & ROI

As organizations adopt open-source models (Llama 3, Qwen, Mistral) for local development to ensure privacy and reduce cloud inference costs, a new bottleneck emerges: **Model Orchestration.**

Running multiple local servers (Ollama, LM Studio, MLX) requires developers to manually decide which model to query, manage their machine's limited unified memory, and benchmark throughput—creating friction and degrading productivity.

**Local AI Orchestrator solves this by providing a unified, OpenAI-compatible API gateway that:**
1. **Reduces Cognitive Load:** Developers query one endpoint (`/v1/chat/completions`); the orchestrator handles the routing.
2. **Prevents System Thrashing:** Built-in macOS memory monitoring blocks large models from loading if unified memory is critically low, preventing out-of-memory (OOM) lockups.
3. **Optimizes Throughput:** Task classification routes code questions to specialized coding models and conversational queries to smaller, faster models, maximizing Tokens-per-Second (Tok/s).

---

## 🗺️ Architecture Overview

The orchestrator sits entirely on your local network (or Tailscale mesh), acting as a reverse proxy with an integrated decision engine.

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Client Applications                        │
│          (VS Code Roo, AnythingLLM, Terminal, Scripts)          │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP POST /v1/chat/completions
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              🧠 Orchestrator Gateway (Port 3131)                │
│                                                                 │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────┐   │
│   │ Task Classifier │   │  Memory Guard   │   │ Benchmarks  │   │
│   │ (NLP Regex/Rules) │   │ (macOS vm_stat) │   │ (SQLite3)   │   │
│   └────────┬────────┘   └────────┬────────┘   └──────┬──────┘   │
│            └─────────────────────┴───────────────────┘          │
│                                  │                              │
│                         ┌────────▼────────┐                     │
│                         │ Decision Router │                     │
│                         └────────┬────────┘                     │
└──────────────────────────────────┼──────────────────────────────┘
                                   │  Proxied Request
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
   │    Ollama     │       │   LM Studio   │       │  MLX Server   │
   │    (:11434)   │       │    (:1234)    │       │    (:8081)    │
   └───────────────┘       └───────────────┘       └───────────────┘
```

---

## ⚡ Core Features

- **Auto Task Classification** — Detects intent: `code`, `math`, `science`, `writing`, `quick`, or `rag`.
- **Memory Guard** — Reads live macOS memory pressure; dynamically blocks heavy model loads if free memory drops below configured thresholds (e.g., < 2GB).
- **Benchmark Database** — Embedded SQLite tracks Tok/s and latency per model and task type, allowing the router to learn and optimize.
- **Failover Routing** — Gracefully cascades to the next best model if the primary choice is unavailable.
- **OpenAI-Compatible API** — Functions as a drop-in replacement for OpenAI's `https://api.openai.com/v1`, working instantly with standard tooling.
- **Observability Dashboard** — Real-time telemetry web UI displaying active models, memory pressure, request history, and benchmarks.
- **Tailscale Ready** — Bind to your Tailscale IP to access your Mac's models securely from an iPad Pro or remote device.
- **Dynamic Registry** — YAML-based configuration (`models.yaml`) supports hot-reloading.

---

## 🛠️ Technical Stack

| Component | Technology / Library | Description |
|-----------|----------------------|-------------|
| **Runtime** | Node.js v22+ | Modern, high-performance V8 runtime |
| **Gateway** | Express.js | Lightweight HTTP routing |
| **Database** | `better-sqlite3` | Synchronous, high-performance C++ SQLite driver |
| **Config** | `js-yaml` | Human-readable model registry |
| **OS Interop**| `child_process` | Asynchronous execution of macOS `vm_stat` |

---

## 📦 Installation & Setup

### Prerequisites
- Apple Silicon Mac (M1/M2/M3/M4)
- macOS 14+ (Sonoma/Sequoia)
- Node.js v22+ (`brew install node`)
- At least one local inference server running (Ollama, LM Studio, or MLX)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/EvanSchakel/local-ai-orchestrator.git
cd local-ai-orchestrator

# 2. Install dependencies
npm install

# 3. Configure your models
cp config/models.example.yaml config/models.yaml
# (Edit config/models.yaml to map to your installed models)

# 4. Start the server
npm start
```

### Access Points
- **API Endpoint:** `http://localhost:3131/v1/chat/completions`
- **Dashboard UI:** `http://localhost:3131/dashboard`

*(To install as a background service that starts on login, run `npm run install-service`)*

---

## 🔌 Integration Examples

### cURL

```bash
curl http://localhost:3131/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Write a Python script to scrape a website."}]
  }'
```
*(Setting `"model": "auto"` engages the Orchestrator's decision engine. You can also specify a direct model ID to bypass routing.)*

### VS Code (Roo Code / Continue.dev)
Configure your extension to use an "OpenAI Compatible" provider:
- **Base URL:** `http://localhost:3131/v1`
- **API Key:** `sk-local` (or any string)
- **Model:** `auto`

---

## 📊 Routing Logic At-a-Glance

| Task Classification | Primary Model Strategy | Fallback Strategy | Rationale |
|---------------------|------------------------|-------------------|-----------|
| `code` | Heavy/Capable (e.g. Qwen 9B) | Light Code (e.g. Qwen 4B) | Maximize logic accuracy. |
| `math` / `science` | Max Reasoning (e.g. GPT-OSS 20B) | Heavy/Capable | Requires deep context; slow but accurate. |
| `writing` / `quick` | Small/Fast (e.g. 4B Quants) | MLX native | Maximize Tok/s for conversational UX. |
| `rag` | High Context | - | Routes based on context window size. |

*For deep dives into the routing algorithms and configuration, see the [Documentation Directory](docs/).*

---

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
