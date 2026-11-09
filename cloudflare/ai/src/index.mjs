/**
 * Infiniti TV Home AI proxy for Cloudflare Workers.
 * API keys are Cloudflare secrets, never shipped to the webOS application.
 * Deploy behind additional Cloudflare WAF/rate limit for public use.
 */
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  };
}
function reply(obj, status) {
  return new Response(JSON.stringify(obj), {status: status || 200, headers: cors()});
}
function extractText(data) {
  if (data && typeof data.output_text === 'string' && data.output_text) return data.output_text;
  var chunks = [];
  (data && data.output || []).forEach(function (item) {
    (item.content || []).forEach(function (v) {
      if (v && v.type === 'output_text' && typeof v.text === 'string') chunks.push(v.text);
    });
  });
  return chunks.join('\n');
}
export default {
  async fetch(request, env) {
    var pathname;
    try { pathname = new URL(request.url).pathname; } catch (e) { return reply({error:'Invalid URL'},400); }
    if (request.method === 'OPTIONS' && pathname === '/api/chat') {
      return new Response(null, {status:204, headers:cors()});
    }
    if (pathname !== '/api/chat') return reply({error:'Not found'},404);
    if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
    if (!env.OPENAI_API_KEY || !env.AI_ACCESS_TOKEN || env.AI_ACCESS_TOKEN.length < 32) {
      return reply({error:'AI service is not configured'},503);
    }
    if (request.headers.get('Authorization') !== 'Bearer ' + env.AI_ACCESS_TOKEN) {
      return reply({error:'Access denied'},401);
    }
    if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
      return reply({error:'Content-Type must be application/json'},415);
    }
    var text = await request.text();
    if (text.length > 5000) return reply({error:'Request too large'},413);
    var body;
    try { body = JSON.parse(text); } catch (e) { return reply({error:'Invalid JSON'},400); }
    var question = body && body.question;
    if (typeof question !== 'string' || !question.trim() || question.length > 1500) {
      return reply({error:'Question must be 1-1500 characters'},400);
    }
    try {
      var upstream = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization':'Bearer ' + env.OPENAI_API_KEY,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          model: env.AI_MODEL || 'gpt-6-luna',
          instructions: 'Bạn là trợ lý AI dành cho gia đình trên TV. Trả lời bằng tiếng Việt rõ ràng, ngắn gọn, dễ đọc trên màn hình TV. Không khẳng định đã điều khiển TV hoặc mở ứng dụng khi bạn chưa thực sự có công cụ thực hiện.',
          input: question,
          max_output_tokens: 500,
          store: false
        })
      });
      if (!upstream.ok) return reply({error: 'AI upstream error (HTTP ' + upstream.status + ')'}, 502);
      var data = await upstream.json();
      var answer = extractText(data).slice(0, 3000);
      if (!answer) return reply({error:'AI returned no answer'},502);
      return reply({answer:answer});
    } catch (e) {
      return reply({error:'AI service temporarily unavailable'},502);
    }
  }
};
export {extractText};
