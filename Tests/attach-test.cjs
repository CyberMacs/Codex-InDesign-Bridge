const assert = require('node:assert/strict');
const {createExecutor} = require('../CodexInDesignBridge/operations.js');
const {validate} = require('../CodexInDesignBridge/protocol.js');
async function main() {
  let fail = false, backups = [];
  const frame = {constructor:{name:'TextFrame'},contents:'old',parentStory:{texts:{item:()=>({})}},id:4,label:'',geometricBounds:[0,0,10,10],overflows:false};
  const doc = {id:1,name:'Orarend.indd',isValid:true,extractLabel:()=>'',saveACopy:p=>{if(fail) throw Error('disk failure');backups.push(p);},pageItems:{itemByID:()=>({isValid:true,getElements:()=>[frame]})}};
  const run=createExecutor({app:{documents:{itemByID:()=>doc}}},{root:{nativePath:'root'},output:{nativePath:'output',getEntries:async()=>backups.map(p=>({name:p.split('/').pop()}))}});
  const ctx={refs:{}};
  const change={op:'updateItem',documentId:1,itemId:4,text:'new'};
  await assert.rejects(run(change,ctx),/attachDocument/);
  await assert.rejects(run({op:'attachDocument',documentId:1,expectedName:'wrong',backupFile:'original.indd'},ctx),/mismatch/);
  fail=true;
  await assert.rejects(run({op:'attachDocument',documentId:1,expectedName:doc.name,backupFile:'original.indd'},ctx),/disk failure/);
  await assert.rejects(run(change,ctx),/attachDocument/);
  fail=false;
  await run({op:'attachDocument',documentId:1,expectedName:doc.name,backupFile:'original.indd'},ctx);
  await run(change,ctx);
  assert.equal(frame.contents,'new');
  assert.equal(backups.length,1);
  await assert.rejects(run({op:'attachDocument',documentId:1,expectedName:doc.name,backupFile:'original.indd'},ctx),/létezik/);
  const req={protocol:1,id:'11111111-1111-1111-1111-111111111111',session:'s',expiresAt:2000,operations:[{op:'attachDocument',documentId:1,expectedName:doc.name,backupFile:'../bad.indd'}]};
  assert.throws(()=>validate(req,'s',1000));
  console.log('PASS: unattached write, name mismatch, failed backup, successful attach/text resolution, overwrite prevention, traversal validation');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
