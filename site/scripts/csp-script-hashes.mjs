// Prints an nginx conf.d fragment defining $csp_script_hashes: the CSP
// 'sha256-...' source for every distinct inline <script> in the built site,
// so script-src can allow them without 'unsafe-inline'. Run against the
// output of `astro build` at image build time, so any change to an inline
// script's content changes its hash too.
//
// Usage: node scripts/csp-script-hashes.mjs <dist-dir> > csp-script-hashes.conf

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = process.argv[2];
if (!dist) {
  console.error("usage: csp-script-hashes.mjs <dist-dir>");
  process.exit(2);
}

// Script types a browser executes (and so CSP governs). Data blocks such as
// application/ld+json are neither executed nor subject to script-src.
const EXECUTABLE_TYPES = new Set(["", "text/javascript", "application/javascript", "module"]);

const hashes = new Set();
for (const file of readdirSync(dist, { recursive: true })) {
  if (!file.endsWith(".html")) continue;
  const html = readFileSync(join(dist, file), "utf8");
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]*)/i)?.[1] ?? "").toLowerCase();
    if (!EXECUTABLE_TYPES.has(type)) continue;
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
}

const sources = [...hashes].sort().join(" ");
process.stdout.write(
  `# Generated at image build by site/scripts/csp-script-hashes.mjs. Do not edit.\n` +
    `map $host $csp_script_hashes {\n    default "${sources}";\n}\n`,
);
console.error(`csp-script-hashes: ${hashes.size} distinct inline script(s)`);
