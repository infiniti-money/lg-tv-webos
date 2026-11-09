import assert from 'node:assert/strict';
import worker, {extractText} from '../cloudflare/ai/src/index.mjs';
const token = '0123456789abcdef0123456789abcdef';
const env = {OPENAI_API_KEY:'test-only-key',AI_ACCESS_TOKEN:token,AI_MODEL:'gpt-6-luna'};
const url = 'https://test.workers.dev/api/chat';
function req(body, t) {
  return new Request(url, {method:'POST',headers:{
    Authorization:'Bearer ' + (t || token), 'Content-Type':'application/json'
  },body:JSON.stringify(body)});
}
assert.equal(extractText({output:[{content:[{type:'output_text',text:'Xin chào'}]}]}), 'Xin chào');
assert.equal((await worker.fetch(new Request(url, {method:'OPTIONS'}),env)).status,204);
assert.equal((await worker.fetch(req({question:'Xin chào'},'bad'),env)).status,401);
assert.equal((await worker.fetch(req({question:''}),env)).status,400);
assert.equal((await worker.fetch(req({question:'x'.repeat(1501)}),env)).status,400);
assert.equal((await worker.fetch(req({question:'Xin chào'}),{OPENAI_API_KEY:'key'})).status,503);
const oldFetch=globalThis.fetch;
let called=0;
globalThis.fetch=async function (upstream, opt) {
  called++;
  assert.equal(upstream,'https://api.openai.com/v1/responses');
  assert.equal(JSON.parse(opt.body).model,'gpt-6-luna');
  assert.equal(JSON.parse(opt.body).store,false);
  return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Chào bạn!'}]}]}),{status:200});
};
try {
  const good=await worker.fetch(req({question:'Xin chào'}),env);
  assert.equal(good.status,200);
  assert.equal((await good.json()).answer,'Chào bạn!');
  assert.equal(called,1,'unauthorized requests never reach OpenAI');
} finally {
  globalThis.fetch=oldFetch;
}
console.log('Vietnamese AI proxy tests passed.');
