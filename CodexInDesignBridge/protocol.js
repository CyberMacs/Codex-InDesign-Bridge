"use strict";
const VERSION = "0.3.1";
const OPS = ["ping", "listDocuments", "inspect", "createDocument", "addPage", "addLayer", "addColor", "addText", "addRectangle", "updateItem", "placeImage", "saveCopy", "exportPDF", "exportIDML", "restorationBook"];
function assert(test, message) { if (!test) throw new Error(message); }
function basename(value) {
  assert(typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,119}$/.test(value) && !value.includes(".."), "Csak egyszerű angol fájlnév használható.");
  assert(!/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(value), "Tiltott Windows-fájlnév.");
  return value;
}
function bounds(value) {
  assert(Array.isArray(value) && value.length === 4 && value.every(x => typeof x === "number" && Number.isFinite(x) && Math.abs(x) <= 5000), "bounds: négy véges milliméterérték szükséges.");
  assert(value[2] > value[0] && value[3] > value[1], "A keret magassága és szélessége legyen pozitív.");
  return value.map(x => x + " mm");
}
function validate(request, session, now) {
  assert(request && request.protocol === 1, "Ismeretlen protokoll.");
  assert(typeof request.id === "string" && /^[a-f0-9-]{36}$/.test(request.id), "Hibás kérésazonosító.");
  assert(request.session === session, "Lejárt kapcsolat. Küldj új kérést az aktuális session értékkel.");
  assert(Number.isFinite(request.expiresAt) && request.expiresAt > now && request.expiresAt <= now + 300000, "Lejárt vagy túl hosszú érvényesség.");
  assert(Array.isArray(request.operations) && request.operations.length > 0 && request.operations.length <= 100, "1–100 művelet küldhető.");
  request.operations.forEach(op => {
    assert(op && (OPS.includes(op.op) || op.op === "attachDocument"), "Nem támogatott művelet: " + (op && op.op));
    if (op.op === "restorationBook") {
      assert(["fonts", "build", "qa", "save"].includes(op.action), "Unknown restorationBook action.");
      if (["build", "save"].includes(op.action)) assert(op.experimental === true, "Experimental builder requires experimental: true.");
      if (["qa", "save"].includes(op.action)) assert(Number.isInteger(op.documentId), "documentId required");
    }
    if (op.op === "attachDocument") {
      assert(Number.isInteger(op.documentId), "documentId required");
      assert(typeof op.expectedName === "string" && op.expectedName.length > 0, "expectedName required");
      basename(op.backupFile);
      assert(op.backupFile.toLowerCase().endsWith(".indd"), "INDD backup required");
    }
    if (op.bounds !== undefined) bounds(op.bounds);
    if (op.file !== undefined) basename(op.file);
    if (op.text !== undefined) assert(typeof op.text === "string" && op.text.length <= 100000, "Túl hosszú vagy hibás szöveg.");
  });
  return request;
}
module.exports = { VERSION, OPS, assert, basename, bounds, validate };
