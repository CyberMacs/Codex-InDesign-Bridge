"use strict";
const assert = require("node:assert/strict"), { test } = require("node:test"), fs = require("node:fs/promises"), path = require("node:path"), vm = require("node:vm"), { randomUUID } = require("node:crypto");
async function harness(execute) {
  function folder(name) {
    const entries = new Map();
    return { name, nativePath: "test/" + name, isFolder: true, entries,
      async getEntries() { return [...entries.values()]; },
      async createFolder(n) { const f = folder(n); entries.set(n, f); return f; },
      async createFile(n, options) {
        if (entries.has(n) && !options.overwrite) throw new Error("exists");
        const f = { name: n, isFile: true, value: "", async read() { return this.value; }, async write(v) { this.value = v; } };
        entries.set(n, f); return f;
      }
    };
  }
  const root = folder("Bridge"), elements = new Map();
  const sandbox = { console, setInterval: () => 1, clearInterval() {}, document: { getElementById(id) { if (!elements.has(id)) elements.set(id, { value: "" }); return elements.get(id); } },
    require(name) {
      if (name === "uxp") return { entrypoints: { setup() {} }, storage: { localFileSystem: { getFolder: async () => root } } };
      if (name === "indesign") return { app: { version: "SIMULATED" } };
      if (name === "./operations.js") return { createExecutor: () => execute };
      return require("../CodexInDesignBridge/protocol.js");
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(await fs.readFile(path.join(__dirname, "../CodexInDesignBridge/main.js"), "utf8"), sandbox);
  await vm.runInContext("choose().then(start)", sandbox);
  return { root, sandbox, async submit(operations) {
    const q = { protocol: 1, id: randomUUID(), expiresAt: Date.now() + 60000, session: JSON.parse(root.entries.get("status.json").value).session, operations };
    const file = await root.entries.get("Requests").createFile(q.id + ".json", { overwrite: false }); await file.write(JSON.stringify(q)); return q.id + ".json";
  }, tick: () => vm.runInContext("tick()", sandbox) };
}
test("queue persists claim and never replays completed or uncertain requests", async () => {
  let calls = 0;
  const h = await harness(async () => { calls++; return "ok"; });
  const name = await h.submit([{ op: "ping" }]);
  await h.tick(); await h.tick(); assert.equal(calls, 1);
  assert.ok(h.root.entries.get("Claims").entries.has(name));
  h.root.entries.get("Responses").entries.delete(name);
  await h.tick(); assert.equal(calls, 1);
});
test("queue stops partial batch at first error and reports index", async () => {
  let calls = 0;
  const h = await harness(async () => { calls++; if (calls === 2) throw new Error("simulated failure"); return "ok"; });
  const name = await h.submit([{ op: "ping" }, { op: "ping" }, { op: "ping" }]);
  await h.tick();
  const result = JSON.parse(h.root.entries.get("Responses").entries.get(name).value);
  assert.equal(calls, 2); assert.equal(result.failedOperation, 1); assert.equal(result.ok, false); assert.equal(result.partialChangesPossible, true);
});
test("queue validates full batch before taking claim or executing", async () => {
  let calls = 0;
  const h = await harness(async () => { calls++; });
  const name = await h.submit([{ op: "ping" }, { op: "eval" }]);
  await h.tick();
  assert.equal(calls, 0); assert.equal(h.root.entries.get("Claims").entries.size, 0);
  assert.equal(JSON.parse(h.root.entries.get("Responses").entries.get(name).value).phase, "validation");
});
