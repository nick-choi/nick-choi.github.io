#!/bin/bash
# Install SilverBullet as a macOS system LaunchDaemon running as nickchoi.
# Run as nickchoi (NOT with sudo). Requires an existing SilverBullet data directory.
set -euo pipefail

LABEL='com.devcrews.silverbullet'
RUN_AS='nickchoi'
HOME_DIR='/Users/nickchoi'
PLIST="/Library/LaunchDaemons/${LABEL}.plist"
LOG_DIR="${HOME_DIR}/Library/Logs/silverbullet"
DATA_DIR="${SB_DATA_DIR:-${HOME_DIR}/silverbullet-data}"
PORT="${SB_PORT:-3001}"
BIN="${SB_BIN:-$(command -v silverbullet || true)}"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -un)" = "$RUN_AS" ] || fail "Run as ${RUN_AS} without sudo."
[ -n "$BIN" ] || fail 'silverbullet executable not found. Set SB_BIN=/absolute/path/to/silverbullet.'
case "$BIN" in /*) ;; *) fail "SB_BIN must be an absolute path: $BIN" ;; esac
[ -x "$BIN" ] || fail "SilverBullet is not executable: $BIN"
[ -d "$DATA_DIR" ] || fail "Existing data directory not found: $DATA_DIR (set SB_DATA_DIR=...)"
[ -r "$DATA_DIR" ] && [ -w "$DATA_DIR" ] || fail "Data directory must be readable and writable: $DATA_DIR"
case "$PORT" in ''|*[!0-9]*) fail "Invalid numeric port: $PORT" ;; esac
[ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || fail "Port out of range: $PORT"
# The generated file is XML: fail rather than silently corrupt paths containing XML metacharacters.
case "$BIN$DATA_DIR$LOG_DIR" in *'&'*|*'<'*|*'>'*) fail 'Paths cannot contain &, <, or > with this installer.' ;; esac
[ ! -e "$PLIST" ] || fail "Already exists: $PLIST (do not overwrite a running service)."

if /usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN | /usr/bin/grep -q .; then
  printf 'Port %s is already in use:\n' "$PORT" >&2
  /usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >&2 || true
  fail 'Stop the existing SilverBullet (or other service) before installing.'
fi

/bin/mkdir -p "$LOG_DIR"
TMP=$(/usr/bin/mktemp /tmp/silverbullet-launchd.XXXXXX)
trap '/bin/rm -f "$TMP"' EXIT

/bin/cat > "$TMP" <<PLIST_XML
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>UserName</key><string>${RUN_AS}</string>
  <key>GroupName</key><string>staff</string>
  <key>ProgramArguments</key>
  <array>
    <string>${BIN}</string>
    <string>${DATA_DIR}</string>
  </array>
  <key>WorkingDirectory</key><string>${HOME_DIR}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key><string>${HOME_DIR}</string>
    <key>PATH</key><string>/opt/homebrew/bin:${HOME_DIR}/.bun/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>SB_HOSTNAME</key><string>0.0.0.0</string>
    <key>SB_PORT</key><string>${PORT}</string>
  </dict>
  <key>StandardOutPath</key><string>${LOG_DIR}/server.log</string>
  <key>StandardErrorPath</key><string>${LOG_DIR}/server-error.log</string>
</dict>
</plist>
PLIST_XML

/usr/bin/plutil -lint "$TMP" || fail 'Generated plist failed validation.'
printf '\nInstall settings:\n  binary: %s\n  data:   %s\n  bind:   0.0.0.0:%s\n  plist:  %s\n\n' "$BIN" "$DATA_DIR" "$PORT" "$PLIST"
/usr/bin/sudo /usr/bin/install -o root -g wheel -m 644 "$TMP" "$PLIST"
/usr/bin/sudo /bin/launchctl bootstrap system "$PLIST"
printf '\nService registered. Check:\n  sudo launchctl print system/%s\n  lsof -nP -iTCP:%s -sTCP:LISTEN\n  tail -n 50 %s/server-error.log\n' "$LABEL" "$PORT" "$LOG_DIR"
