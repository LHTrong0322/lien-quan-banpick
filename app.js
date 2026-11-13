/* Ban-Pick Liên Quân — logic
   Đặc điểm tướng (trường f trong data.js):
   t đỡ đòn · c có khống chế cứng · q khống chế chắc chắn (dễ trúng, khó né) · g mở giao tranh
   d lướt/cơ động · b sát thủ dồn sát thương · s hồi máu/hút máu · h hồi máu/khiên cho đồng đội
   x sát thương chuẩn hoặc theo % máu (xé tank) · w miễn/giải khống chế · u không thể bị chọn làm mục tiêu
   i tàng hình · n chiêu vận (đứng yên tung chiêu) · m sát thương phép · r đánh xa · p cấu rỉa tầm xa
   k thả diều (xạ thủ cơ động) · e mạnh đầu trận · l mạnh cuối trận */

const LANES = [["T","Tà Thần","⚔️"],["J","Rừng","🌲"],["M","Giữa","🔮"],["A","Rồng","🏹"],["S","Trợ thủ","🛡️"]];
const LN = Object.fromEntries(LANES.map(l=>[l[0],l[1]]));
const LI = Object.fromEntries(LANES.map(l=>[l[0],l[2]]));
const LK = LANES.map(l=>l[0]);
const BY = Object.fromEntries(HEROES.map(h=>[h.id,h]));
HEROES.forEach(h=>h.F=new Set(h.f));
const has=(h,c)=>h.F.has(c);

const CNT={}; COUNTERS.forEach(([a,b,s])=>{(CNT[a]=CNT[a]||{})[b]=s});
const SYN={}; SYNERGY.forEach(([a,b,s])=>{(SYN[a]=SYN[a]||{})[b]=s;(SYN[b]=SYN[b]||{})[a]=s});
/* Kèo quen thuộc bổ sung (tướng → những tướng nó khắc chế) */
const KNOWN={arum:["nakroth","murad","quillen","keera","florentino"],aleister:["murad","nakroth","florentino","zill","zata"],
  grakk:["valhein","telannas","yorn","krixi","elsu"],hayate:["thane","maloch","taara","toro","arthur","biron"],
  maloch:["taara","thane","arthur","biron"],chaugnar:["kahlii","aleister","grakk","arum"],murad:["krixi","kahlii","telannas","valhein"],
  nakroth:["valhein","yorn","elsu","ignis"],quillen:["elsu","telannas","krixi","yorn"],kriknak:["ignis","natalya","krixi"],
  toro:["nakroth","zill","murad","azzenka"],omen:["florentino","yena","allain"],thorne:["taara","thane","toro"],lorion:["murad","zill"],
  veera:["mganga"],keera:["dextra","lauriel"]};

/* ===== Dữ liệu giải đấu ===== */
const RG={vn:'🇻🇳',th:'🇹🇭',tw:'🇹🇼'};
const GAMES=Object.fromEntries(REGIONS.map(r=>[r[0],r[2]]));
function presence(id){const d=PRO[id];if(!d)return null;const o={};REGIONS.forEach(([r])=>{const [p,w,b]=d[r]||[0,0,0];o[r]={pb:Math.round((p+b)/GAMES[r]*100),wr:p?Math.round(w/p*100):null,p,b}});return o}
const CMB={};COMBOS.forEach(([a,b,n,w,rg])=>{(CMB[a]=CMB[a]||{})[b]={n,w,rg};(CMB[b]=CMB[b]||{})[a]={n,w,rg}});
const comboWR=c=>(c.w+3)/(c.n+6);
const flags=rg=>rg.match(/../g).map(r=>RG[r]).join('');
const isSquishy=h=>!has(h,'t')&&(h.lanes[0]==='A'||h.lanes[0]==='M');
const N=h=>`<b>${h.name}</b>`;

/* ===== So kèo 1 tướng (C) với 1 tướng (E) ===== */
function matchup(C,E){
  const r=[];let s=0;const add=(v,t)=>{s+=v;r.push([v,t])};
  const cs=CNT[C.id]?.[E.id], es=CNT[E.id]?.[C.id];
  if(cs) add(cs*.4,`Kèo đấu cộng đồng: khắc chế ${N(E)}`);
  if(es) add(-es*.4,`Kèo đấu cộng đồng: bị ${N(E)} khắc chế`);
  if(KNOWN[C.id]?.includes(E.id)&&!cs) add(2.5,`Kèo khắc chế quen thuộc với ${N(E)}`);
  if(KNOWN[E.id]?.includes(C.id)&&!es) add(-2.5,`Bị ${N(E)} khắc chế`);
  if(has(E,'b')){ if(has(C,'q')) add(2,`Khống chế chắc tay, bắt được ${N(E)} khi lao vào`); else if(has(C,'c')) add(.8,`Có khống chế để giữ ${N(E)}`); }
  if(has(E,'t')&&has(C,'x')) add(2.5,`Sát thương chuẩn/theo % máu, xé tank ${N(E)}`);
  if(isSquishy(E)&&!has(E,'d')&&has(C,'b')) add(2,`Lao vào hạ nhanh ${N(E)} (máu mỏng, ít chiêu thoát)`);
  if(has(E,'p')&&(has(C,'g')||(has(C,'d')&&has(C,'b')))) add(1.2,`Áp sát nhanh, không để ${N(E)} cấu rỉa từ xa`);
  if(has(E,'s')&&(has(C,'x')||has(C,'b'))) add(.7,`Dồn sát thương nhanh, át khả năng hồi máu của ${N(E)}`);
  if((has(E,'u')||has(E,'i'))&&has(C,'q')) add(1,`Giữ được ${N(E)} trước khi kịp né/tàng hình`);
  if(has(E,'q')&&has(C,'w')) add(1.5,`Có chiêu miễn khống chế, không sợ bị ${N(E)} giữ chân`);
  if(has(E,'n')&&has(C,'c')) add(1.5,`Ngắt được chiêu vận (đứng yên tung chiêu) của ${N(E)}`);
  if(has(E,'b')&&(has(C,'t')||has(C,'h'))) add(.8,`Trâu/có khiên, chịu được đợt dồn của ${N(E)}`);
  if(has(E,'k')&&has(C,'g')) add(.8,`Có chiêu mở giao tranh, bắt được ${N(E)} đang thả diều`);
  if(has(E,'l')&&has(C,'e')) add(.8,`Mạnh đầu trận, ép ${N(E)} trước khi kịp lên đồ`);
  if(isSquishy(C)&&has(E,'b')) add(-1.2,`Máu mỏng, dễ bị ${N(E)} ám sát`);
  if(has(C,'t')&&has(E,'x')) add(-1.5,`${N(E)} xé tank rất đau`);
  if(has(C,'n')&&has(E,'q')) add(-1.2,`Chiêu vận dễ bị ${N(E)} ngắt`);
  if(has(C,'b')&&!has(C,'w')&&has(E,'q')) add(-.6,`Lao vào dễ dính khống chế của ${N(E)}`);
  return {s,r};
}

/* ===== Chấm điểm 1 tướng cho 1 đường của đội bạn ===== */
function rate(C,lane){
  let s=C.lanes[0]===lane?.4:-1.2;const r=[];
  const add=(v,t)=>{s+=v;if(t)r.push([v,t])};
  add(C.meta*.7,C.tier==='S'||C.tier==='A'?`Tier ${C.tier} meta (giải đấu VN·TH·TW + rank VN·TH)`:null);
  LK.forEach(k=>{const e=st.enemy[k];if(!e)return;const w=k===lane?1.6:1;const m=matchup(C,BY[e]);m.r.forEach(([v,t])=>add(v*w,t))});
  const allies=LK.filter(k=>k!==lane&&st.ally[k]).map(k=>BY[st.ally[k]]);
  allies.forEach(a=>{const v=SYN[C.id]?.[a.id];if(v)add(v*.25,`Kết hợp tốt với đồng đội ${N(a)}`);
    const c=CMB[C.id]?.[a.id];if(c){const wr=comboWR(c);if(wr>.52)add(Math.min(3,(wr-.5)*12*Math.min(1,c.n/15)),`Cặp bài pro với ${N(a)}: thắng ${c.w}/${c.n} ván ${flags(c.rg)}`);else if(wr<.42)add(-1,`Đi cùng ${N(a)} ở giải chỉ thắng ${c.w}/${c.n} ván`)}});
  if(allies.length){
    const mag=allies.filter(a=>has(a,'m')).length,phy=allies.length-mag;
    if(!allies.some(a=>has(a,'t'))&&has(C,'t')) add(1.5,'Đội đang thiếu người đỡ đòn — bạn gánh tuyến trước');
    if(phy>=2&&mag===0&&has(C,'m')) add(1.2,'Đội toàn sát thương vật lý — bạn bù sát thương phép');
    if(mag>=2&&phy===0&&!has(C,'m')) add(1.2,'Đội toàn sát thương phép — bạn bù sát thương vật lý');
    if(!allies.some(a=>has(a,'q'))&&has(C,'q')) add(1,'Đội thiếu khống chế — bạn bổ sung chiêu giữ chân');
    if(!allies.some(a=>has(a,'g'))&&has(C,'g')&&allies.length>=2) add(.6,'Đội thiếu người mở giao tranh');
    const carry=allies.find(a=>isSquishy(a));
    if(carry&&(has(C,'h')||(has(C,'t')&&has(C,'q')))&&lane==='S') add(.8,`Bảo kê tốt cho ${N(carry)}`);
  }
  return {h:C,s,r};
}
function ranked(lane){
  const u=used();
  return HEROES.filter(h=>h.lanes.includes(lane)&&!u.has(h.id)).map(h=>rate(h,lane)).sort((a,b)=>b.s-a.s);
}
function tiers(list){
  const t={S:[],A:[],B:[]};
  list.forEach((x,i)=>{ if(i<3&&x.s>=1.2)t.S.push(x); else if(i<8&&x.s>=.4)t.A.push(x); else if(i<14&&x.s>=0)t.B.push(x); });
  return t;
}
/* Gợi ý cấm: tướng nguy hiểm nhất với đội bạn */
function banList(){
  const u=used();const allies=LK.filter(k=>st.ally[k]).map(k=>BY[st.ally[k]]);
  return HEROES.filter(h=>!u.has(h.id)).map(E=>{
    let s=E.meta*1.5;const r=[];if(E.tier==='S'||E.tier==='A'){const pr=presence(E.id);const vb=E.rank.vn?` · rank VN cấm ${E.rank.vn[2]}%`:'';r.push([E.meta,`Tier ${E.tier} meta${pr?' — giải đấu bị cấm '+Object.entries(pr).map(([k,v])=>RG[k]+' '+Math.round(v.b/GAMES[k]*100)+'%').join(' '):''}${vb}`])}
    allies.forEach(a=>{const m=matchup(E,a);if(m.s>0){s+=m.s*.6;const best=m.r.filter(x=>x[0]>0).sort((x,y)=>y[0]-x[0])[0];if(best)r.push([m.s,best[1]])}});
    const ens=LK.filter(k=>st.enemy[k]).map(k=>BY[st.enemy[k]]);
    ens.forEach(e=>{const v=SYN[E.id]?.[e.id];if(v){s+=v*.2;r.push([v*.2,`Kết hợp mạnh với ${N(e)} bên đối thủ`])}
      const c=CMB[E.id]?.[e.id];if(c&&comboWR(c)>.55){const v2=(comboWR(c)-.5)*10;s+=v2;r.push([v2,`Cặp bài pro với ${N(e)} (đối thủ đã pick): thắng ${c.w}/${c.n} ván`])}});
    return {h:E,s,r};
  }).sort((a,b)=>b.s-a.s).slice(0,12);
}

/* ===== Trạng thái ===== */
const blank=()=>({ally:{T:null,J:null,M:null,A:null,S:null},enemy:{T:null,J:null,M:null,A:null,S:null},bans:{ally:[null,null,null,null,null],enemy:[null,null,null,null,null]}});
let st=Object.assign(blank(),{focus:'T',mode:'pick',target:null,tierLane:'T'});
let history=[];
try{const s=JSON.parse(localStorage.getItem('bp-lq')||'null');if(s&&s.ally)Object.assign(st,s,{target:null})}catch(e){}
const save=()=>{try{localStorage.setItem('bp-lq',JSON.stringify({ally:st.ally,enemy:st.enemy,bans:st.bans,focus:st.focus}))}catch(e){}};
const snap=()=>{history.push(JSON.stringify({ally:st.ally,enemy:st.enemy,bans:st.bans}));if(history.length>40)history.shift()};
const used=()=>new Set([...Object.values(st.ally),...Object.values(st.enemy),...st.bans.ally,...st.bans.enemy].filter(Boolean));

/* Thứ tự ban-pick 10 cấm như trong game (đội bạn = phe xanh, chọn trước) */
const SEQ=[["ban","ally"],["ban","enemy"],["ban","ally"],["ban","enemy"],["ban","ally"],["ban","enemy"],
  ["pick","ally"],["pick","enemy"],["pick","enemy"],["pick","ally"],["pick","ally"],["pick","enemy"],
  ["ban","enemy"],["ban","ally"],["ban","enemy"],["ban","ally"],
  ["pick","enemy"],["pick","ally"],["pick","ally"],["pick","enemy"]];
function step(){
  const c={ban:{ally:0,enemy:0},pick:{ally:0,enemy:0}};
  const filled={ban:{ally:st.bans.ally.filter(Boolean).length,enemy:st.bans.enemy.filter(Boolean).length},
    pick:{ally:LK.filter(k=>st.ally[k]).length,enemy:LK.filter(k=>st.enemy[k]).length}};
  for(const [kind,side] of SEQ){c[kind][side]++;if(c[kind][side]>filled[kind][side])return {kind,side,n:c[kind][side]};}
  return null;
}
function currentTarget(){
  if(st.target)return st.target;
  const sp=step();if(!sp)return null;
  if(sp.kind==='ban')return {kind:'ban',side:sp.side,idx:st.bans[sp.side].findIndex(b=>!b)};
  return {kind:'pick',side:sp.side,lane:null};
}
function bestLane(h,side){
  const empty=LK.filter(k=>!st[side][k]);
  return h.lanes.find(l=>empty.includes(l))||empty[0];
}
function place(id,t){
  snap();
  if(t.kind==='ban')st.bans[t.side][t.idx]=id;
  else{const lane=t.lane||bestLane(BY[id],t.side);st[t.side][lane]=id;if(t.side==='ally'&&st.focus===lane){const nx=LK.find(k=>!st.ally[k]);if(nx)st.focus=nx}}
  st.target=null;save();closeModal();render();
}

/* ===== Hiển thị ===== */
const pic=h=>h.img?`<img src="${h.img}" alt="${h.name}" loading="lazy" onerror="this.outerHTML='<div class=ini>${h.name.slice(0,2).toUpperCase()}</div>'">`:`<div class="ini">${h.name.slice(0,2).toUpperCase()}</div>`;
const TC={S:'var(--S)',A:'var(--A)',B:'var(--B)'};

function renderBans(){
  const t=currentTarget();
  ['ally','enemy'].forEach(side=>{
    document.getElementById('bans-'+side).innerHTML=st.bans[side].map((b,i)=>{
      const cur=t&&t.kind==='ban'&&t.side===side&&t.idx===i;
      return `<button class="ban ${b?'filled':''} ${cur?'cur':''}" data-ban="${side}:${i}" title="${b?BY[b].name:'Cấm '+(i+1)}">${b?pic(BY[b]):(i+1)}</button>`}).join('');
  });
}
function renderTeams(){
  const t=currentTarget();
  ['ally','enemy'].forEach(side=>{
    document.getElementById('team-'+side).innerHTML=LANES.map(([k,l,ic])=>{
      const id=st[side][k],h=id&&BY[id];
      const cur=t&&t.kind==='pick'&&t.side===side&&(t.lane===k||(!t.lane&&!id&&side==='ally'&&k===st.focus));
      const foc=side==='ally'&&st.focus===k&&st.mode==='pick';
      return `<button class="slot ${cur?'cur':''} ${foc&&!cur?'focus':''}" data-slot="${side}:${k}">
        <div class="pic">${h?pic(h):`<span class="empty-ic">${ic}</span>`}</div>
        <div class="info"><div class="lane">${ic} ${l}</div>${h?`<div class="nm">${h.name}</div>`:`<div class="ph">Bấm để chọn</div>`}</div></button>`}).join('');
  });
}
function renderTurn(){
  const el=document.getElementById('turn');const sp=step();
  if(!sp){el.className='turn done';el.innerHTML='✔ Hoàn tất ban-pick';return}
  const who=sp.side==='ally'?'Đội bạn':'Đối thủ';
  el.className='turn '+sp.side;
  el.innerHTML=`<span class="dot" style="background:${sp.side==='ally'?'var(--blue)':'var(--red)'}"></span>Lượt: ${who} ${sp.kind==='ban'?'CẤM':'CHỌN'} tướng — bấm để nhập`;
}
function why(rs,n=3,neg){
  const list=rs.filter(r=>neg?r[0]<0:r[0]>0).sort((a,b)=>neg?a[0]-b[0]:b[0]-a[0]);
  const seen=new Set();const out=[];
  for(const r of list){if(seen.has(r[1]))continue;seen.add(r[1]);out.push(r);if(out.length>=n)break}
  return out;
}
function renderCenter(){
  document.getElementById('tab-pick').classList.toggle('on',st.mode==='pick');
  document.getElementById('tab-ban').classList.toggle('on',st.mode==='ban');
  document.getElementById('tab-tier').classList.toggle('on',st.mode==='tier');
  if(st.mode==='tier'){renderTier();return}
  const lp=document.getElementById('lanepick'),el=document.getElementById('suggest');
  if(st.mode==='ban'){
    lp.innerHTML='';
    const list=banList();
    const t=currentTarget();const canBan=t&&t.kind==='ban'&&t.side==='ally';
    el.innerHTML=`<div class="shead"><h2>Nên cấm</h2><span class="sub">Tướng mạnh meta + tướng khắc chế đội bạn</span></div>
      ${canBan?'':'<div class="note">Bấm vào tướng để cấm ngay (vào ô cấm trống tiếp theo của đội bạn).</div>'}
      <div class="top3">${list.slice(0,3).map(x=>bigCard(x,'ban')).join('')}</div>
      <div class="chips">${list.slice(3).map(x=>chip(x,'ban')).join('')}</div>`;
    return;
  }
  lp.innerHTML=LANES.map(([k,l,ic])=>`<button class="lp ${st.focus===k?'on':''}" data-focus="${k}">${ic} ${l}${st.ally[k]?' <span class="ok">✔</span>':''}</button>`).join('');
  const lane=st.focus,opp=st.enemy[lane],mine=st.ally[lane];
  const anyEnemy=LK.some(k=>st.enemy[k]);
  const list=ranked(lane),tr=tiers(list);
  const avoid=list.filter(x=>x.s<0).slice(-4).reverse();
  el.innerHTML=`<div class="shead"><h2>${LI[lane]} Gợi ý đường ${LN[lane]}</h2>
      <span class="sub">${opp?`Đối đầu: <b>${BY[opp].name}</b>`:'Chưa biết đối thủ cùng đường'}${mine?` · đã chọn ${BY[mine].name}`:''}</span></div>
    ${anyEnemy?'':'<div class="note">Chưa nhập tướng đối thủ nên gợi ý đang dựa trên meta. Nhập tướng đối thủ để có gợi ý khắc chế chính xác.</div>'}
    ${tr.S.length?`<div class="top3">${tr.S.map(x=>bigCard(x,'pick','S')).join('')}</div>`:''}
    ${tr.A.length?`<div class="tierrow"><div class="tl" style="background:var(--A)">A</div><div class="chips">${tr.A.map(x=>chip(x,'pick')).join('')}</div></div>`:''}
    ${tr.B.length?`<div class="tierrow"><div class="tl" style="background:var(--B)">B</div><div class="chips">${tr.B.map(x=>chip(x,'pick')).join('')}</div></div>`:''}
    ${comboHTML(lane,list)}
    ${avoid.length&&anyEnemy?`<div class="sec">⛔ Nên tránh pick ở đường này</div><div class="chips">${avoid.map(x=>chip(x,'none',true)).join('')}</div>`:''}`;
}
/* Cặp bài: tướng đường này + đồng đội (đã pick hoặc nên pick ở đường trống) */
function comboHTML(lane,list){
  const sc=Object.fromEntries(list.map(x=>[x.h.id,x.s]));const u=used();const out=[];
  list.slice(0,25).forEach(x=>{const m=CMB[x.h.id];if(!m)return;
    Object.entries(m).forEach(([pid,c])=>{if(c.n<8||comboWR(c)<.55)return;const P=BY[pid];if(!P)return;
      const allyLane=LK.find(k=>st.ally[k]===pid);
      if(allyLane){out.push({a:x.h,b:P,c,have:true,s:x.s+comboWR(c)*4});return}
      if(u.has(pid))return;const fl=P.lanes.find(l=>l!==lane&&!st.ally[l]);if(!fl)return;
      out.push({a:x.h,b:P,c,lane2:fl,s:x.s+comboWR(c)*3});});});
  const seen=new Set(),per={};const top=out.sort((p,q)=>q.s-p.s).filter(o=>{const k=[o.a.id,o.b.id].sort().join();if(seen.has(k)||(per[o.a.id]||0)>=1)return false;seen.add(k);per[o.a.id]=(per[o.a.id]||0)+1;return true}).slice(0,4);
  if(!top.length)return '';
  return `<div class="sec">🤝 Cặp bài gợi ý (theo dữ liệu giải VN·TH·TW)</div><div class="combos">${top.map(o=>`
    <div class="combo"><div class="pair"><div class="pic">${pic(o.a)}</div><span>+</span><div class="pic ${o.have?'have':''}">${pic(o.b)}</div></div>
      <div class="cinfo"><div class="nm">${o.a.name} + ${o.b.name}</div>
      <div class="w">${o.have?`${o.b.name} đã có trong đội`:`${o.b.name} đi đường ${LN[o.lane2]}`} · thắng <b>${o.c.w}/${o.c.n}</b> ván (${Math.round(o.c.w/o.c.n*100)}%) ${flags(o.c.rg)}</div></div>
      <button class="pickbtn sm" data-act="pick" data-id="${o.a.id}">Chọn ${o.a.name}</button></div>`).join('')}</div>`;
}
function renderTier(){
  document.getElementById('lanepick').innerHTML=LANES.map(([k,l,ic])=>`<button class="lp ${st.tierLane===k?'on':''}" data-tl="${k}">${ic} ${l}</button>`).join('');
  const lane=st.tierLane||'T';
  const list=HEROES.filter(h=>h.lanes[0]===lane||(h.lanes.includes(lane)&&PRO[h.id]));
  const ord={S:0,A:1,B:2,C:3};list.sort((a,b)=>ord[a.tier]-ord[b.tier]||((PRO[b.id]||{}).score||0)-((PRO[a.id]||{}).score||0));
  const g={S:[],A:[],B:[],C:[]};list.forEach(h=>g[h.tier].push(h));
  document.getElementById('suggest').innerHTML=`<div class="shead"><h2>Tier meta — đường ${LN[lane]}</h2><span class="sub">Gộp 3 giải đấu (${REGIONS.map(r=>RG[r[0]]+' '+r[1]).join(' · ')}) + rank 🇻🇳 (tỉ lệ thắng/chọn/cấm) + rank 🇹🇭 (tier list rovmeta)</span></div>
   ${Object.entries(g).filter(([,v])=>v.length).map(([t,v])=>`<div class="tierrow"><div class="tl" style="background:${{S:'var(--S)',A:'var(--A)',B:'var(--B)',C:'#5b6690'}[t]}">${t}</div><div class="chips">${v.map(h=>{const pr=presence(h.id);const rk=h.rank||{};
     const proL=pr?Object.entries(pr).map(([r,v])=>`${RG[r]} ${v.pb}%`).join(' '):'Ít xuất hiện ở giải';
     const rkL=[rk.vn?`🇻🇳 thắng ${rk.vn[0]}% · chọn ${rk.vn[1]}% · cấm ${rk.vn[2]}%`:'',rk.th?`🇹🇭 tier ${rk.th==='S'?'S+':rk.th}`:''].filter(Boolean).join('<br>');
     return `<div class="chip"><div class="pic">${pic(h)}</div><div style="min-width:0"><div class="nm">${h.name}</div><div class="w2">🏆 Giải: ${proL}<br>⚔️ Rank: ${rkL||'—'}</div></div></div>`}).join('')}</div></div>`).join('')}
   <div class="note">Cách đọc: "🏆 Giải: 🇻🇳 68%" = tướng xuất hiện (được pick hoặc bị cấm) ở 68% số ván của giải Việt Nam. "⚔️ Rank 🇻🇳" = tỉ lệ thắng / chọn / cấm ở đấu hạng Việt Nam. Đài Loan chưa có nguồn rank công khai nên chỉ tính dữ liệu giải.</div>`;
}
function bigCard(x,act,tier){
  const max=Math.max(6,x.s);const w=why(x.r,3);const neg=why(x.r,1,true);
  return `<div class="big"><span class="tierb" style="background:${act==='ban'?'var(--red)':TC[tier]}">${act==='ban'?'⛔':tier}</span>
    <div class="row"><div class="pic">${pic(x.h)}</div><div style="min-width:0"><div class="nm">${x.h.name}</div><div class="tt">${x.h.title||''}</div>
    <div class="meter" style="margin-top:6px;width:120px;max-width:100%"><i style="width:${Math.min(100,x.s/max*100)}%"></i></div></div></div>
    <ul class="why">${w.map(r=>`<li>${r[1]}</li>`).join('')}${neg.map(r=>`<li class="neg">${r[1]}</li>`).join('')}</ul>
    <button class="pickbtn" data-act="${act}" data-id="${x.h.id}">${act==='ban'?'Cấm tướng này':'Chọn cho đường '+LN[st.focus]}</button></div>`;
}
function chip(x,act,bad){
  const w=why(x.r,1,bad)[0];
  return `<button class="chip ${bad?'bad':''}" ${act!=='none'?`data-act="${act}" data-id="${x.h.id}"`:''} title="${why(x.r,4,bad).map(r=>r[1].replace(/<[^>]+>/g,'')).join(' · ')}">
    <div class="pic">${pic(x.h)}</div><div style="min-width:0"><div class="nm">${x.h.name}</div><div class="w">${w?w[1]:'Phù hợp chung với đội hình'}</div></div></button>`;
}
function renderIntel(){
  const el=document.getElementById('intel');
  const E=LK.filter(k=>st.enemy[k]).map(k=>BY[st.enemy[k]]);
  const A=LK.filter(k=>st.ally[k]).map(k=>BY[st.ally[k]]);
  if(!E.length&&!A.length){el.innerHTML='';return}
  const prof=T=>{const mag=T.filter(h=>has(h,'m')).length;return{mag,phy:T.length-mag,cc:T.filter(h=>has(h,'q')).length,heal:T.filter(h=>has(h,'s')||has(h,'h')).length,tank:T.filter(h=>has(h,'t')).length,ass:T.filter(h=>has(h,'b')).length,poke:T.filter(h=>has(h,'p')).length,late:T.filter(h=>has(h,'l')).length}};
  const card=(title,T,isEnemy)=>{
    if(!T.length)return `<div class="card"><h3>${title}</h3><div class="empty" style="padding:12px">Chưa có tướng</div></div>`;
    const p=prof(T);
    const style=p.tank>=2?'Trâu, đánh tổng':p.ass>=2?'Bắt lẻ, ám sát':p.poke>=2?'Cấu rỉa từ xa':p.late>=2?'Chờ cuối trận':'Cân bằng';
    const tips=[];
    if(isEnemy){
      if(p.phy>=3)tips.push('Đối thủ chủ yếu gây <b>sát thương vật lý</b> → ưu tiên đồ giáp: <b>Áo choàng băng giá</b>, <b>Khiên huyền thoại</b> (giảm tốc đánh xạ thủ địch).');
      if(p.mag>=3)tips.push('Đối thủ chủ yếu gây <b>sát thương phép</b> → ưu tiên đồ giáp phép: <b>Huân chương Troy</b>, <b>Giáp Gaia</b>.');
      if(p.heal>=2)tips.push(`Có ${p.heal} tướng hồi máu → nên có người lên đồ giảm hồi máu: <b>Sách Truy Hồn</b> (tướng phép) hoặc <b>Đao Truy Hồn</b> (tướng vật lý) — giảm 40% lượng máu đối thủ hồi lại.`);
      if(p.cc>=2)tips.push(`Có ${p.cc} tướng khống chế chắc tay (choáng, kéo, áp chế) → xạ thủ/pháp sư nên mang phép bổ trợ <b>Thanh tẩy</b> (giải mọi khống chế).`);
      T.forEach(h=>{const it=COUNTER_ITEMS[h.id];if(it)tips.push(`Đồ khắc chế <b>${h.name}</b>: ${it.map(x=>'<b>'+x+'</b>').join(', ')}.`)});
      if(p.ass>=2)tips.push(`Có ${p.ass} sát thủ → tướng máu mỏng đi theo trợ thủ, tránh đi lẻ chỗ không có tầm nhìn.`);
      if(p.tank>=2)tips.push(`Có ${p.tank} tướng đỡ đòn → cần tướng gây <b>sát thương chuẩn/theo % máu</b> (máu càng nhiều mất càng nhiều).`);
      if(p.late>=2)tips.push('Đối thủ mạnh cuối trận → nên đánh nhanh, lấy Rồng/Tà Thần sớm.');
    }else{
      if(T.length>=3&&!p.tank)tips.push('Đội bạn chưa có người <b>đỡ đòn</b> — ưu tiên pick một tướng trâu.');
      if(T.length>=3&&!p.cc)tips.push('Đội bạn thiếu <b>khống chế chắc tay</b> — khó bắt sát thủ đối phương.');
      if(T.length>=3&&(p.mag===0||p.phy===0))tips.push(`Đội bạn toàn sát thương ${p.mag?'phép':'vật lý'} — đối thủ chỉ cần lên 1 loại giáp. Nên bù loại sát thương còn lại.`);
    }
    return `<div class="card"><h3>${title}</h3><div class="stats">
      <div class="stat"><div class="k">Kiểu sát thương</div><div class="v">${p.phy} vật lý · ${p.mag} phép</div><div class="bar"><i style="width:${p.phy/T.length*100}%;background:#ff9f1c"></i><i style="width:${p.mag/T.length*100}%;background:#8b6cff"></i></div></div>
      <div class="stat"><div class="k">Lối chơi</div><div class="v">${style}</div></div>
      <div class="stat"><div class="k">Khống chế · Hồi máu</div><div class="v">${p.cc} · ${p.heal}</div></div>
      <div class="stat"><div class="k">Sát thủ · Đỡ đòn</div><div class="v">${p.ass} · ${p.tank}</div></div></div>
      ${tips.length?`<ul class="tips" style="margin-top:10px">${tips.map(t=>`<li>${t}</li>`).join('')}</ul>`:''}</div>`;
  };
  el.innerHTML=card('Phân tích đối thủ',E,true)+card('Đội hình của bạn',A,false);
}
function render(){renderTurn();renderBans();renderTeams();renderCenter();renderIntel()}

/* ===== Bảng chọn tướng (popup) ===== */
let M={t:null,tab:'all',q:''};
function openModal(t){
  if(!t)return;st.target=t;M={t,tab:t.kind==='pick'?(t.lane||(t.side==='ally'?st.focus:'all')):'all',q:''};
  document.getElementById('msearch').value='';
  const side=t.side==='ally'?'<span class="side-ally">Đội bạn</span>':'<span class="side-enemy">Đối thủ</span>';
  document.getElementById('mtitle').innerHTML=t.kind==='ban'?`${side} · Cấm tướng (ô ${t.idx+1})`:`${side} · Chọn tướng${t.lane?' đường '+LN[t.lane]:''}`;
  const filled=t.kind==='ban'?st.bans[t.side][t.idx]:(t.lane&&st[t.side][t.lane]);
  document.getElementById('mclear').hidden=!filled;
  const sw=document.getElementById('mswap');
  if(t.kind==='pick'&&t.lane&&filled){sw.hidden=false;sw.innerHTML='Chuyển tướng này sang đường: '+LANES.filter(l=>l[0]!==t.lane).map(([k,l,ic])=>`<button class="mt" data-swap="${k}">${ic} ${l}${st[t.side][k]?' (đổi chỗ với '+BY[st[t.side][k]].name+')':''}</button>`).join('')}else sw.hidden=true;
  document.getElementById('modal').hidden=false;renderTeams();renderBans();renderModal();
}
function closeModal(){document.getElementById('modal').hidden=true;st.target=null;render()}
function renderModal(){
  const t=M.t,u=used();
  document.getElementById('mtabs').innerHTML=[['all','Tất cả'],...LANES].map(([k,l])=>`<button class="mt ${M.tab===k?'on':''}" data-mt="${k}">${l}</button>`).join('');
  let list=HEROES.filter(h=>(M.tab==='all'||h.lanes.includes(M.tab))&&(!M.q||norm(h.name).includes(norm(M.q))));
  let badge={},hint='';
  if(t.kind==='pick'&&t.side==='ally'){
    const lane=t.lane||(M.tab!=='all'?M.tab:st.focus);
    const rk=ranked(lane),tr=tiers(rk);['S','A','B'].forEach(k=>tr[k].forEach(x=>badge[x.h.id]=k));
    const sc=Object.fromEntries(rk.map(x=>[x.h.id,x.s]));
    list.sort((a,b)=>(sc[b.id]??-99)-(sc[a.id]??-99));
    hint=`Xếp theo mức độ khắc chế cho đường <b>${LN[lane]}</b>. Nhãn trái (S/A/B) = nên pick ván này · chữ nhỏ góc phải = tier meta giải đấu.`;
  }else if(t.kind==='ban'&&t.side==='ally'){
    const bl=banList();bl.slice(0,6).forEach(x=>badge[x.h.id]='ban');const sc=Object.fromEntries(bl.map((x,i)=>[x.h.id,100-i]));
    list.sort((a,b)=>(sc[b.id]||0)-(sc[a.id]||0)||a.name.localeCompare(b.name,'vi'));
    hint='Tướng có nhãn <b>Cấm</b> là tướng nguy hiểm nhất với đội bạn ở thời điểm này.';
  }else{list.sort((a,b)=>a.name.localeCompare(b.name,'vi'));hint=t.kind==='ban'?'Chọn tướng mà đối thủ đã cấm.':'Chọn tướng đối thủ vừa pick — tướng sẽ tự xếp vào đúng đường.';}
  document.getElementById('mhint').innerHTML=hint;
  document.getElementById('mgrid').innerHTML=list.map(h=>{
    const b=badge[h.id];
    return `<button class="hc ${u.has(h.id)?'off':''}" data-hero="${h.id}" title="${h.name} — ${h.lanes.map(l=>LN[l]).join(', ')}">
      ${b?`<span class="tb ${b==='ban'?'ban':''}" style="${b!=='ban'?'background:'+TC[b]:''}">${b==='ban'?'Cấm':b}</span>`:''}
      ${h.tier&&h.tier!=='D'?`<span class="mtier t${h.tier}" title="Tier meta giải đấu">${h.tier}</span>`:''}
      <div class="pic">${pic(h)}</div><div class="n">${h.name}</div></button>`}).join('')||'<div class="empty">Không tìm thấy tướng</div>';
}
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]/g,'');

/* ===== Sự kiện ===== */
document.addEventListener('click',e=>{
  const g=s=>e.target.closest(s);let x;
  if(x=g('[data-slot]')){const [side,lane]=x.dataset.slot.split(':');if(side==='ally')st.focus=lane;openModal({kind:'pick',side,lane});return}
  if(x=g('[data-ban]')){const [side,i]=x.dataset.ban.split(':');openModal({kind:'ban',side,idx:+i});return}
  if(x=g('[data-hero]')){place(x.dataset.hero,M.t);return}
  if(x=g('[data-mt]')){M.tab=x.dataset.mt;renderModal();return}
  if(x=g('[data-swap]')){snap();const t=M.t,to=x.dataset.swap,tmp=st[t.side][to];st[t.side][to]=st[t.side][t.lane];st[t.side][t.lane]=tmp;save();closeModal();return}
  if(x=g('[data-tl]')){st.tierLane=x.dataset.tl;render();return}
  if(x=g('[data-focus]')){st.focus=x.dataset.focus;save();render();return}
  if(x=g('[data-mode]')){st.mode=x.dataset.mode;render();return}
  if(x=g('[data-act]')){
    const id=x.dataset.id;
    if(x.dataset.act==='pick')place(id,{kind:'pick',side:'ally',lane:st.focus});
    else{const i=st.bans.ally.findIndex(b=>!b);if(i>=0)place(id,{kind:'ban',side:'ally',idx:i})}
    return;
  }
  if(g('#turn')){const t=currentTarget();if(t){if(t.kind==='ban'&&t.side==='ally')st.mode='ban';else if(t.kind==='pick'&&t.side==='ally')st.mode='pick';openModal(t)}return}
  if(g('#mclose')||e.target.id==='modal'){closeModal();return}
  if(g('#mclear')){snap();const t=M.t;if(t.kind==='ban')st.bans[t.side][t.idx]=null;else st[t.side][t.lane]=null;save();closeModal();return}
  if(g('#undo')){const h=history.pop();if(h){Object.assign(st,JSON.parse(h));save();render()}return}
  if(g('#reset')){snap();Object.assign(st,blank(),{focus:'T',mode:'pick'});save();render();return}
  if(g('#demo')){snap();Object.assign(st,blank(),{focus:'J',mode:'pick'});
    st.bans.ally=['elsu','zata','aya','taara','sinestrea'];st.bans.enemy=['toro','yue','nakroth','florentino',null];
    st.enemy={T:'yena',J:'aoi',M:'liliana',A:'violet',S:'thane'};st.ally={T:'omen',J:null,M:'lorion',A:null,S:null};save();render();return}
});
document.getElementById('msearch').addEventListener('input',e=>{M.q=e.target.value;renderModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('modal').hidden)closeModal()});
/* Tự chuyển tab gợi ý theo lượt của đội bạn */
let lastStep='';const _render=render;render=function(){const sp=step();const key=sp?sp.kind+sp.side+sp.n:'done';if(key!==lastStep){lastStep=key;if(sp&&sp.side==='ally')st.mode=sp.kind==='ban'?'ban':'pick'}_render()};
document.getElementById('upd').innerHTML='🔄 Số liệu cập nhật: <b>'+UPDATED+'</b> · tự làm mới mỗi sáng thứ Hai';
render();
