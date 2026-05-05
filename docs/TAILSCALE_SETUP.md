# Tailscale Setup for Remote Access

The orchestrator can be exposed over your Tailscale mesh so your MacBook Air and iPad Pro can route prompts to your Mac Mini without touching the public internet.

## 1. Get Your Mac Mini's Tailscale IP

```bash
tailscale ip -4
# e.g., 100.x.x.x
```

## 2. Update orchestrator.yaml

Change `bind_address` in `config/orchestrator.yaml`:

```yaml
server:
  port: 3131
  bind_address: "100.x.x.x"  # your Tailscale IP
```

Restart the orchestrator. The gateway will now also listen on your Tailscale IP.

## 3. Connect from MacBook Air

On your MacBook Air, use the Mac Mini's Tailscale IP as the base URL in any OpenAI-compatible client:

```bash
curl http://100.x.x.x:3131/v1/chat/completions ...
```

Or configure AnythingLLM / LM Studio / Continue.dev to point to `http://100.x.x.x:3131`.

## 4. iPad Pro (via Möbius Sync)

For iOS apps that support custom OpenAI endpoints (e.g., Enchanted, OpenCat), enter:
```
Base URL: http://100.x.x.x:3131/v1
API Key:  any-value (not validated)
```

> ⚠️ Do NOT open port 3131 on your router. Tailscale provides the secure tunnel. The orchestrator is not hardened for public internet exposure.
