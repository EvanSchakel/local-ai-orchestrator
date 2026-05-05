#!/usr/bin/env bash
# Sends a standard set of test prompts to the orchestrator and prints results
ORCHESTRATOR="http://localhost:3131"

run_test() {
  local label="$1"
  local prompt="$2"
  echo -n "  [$label] ... "
  local start=$(date +%s%3N)
  curl -s -X POST "$ORCHESTRATOR/v1/chat/completions" \
    -H 'Content-Type: application/json' \
    -d "{\"model\":\"auto\",\"messages\":[{\"role\":\"user\",\"content\":\"$prompt\"}]}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'][:60] + '...')" 2>/dev/null
  local end=$(date +%s%3N)
  echo "    Elapsed: $((end-start))ms"
}

echo "🧠 Running benchmark suite..."
run_test "code"    "Write a Java method that checks if a string is a palindrome"
run_test "math"    "Integrate x^2 * sin(x) dx by parts"
run_test "science" "Explain Newton's second law and derive F=ma from first principles"
run_test "writing" "Write a professional email requesting a letter of recommendation"
run_test "quick"   "What is the capital of France?"
echo "✅ Done. Check /dashboard for benchmark history."
