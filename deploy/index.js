#!/usr/bin/env node
/**
 * Wispbyte / Velixir / Pterodactyl-style Node panels · VLESS + WebSocket launcher
 *
 * Platform gives a raw public IP:port (often no TLS / no custom domain).
 * This launcher:
 *   1) downloads a pinned Xray-core linux-64 zip from GitHub (retryable)
 *   2) extracts `xray` with a minimal ZIP+deflate reader (no system unzip/python)
 *   3) writes config from env and spawns xray on the panel port
 *
 * Env:
 *   SERVER_PORT | PORT   listen port (Pterodactyl injects SERVER_PORT)
 *   UUID                 VLESS id — set a fresh UUIDv4 per deploy (default CHANGE_ME)
 *   WS_PATH              WebSocket path (default /tk-rail)
 *   XRAY_ZIP_URL         override release zip URL
 *   XRAY_LOGLEVEL        default warning
 *
 * Honest limit: plaintext WS (security=none). Prefer TLS siblings (Zoho/Light Cloud
 * XHTTP skills) for China entry; treat this as a spare / lab node.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { spawn } = require('child_process');

const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 8080);
const UUID = process.env.UUID || 'CHANGE_ME';
const RAW_PATH = process.env.WS_PATH || '/tk-rail';
const WS_PATH = RAW_PATH.startsWith('/') ? RAW_PATH : `/${RAW_PATH}`;

const HERE = __dirname;
const XRAY_BIN = path.join(HERE, 'xray');
const CONFIG_PATH = path.join(HERE, 'xray-config.json');
const ZIP_PATH = path.join(HERE, 'xray-download.zip');

const XRAY_ZIP_URL =
  process.env.XRAY_ZIP_URL ||
  'https://github.com/XTLS/Xray-core/releases/download/v26.10.21/Xray-linux-64.zip';

function die(msg) {
  console.error(`[wispbyte-ws] FATAL: ${msg}`);
  process.exit(1);
}

function buildConfig() {
  return {
    log: { loglevel: process.env.XRAY_LOGLEVEL || 'warning' },
    inbounds: [
      {
        listen: '0.0.0.0',
        port: PORT,
        protocol: 'vless',
        settings: {
          clients: [{ id: UUID, email: 'wispbyte-ws' }],
          decryption: 'none',
        },
        streamSettings: {
          network: 'ws',
          security: 'none',
          wsSettings: {
            path: WS_PATH,
          },
        },
        sniffing: {
          enabled: true,
          destOverride: ['http', 'tls', 'quic'],
        },
      },
    ],
    outbounds: [
      { protocol: 'freedom', tag: 'direct' },
      { protocol: 'blackhole', tag: 'block' },
    ],
  };
}

function fetchToFile(url, dest, redirectsLeft) {
  const left = redirectsLeft == null ? 5 : redirectsLeft;
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(
      url,
      {
        timeout: 120000,
        headers: { 'User-Agent': 'wispbyte-xray-ws-skill/1.0' },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (left <= 0) return reject(new Error('too many redirects'));
          return fetchToFile(res.headers.location, dest, left - 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`download HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const out = fs.createWriteStream(dest);
        res.pipe(out);
        out.on('finish', () => out.close(resolve));
        out.on('error', reject);
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('download timeout')));
  });
}

/** Minimal ZIP reader: find local-file entry named `xray` (basename match) and inflate. */
function extractXrayFromZip(zipBuf, destPath) {
  const sig = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04
  let offset = 0;
  while (offset + 30 <= zipBuf.length) {
    const i = zipBuf.indexOf(sig, offset);
    if (i < 0) break;
    const compression = zipBuf.readUInt16LE(i + 8);
    const compSize = zipBuf.readUInt32LE(i + 18);
    const uncompSize = zipBuf.readUInt32LE(i + 22);
    const nameLen = zipBuf.readUInt16LE(i + 26);
    const extraLen = zipBuf.readUInt16LE(i + 28);
    const nameStart = i + 30;
    const nameEnd = nameStart + nameLen;
    if (nameEnd + extraLen + compSize > zipBuf.length) {
      offset = i + 4;
      continue;
    }
    const name = zipBuf.slice(nameStart, nameEnd).toString('utf8');
    const dataStart = nameEnd + extraLen;
    const dataEnd = dataStart + compSize;
    const base = name.split('/').pop();
    if (base === 'xray') {
      const compressed = zipBuf.slice(dataStart, dataEnd);
      let raw;
      if (compression === 0) {
        raw = compressed;
      } else if (compression === 8) {
        raw = zlib.inflateRawSync(compressed);
      } else {
        throw new Error(`unsupported ZIP compression ${compression} for ${name}`);
      }
      if (uncompSize && raw.length !== uncompSize) {
        // allow mismatch only if uncompSize was 0 (zip64 / unset); otherwise warn
        if (uncompSize > 0 && Math.abs(raw.length - uncompSize) > 0) {
          console.warn(
            `[wispbyte-ws] size note: inflated=${raw.length} header=${uncompSize} for ${name}`
          );
        }
      }
      fs.writeFileSync(destPath, raw);
      fs.chmodSync(destPath, 0o755);
      return raw.length;
    }
    offset = dataEnd;
  }
  throw new Error('xray entry not found in zip');
}

async function downloadWithRetry(url, dest, attempts) {
  let last;
  for (let n = 1; n <= attempts; n++) {
    try {
      console.log(`downloading xray-core, attempt ${n}`);
      await fetchToFile(url, dest);
      return;
    } catch (e) {
      last = e;
      console.error(`[wispbyte-ws] download failed attempt ${n}: ${e.message}`);
      try {
        fs.unlinkSync(dest);
      } catch (_) {}
    }
  }
  throw last || new Error('download failed');
}

async function ensureXray() {
  if (fs.existsSync(XRAY_BIN)) {
    try {
      fs.chmodSync(XRAY_BIN, 0o755);
    } catch (_) {}
    const st = fs.statSync(XRAY_BIN);
    if (st.size > 1_000_000) {
      console.log(`[wispbyte-ws] reusing cached xray, bytes: ${st.size}`);
      return;
    }
  }

  await downloadWithRetry(XRAY_ZIP_URL, ZIP_PATH, 3);
  const zipBuf = fs.readFileSync(ZIP_PATH);
  const bytes = extractXrayFromZip(zipBuf, XRAY_BIN);
  console.log(`xray extracted, bytes: ${bytes}`);
  try {
    fs.unlinkSync(ZIP_PATH);
  } catch (_) {}
}

async function main() {
  if (!UUID || UUID === 'CHANGE_ME') {
    console.warn('[wispbyte-ws] WARNING: UUID is still CHANGE_ME — set env UUID before real use');
  }
  if (!Number.isFinite(PORT) || PORT <= 0) {
    die(`invalid PORT/SERVER_PORT: ${process.env.SERVER_PORT || process.env.PORT}`);
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(buildConfig(), null, 2));
  console.log(`starting xray on port ${PORT} path ${WS_PATH}`);

  await ensureXray();

  const child = spawn(XRAY_BIN, ['run', '-c', CONFIG_PATH], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    console.error(`[wispbyte-ws] xray exited code=${code} signal=${signal}`);
    process.exit(code || 1);
  });

  process.on('SIGTERM', () => child.kill('SIGTERM'));
  process.on('SIGINT', () => child.kill('SIGINT'));
}

main().catch((err) => die(err.stack || err.message));
