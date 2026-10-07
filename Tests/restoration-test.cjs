"use strict";
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const {validate, VERSION, OPS} = require('../CodexInDesignBridge/protocol.js');
const {execute} = require('../CodexInDesignBridge/restoration-book.js');
const {createExecutor} = require('../CodexInDesignBridge/operations.js');
const request = op => ({protocol:1,id:randomUUID(),session:'s',expiresAt:Date.now()+60000,operations:[op]});

test('versions and experimental capability are aligned', () => {
  assert.equal(VERSION, '0.3.1');
  assert.equal(require('../CodexInDesignBridge/manifest.json').version, VERSION);
  assert.equal(require('../package.json').version, VERSION);
  assert.ok(OPS.includes('restorationBook'));
});
test('unknown action and missing opt-in fail before DOM access', async () => {
  for (const op of [
    {op:'restorationBook',action:'anything'},
    {op:'restorationBook',action:'build'},
    {op:'restorationBook',action:'save',documentId:1},
    {op:'restorationBook',action:'qa'}
  ]) assert.throws(() => validate(request(op),'s',Date.now()));
  for (const action of ['build','save','anything']) await assert.rejects(execute({}, {}, {action}, {}));
});
test('read-only fonts and QA actions do not require experimental writes', () => {
  for (const op of [{op:'restorationBook',action:'fonts'}, {op:'restorationBook',action:'qa',documentId:1}]) {
    assert.equal(validate(request(op),'s',Date.now()).operations[0],op);
  }
});
test('experimental QA rejects another session owner', async () => {
  const doc={isValid:true,extractLabel:k=>k==='restorationBookVersion'?'1.0.0':'another-root'};
  const id={app:{documents:{itemByID:()=>doc}}};
  await assert.rejects(execute(id,{root:{nativePath:'current-root'}},{action:'qa',documentId:9},{}),/projekt/);
});
test('experimental export rejects each existing output before QA or save', async () => {
  let writes=0;
  const doc={isValid:true,id:9,extractLabel:k=>k==='restorationBookVersion'?'1.0.0':'root',save:()=>writes++};
  const id={app:{documents:{itemByID:()=>doc}}};
  for (const name of ['Restoration-Book-Layouts-v1.0.0.indd','Restoration-Book-Layouts-v1.0.0.indt','Restoration-Book-Layouts-v1.0.0.idml','Restoration-Book-Layouts-v1.0.0.pdf','Native-QA-v1.0.0.json']) {
    const folders={root:{nativePath:'root'},output:{getEntries:async()=>[{name:name.toUpperCase()}]}};
    await assert.rejects(execute(id,folders,{action:'save',documentId:9,experimental:true},{}),/Output already exists/);
  }
  assert.equal(writes,0);
});
test('executor dispatch preserves the experimental guard', async () => {
  const run=createExecutor({app:{}},{});
  await assert.rejects(run({op:'restorationBook',action:'build'},{}),/experimental/);
  const ping=await run({op:'ping'},{});
  assert.equal(ping.version,VERSION);
  assert.ok(ping.operations.includes('restorationBook'));
});
