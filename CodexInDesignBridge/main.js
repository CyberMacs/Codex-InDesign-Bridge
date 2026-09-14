"use strict";
const { entrypoints, storage } = require("uxp");
const indesign = require("indesign");
const { VERSION, validate } = require("./protocol.js");
const { createExecutor } = require("./operations.js");
const fs = storage.localFileSystem;
let root = null, dirs = null, timer = null, active = false, busy = false, session = "", run = null;
function log(message) {
  document.getElementById("status").textContent = message;
  const box = document.getElementById("log");
  box.value = (new Date().toLocaleTimeString() + " " + message + "\n" + box.value).slice(0, 6000);
}
async function jsonFile(folder, name, data) {
  const f = await folder.createFile(name, { overwrite: true });
  await f.write(JSON.stringify(data, null, 2));
}
async function status() {
  if (root) await jsonFile(root, "status.json", { protocol: 1, version: VERSION, active, session, updatedAt: Date.now(), host: String(indesign.app.version) });
}
async function folder(parent, name) {
  const entries = await parent.getEntries();
  const found = entries.find(e => e.name === name);
  if (found) { if (!found.isFolder) throw new Error(name + " nem könyvtár."); return found; }
  return parent.createFolder(name);
}
async function choose() {
  if (active || busy) throw new Error("Előbb állítsd le a kapcsolatot, és várd meg a művelet végét.");
  const selected = await fs.getFolder();
  if (!selected) return;
  root = selected;
  dirs = { root, requests: await folder(root, "Requests"), responses: await folder(root, "Responses"), claims: await folder(root, "Claims"), assets: await folder(root, "Assets"), output: await folder(root, "Output") };
  run = createExecutor(indesign, dirs);
  document.getElementById("path").textContent = root.nativePath;
  log("Mappa kiválasztva. Indítható.");
}
async function tick() {
  if (!active || busy) return;
  busy = true;
  try {
    await status();
    const responses = new Set((await dirs.responses.getEntries()).map(e => e.name));
    const claims = new Set((await dirs.claims.getEntries()).map(e => e.name));
    const files = (await dirs.requests.getEntries()).filter(e => e.isFile && /^[a-f0-9-]{36}\.json$/.test(e.name)).sort((a,b) => a.name.localeCompare(b.name));
    for (const file of files) {
      if (!active) break;
      if (responses.has(file.name) || claims.has(file.name)) continue;
      let request;
      try {
        const raw = await file.read();
        if (raw.length > 1000000) throw new Error("A kérés túl nagy.");
        request = validate(JSON.parse(raw), session, Date.now());
        if (file.name !== request.id + ".json") throw new Error("Eltérő fájlnév és kérésazonosító.");
      } catch (error) {
        await jsonFile(dirs.responses, file.name, { ok: false, phase: "validation", error: String(error.message || error) });
        continue;
      }
      // Durable claim BEFORE any DOM mutation. Never replay uncertain requests after restart.
      const claim = await dirs.claims.createFile(file.name, { overwrite: false });
      await claim.write(JSON.stringify({ id: request.id, session, startedAt: Date.now() }));
      const results = [], ctx = { refs: Object.create(null) };
      let error = null;
      for (const op of request.operations) {
        if (!active) { error = "A kapcsolat leállt; a hátralévő műveletek kimaradtak."; break; }
        try { results.push(await run(op, ctx)); }
        catch (e) { error = String(e.message || e); break; }
      }
      await jsonFile(dirs.responses, file.name, { id: request.id, ok: !error, version: VERSION, results, documentId: ctx.documentId, error, failedOperation: error ? results.length : null, partialChangesPossible: !!error, finishedAt: Date.now() });
      log(error ? "Hiba: " + error : "Kész: " + results.length + " művelet.");
      break;
    }
  } catch (error) { active = false; clearInterval(timer); log("Kapcsolat megállt: " + (error.message || error)); }
  finally { busy = false; try { await status(); } catch (_) {} }
}
async function start() {
  if (!dirs) throw new Error("Válaszd ki a projekt Bridge mappáját.");
  if (busy) throw new Error("Még folyamatban van egy művelet.");
  if (active) return;
  session = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  active = true;
  try { await status(); } catch (error) { active = false; throw error; }
  timer = setInterval(tick, 1000);
  log("Aktív – a Codex csatlakozhat.");
}
async function stop() { active = false; clearInterval(timer); await status(); log("Leállítva."); }
function bind() {
  for (const [id, fn] of [["choose", choose], ["start", start], ["stop", stop]]) {
    document.getElementById(id).onclick = () => Promise.resolve().then(fn).catch(e => log("Hiba: " + (e.message || e)));
  }
}
entrypoints.setup({ panels: { bridgePanel: { create() { bind(); }, destroy() { active = false; clearInterval(timer); } } } });
bind();
