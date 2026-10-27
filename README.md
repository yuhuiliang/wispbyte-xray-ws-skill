# Wispbyte / Velixir · VLESS + WS（明文）一键复刻

> Pterodactyl-style free Node panels that only give you **IP:port** (no TLS):  
> `VLESS + WebSocket` (`security=none`) → Shadowrocket / v2rayN / Xray.

**English:** Upload two files (`deploy/index.js` + `deploy/package.json`). The launcher **runtime-downloads** a pinned Xray-core zip, extracts `xray` with a **pure-Node ZIP+deflate** reader (no `unzip`/`python`), then listens on `SERVER_PORT` (Wispbyte / Pterodactyl) or `PORT`. Verified on **Wispbyte RO** (2026-10-27 Asia/Shanghai): box E2E `generate_204=204`, exit Bacău `78.154.103.9` AS210718. Same wrapper pattern previously worked on **Velixir**.

Sibling skills (freedom / no-walls):

- [zoho-catalyst-appsail-xhttp-skill](https://github.com/free-dam-man/zoho-catalyst-appsail-xhttp-skill) — Zoho AppSail · XHTTP + TLS · `alpn=http/1.1`
- [light-cloud-xhttp-skill](https://github.com/free-dam-man/light-cloud-xhttp-skill) — Light Cloud · XHTTP + TLS · `alpn=h2`
- [homeline-residential-exit-skill](https://github.com/free-dam-man/homeline-residential-exit-skill) — VPS Mihomo 真家宽（更稳）
- [cf-sstp-home-broadband-skill](https://github.com/free-dam-man/cf-sstp-home-broadband-skill) — CF Worker MS-SSTP 免 VPS 家宽（更飘）

---

## 为什么是明文 WS / Why plaintext WS

| Platform trait | Consequence |
|---|---|
| Panel assigns **public IP + one port**, no domain / no TLS cert | Client must use `security=none` + `type=ws` |
| Optional beta subdomain (if any) | Not used in the verified Wispbyte path; try later if you want TLS |
| Cloudflare / ZGS in front | **Do not** use this skill — use Zoho / Light Cloud **XHTTP** siblings |

Xray 26.x already **deprecates WS**; this skill keeps WS because the panel has no TLS edge. Prefer XHTTP+TLS siblings for daily China entry; treat Wispbyte as a **spare**.

---

## 架构 / Architecture

```text
Shadowrocket / v2rayN / sing-box / Xray
   │  VLESS + WS  security=none  path=/…  host=<server-ip>
   ▼
Wispbyte / Velixir / similar (Pterodactyl Node)
   └─ node index.js
        ├─ download Xray-linux-64.zip (pinned; retries)
        ├─ inflate `xray` (pure JS)
        └─ xray listen 0.0.0.0:$SERVER_PORT
             └─ exit = panel server IP (datacenter, not 真家宽)
```

---

## 快速复刻 / Reproduce

1. **Register** Wispbyte (or Velixir / similar). Free tier: often **512 MB / 1 GB**, no card. Expect **14-day panel login** keepalive and (on Wispbyte) a **reward ad** before Start.
2. Create a **Node.js** server; note the panel **Address** `IP:PORT`.
3. Upload `deploy/index.js` + `deploy/package.json` via Files.
4. Startup: JS file = `index.js` (default). Confirm start ends with `node …/index.js`.
5. Set env (panel Startup → variables), **never commit live values**:

| Env | Example | Notes |
|---|---|---|
| `UUID` | fresh UUIDv4 | **required** for real use |
| `WS_PATH` | `/my-rail` | default in code is `/tk-rail` |
| `SERVER_PORT` | panel-injected | do not hardcode; wrapper already prefers `SERVER_PORT` then `PORT` |
| `XRAY_ZIP_URL` | optional | pin/override release zip |

6. Start (watch ad if prompted). Console should show roughly:
   - `downloading xray-core, attempt 1`
   - `xray extracted, bytes: …`
   - `starting xray on port <PORT> path <PATH>`
   - `Xray … (Xray, Penetrates Everything.)`
7. **Client URL**:

```text
vless://<UUID>@<IP>:<PORT>?encryption=none&security=none&type=ws&host=<IP>&path=<urlencoded path>#Wispbyte-RO
```

Helper: `scripts/make_vless_url.sh`

8. **Verify** with a real client → SOCKS → `https://www.gstatic.com/generate_204` expect **204**, then check exit city/IP. Panel “Online” alone is **not** acceptance.

---

## 仓库内容 / Layout

```text
deploy/index.js      # runtime-download + VLESS/WS launcher
deploy/package.json  # no third-party deps
scripts/             # URL helper
docs/TECH.md         # scrubbed platform notes
SKILL.md             # agent skill brief
LICENSE              # MIT
```

Defaults use **placeholders** (`CHANGE_ME` UUID). Rotate UUID/path per deploy. Never publish live credentials, panel passwords, or Outlook accounts.

---

## 诚实限制 / Honest limits

- **Plaintext WS** — weak camouflage on the phone→server hop; HTTPS sites still encrypt content. China 5G / ISP DPI may block or throttle. Spare node, not daily driver.
- **14-day login** — free tier may archive if you never open the panel.
- **Start ads** (Wispbyte) — Venatus reward ad before Start / often again on restart.
- **512 MB / 1 GB** — fine for light traffic; first boot downloads ~20 MB zip and extracts ~34 MB `xray` (cached afterward).
- **Exit IP = panel IP** — datacenter; if blocked by a target site, rebuild for a new IP.
- **WS deprecated** in modern Xray — migrate to TLS+XHTTP platforms when you can.
- Optional **beta subdomain / TLS** on some panels was **not** validated here — experiment separately.

---

## One-liner 口令 / Agent prompt

```text
照 https://github.com/free-dam-man/wispbyte-xray-ws-skill 在 Wispbyte（或同类只给 IP:端口 的 Pterodactyl Node 面板）一键复刻 VLESS+WS 明文节点：上传 deploy/，设 UUID+WS_PATH，认 SERVER_PORT，E2E generate_204 后再交付订阅；不要提交真实 UUID/面板账密。
```

---

## License

MIT — copy, fork, teach. Freedom / no-walls.
