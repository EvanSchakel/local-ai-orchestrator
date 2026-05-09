## 2025-05-07 - Missing Authentication and Insecure Default Binding
**Vulnerability:** The Express server lacked authentication on sensitive `/v1/` and `/api/` endpoints, allowing any user with network access to make prompt requests and view memory/benchmark stats. Furthermore, it bound to all interfaces by default (`app.listen(PORT, ...)` without a host), potentially exposing the unauthenticated API to the public internet or local network unexpectedly.
**Learning:** The project relied on the assumption that it would only be run locally and safely, failing to provide built-in defense-in-depth mechanisms for users who might expose the port over tools like Tailscale or on a shared network.
**Prevention:** Always implement basic authentication for APIs, even if intended for local use, and default to binding only to `127.0.0.1`. Allow configuration options (like an API key and bind address in a `.yaml` or `.env` file) to opt-in to broader access securely.

## 2026-05-09 - Unbounded Response Buffering (OOM Risk)
**Vulnerability:** The core router (`src/router.js`) proxy request handler accumulated incoming response data from the selected model without limits. A malicious or buggy model could stream a massive payload, leading to process out-of-memory (OOM) and causing a denial-of-service (DoS).
**Learning:** Proxy implementations need strict boundaries on the resources they consume while relaying data. Even if the models are trusted locally, bugs or unexpected states can still cause unbounded streams.
**Prevention:** Always implement bounded buffers and enforce strict maximum sizes (e.g., `MAX_RESPONSE_SIZE = 50MB`) when consuming streams from external or internal dependencies, gracefully destroying the stream if limits are exceeded.
