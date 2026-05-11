## 2025-05-07 - Missing Authentication and Insecure Default Binding
**Vulnerability:** The Express server lacked authentication on sensitive `/v1/` and `/api/` endpoints, allowing any user with network access to make prompt requests and view memory/benchmark stats. Furthermore, it bound to all interfaces by default (`app.listen(PORT, ...)` without a host), potentially exposing the unauthenticated API to the public internet or local network unexpectedly.
**Learning:** The project relied on the assumption that it would only be run locally and safely, failing to provide built-in defense-in-depth mechanisms for users who might expose the port over tools like Tailscale or on a shared network.
**Prevention:** Always implement basic authentication for APIs, even if intended for local use, and default to binding only to `127.0.0.1`. Allow configuration options (like an API key and bind address in a `.yaml` or `.env` file) to opt-in to broader access securely.

## 2025-05-07 - Unbounded HTTP Response Buffering (DoS/OOM Risk)
**Vulnerability:** The `src/router.js` proxy blindly buffered upstream responses into memory via string concatenation (`data += chunk`) without limits. A malicious or misconfigured upstream model could send an infinitely large response, causing the Node.js process to crash with an Out-Of-Memory (OOM) error (Denial of Service).
**Learning:** Even when making requests to "trusted" local services, never assume their responses will be well-behaved or bounded. Defense-in-depth requires explicitly capping the maximum amount of data read into memory.
**Prevention:** Always implement a `MAX_RESPONSE_SIZE` check inside `res.on('data')` when buffering HTTP responses, and use `req.destroy(new Error(...))` to forcefully close the socket if the limit is exceeded.
