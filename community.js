/* ===== Người chơi góp ý bài đánh: kèo khắc chế, cặp bài, đội hình — Agent build by @Trong0322 =====
   Lưu chung trên máy chủ (Cloudflare KV qua /api/contrib). Không có máy chủ thì lưu tạm trên máy người dùng.
   Góp ý càng được 👍 nhiều thì thuật toán càng tính nặng; bị 👎 nhiều thì bị bỏ qua và ẩn. */
(function(){
const API='/api/contrib';
const LS=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}};
let dev=LS('bp-lq-dev');if(!dev){dev=Math.random().toString(36).slice(2)+Date.now().toString(36);LS('bp-lq-dev',dev)}
const myVotes=LS('bp-lq-votes')||{};
let items=[],online=false,loaded=false;
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const net=x=>x.up-x.down;
const wt=x=>{const n=net(x);return n<=0?0:Math.min(2.5,Math.log2(1+n))}; // 1 phiếu = 1, 3 phiếu = 2, từ 5 phiếu = 2.5 (tối đa)
let IDX={c:{},p:{},comp:[]};
function index(){IDX={c:{},p:{},comp:[]};
  items.forEach(x=>{if(net(x)<=-3)return;
    if(x.type==='counter'){(IDX.c[x.a]=IDX.c[x.a]||{});(IDX.c[x.a][x.b]=IDX.c[x.a][x.b]||[]).push(x)}
    else if(x.type==='combo'){const k=[x.a,x.b].sort().join('|');(IDX.p[k]=IDX.p[k]||[]).push(x)}
    else if(x.type==='comp')IDX.comp.push(x)})}
const best=list=>list.slice().sort((a,b)=>net(b)-net(a))[0];
const sumW=list=>Math.min(3,list.reduce((s,x)=>s+wt(x),0));
const quote=x=>`“${esc(x.text)}” <span class="ucv">👍${x.up}</span>`;

/* ---- móc vào thuật toán ---- */
window.UC={
  match(C,E){const o=[];
    const pos=IDX.c[C.id]?.[E.id];if(pos){const v=sumW(pos);if(v>0)o.push([v,`💬 Người chơi: ${C.name} khắc ${N(E)} — ${quote(best(pos))}`])}
    const neg=IDX.c[E.id]?.[C.id];if(neg){const v=sumW(neg);if(v>0)o.push([-v*.8,`💬 Người chơi: ${N(E)} khắc ${C.name} — ${quote(best(neg))}`])}
    return o},
  pair(a,b){const l=IDX.p[[a.id,b.id].sort().join('|')];if(!l)return null;const v=sumW(l);return v>0?{v,t:`💬 Cặp bài người chơi gợi ý với ${N(b)}: ${quote(best(l))}`,x:best(l)}:null},
  comp(C,allies){const out=[];const ids=new Set(allies.map(a=>a.id));
    IDX.comp.forEach(x=>{if(!x.heroes.includes(C.id))return;const hit=x.heroes.filter(h=>ids.has(h));if(!hit.length)return;const v=wt(x)*(.5+.4*hit.length);
      if(v>0)out.push([Math.min(2.5,v),`💬 Bài đánh người chơi: ${x.heroes.map(h=>BY[h]?.name).join(' + ')}${x.arch?' ('+ARCH[x.arch].n+')':''} — ${quote(x)}`])});
    return out.sort((a,b)=>b[0]-a[0]).slice(0,2)},
  compsFor(A){const ids=new Set(A.map(a=>a.id));
    return IDX.comp.map(x=>({x,hit:x.heroes.filter(h=>ids.has(h)).length})).filter(o=>o.hit>=Math.min(2,o.x.heroes.length)&&wt(o.x)>0).sort((a,b)=>b.hit-a.hit||net(b.x)-net(a.x)).slice(0,2).map(o=>o.x)},
  quote,
  render:renderTab,
};

/* ---- tải / gửi ---- */
async function load(){
  try{const r=await fetch(API,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json();items=d.items||[];online=true}
  catch(e){online=false;items=LS('bp-lq-contrib')||[]}
  loaded=true;index();render();
}
async function send(body){
  if(online){const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...body,dev})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Gửi không được');return d}
  // chế độ lưu trên máy
  const loc=LS('bp-lq-contrib')||[];
  if(body.action==='add'){const it={id:'l'+Date.now().toString(36),type:body.type,a:body.a,b:body.b,heroes:body.heroes,arch:body.arch,text:body.text,nick:body.nick,up:1,down:0,ts:Date.now()};loc.unshift(it);LS('bp-lq-contrib',loc);items=loc;return{ok:true,item:it}}
  if(body.action==='vote'){const it=loc.find(x=>x.id===body.id);if(it){const old=myVotes[it.id]||0;if(old===1)it.up--;if(old===-1)it.down--;if(body.v===1)it.up++;if(body.v===-1)it.down++;LS('bp-lq-contrib',loc);items=loc;return{ok:true,up:it.up,down:it.down,my:body.v}}}
  return{};
}

/* ---- giao diện tab "Góp ý" ---- */
const F={type:'counter',a:'',b:'',heroes:['','','','',''],arch:'',text:'',nick:LS('bp-lq-nick')||'',filter:'all',sort:'hot',q:'',msg:''};
const TYPES=[['counter','⚔️ Kèo khắc chế'],['combo','🤝 Cặp bài'],['comp','🧩 Bài đánh / đội hình']];
const byName=v=>{const n=norm(v||'');if(!n)return '';const h=HEROES.find(h=>norm(h.name)===n||h.id===n);return h?h.id:''};
const hin=(k,v,ph)=>`<input class="ucin" list="uc-heroes" data-uck="${k}" value="${esc(v?BY[v]?.name||v:'')}" placeholder="${ph}">`;
function itemHTML(x){
  const pics=(x.type==='comp'?x.heroes:[x.a,x.b]).map(h=>BY[h]).filter(Boolean);
  const sep=x.type==='counter'?'<span class="ucs">khắc</span>':'<span class="ucs">+</span>';
  const mv=myVotes[x.id]||0;
  return `<div class="ucitem"><div class="ucpics">${x.type==='comp'?pics.map(h=>`<div class="pic" title="${h.name}">${pic(h)}</div>`).join(''):`<div class="pic" title="${pics[0]?.name}">${pics[0]?pic(pics[0]):''}</div>${sep}<div class="pic" title="${pics[1]?.name}">${pics[1]?pic(pics[1]):''}</div>`}</div>
    <div class="ucbody"><div class="uct">${TYPES.find(t=>t[0]===x.type)[1]} · <b>${x.type==='comp'?pics.map(h=>h.name).join(' + '):`${pics[0]?.name} ${x.type==='counter'?'khắc chế':'+'} ${pics[1]?.name}`}</b>${x.arch?` · ${ARCH[x.arch].ic} ${ARCH[x.arch].n}`:''}</div>
      <div class="uctext">${esc(x.text)}</div><div class="ucmeta">${x.nick?esc(x.nick)+' · ':''}${new Date(x.ts).toLocaleDateString('vi-VN')}</div></div>
    <div class="ucvote"><button class="${mv===1?'on':''}" data-ucv="${x.id}:1">👍 ${x.up}</button><button class="${mv===-1?'on bad':''}" data-ucv="${x.id}:-1">👎 ${x.down}</button></div></div>`;
}
function renderTab(el){
  document.getElementById('lanepick').innerHTML='';
  const list=items.filter(x=>net(x)>-3&&(F.filter==='all'||x.type===F.filter)&&(!F.q||[x.a,x.b,...(x.heroes||[])].some(h=>h&&norm(BY[h]?.name||'').includes(norm(F.q)))))
    .sort((a,b)=>F.sort==='new'?b.ts-a.ts:(net(b)-net(a))||(b.ts-a.ts));
  el.innerHTML=`<div class="shead"><h2>💬 Góp ý bài đánh</h2><span class="sub">${online?'Lưu chung cho mọi người dùng':'⚠️ Đang lưu trên máy bạn (máy chủ chưa bật)'}</span></div>
   <div class="note">Bạn biết kèo khắc chế, cặp bài hay bài đánh mạnh? Gửi lên đây. Góp ý được nhiều người <b>👍</b> sẽ được thuật toán tính điểm cao hơn khi gợi ý pick; bị <b>👎</b> nhiều sẽ bị bỏ qua và ẩn.</div>
   <div class="ucform">
     <div class="uctypes">${TYPES.map(([k,l])=>`<button class="mt ${F.type===k?'on':''}" data-uct="${k}">${l}</button>`).join('')}</div>
     <div class="ucrow">${F.type==='counter'?`${hin('a',F.a,'Tướng của bạn')}<span class="ucs">khắc chế</span>${hin('b',F.b,'Tướng đối thủ')}`
       :F.type==='combo'?`${hin('a',F.a,'Tướng 1')}<span class="ucs">+</span>${hin('b',F.b,'Tướng 2')}`
       :F.heroes.map((h,i)=>hin('h'+i,h,LANES[i][1])).join('')+`<select class="ucin" data-uck="arch"><option value="">Lối đánh…</option>${Object.entries(ARCH).map(([k,a])=>`<option value="${k}" ${F.arch===k?'selected':''}>${a.ic} ${a.n}</option>`).join('')}</select>`}</div>
     <textarea class="ucin" data-uck="text" rows="3" maxlength="280" placeholder="${F.type==='counter'?'Khắc bằng chiêu nào, lúc nào? VD: Giữ chiêu 2 choáng, chờ Nakroth lướt vào rồi mới tung…':F.type==='combo'?'Phối hợp ra sao? VD: Thane mở giao tranh, Lorion nối chiêu cuối gom cả đội…':'Cách đánh của đội hình: ai mở giao tranh, đẩy trụ thế nào, điều kiện thắng…'}">${esc(F.text)}</textarea>
     <div class="ucrow"><input class="ucin" data-uck="nick" maxlength="24" value="${esc(F.nick)}" placeholder="Tên hiển thị (không bắt buộc)"><button class="pickbtn" id="ucsend" style="width:auto;padding:9px 18px">Gửi góp ý</button></div>
     ${F.msg?`<div class="ucmsg">${F.msg}</div>`:''}
   </div>
   <div class="ucfilter"><div class="uctypes">${[['all','Tất cả'],...TYPES].map(([k,l])=>`<button class="mt ${F.filter===k?'on':''}" data-ucf="${k}">${l}</button>`).join('')}</div>
     <input class="ucin" id="ucq" value="${esc(F.q)}" placeholder="Lọc theo tướng…"><button class="mt ${F.sort==='hot'?'on':''}" data-ucs="hot">🔥 Nhiều 👍</button><button class="mt ${F.sort==='new'?'on':''}" data-ucs="new">🆕 Mới</button></div>
   <div class="uclist">${!loaded?'<div class="empty">Đang tải…</div>':list.length?list.slice(0,60).map(itemHTML).join(''):'<div class="empty">Chưa có góp ý nào ở đây — hãy là người đầu tiên!</div>'}</div>
   <datalist id="uc-heroes">${HEROES.slice().sort((a,b)=>a.name.localeCompare(b.name,'vi')).map(h=>`<option value="${esc(h.name)}">`).join('')}</datalist>`;
}
function readForm(){document.querySelectorAll('[data-uck]').forEach(i=>{const k=i.dataset.uck,v=i.value;
  if(k==='a'||k==='b')F[k]=byName(v)||v;else if(k[0]==='h'&&k.length===2)F.heroes[+k[1]]=byName(v)||v;else F[k]=v})}
async function submit(){
  readForm();F.msg='';const bad=v=>v&&!BY[v];
  const body={action:'add',type:F.type,text:F.text.trim(),nick:F.nick.trim()};
  if(F.type==='comp'){const hs=F.heroes.filter(Boolean);if(hs.some(bad)){F.msg='⚠️ Có tên tướng không đúng — chọn từ danh sách gợi ý';return render()}body.heroes=hs;body.arch=F.arch}
  else{if(!BY[F.a]||!BY[F.b]){F.msg='⚠️ Chọn đủ 2 tướng từ danh sách gợi ý';return render()}body.a=F.a;body.b=F.b}
  if(body.text.length<8){F.msg='⚠️ Viết lý do/cách đánh dài hơn chút (ít nhất 8 ký tự)';return render()}
  LS('bp-lq-nick',body.nick);
  try{const d=await send(body);if(d.item&&online)items.unshift(d.item);if(d.item)myVotes[d.item.id]=1;LS('bp-lq-votes',myVotes);
    index();F.text='';F.a=F.b='';F.heroes=['','','','',''];F.arch='';F.msg='✅ Đã gửi! Góp ý của bạn đã được tính vào gợi ý.';F.filter='all';F.sort='new'}
  catch(e){F.msg='⚠️ '+esc(e.message)}
  render();
}
async function vote(id,v){
  const cur=myVotes[id]||0;const nv=cur===v?0:v;
  try{const d=await send({action:'vote',id,v:nv});const it=items.find(x=>x.id===id);if(it&&d.ok){it.up=d.up;it.down=d.down}
    if(nv)myVotes[id]=nv;else delete myVotes[id];LS('bp-lq-votes',myVotes);index();render()}
  catch(e){F.msg='⚠️ '+esc(e.message);render()}
}
document.addEventListener('click',e=>{const g=s=>e.target.closest(s);let x;
  if(x=g('[data-uct]')){readForm();F.type=x.dataset.uct;F.msg='';render();return}
  if(x=g('[data-ucf]')){F.filter=x.dataset.ucf;render();return}
  if(x=g('[data-ucs]')){F.sort=x.dataset.ucs;render();return}
  if(x=g('[data-ucv]')){const [id,v]=x.dataset.ucv.split(':');vote(id,+v);return}
  if(g('#ucsend')){submit();return}
  if(x=g('[data-ucadd]')){/* nút "Góp kèo" trên thẻ gợi ý: điền sẵn tướng đó khắc tướng đối thủ cùng đường */
    readForm();F.type='counter';F.a=x.dataset.ucadd;F.b=st.enemy[st.focus]||'';F.msg='';st.mode='cong';render();window.scrollTo({top:document.getElementById('suggest').offsetTop-60,behavior:'smooth'});return}
},true);
document.addEventListener('input',e=>{if(e.target.id==='ucq'){F.q=e.target.value;const el=document.getElementById('suggest');const pos=e.target.selectionStart;renderTab(el);const q=document.getElementById('ucq');q.focus();q.setSelectionRange(pos,pos)}});
load();
})();
