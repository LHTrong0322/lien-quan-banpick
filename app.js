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

/* Tên chiêu (dữ liệu Garena): "Chiêu 2 – Lôi động" */
const SKL=(h,k)=>h.sk&&h.sk[k]?`<b>${(h.sk[k][0]+' '+h.sk[k][1]).trim()}</b>`:null;
const EFF=(h,k)=>h.sk&&h.sk[k]?h.sk[k][2]:'';
const PV={};PROVS.forEach(([a,b,n,w])=>{(PV[a]=PV[a]||{})[b]={n,w}});
/* ===== So kèo C (tướng mình) với E (tướng đối thủ) — dựa trên hồ sơ tướng (pf) viết từ toàn bộ kỹ năng/nội tại =====
   pf.s = điểm mạnh {tag: "Chiêu N Tên (hiệu ứng)"} · pf.w = điểm yếu · pf.p = giai đoạn mạnh (e/m/l) */
const PF=h=>h.pf||{s:{},w:[],p:'m',a:''};
const hasS=(h,t)=>t in PF(h).s, hasW=(h,t)=>PF(h).w.includes(t);
const fmt=s=>{const m=s.match(/^(.+?)( \(.+\))?$/);return `<b>${m[1]}</b>${m[2]||''}`};
const firstS=(h,tags)=>{for(const t of tags)if(hasS(h,t))return t;return null};
const SK=(h,tags)=>{const t=firstS(h,tags);return t?fmt(PF(h).s[t]):null};
const SKN=(h,tags)=>{const t=firstS(h,tags);return t?`<b>${PF(h).s[t].replace(/ \(.+\)$/,'')}</b>`:null};
const CC=['ccp','ccs','cca'];
/* Luật 1: điểm mạnh của C đánh đúng điểm yếu của E */
const WR=[
 ['tru','w_tank',['tru'],2.4,(sk,n)=>`${sk} — ${n} càng lên đồ trâu càng mất nhiều máu`],
 ['sil','w_sil',['sil'],2.2,(sk,n)=>`${sk} khóa chiêu của ${n} — mất chiêu là gần như vô hại`],
 ['cha','w_cha',['ccp','sil','ccs','cca'],1.8,(sk,n,E)=>`${n} phải đứng yên khi ${E&&SKL(E,'chan')?'tung '+SKL(E,'chan'):'vận chiêu'} — dùng ${sk} ngắt ngay`],
 ['ccp','w_cc',['ccp'],2.0,(sk,n)=>`${sk} khóa thẳng ${n} — không có chiêu giải khống, dính là khó thoát`],
 ['cc','w_cc',['ccs','cca'],1.3,(sk,n)=>`Chờ ${n} dùng hết chiêu lướt rồi tung ${sk} — không có giải khống, dính là chết`],
 ['dodge','w_mob',['mob','unt','inv'],1.4,(sk,n)=>`${n} khó bắt được tướng cơ động — dùng ${sk} né chiêu rồi phản đòn`],
 ['bur','w_bur',['bur'],1.8,(sk,n)=>`${sk} dồn chết ${n} trong một combo — máu mỏng không trụ nổi`],
 ['dive','w_dive',['mob','dash','eng'],1.4,(sk,n)=>`Dùng ${sk} áp sát ${n} — tướng tay dài bị lao vào mặt là mất tác dụng`],
 ['ahl','w_heal',['ahl'],2.0,(sk,n)=>`${sk} cắt hồi máu của ${n}`],
 ['hbur','w_heal',['bur','tru'],1.0,(sk,n)=>`Dồn ${sk} hạ ${n} trong 1 nhịp, không cho kịp hồi máu (lên thêm Sách/Đao Truy Hồn)`],
 ['kite','w_kite',['pok','rng'],1.5,(sk,n)=>`${n} phải áp sát mới đánh được — giữ khoảng cách, dùng ${sk} bào máu`],
 ['kpel','w_kite',['pel'],1.2,(sk,n)=>`${sk} đẩy ${n} ra mỗi lần lao vào`],
];
/* Luật 2: điểm mạnh của C vô hiệu hóa điểm mạnh của E (phòng thủ phản công) */
const NR=[
 ['imm',['ccp','ccs','cca','sil'],['imm'],1.3,(sk,n,es)=>`${sk} — miễn nhiễm ${es||'khống chế'} của ${n}`],
 ['unt',['bur'],['unt','inv'],1.0,(sk,n,es)=>`${sk} né trọn ${es||'combo dồn sát thương'} của ${n}`],
 ['tank',['bur'],['shd','tnk'],.8,(sk,n,es)=>`${sk} chịu được ${es||'combo'} của ${n}, phản đòn khi hết chiêu`],
 ['sus',['pok'],['heal','sup'],.6,(sk,n)=>`${sk} hồi lại lượng máu bị ${n} cấu rỉa`],
 ['peng',['eng','mob'],['pel','zon','ccs','cca'],.9,(sk,n,es)=>`Phản công: chờ ${n} dùng ${es||'chiêu lao vào'} rồi tung ${sk}`],
 ['uwait',['unt'],['ccp','ccs','cca'],.8,(sk,n,es)=>`${n} có ${es||'chiêu né đòn'} — giữ ${sk}, tung ngay khi hiệu ứng vừa hết`],
 ['inv',['inv'],['rev'],1.2,(sk,n)=>`${sk} bắt được ${n} khi đang tàng hình`],
 ['rev',['unt','mob'],['rev'],.9,(sk,n,es)=>`${sk} — ${n} hết đường lẩn trốn dù có ${es||'chiêu thoát'}`],
 ['ptl',['mob'],['ccp'],1,(sk,n,es)=>`${sk} là khống chế chỉ định — ${es||'chiêu lướt'} của ${n} không né được`],
];
function edges(C,E){ // các lợi thế C có trước E
  const o=[];
  WR.forEach(([k,w,cs,v,fn])=>{if(!hasW(E,w))return;const t=firstS(C,cs);if(!t)return;o.push({k,v,sk:fmt(PF(C).s[t]),fn,E})});
  NR.forEach(([k,es,cs,v,fn])=>{const et=firstS(E,es);if(!et)return;const t=firstS(C,cs);if(!t)return;o.push({k,v,sk:fmt(PF(C).s[t]),es:SKN(E,[et]),fn,E})});
  if(hasW(E,'w_early')&&PF(C).p==='e')o.push({k:'early',v:1.2,fn:(sk,n)=>`Mạnh đầu trận — ép ${n} trước phút 8 khi chưa đủ đồ`});
  if(hasW(E,'w_late')&&PF(C).p==='l')o.push({k:'late',v:1,fn:(sk,n)=>`Về cuối trận vượt trội ${n}`});
  const seen=new Set();return o.sort((a,b)=>b.v-a.v).filter(x=>{const key=x.sk||x.k;if(seen.has(key))return false;seen.add(key);return true});
}
const DIM=[1,.6,.35,.2,.1];
function matchup(C,E){
  const r=[];let s=0;const n=N(E);
  const pos=edges(C,E),neg=edges(E,C);
  pos.forEach((x,i)=>{const v=x.v*(DIM[i]||0);s+=v;if(i<3)r.push([v,x.fn(x.sk,n,x.es,E),x.k+'|'+(x.sk||''),ns=>x.fn(x.sk,ns,null,null),E.name])});
  neg.forEach((x,i)=>{const v=-.8*x.v*(DIM[i]||0);s+=v;if(i<2)r.push([v,x.sk?`Dễ bị ${n} khắc chế bằng ${x.sk}`:`${n} ${x.k==='early'?'mạnh đầu trận hơn':'mạnh cuối trận hơn'}`])});
  // Bằng chứng dữ liệu: bảng kèo VN, đối đầu trực tiếp ở giải
  const cs=CNT[C.id]?.[E.id], es=CNT[E.id]?.[C.id], pv=PV[C.id]?.[E.id];
  const mech=pos.length>0;
  const pvTxt=pv&&pv.w/pv.n>=.55?` · ở giải thắng ${pv.w}/${pv.n} ván`:'';
  if(cs) s+=cs*.35, mech||r.push([cs*.35,`Khắc chế ${n}: ${PF(C).a.toLowerCase()}${pvTxt}`]);
  if(KNOWN[C.id]?.includes(E.id)&&!cs){s+=2;mech||r.push([2,`Khắc chế ${n}: ${PF(C).a.toLowerCase()}`])}
  if(pv&&pv.n>=5){const wr=(pv.w+2)/(pv.n+4);if(wr>.6){const v=(wr-.5)*8;s+=v;if(mech)r.push([v*.5,`Ở giải ${C.name} gặp ${n} thắng ${pv.w}/${pv.n} ván`])}else if(wr<.4){const v=(wr-.5)*8;s+=v;r.push([v,`Ở giải ${C.name} gặp ${n} chỉ thắng ${pv.w}/${pv.n} ván`])}}
  if(es){s-=es*.35;r.push([-es*.35,`Bị ${n} khắc chế`])}
  if(KNOWN[E.id]?.includes(C.id)&&!es){s-=2;r.push([-2,`Bị ${n} khắc chế`])}
  return {s,r};
}

/* ===== Lối đánh đội hình (archetype) ===== */
const ARCH={
 push:{n:'Đẩy trụ nhanh',ic:'🏰',w:{psh:1.5,clr:1,pok:.4,rng:.3}},
 dive:{n:'Lao vào bắt chủ lực',ic:'🗡️',w:{eng:1,mob:.8,dash:.4,bur:1,imm:.3}},
 poke:{n:'Cấu rỉa từ xa',ic:'🎯',w:{pok:1.2,rng:1,zon:.5,clr:.3}},
 fight:{n:'Giao tranh tổng',ic:'💥',w:{cca:1.3,zon:.8,eng:.6,tnk:.5,sup:.3}},
 protect:{n:'Bảo kê chủ lực',ic:'🛡️',w:{sup:1.2,shd:.6,pel:1,glb:.4}},
 split:{n:'Chia đường, đi lẻ',ic:'🔀',w:{spl:1.5,mob:.3,glb:.3}},
 counter:{n:'Phòng thủ phản công',ic:'🔄',w:{pel:1,zon:.8,ccp:.6,ccs:.4,clr:.6,imm:.2}},
 pick:{n:'Bắt lẻ',ic:'🪤',w:{ccp:1,rev:1,glb:.8,mob:.5,inv:.8}},
};
/* lối đánh nào khắc lối nào */
const BEATS={dive:['poke','split'],counter:['dive','fight'],poke:['counter','fight','protect'],fight:['split','pick'],protect:['dive','pick'],push:['protect','split','counter'],split:['fight'],pick:['poke','push']};
const contrib=(h,a)=>{let v=Object.entries(ARCH[a].w).reduce((s,[t,v])=>s+(hasS(h,t)?v:0),0);
  if(a==='protect'&&PF(h).p==='l'&&hasS(h,'dps'))v+=1;
  if(a==='dive'&&hasS(h,'bur')&&!hasS(h,'mob')&&!hasS(h,'dash')&&!hasS(h,'eng'))v-=1; // dồn sát thương nhưng không áp sát được thì không phải lối lao vào
  return v};
function archOf(T){const o={};Object.keys(ARCH).forEach(a=>o[a]=T.reduce((s,h)=>s+contrib(h,a),0));
  if(!T.some(h=>PF(h).p==='l'&&hasS(h,'dps')))o.protect*=.5;
  return Object.entries(o).sort((x,y)=>y[1]-x[1])}
const keyH=(T,a,n=3)=>T.filter(h=>Object.entries(ARCH[a].w).some(([t,v])=>v>=.8&&hasS(h,t))).map(h=>[h,contrib(h,a)]).filter(x=>x[1]>=.8).sort((x,y)=>y[1]-x[1]).slice(0,n).map(x=>x[0]);
const bestTag=(h,a)=>{const t=Object.entries(ARCH[a].w).sort((x,y)=>y[1]-x[1]).map(x=>x[0]).find(t=>hasS(h,t));return t?SKN(h,[t]):''};
function planText(a,T){
  const k=keyH(T,a),nm=k.map(h=>`<b>${h.name}</b>`).join(', ')||'cả đội';const sk=h=>h?bestTag(h,a):'';
  switch(a){
   case 'push':return `Gom lính đẩy liên tục, phá trụ ngoài trước phút 8. ${nm} dẫn lính vào trụ, không cần giao tranh — ép đối thủ phải ra thủ, rừng tranh thủ lấy Rồng/Tà Thần lúc đó.`;
   case 'dive':return `${nm} vào cùng một lúc (${k.map(sk).filter(Boolean).slice(0,2).join(' → ')}), nhắm thẳng xạ thủ/pháp sư địch. Chờ đối thủ dùng phép bổ trợ/chiêu thoát rồi mới lao.`;
   case 'poke':return `Bào máu trước mỗi mục tiêu lớn bằng ${k.map(sk).filter(Boolean).slice(0,3).join(', ')}; chỉ giao tranh khi địch đã mất 30–40% máu. Không để đối thủ áp sát.`;
   case 'fight':return `Đánh tổng ở khe hẹp/cửa rừng, nối ${k.map(sk).filter(Boolean).slice(0,3).join(' → ')} lên cụm đối thủ. Đi 5 người cùng nhau, tránh bị bắt lẻ trước combat.`;
   case 'protect':{const c=T.find(h=>PF(h).p==='l'&&hasS(h,'dps'));return `Cả đội xoay quanh <b>${c?c.name:'chủ lực'}</b>; ${nm} giữ ${k.map(sk).filter(Boolean).slice(0,2).join(', ')} để chặn sát thủ. Kéo trận về cuối, chỉ đánh khi chủ lực đủ 3 món.`}
   case 'split':return `${nm} đi lẻ một đường biên, 4 người còn lại giữ thế ở đường đối diện, không giao tranh 4v5. Đối thủ cử người đi chặn thì đội đánh mục tiêu bên kia.`;
   case 'counter':return `Không chủ động lao vào. Đứng sau trụ/sau tầm nhìn, chờ đối thủ mở combat rồi dùng ${k.map(sk).filter(Boolean).slice(0,3).join(', ')} phản công. Thắng giao tranh là lập tức đẩy trụ hoặc lấy Rồng.`;
   case 'pick':return `Cắm mắt sâu rừng địch; ${nm} (${k.map(sk).filter(Boolean).slice(0,2).join(', ')}) bắt người đi lẻ, hơn người rồi mới đánh mục tiêu.`;
  }
}
/* Cặp bài theo chất tướng */
function pairSyn(a,b){
  const R=[];const t=(x,y,v,lb,fn)=>{if(x&&y)R.push({v,lb,t:fn(x,y)})};
  const one=(A,B)=>{
    t(SKN(A,['eng','ccp','cca']),SKN(B,['bur','zon']),1.4,'Mở giao tranh',(x,y)=>`${A.name} mở bằng ${x} → ${B.name} dồn ${y}`);
    t(SKN(A,['cca']),SKN(B,['zon','cca']),1,'Giao tranh tổng',(x,y)=>`Combo diện rộng: ${x} + ${y}`);
    if(PF(B).p==='l'&&hasS(B,'dps')&&(A.lanes[0]==='S'||hasS(A,'sup')||hasS(A,'tnk')))t(SKN(A,['sup','shd','pel']),SKN(B,['dps']),1.3,'Bảo kê',(x,y)=>`${A.name} bảo kê bằng ${x} để ${B.name} xả ${y}`);
    t(SKN(A,['psh']),SKN(B,['psh','clr']),1.2,'Đẩy trụ',()=>`Cặp đẩy trụ: ${A.name} + ${B.name} dọn lính, phá trụ rất nhanh — ép đối thủ phải ra thủ`);
    t(SKN(A,['glb']),SKN(B,['mob','bur','spl']),1,'Hỗ trợ toàn bản đồ',(x,y)=>`${A.name} dùng ${x} hỗ trợ ${B.name} từ khắp bản đồ`);
    t(SKN(A,['rev']),SKN(B,['bur']),1,'Bắt lẻ',(x,y)=>`${A.name} lộ diện bằng ${x}, ${B.name} lao vào dứt điểm bằng ${y}`);
    t(SKN(A,['ccp']),SKN(B,['tru','bur']),.8,'Bắt lẻ',(x,y)=>`${x} của ${A.name} giữ mục tiêu cho ${B.name} tung ${y}`);
    t(SKN(A,['pel','zon']),SKN(B,['pel','zon','ccp']),.6,'Phòng thủ phản công',(x,y)=>`${x} + ${y} chặn mọi pha lao vào, rồi phản công`);
  };
  one(a,b);one(b,a);
  R.sort((x,y)=>y.v-x.v);return R[0]?{v:R[0].v+(R[1]?R[1].v*.3:0),t:R[0].t,lb:R[0].lb}:null;
}

/* ===== Chấm điểm 1 tướng cho 1 đường của đội bạn ===== */
function rate(C,lane){
  let s=C.lanes[0]===lane?.4:-1.8;const r=[];
  const add=(v,t)=>{s+=v;if(t)r.push([v,t])};
  add(C.meta*.7,null);
  const grp={};
  LK.forEach(k=>{const e=st.enemy[k];if(!e)return;const w=k===lane?1.6:1;const m=matchup(C,BY[e]);s+=m.s*w;
    m.r.forEach(([v,t,key,sh,en])=>{if(key&&v>0){const g=grp[key]=grp[key]||{v:0,mx:0,t,sh,ns:[]};g.v+=v*w;g.mx=Math.max(g.mx,v*w);g.ns.push('<b>'+en+'</b>');}else r.push([v*w,t])})});
  /* cùng một lợi thế đánh nhiều tướng: tính giảm dần để tướng 1 chiêu mạnh không lấn át */
  Object.values(grp).forEach(g=>{const cap=g.mx*1.7;if(g.v>cap){s-=g.v-cap;g.v=cap}r.push([g.v,g.ns.length>1?g.sh(g.ns.join(' / ')):g.t])});
  const allies=LK.filter(k=>k!==lane&&st.ally[k]).map(k=>BY[st.ally[k]]);
  allies.forEach(a=>{const v=SYN[C.id]?.[a.id];if(v)add(v*.25,`Phối hợp tốt với ${N(a)}${has(a,'q')&&has(C,'b')?': nối '+SKL(a,'cc')+' của '+a.name+' với combo dồn sát thương':has(C,'q')&&(has(a,'b')||isSquishy(a))?': '+SKL(C,'cc')+' giữ mục tiêu cho '+a.name+' dồn sát thương':''}`);
    const c=CMB[C.id]?.[a.id];if(c){const wr=comboWR(c);if(wr>.52)add(Math.min(3,(wr-.5)*12*Math.min(1,c.n/15)),`Cặp bài pro với ${N(a)}: thắng ${c.w}/${c.n} ván ${flags(c.rg)}`);else if(wr<.42)add(-1,`Đi cùng ${N(a)} ở giải chỉ thắng ${c.w}/${c.n} ván`)}});
  allies.forEach(a=>{if(SYN[C.id]?.[a.id]||CMB[C.id]?.[a.id])return;const ps=pairSyn(C,a);if(ps&&ps.v>=1)add(ps.v*.45,`Cặp bài với ${N(a)}: ${ps.t}`)});
  const ens=LK.filter(k=>st.enemy[k]).map(k=>BY[st.enemy[k]]);
  if(allies.length>=2){
    const top=archOf(allies)[0][0],c=contrib(C,top);
    if(c>=1)add(Math.min(1.5,c*.5),`Hoàn thiện lối <b>${ARCH[top].n}</b> của đội: ${bestTag(C,top)}`);
  }
  if(ens.length>=2){
    const ea=archOf(ens)[0][0];
    const best=Object.keys(BEATS).filter(a=>BEATS[a].includes(ea)).map(a=>[a,contrib(C,a)]).sort((x,y)=>y[1]-x[1])[0];
    if(best&&best[1]>=1.2)add(Math.min(1.2,best[1]*.35),`Đối thủ chơi <b>${ARCH[ea].n}</b> — ${C.name} giúp đội đánh <b>${ARCH[best[0]].n}</b> (khắc lối đó) nhờ ${bestTag(C,best[0])}`);
  }
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
    ${opp&&(COUNTER_TIPS[opp]||COUNTER_ITEMS[opp])?`<div class="tip" style="margin-bottom:12px">💡 <b>Mẹo đối phó ${BY[opp].name}:</b> ${COUNTER_TIPS[opp]||''}${COUNTER_ITEMS[opp]?` <br>🛡️ <b>Đồ nên lên:</b> ${COUNTER_ITEMS[opp].join(', ')}`:''}</div>`:''}
    ${anyEnemy?'':'<div class="note">Chưa nhập tướng đối thủ nên gợi ý đang dựa trên meta. Nhập tướng đối thủ để có gợi ý khắc chế chính xác.</div>'}
    ${tr.S.length?`<div class="top3">${tr.S.map(x=>bigCard(x,'pick','S')).join('')}</div>`:''}
    ${tr.A.length?`<div class="tierrow"><div class="tl" style="background:var(--A)">A</div><div class="chips">${tr.A.map(x=>chip(x,'pick')).join('')}</div></div>`:''}
    ${tr.B.length?`<div class="tierrow"><div class="tl" style="background:var(--B)">B</div><div class="chips">${tr.B.map(x=>chip(x,'pick')).join('')}</div></div>`:''}
    ${comboHTML(lane,list)}
    ${avoid.length&&anyEnemy?`<div class="sec">⛔ Nên tránh pick ở đường này</div><div class="chips">${avoid.map(x=>chip(x,'none',true)).join('')}</div>`:''}`;
}
/* Cặp bài: tướng đường này + đồng đội (đã pick hoặc nên pick ở đường trống) — theo chất tướng + dữ liệu giải */
function comboHTML(lane,list){
  const u=used();const out=[];
  const partners=[];
  LK.forEach(k=>{if(k===lane)return;if(st.ally[k])partners.push({h:BY[st.ally[k]],have:true,lane:k,s:0});
    else ranked(k).slice(0,6).forEach(x=>partners.push({h:x.h,lane:k,s:x.s}))});
  list.slice(0,10).forEach(x=>partners.forEach(p=>{if(p.h.id===x.h.id)return;
    const ps=pairSyn(x.h,p.h),c=CMB[x.h.id]?.[p.h.id];
    const pro=c&&c.n>=6&&comboWR(c)>=.55;
    if(!(ps&&ps.v>=1)&&!pro)return;
    const sc=x.s+p.s*.3+(ps?ps.v*1.5:0)+(pro?(comboWR(c)-.5)*20*Math.min(1,c.n/15):0)+(p.have?1:0);
    out.push({a:x.h,b:p.h,ps,c:pro?c:null,have:p.have,lane2:p.lane,s:sc})}));
  const seen=new Set(),per={},perB={};
  const top=out.sort((p,q)=>q.s-p.s).filter(o=>{const k=[o.a.id,o.b.id].sort().join();if(seen.has(k)||(per[o.a.id]||0)>=1||(perB[o.b.id]||0)>=2)return false;seen.add(k);per[o.a.id]=1;perB[o.b.id]=(perB[o.b.id]||0)+1;return true}).slice(0,5);
  if(!top.length)return '';
  return `<div class="sec">🤝 Cặp bài gợi ý</div><div class="combos">${top.map(o=>`
    <div class="combo"><div class="pair"><div class="pic">${pic(o.a)}</div><span>+</span><div class="pic ${o.have?'have':''}">${pic(o.b)}</div></div>
      <div class="cinfo"><div class="nm">${o.a.name} + ${o.b.name} ${o.ps?`<span class="lb">${o.ps.lb}</span>`:''}</div>
      ${o.ps?`<div class="w">${o.ps.t}</div>`:''}
      <div class="w">${o.have?`${o.b.name} đã có trong đội`:`${o.b.name} đi đường ${LN[o.lane2]}`}${o.c?` · giải đấu thắng <b>${o.c.w}/${o.c.n}</b> ván ${flags(o.c.rg)}`:''}</div></div>
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
  const max=Math.max(6,x.s);const w=why(x.r,3);const neg=[];
  const tip='';
  return `<div class="big"><span class="tierb" style="background:${act==='ban'?'var(--red)':TC[tier]}">${act==='ban'?'⛔':tier}</span>
    <div class="row"><div class="pic">${pic(x.h)}</div><div style="min-width:0"><div class="nm">${x.h.name} ${x.h.tier&&x.h.tier!=='C'?`<span class="mb t${x.h.tier}">Meta ${x.h.tier}</span>`:''}</div><div class="tt">${x.h.title||''}</div>
    <div class="meter" style="margin-top:6px;width:120px;max-width:100%"><i style="width:${Math.min(100,x.s/max*100)}%"></i></div></div></div>
    <ul class="why">${w.map(r=>`<li>${r[1]}</li>`).join('')}</ul>${tip}
    <button class="pickbtn" data-act="${act}" data-id="${x.h.id}">${act==='ban'?'Cấm tướng này':'Chọn cho đường '+LN[st.focus]}</button></div>`;
}
function chip(x,act,bad){
  const w=why(x.r,1,bad)[0];
  return `<button class="chip ${bad?'bad':''}" ${act!=='none'?`data-act="${act}" data-id="${x.h.id}"`:''} title="${why(x.r,4,bad).map(r=>r[1].replace(/<[^>]+>/g,'')).join(' · ')}">
    <div class="pic">${pic(x.h)}</div><div style="min-width:0"><div class="nm">${x.h.name}</div><div class="w">${w?w[1]:'Phù hợp chung với đội hình'}</div></div></button>`;
}

/* ===== HLV phân tích: sức mạnh theo giai đoạn, điều kiện thắng, kế hoạch rừng, focus, cẩn thận, di chuyển ===== */
function phase(T){
  let e=0,m=0,l=0;
  T.forEach(h=>{
    if(has(h,'e')){e+=1.3;l-=.4}
    if(has(h,'l')){l+=1.4;e-=.5}
    if(has(h,'b')){e+=.4;m+=.6}
    if(has(h,'g')||has(h,'q')){m+=.5}
    if(h.lanes[0]==='A'){l+=.5;e-=.2}
    if(has(h,'t')){m+=.3;l+=.2}
    if(has(h,'x')){l+=.3}
    if(h.tier==='S'){e+=.3;m+=.3;l+=.3}
  });
  return {e,m,l};
}
function coachHTML(A,E,AL,EL){
  if(E.length<2&&A.length<2) return '';
  const out=[];const pa=phase(A),pe=phase(E);
  // 1) Nhịp trận
  if(A.length>=2&&E.length>=2){
    const de=pa.e-pe.e,dl=pa.l-pe.l;
    if(de>.8&&dl<0) out.push(['⏱️','Nhịp trận',`Đội bạn <b>mạnh đầu trận</b>, đối thủ mạnh dần từ khoảng <b>phút 14–16</b> (lúc xạ thủ/pháp sư địch đủ 3 món). Phải tạo lợi thế trước phút 12: xâm rừng sớm, giành Tà Thần/Rồng đầu tiên, phá trụ ngoài rồi ép lên.`]);
    else if(dl>.8&&de<0) out.push(['⏱️','Nhịp trận',`Đối thủ <b>mạnh đầu trận</b>, đội bạn mạnh từ khoảng <b>phút 14–16</b>. Giai đoạn đầu chơi chắc: không giao tranh sớm, nhường mục tiêu nếu bất lợi, đổi trụ thay vì cố thủ. Sau khi đủ đồ mới chủ động mở combat.`]);
    else if(de>.8&&dl>.8) out.push(['⏱️','Nhịp trận','Đội bạn nhỉnh hơn ở cả đầu lẫn cuối trận — chủ động ép nhịp, đừng cho đối thủ thời gian gỡ.']);
    else if(de<-.8&&dl<-.8) out.push(['⏱️','Nhịp trận','Đối thủ nhỉnh hơn ở mọi giai đoạn — tập trung bắt lẻ và giao tranh ở chỗ hẹp, có tầm nhìn để lật kèo; tránh đánh tổng ở chỗ trống.']);
    else out.push(['⏱️','Nhịp trận',`Hai đội khá cân ở đầu trận; đội ${pa.m>=pe.m?'bạn':'đối thủ'} mạnh hơn ở <b>giữa trận (phút 8–14)</b> — đó là giai đoạn quyết định quanh các mục tiêu lớn.`]);
  }
  // 2) Lối đánh + điều kiện thắng
  if(A.length>=2){
    const aa=archOf(A),ma=aa[0][0];let txt=`Đội bạn hợp lối <b>${ARCH[ma].ic} ${ARCH[ma].n}</b>. ${planText(ma,A)}`;
    if(E.length>=2){const ea=archOf(E)[0][0];
      txt+=`<br>Đối thủ thiên về <b>${ARCH[ea].ic} ${ARCH[ea].n}</b>`;
      if(BEATS[ma].includes(ea)) txt+=' — lối của bạn <span class="good">khắc chế</span> lối này, cứ đánh đúng kế hoạch.';
      else if(BEATS[ea].includes(ma)){const alt=aa.slice(1).find(([a,v])=>BEATS[a].includes(ea)&&v>=aa[0][1]*.6);
        txt+=` — lối này <span class="bad">khắc</span> đội bạn.`+(alt?` Nên chuyển sang <b>${ARCH[alt[0]].n}</b>: ${planText(alt[0],A)}`:` Nếu còn lượt pick, ưu tiên tướng đánh được lối ${BEATS[ea].length?Object.keys(BEATS).filter(a=>BEATS[a].includes(ea)).map(a=>ARCH[a].n).join(' / '):''}.`);}
      else txt+='.';
      if(ea==='dive'||ea==='fight'){const pk=keyH(A,'counter',2);if(pk.length&&ma!=='counter')txt+=`<br>🔄 <b>Phòng thủ phản công</b>: đối thủ thích lao vào — đứng sát trụ, giữ ${pk.map(h=>bestTag(h,'counter')).join(', ')} chờ họ vào rồi đánh trả.`}
      const pu=keyH(A,'push',2);if(pu.length&&ma!=='push')txt+=`<br>🏰 <b>Đẩy trụ</b>: ${pu.map(h=>h.name).join(', ')} dọn lính nhanh — sau mỗi pha thắng giao tranh, dẫn lính phá trụ ngay thay vì đi farm.`;
    }
    out.push(['🧩','Lối đánh & điều kiện thắng',txt]);
  }
  // 3) Kế hoạch rừng / gank
  if(E.length>=2){
    const jg=AL.J&&BY[AL.J];
    const cand=LK.filter(k=>k!=='J'&&EL[k]).map(k=>{const e=BY[EL[k]];const ally=AL[k]&&BY[AL[k]];
      let g=0;if(isSquishy(e))g+=1.5;if(!has(e,'d'))g+=1.5;if(has(e,'u')||has(e,'w'))g-=1.5;if(has(e,'l'))g+=.8;if(ally&&has(ally,'q'))g+=1;if(ally&&has(ally,'c'))g+=.4;return {k,e,ally,g}}).sort((a,b)=>b.g-a.g);
    if(cand.length){
      const t=cand[0],bad=cand[cand.length-1];
      let txt=`${jg?jg.name+' (rừng)':'Người đi rừng'} nên <b>gank đường ${LN[t.k]}</b> — ${t.e.name} ${!has(t.e,'d')?'không có chiêu lướt thoát thân':'máu mỏng'}${has(t.e,'l')?', lại cần thời gian lên đồ':''}`;
      if(t.ally&&has(t.ally,'c')) txt+=`; ${t.ally.name} nối ${SKL(t.ally,'cc')} giữ chân khi rừng vừa tới`;
      txt+='.';
      if(bad&&bad!==t&&bad.g<1) txt+=` Hạn chế gank đường ${LN[bad.k]}: ${bad.e.name} có ${SKL(bad.e,'imm')||SKL(bad.e,'unt')||SKL(bad.e,'dash')||'chiêu thoát'} nên rất khó bắt.`;
      const ej=EL.J&&BY[EL.J];
      if(ej) txt+=` Rừng địch là ${ej.name}${has(ej,'e')?' (mạnh đầu trận) — cắm mắt bụi rừng mình từ phút 1, đừng để bị xâm bùa':''}${has(ej,'l')?' (cần farm) — xâm rừng địch, cướp bùa xanh/đỏ để làm chậm hắn':''}.`;
      out.push(['🌲','Kế hoạch rừng',txt]);
    }
  }
  // 4) Focus
  if(E.length>=2){
    const thr=E.map(e=>({e,v:(isSquishy(e)?2:0)+(has(e,'l')?1.5:0)+(e.lanes[0]==='A'?1.2:0)+(has(e,'b')?1:0)+({S:1.5,A:1,B:.4,C:0}[e.tier]||0)})).sort((a,b)=>b.v-a.v);
    const f=thr[0].e;
    out.push(['🎯','Focus',`Ưu tiên hạ <b>${f.name}</b> (nguồn sát thương chính). Chờ ${f.name} dùng ${SKL(f,'dash')||SKL(f,'unt')||'chiêu thoát thân'} xong rồi mới dồn — hết chiêu là không chạy được.${thr[1]?` Mục tiêu thứ hai: <b>${thr[1].e.name}</b>.`:''}`]);
  }
  // 5) Cẩn thận
  if(E.length){
    const warn=[];
    E.filter(e=>has(e,'q')&&(has(e,'g')||e.sk?.cc?.[0]==='Chiêu 3')).slice(0,2).forEach(e=>warn.push(`${SKL(e,'cc')} (${EFF(e,'cc')}) của <b>${e.name}</b> — đứng tản ra, giữ phép Thanh tẩy cho chủ lực`));
    E.filter(e=>has(e,'b')).slice(0,2).forEach(e=>warn.push(`<b>${e.name}</b> rình ám sát bằng ${SKL(e,'dash')||'chiêu lướt'}${has(e,'u')||has(e,'i')?' và '+(SKL(e,'unt')||SKL(e,'inv')):''} — xạ thủ/pháp sư không đứng đầu giao tranh, chưa thấy ${e.name} trên bản đồ thì chưa xả hết chiêu`));
    E.filter(e=>has(e,'x')&&!has(e,'b')).slice(0,1).forEach(e=>warn.push(`<b>${e.name}</b> có ${SKL(e,'tru')} gây ${EFF(e,'tru')} — tướng đỡ đòn đừng ôm đòn quá lâu`));
    if(warn.length) out.push(['⚠️','Cẩn thận',warn.slice(0,3).join('<br>')]);
  }
  // 6) Di chuyển
  if(E.length>=2){
    const mv=[];const ass=E.filter(e=>has(e,'b')).length,poke=E.filter(e=>has(e,'p')).length,eng=E.filter(e=>has(e,'g')&&has(e,'q')).length;
    if(ass) mv.push('Xạ thủ và pháp sư đi theo cặp với trợ thủ, không đi lẻ ra đường biên khi chưa thấy sát thủ địch.');
    if(poke) mv.push('Đối thủ cấu rỉa tầm xa: di chuyển xuyên bụi, áp sát từ góc khuất thay vì đi thẳng đường giữa.');
    if(eng) mv.push('Đối thủ có tướng mở giao tranh: đứng tản đội hình, không dồn cụm khi qua khe hẹp.');
    if(pa.e>pe.e) mv.push('Đội bạn mạnh đầu: phút 2–4 xoay sang hỗ trợ rừng xâm bùa, đẩy lính trước khi đi gank để giữ áp lực đường.');
    else mv.push('Đầu trận giữ lính gần trụ mình, chờ rừng gank; cắm mắt ở cửa rừng đối diện Rồng/Tà Thần trước mỗi lần mục tiêu hồi.');
    out.push(['🧭','Di chuyển',mv.join(' ')]);
  }
  // 7) Kèo từng đường
  const lanes=LK.filter(k=>AL[k]&&EL[k]).map(k=>{const a=BY[AL[k]],e=BY[EL[k]];const d=matchup(a,e).s-matchup(e,a).s;
    return `<b>${LN[k]}</b>: ${a.name} vs ${e.name} — ${d>1.5?'<span class="good">thắng kèo, chủ động ép</span>':d<-1.5?'<span class="bad">khó kèo, chơi an toàn, chờ rừng</span>':'cân kèo, đánh theo tay'}`});
  if(lanes.length) out.push(['⚔️','Kèo từng đường',lanes.join('<br>')]);
  if(!out.length) return '';
  return `<div class="card coach"><h3>🧠 HLV phân tích</h3><div class="cgrid">${out.map(([ic,t,b])=>`<div class="citem"><div class="ct">${ic} ${t}</div><div class="cb">${b}</div></div>`).join('')}</div></div>`;
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
    const ar=archOf(T);const style=T.length>=2?`${ARCH[ar[0][0]].ic} ${ARCH[ar[0][0]].n}`+(ar[1][1]>=ar[0][1]*.8?` · ${ARCH[ar[1][0]].n}`:''):'Chưa rõ';
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
  el.innerHTML=coachHTML(A,E,st.ally,st.enemy)+card('Phân tích đối thủ',E,true)+card('Đội hình của bạn',A,false);
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
