# Contributing to Local AI Orchestrator

First off, thank you for considering contributing to the Local AI Orchestrator! It's people like you that make the open source community such a great place to learn, inspire, and create.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## 💡 How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

1. **Check if the issue exists.** Search the existing issues to see if someone else has already reported it.
2. **Use the Bug Report template.** Provide as much detail as possible, including your environment (Node version, macOS version, models running).
3. **Include logs.** If the orchestrator crashes or behaves unexpectedly, include the terminal output or logs.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

1. **Check if the enhancement is already requested.** Search the existing issues.
2. **Use the Feature Request template.** Describe the feature you would like to see, why you need it, and how it should work.

### Pull Requests

1. **Fork the repo and create your branch from `main`.**
2. **If you've added code that should be tested, add tests.** (We use the native `node:test` runner).
3. **Ensure the test suite passes.** (`npm test`)
4. **Make sure your code lints and is properly formatted.**
5. **Issue that pull request!**

## 🛠️ Development Setup

1. **Prerequisites:**
   - macOS (Apple Silicon recommended for intended use cases)
   - Node.js v22+

2. **Installation:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/local-ai-orchestrator.git
   cd local-ai-orchestrator
   npm install
   ```

3. **Running tests:**
   ```bash
   npm test
   ```

4. **Running locally in watch mode:**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture and Code Structure

*   `src/server.js`: The main Express application and API entry points.
*   `src/router.js`: The core logic for routing prompts to the appropriate model based on task, memory, and availability.
*   `src/classifier.js`: Logic for determining the task type of a given prompt.
*   `src/memoryGuard.js`: Utilities for checking system memory pressure.
*   `src/benchmarkStore.js`: Database logic for storing and retrieving model performance metrics.
*   `src/modelRegistry.js`: Logic for loading and parsing the `config/models.yaml` configuration.

When modifying core logic, please ensure tests are updated accordingly. Avoid introducing native cloud dependencies—the goal is to keep this 100% local and lightweight!
