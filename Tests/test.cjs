"use strict";
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { validate, basename, bounds, VERSION } = require("../CodexInDesignBridge/protocol.js");
const { send } = require("../bridge-client.cjs");
const make = () => ({ protocol: 1, id: randomUUID(), session: "s", expiresAt: Date.now() + 60000, operations: [{ op: "ping" }] });
test("reject arbitrary code and validate entire batch before execution", () => {
  const q = make(); q.operations.push({ op: "eval", code: "app.quit()" });
  assert.throws(() => validate(q, "s", Date.now()), /Nem támogatott/);
});
test("reject stale session and expired requests", () => {
  assert.throws(() => validate(make(), "new-session", Date.now()), /Lejárt kapcsolat/);
  const q = make(); q.expiresAt = Date.now() - 1;
  assert.throws(() => validate(q, "s", Date.now()), /Lejárt/);
});
test("reject traversal, device files and absolute filenames", () => {
  for (const name of ["../x.png", "C:\\x.png", "folder/x.png", "CON.png", "a..png", "x:foo"]) assert.throws(() => basename(name));
  assert.equal(basename("photo-01.png"), "photo-01.png");
});
test("bounds preserve explicit mm and reject inverted or nonfinite values", () => {
  assert.deepEqual(bounds([0, 10, 20, 30]), ["0 mm", "10 mm", "20 mm", "30 mm"]);
  assert.throws(() => bounds([10, 0, 5, 20]));
  assert.throws(() => bounds([0, NaN, 5, 20]));
});
test("reject oversized batch", () => {
  const q = make(); q.operations = Array(101).fill({ op: "ping" });
  assert.throws(() => validate(q, "s", Date.now()));
});
test("client atomic request and correlated response round trip with simulated consumer", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-id-test-"));
  let timer;
  try {
    await fs.mkdir(path.join(root, "Requests")); await fs.mkdir(path.join(root, "Responses"));
    await fs.writeFile(path.join(root, "status.json"), JSON.stringify({ protocol: 1, version: VERSION, active: true, session: "s", updatedAt: Date.now() }));
    let handled = false;
    timer = setInterval(async () => {
      if (handled) return;
      const names = await fs.readdir(path.join(root, "Requests"));
      const name = names.find(x => x.endsWith(".json"));
      if (!name) return;
      handled = true;
      const q = JSON.parse(await fs.readFile(path.join(root, "Requests", name), "utf8"));
      validate(q, "s", Date.now());
      await fs.writeFile(path.join(root, "Responses", name), JSON.stringify({ ok: true, id: q.id, results: ["simulated"] }));
    }, 20);
    const result = await send(root, [{ op: "ping" }], 3000);
    assert.equal(result.ok, true); assert.equal(result.results[0], "simulated");
    await assert.rejects(fs.access(path.join(root, "client.lock")));
  } finally { clearInterval(timer); await fs.rm(root, { recursive: true, force: true }); }
});
test("client refuses an offline host without writing a command", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-id-test-"));
  try {
    await fs.writeFile(path.join(root, "status.json"), JSON.stringify({ protocol: 1, version: VERSION, active: false, updatedAt: Date.now() }));
    await assert.rejects(send(root, [{ op: "ping" }]), /Nincs élő/);
    assert.deepEqual(await fs.readdir(root), ["status.json"]);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
test("client timeout returns the same request ID for recovery", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-id-test-"));
  try {
    await fs.mkdir(path.join(root, "Requests")); await fs.mkdir(path.join(root, "Responses"));
    await fs.writeFile(path.join(root, "status.json"), JSON.stringify({ protocol: 1, version: VERSION, active: true, session: "s", updatedAt: Date.now() }));
    const result = await send(root, [{ op: "ping" }], 10);
    assert.equal(result.pending, true);
    assert.equal(path.basename(result.responseFile), result.id + ".json");
    assert.equal((await fs.readdir(path.join(root, "Requests"))).length, 1);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
