#!/usr/bin/env bash
# Build a plaintext VLESS+WS share URL (no secrets committed).
set -euo pipefail
: "${UUID:?set UUID}"
: "${IP:?set IP}"
: "${PORT:?set PORT}"
PATH_WS="${WS_PATH:-/tk-rail}"
NAME="${NAME:-Wispbyte-RO}"
# urlencode path
ENC_PATH=$(python3 -c 'import urllib.parse,os; print(urllib.parse.quote(os.environ["P"], safe=""))' P="$PATH_WS")
echo "vless://${UUID}@${IP}:${PORT}?encryption=none&security=none&type=ws&host=${IP}&path=${ENC_PATH}#${NAME}"
