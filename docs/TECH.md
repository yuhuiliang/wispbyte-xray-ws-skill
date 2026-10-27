# Scrubbed platform notes (Wispbyte / Velixir-style)

Date reference: 2026-10-27 (Asia/Shanghai). Live secrets intentionally omitted.

## Panel model
- Free tier example: 512 MB RAM / 1 GB disk, €0, no card.
- Allocates one **public IP + port**; no customer domain / TLS on the verified path.
- Keepalive: often **login every 14 days**.
- Files web UI upload; Startup sets image / `JS_FILE` / env; Node runs `node <JS_FILE>`.
- No SSH; SFTP may be paid.
- Wispbyte quirk: **reward ad** before Start.

## Why runtime-download
- Image may lack `unzip` / `python` / preinstalled xray.
- Pure Node ZIP+deflate extract of official `Xray-linux-64.zip` is enough.
- Prefer `SERVER_PORT` then `PORT` (Pterodactyl injects `SERVER_PORT`).

## Acceptance bar
- Console Online ≠ done.
- Foreign real client: SOCKS → `generate_204` HTTP 204 + ipinfo city/ASN matching the panel IP.

## Known ops pitfalls
- Cloudflare human-check on signup: after two failures in one browser profile, switch profile/environment.
- Disposable mailbox verify links may land in Junk.
- Panel transient 503 / “Something went wrong”: refresh; do not assume deploy failure.
- First boot needs outbound HTTPS to GitHub releases (or set `XRAY_ZIP_URL` to a mirror).

## Not validated here
- Beta subdomain / free TLS on Wispbyte.
- China mobile 5G long-term stability of plaintext WS.
