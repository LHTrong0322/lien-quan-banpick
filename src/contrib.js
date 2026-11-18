/* API góp ý bài đánh — Cloudflare Pages Function + KV (biến ràng buộc tên CONTRIB)
   GET  /api/contrib            → danh sách góp ý
   POST /api/contrib {action:'add', type:'counter'|'combo'|'comp', a, b, heroes, arch, text, nick, dev}
   POST /api/contrib {action:'vote', id, v:1|-1, dev}
   Agent build by @Trong0322 */
const KEY = 'items-v1', MAX = 3000;
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const ID = /^[a-z]{2,16}$/;
const ARCH = ['push', 'dive', 'poke', 'fight', 'protect', 'split', 'counter', 'pick', ''];
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);

async function load(env) { return (await env.CONTRIB.get(KEY, 'json')) || []; }

async function limited(env, ip, kind, max) {
  const k = `rl:${kind}:${ip}:${Math.floor(Date.now() / 600000)}`; // mỗi 10 phút
  const n = +(await env.CONTRIB.get(k)) || 0;
  if (n >= max) return true;
  await env.CONTRIB.put(k, String(n + 1), { expirationTtl: 900 });
  return false;
}

async function onGet(env) {
  if (!env.CONTRIB) return J({ error: 'nokv' }, 503);
  const items = await load(env);
  // không trả danh sách người bình chọn ra ngoài
  return J({ items: items.filter(x => x.up - x.down > -3).map(({ voters, ...x }) => x) });
}

async function onPost(request, env) {
  if (!env.CONTRIB) return J({ error: 'nokv' }, 503);
  let b; try { b = await request.json(); } catch { return J({ error: 'bad json' }, 400); }
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const dev = clean(b.dev, 40) || ip;
  const items = await load(env);

  if (b.action === 'vote') {
    if (await limited(env, ip, 'v', 60)) return J({ error: 'Bạn bình chọn nhanh quá, thử lại sau ít phút' }, 429);
    const it = items.find(x => x.id === b.id); if (!it) return J({ error: 'not found' }, 404);
    it.voters = it.voters || {};
    const old = it.voters[dev] || 0, v = b.v > 0 ? 1 : b.v < 0 ? -1 : 0;
    if (old === 1) it.up--; if (old === -1) it.down--;
    if (v === 1) it.up++; if (v === -1) it.down++;
    if (v) it.voters[dev] = v; else delete it.voters[dev];
    await env.CONTRIB.put(KEY, JSON.stringify(items));
    return J({ ok: true, up: it.up, down: it.down, my: v });
  }

  if (b.action === 'add') {
    if (await limited(env, ip, 'a', 8)) return J({ error: 'Bạn gửi nhiều quá, nghỉ 10 phút rồi gửi tiếp nhé' }, 429);
    const type = b.type, text = clean(b.text, 280), nick = clean(b.nick, 24);
    const it = { id: crypto.randomUUID().slice(0, 8), type, text, nick, up: 1, down: 0, ts: Date.now(), voters: { [dev]: 1 } };
    if (type === 'counter' || type === 'combo') {
      if (!ID.test(b.a) || !ID.test(b.b) || b.a === b.b) return J({ error: 'Chọn đủ 2 tướng khác nhau' }, 400);
      it.a = b.a; it.b = b.b;
      if (type === 'combo' && it.a > it.b) [it.a, it.b] = [it.b, it.a];
      const dup = items.find(x => x.type === type && x.a === it.a && x.b === it.b && x.text.toLowerCase() === text.toLowerCase());
      if (dup) return J({ error: 'Góp ý này đã có — hãy bấm 👍 cho nó' }, 409);
    } else if (type === 'comp') {
      const hs = [...new Set((b.heroes || []).filter(h => ID.test(h)))].slice(0, 5);
      if (hs.length < 2) return J({ error: 'Bài đánh cần ít nhất 2 tướng' }, 400);
      it.heroes = hs; it.arch = ARCH.includes(b.arch) ? b.arch : '';
    } else return J({ error: 'Loại góp ý không hợp lệ' }, 400);
    if (text.length < 8) return J({ error: 'Viết lý do/cách đánh dài hơn chút (ít nhất 8 ký tự)' }, 400);
    items.unshift(it);
    // giữ tối đa MAX mục: bỏ bớt mục bị chê nhiều/cũ nhất
    if (items.length > MAX) items.sort((x, y) => (y.up - y.down) - (x.up - x.down) || y.ts - x.ts).length = MAX;
    await env.CONTRIB.put(KEY, JSON.stringify(items));
    const { voters, ...pub } = it;
    return J({ ok: true, item: pub });
  }
  return J({ error: 'unknown action' }, 400);
}

/* ===== Chuyển giọng nói → chữ bằng Whisper (Cloudflare Workers AI) =====
   Dùng khi trình duyệt không tự nhận giọng được (lỗi "network": Cốc Cốc, Brave, Opera, máy chặn Google…).
   Trình duyệt gửi file WAV ngắn (1 câu lệnh) lên đây, máy chủ trả về chữ. */
const STT_PROMPT = 'Ban pick Liên Quân Mobile. Lệnh: cấm, chọn, pick, địch chọn, đối thủ cấm, khắc chế, counter, đường rừng, đường giữa, đường rồng, tà thần, trợ thủ, hoàn tác. Tướng: Tulen, Nakroth, Murad, Yena, Aoi, Violet, Thane, Liliana, Florentino, Zata, Lorion, Yorn, Hayate, Capheny, Elsu, Arum, Alice, Zip, Toro, Grakk, Krixi, Raz, Zill, Veres, Volkath, Omen, Maloch, Ryoma, Qi, Bijan, Dirak, Iggy, Ilumia, Ishar, Lauriel, Keera, Kriknak, Quillen, Triệu Vân, Ngộ Không, Lữ Bố, Điêu Thuyền, Zephys, Y\'bneth, Wonder Woman.';
function b64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
async function onStt(request, env) {
  if (!env.AI) return J({ error: 'Máy chủ chưa bật Workers AI' }, 503);
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  if (env.CONTRIB && await limited(env, ip, 's', 80)) return J({ error: 'Bạn nói nhanh quá, nghỉ vài phút rồi thử lại nhé' }, 429);
  const buf = await request.arrayBuffer();
  if (buf.byteLength < 2000) return J({ text: '' });
  if (buf.byteLength > 1500000) return J({ error: 'Đoạn ghi âm quá dài' }, 413);
  const r = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: b64(buf), language: 'vi', task: 'transcribe', initial_prompt: STT_PROMPT });
  return J({ text: (r && r.text || '').trim() });
}

/* ===== Bộ hiểu lệnh bằng AI (dự phòng khi luật có sẵn không hiểu câu nói) =====
   Câu nói sai chính tả, giọng địa phương, tên tướng đọc kiểu Việt → mô hình ngôn ngữ đoán ý → trả về lệnh có cấu trúc. */
const INTENT_SYS = `Bạn là bộ hiểu lệnh giọng nói cho công cụ ban-pick game Liên Quân Mobile.
Câu của người dùng là tiếng Việt nói, có thể sai chính tả, sai dấu, giọng miền Bắc/Trung/Nam, tiếng lóng game thủ, tên tướng tiếng Anh đọc kiểu Việt (vd "na crốt"=Nakroth, "giọn"=Yorn, "vai ô lét"=Violet, "tu lên"=Tulen, "mu rát"=Murad, "dê phít"=Zephys).
Chỉ trả về MỘT dòng JSON, không giải thích:
{"action":"ban|pick|auto_pick|auto_ban|undo|none","side":"ally|enemy","heroes":["tên đúng trong danh sách"],"lane":"T|J|M|A|S|null","counter":"tên đúng trong danh sách hoặc null"}
Quy tắc:
- cấm/ban/khóa/chặn/loại = ban. chọn/pick/lấy/cầm/chơi/xài/lựa = pick.
- địch/đối thủ/bên kia/team kia/tụi nó/họ = enemy; mặc định ally.
- Muốn tướng khắc chế/counter/bắt bài một tướng mà KHÔNG nêu tướng muốn chọn → auto_pick, counter = tướng bị khắc.
- "chọn giúp", "pick đi", "chọn tướng mạnh nhất" không có tên → auto_pick. "cấm giúp", "cấm tướng nguy hiểm" không tên → auto_ban.
- hoàn tác/quay lại/lùi lại/huỷ = undo. Không phải lệnh = none.
- Đường: tà thần/top/đường trên=T; rừng/jungle=J; giữa/mid=M; rồng/xạ thủ/ad/đường dưới=A; trợ thủ/support/sp=S.
- heroes và counter PHẢI là tên có trong danh sách tướng được cung cấp; đoán tên gần nhất về cách phát âm.`;
async function onIntent(request, env) {
  if (!env.AI) return J({ error: 'Máy chủ chưa bật Workers AI' }, 503);
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  if (env.CONTRIB && await limited(env, ip, 'i', 80)) return J({ error: 'Bạn ra lệnh nhanh quá, nghỉ vài phút nhé' }, 429);
  let b; try { b = await request.json(); } catch { return J({ error: 'bad json' }, 400); }
  const text = String(b.text || '').slice(0, 200), names = (b.heroes || []).map(x => String(x).slice(0, 30)).slice(0, 200);
  if (!text.trim()) return J({ action: 'none' });
  const r = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
    messages: [
      { role: 'system', content: INTENT_SYS + '\nDanh sách tướng: ' + names.join(', ') },
      { role: 'user', content: 'cấm na crốt' }, { role: 'assistant', content: '{"action":"ban","side":"ally","heroes":["Nakroth"],"lane":null,"counter":null}' },
      { role: 'user', content: 'bên kia lấy con giọn với thên' }, { role: 'assistant', content: '{"action":"pick","side":"enemy","heroes":["Yorn","Thane"],"lane":null,"counter":null}' },
      { role: 'user', content: 'cho em con nào bắt bài con ao i đi rừng' }, { role: 'assistant', content: '{"action":"auto_pick","side":"ally","heroes":[],"lane":"J","counter":"Aoi"}' },
      { role: 'user', content: text }],
    max_tokens: 80, temperature: 0 });
  const out = typeof r?.response === 'string' ? r.response : JSON.stringify(r?.response || {});
  const m = out.match(/\{[\s\S]*\}/); let o = {};
  try { o = m ? JSON.parse(m[0]) : {}; } catch { o = {}; }
  return J({ action: o.action || 'none', side: o.side === 'enemy' ? 'enemy' : 'ally', heroes: Array.isArray(o.heroes) ? o.heroes.slice(0, 5) : [], lane: 'TJMAS'.includes(o.lane) && o.lane ? o.lane : null, counter: o.counter || null });
}

/* Worker chính: /api/contrib do code xử lý, còn lại trả file tĩnh (index.html, app.js, ảnh…) */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contrib') {
      try {
        if (request.method === 'GET') return await onGet(env);
        if (request.method === 'POST') return await onPost(request, env);
        return J({ error: 'method' }, 405);
      } catch (e) { return J({ error: 'Lỗi máy chủ: ' + e.message }, 500); }
    }
    if (url.pathname === '/api/intent' && request.method === 'POST') {
      try { return await onIntent(request, env); } catch (e) { return J({ error: 'Lỗi hiểu lệnh: ' + e.message }, 500); }
    }
    if (url.pathname === '/api/stt' && request.method === 'POST') {
      try { return await onStt(request, env); } catch (e) { return J({ error: 'Lỗi nhận giọng: ' + e.message }, 500); }
    }
    return env.ASSETS.fetch(request);
  }
};
