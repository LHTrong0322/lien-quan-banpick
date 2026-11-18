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

export async function onRequestGet({ env }) {
  if (!env.CONTRIB) return J({ error: 'nokv' }, 503);
  const items = await load(env);
  // không trả danh sách người bình chọn ra ngoài
  return J({ items: items.filter(x => x.up - x.down > -3).map(({ voters, ...x }) => x) });
}

export async function onRequestPost({ request, env }) {
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
