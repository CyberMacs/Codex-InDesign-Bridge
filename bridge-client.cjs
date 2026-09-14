#!/usr/bin/env node
"use strict";
// Codex InDesign Bridge 0.3.0. No third-party dependencies.
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { validate, VERSION } = require("./CodexInDesignBridge/protocol.js");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function readJSON(file) { return JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, "")); }
async function send(root, operations, waitMs = 25000) {
  root = path.resolve(root);
  const state = await readJSON(path.join(root, "status.json"));
  if (state.protocol !== 1 || state.version !== VERSION) throw new Error("Bridge version mismatch: client " + VERSION + ", panel " + (state.version || "unknown") + ". Load matching panel.");
  if (!state.active || !Number.isFinite(state.updatedAt) || Math.abs(Date.now() - state.updatedAt) > 15000) throw new Error("Nincs élő Bridge-kapcsolat. Az InDesign panelen válaszd ki a Bridge mappát és indítsd el.");
  const id = randomUUID();
  const request = { protocol: 1, id, session: state.session, expiresAt: Date.now() + 120000, operations };
  validate(request, state.session, Date.now());
  const lockPath = path.join(root, "client.lock");
  let lock;
  try { lock = await fs.open(lockPath, "wx"); }
  catch (error) { throw new Error("Másik parancsküldő fut vagy maradt client.lock. Ellenőrizd a folyamatot és a kérés eredményét; ne küldd újra vakon. " + error.code); }
  let result;
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, id }));
    const output = path.join(root, "Responses", id + ".json");
    const target = path.join(root, "Requests", id + ".json");
    const temporary = path.join(root, "Requests", id + ".tmp");
    await fs.writeFile(temporary, JSON.stringify(request), { encoding: "utf8", flag: "wx" });
    await fs.rename(temporary, target);
    const end = Date.now() + waitMs;
    while (Date.now() < end) {
      try { result = await readJSON(output); break; }
      catch (error) { if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error; }
      await sleep(250);
    }
    if (!result) result = { ok: false, pending: true, id, responseFile: output, message: "Nincs még válasz. A kérés végrehajtódhatott vagy még várakozik. Ugyanezt az eredményfájlt ellenőrizd; ne ismételd meg a módosítást." };
    return result;
  } finally { await lock.close(); await fs.unlink(lockPath); }
}
async function main() {
  const [root, command, file] = process.argv.slice(2);
  if (!root || !command) throw new Error("Használat: node bridge-client.cjs <Bridge mappa> ping|list|status|send <operations.json>");
  if (command === "status") { console.log(JSON.stringify(await readJSON(path.join(root, "status.json")), null, 2)); return; }
  let operations;
  if (command === "ping") operations = [{ op: "ping" }];
  else if (command === "list") operations = [{ op: "listDocuments" }];
  else if (command === "send" && file) operations = await readJSON(file);
  else throw new Error("Ismeretlen parancs.");
  const result = await send(root, operations);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = result.pending ? 2 : 1;
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { send, readJSON };
