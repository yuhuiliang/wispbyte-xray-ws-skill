# wispbyte-xray-ws-skill

## When to use
Someone wants a **reproducible** node on **Wispbyte**, **Velixir**, or another **Pterodactyl-style Node panel** that only exposes **public IP:port** (no TLS). Protocol: **VLESS + WebSocket plaintext** (`security=none`).

## Do
1. Copy `deploy/index.js` + `deploy/package.json`.
2. Generate fresh `UUID` (and optional custom `WS_PATH`).
3. Upload via panel Files; ensure Startup runs `node index.js`.
4. Rely on `SERVER_PORT` (then `PORT`) — do not hardcode the panel port.
5. Client: `type=ws&security=none&host=<IP>&path=<path>`.
6. E2E: real client → `generate_204=204` + exit IP/city. Scrub secrets before any public commit.

## Don't
- Don't claim TLS / XHTTP on this panel path unless you separately validate a subdomain.
- Don't commit live UUID, panel passwords, Outlook / disposable mail creds, or live sub URLs.
- Don't call datacenter exit IP "真家宽".
- Don't use this skill on Cloudflare / Zoho ZGS edges (use XHTTP siblings instead).
- Don't treat panel "Online" as success without E2E.
