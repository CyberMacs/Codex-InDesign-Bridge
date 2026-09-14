"use strict";
const { assert, bounds, basename, VERSION, OPS } = require("./protocol.js");
function createExecutor(id, folders) {
  const app = id.app;
  const attached = new Map();
  function resolve(item) { return item.getElements ? item.getElements()[0] : item; }
  function documentFor(op, ctx, write) {
    const docId = op.documentId === undefined ? ctx.documentId : op.documentId;
    assert(Number.isInteger(docId), "documentId szükséges; előbb listDocuments vagy createDocument.");
    const doc = app.documents.itemByID(docId);
    assert(doc.isValid, "A dokumentum már nincs megnyitva.");
    if (write) assert(doc.extractLabel("codexBridgeOwner") === folders.root.nativePath || attached.get(docId) === doc.name, "attachDocument required before editing an existing document.");
    ctx.documentId = docId;
    return doc;
  }
  function pageFor(doc, op) {
    const n = op.page === undefined ? 0 : op.page;
    assert(Number.isInteger(n) && n >= 0 && n < doc.pages.length, "Hibás, nullától számított oldalindex.");
    return doc.pages.item(n);
  }
  function itemFor(doc, op, ctx) {
    const itemId = typeof op.itemId === "string" ? ctx.refs[op.itemId] : op.itemId;
    assert(Number.isInteger(itemId), "itemId vagy korábban megadott key szükséges.");
    const item = doc.pageItems.itemByID(itemId);
    assert(item.isValid, "A keresett objektum nem létezik.");
    return resolve(item);
  }
  function swatch(doc, name) {
    assert(typeof name === "string", "Színnév szükséges.");
    const color = doc.swatches.itemByName(name);
    assert(color.isValid, "Hiányzó szín: " + name);
    return color;
  }
  function style(doc, item, op) {
    if (op.tableCells !== undefined) {
      assert(item.constructor.name === "TextFrame", "Table requires a text frame.");
      assert(Array.isArray(op.tableCells) && op.tableCells.length <= 100, "Invalid tableCells.");
      const table = item.parentStory.tables.item(op.tableIndex === undefined ? 0 : op.tableIndex);
      assert(table.isValid, "Table not found.");
      const changes = op.tableCells.map(change => {
        assert(Number.isInteger(change.row) && change.row >= 0 && change.row < table.rows.length, "Invalid row.");
        assert(Number.isInteger(change.column) && change.column >= 0 && change.column < table.columns.length, "Invalid column.");
        assert(typeof change.text === "string" && change.text.length <= 1000, "Invalid cell text.");
        return { cell: table.rows.item(change.row).cells.item(change.column), text: change.text };
      });
      changes.forEach(change => { change.cell.texts.item(0).contents = change.text; });
    }
    if (op.bounds !== undefined) item.geometricBounds = bounds(op.bounds);
    if (op.fill !== undefined) item.fillColor = swatch(doc, op.fill);
    if (op.stroke !== undefined) item.strokeColor = swatch(doc, op.stroke);
    if (op.strokeWeight !== undefined) {
      assert(Number.isFinite(op.strokeWeight) && op.strokeWeight >= 0 && op.strokeWeight <= 100, "strokeWeight: 0–100 pt.");
      item.strokeWeight = op.strokeWeight + " pt";
    }
    if (op.label !== undefined) item.label = String(op.label).slice(0, 256);
    if (op.layer !== undefined) {
      const layer = doc.layers.itemByName(op.layer);
      assert(layer.isValid && !layer.locked, "Hiányzó vagy zárolt réteg.");
      item.itemLayer = layer;
    }
    if (op.text !== undefined || op.font !== undefined || op.fontSize !== undefined || op.textColor !== undefined) {
      assert(item.constructor.name === "TextFrame", "Szövegtulajdonság csak szövegkereten módosítható.");
      if (op.text !== undefined) item.contents = op.text;
      const text = item.parentStory.texts.item(0);
      if (op.font !== undefined) {
        const font = app.fonts.itemByName(op.font);
        assert(font.isValid, "Hiányzó betűtípus: " + op.font);
        text.appliedFont = font;
      }
      if (op.fontSize !== undefined) {
        assert(Number.isFinite(op.fontSize) && op.fontSize >= 1 && op.fontSize <= 500, "fontSize: 1–500 pt.");
        text.pointSize = op.fontSize;
      }
      if (op.textColor !== undefined) text.fillColor = swatch(doc, op.textColor);
    }
  }
  function record(item, op, ctx) {
    if (op.key) ctx.refs[op.key] = item.id;
    return { itemId: item.id, label: item.label, type: item.constructor.name, bounds: Array.from(item.geometricBounds), overset: item.constructor.name === "TextFrame" ? item.overflows : undefined };
  }
  async function unusedOutput(file, extension) {
    basename(file);
    assert(file.toLowerCase().endsWith(extension), "Szükséges kiterjesztés: " + extension);
    const entries = await folders.output.getEntries();
    assert(!entries.some(e => e.name.toLowerCase() === file.toLowerCase()), "A kimenet már létezik. Adj új fájlnevet.");
    return folders.output.nativePath + "/" + file;
  }
  return async function execute(op, ctx) {
    if (op.op === "ping") return { version: VERSION, host: String(app.version), operations: OPS.concat("attachDocument") };
    if (op.op === "attachDocument") {
      const doc = documentFor(op, ctx, false);
      assert(doc.name === op.expectedName, "Document name mismatch.");
      const backupPath = await unusedOutput(op.backupFile, ".indd");
      doc.saveACopy(backupPath, false);
      attached.set(doc.id, doc.name);
      return { documentId: doc.id, name: doc.name, backupPath, attached: true };
    }
    if (op.op === "listDocuments") {
      const docs = [];
      for (let i = 0; i < app.documents.length; i++) {
        const d = app.documents.item(i);
        docs.push({ documentId: d.id, name: d.name, pages: d.pages.length, managed: d.extractLabel("codexBridgeOwner") === folders.root.nativePath });
      }
      return docs;
    }
    if (op.op === "createDocument") {
      const width = op.width === undefined ? 420 : op.width;
      const height = op.height === undefined ? 297 : op.height;
      const pages = op.pages === undefined ? 1 : op.pages;
      assert(Number.isFinite(width) && width >= 10 && width <= 2000 && Number.isFinite(height) && height >= 10 && height <= 2000, "Oldalméret: 10–2000 mm.");
      assert(Number.isInteger(pages) && pages >= 1 && pages <= 100, "Oldalszám: 1–100.");
      const doc = app.documents.add();
      ctx.documentId = doc.id;
      doc.insertLabel("codexBridgeOwner", folders.root.nativePath);
      doc.insertLabel("codexBridgeVersion", VERSION);
      doc.documentPreferences.properties = { pageWidth: width + " mm", pageHeight: height + " mm", facingPages: false, pagesPerDocument: pages };
      doc.viewPreferences.properties = { horizontalMeasurementUnits: id.MeasurementUnits.MILLIMETERS, verticalMeasurementUnits: id.MeasurementUnits.MILLIMETERS, rulerOrigin: id.RulerOrigin.PAGE_ORIGIN };
      return { documentId: doc.id, name: doc.name, width, height, pages };
    }
    const doc = documentFor(op, ctx, op.op !== "inspect");
    if (op.op === "inspect") {
      const page = pageFor(doc, op);
      const items = [];
      for (let i = 0; i < Math.min(page.pageItems.length, 300); i++) {
        const item = resolve(page.pageItems.item(i));
        const entry = record(item, {}, ctx);
        if (item.constructor.name === "TextFrame") entry.text = String(item.contents).slice(0, 10000);
        items.push(entry);
      }
      return { documentId: doc.id, page: op.page || 0, horizontalUnit: String(doc.viewPreferences.horizontalMeasurementUnits), verticalUnit: String(doc.viewPreferences.verticalMeasurementUnits), totalItems: page.pageItems.length, truncated: page.pageItems.length > 300, items };
    }
    if (op.op === "addPage") return { pageId: doc.pages.add().id, page: doc.pages.length - 1 };
    if (op.op === "addLayer") {
      assert(typeof op.name === "string" && op.name.length > 0 && op.name.length <= 100, "Rétegnév szükséges.");
      assert(!doc.layers.itemByName(op.name).isValid, "A réteg már létezik.");
      return { layerId: doc.layers.add({ name: op.name }).id };
    }
    if (op.op === "addColor") {
      assert(typeof op.name === "string" && op.name.length > 0 && op.name.length <= 100, "Színnév szükséges.");
      assert(Array.isArray(op.rgb) && op.rgb.length === 3 && op.rgb.every(x => Number.isInteger(x) && x >= 0 && x <= 255), "rgb: három 0–255 egész szám.");
      assert(!doc.swatches.itemByName(op.name).isValid, "A szín már létezik.");
      return { colorId: doc.colors.add({ name: op.name, model: id.ColorModel.PROCESS, space: id.ColorSpace.RGB, colorValue: op.rgb }).id };
    }
    if (op.op === "addText" || op.op === "addRectangle") {
      bounds(op.bounds);
      const page = pageFor(doc, op);
      const item = op.op === "addText" ? page.textFrames.add() : page.rectangles.add();
      try { item.strokeWeight = 0; style(doc, item, op); return record(item, op, ctx); }
      catch (error) { try { item.remove(); } catch (_) {} throw error; }
    }
    if (op.op === "updateItem") {
      const item = itemFor(doc, op, ctx);
      style(doc, item, op);
      return record(item, op, ctx);
    }
    if (op.op === "placeImage") {
      const file = basename(op.file);
      assert(/\.(png|jpe?g|tiff?|psd)$/i.test(file), "Támogatott képek: PNG, JPEG, TIFF, PSD.");
      const entry = await folders.assets.getEntry(file);
      assert(entry.isFile, "Képfájl szükséges.");
      const item = itemFor(doc, op, ctx);
      assert(item.constructor.name === "Rectangle", "A képet téglalapkeretbe helyezd.");
      item.place(entry.nativePath);
      item.fit(id.FitOptions.FILL_PROPORTIONALLY);
      return record(item, op, ctx);
    }
    if (op.op === "saveCopy") {
      const path = await unusedOutput(op.file, op.template ? ".indt" : ".indd");
      doc.saveACopy(path, !!op.template);
      return { path };
    }
    if (op.op === "exportPDF" || op.op === "exportIDML") {
      const pdf = op.op === "exportPDF";
      const path = await unusedOutput(op.file, pdf ? ".pdf" : ".idml");
      doc.exportFile(pdf ? id.ExportFormat.PDF_TYPE : id.ExportFormat.INDESIGN_MARKUP, path, false);
      return { path };
    }
    throw new Error("Nem támogatott művelet.");
  };
}
module.exports = { createExecutor };
