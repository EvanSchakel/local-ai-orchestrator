#!/usr/bin/env bash
# Installs local-ai-orchestrator as a launchctl service (auto-start on login)
set -e

PLIST_PATH="$HOME/Library/LaunchAgents/com.evanschakel.local-ai-orchestrator.plist"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN="$(which node)"
LOG_DIR="$HOME/Library/Logs/local-ai-orchestrator"

mkdir -p "$LOG_DIR"

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.evanschakel.local-ai-orchestrator</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$PROJECT_DIR/src/server.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$PROJECT_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load -w "$PLIST_PATH"

echo "✅ Service installed and started."
echo "   Logs: $LOG_DIR"
echo "   Uninstall: launchctl unload $PLIST_PATH && rm $PLIST_PATH"
