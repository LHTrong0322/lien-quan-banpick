/* ===== Ra lệnh bằng giọng nói (Web Speech API, tiếng Việt) — Agent build by @Trong0322 =====
   Ví dụ: "cấm Tulen" · "địch cấm Yena" · "chọn Aoi đi rừng" · "đối thủ chọn Violet và Thane"
          "chọn gợi ý số 1" · "xem đường giữa" · "hoàn tác" · "làm lại" · "tắt mic" */
(function(){
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const btn=document.getElementById('mic'),bar=document.getElementById('vbar'),vtxt=document.getElementById('vtxt'),vres=document.getElementById('vres');
if(!btn)return;
const NOSR=!SR;

/* --- chuẩn hóa: bỏ dấu, gộp âm gần giống nhau để khớp tên tướng tiếng Anh đọc kiểu Việt --- */
const plain=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d').toLowerCase();
const phon=s=>plain(s).replace(/[^a-z0-9]/g,'').replace(/tr/g,'ch').replace(/gi/g,'d').replace(/r/g,'d').replace(/v/g,'d').replace(/ng/g,'n').replace(/nh/g,'n').replace(/ph/g,'f').replace(/th/g,'t').replace(/ch/g,'c').replace(/ck|q|c/g,'k').replace(/[zy]/g,'d').replace(/x/g,'s').replace(/w/g,'u').replace(/gh/g,'g').replace(/(.)\1+/g,'$1');
/* cách đọc phổ biến (giọng Việt nhận ra) → id tướng */
const ALIAS={nakroth:['na crốt','na cờ rốt','nacrot','nắc rốt'],yorn:['giọn','dọn','yon','i on'],violet:['vai ô lét','vi ô lét','vai lét'],murad:['mu rát','mu rạt','murát'],
 thane:['then','thên','thên'],zephys:['dê phít','dê phis','zê phi','dephi'],zill:['din','zin','dill'],zata:['da ta','gia ta','dia ta','dza ta','gi a ta'],lubo:['lữ bố','lu bố'],ngokhong:['ngộ không'],
 trieuvan:['triệu vân'],dieuthuyen:['điêu thuyền'],ybneth:['i bơ nét','y bê nét','íp nét'],telannas:['te la nát','tela nas','te lan nát'],theflash:['phờ lát','flash','đờ phờ lát'],
 wonderwoman:['wonder woman','quanđơ wu men','oăn đơ'],superman:['siêu nhân','su pơ men'],elandorr:['e lan đo','elan dor'],kilgroth:['kin grốt','kil groth'],krixi:['kri xi','cờ ri xi'],
 kriknak:['kric nắc','krik nak'],krizzix:['kri dích','kri zix'],qi:['ki'],aoi:['a ô i','ao i'],aya:['a da','a ya'],ata:['a ta'],iggy:['ích gi','i gi'],ignis:['ích nít','íc nít'],
 tulen:['tu len','tu lên'],yena:['giê na','ye na','dê na'],yue:['duệ','yu e','du e'],yan:['giang','dan kiếm'],xeniel:['xê ni en','xenien'],raz:['ra dờ','rát dờ'],max:['mắc','mác'],
 mina:['mi na'],omen:['ô men'],omega:['ô mê ga'],veres:['vê rét','ve res'],volkath:['vôn cát','vol kát'],wisp:['qui sp','uýt'],wiro:['qui rô','wi rô'],
 grakk:['gờ rắc','grác'],taara:['ta ra'],toro:['tô rô'],arum:['a rum'],alice:['a li xơ','e lít'],lauriel:['lô ri en','lau ri el'],liliana:['li li a na'],lorion:['lo ri on','lô ri ôn'],
 florentino:['flo ren ti nô','phờ lo'],allain:['a lanh','a lain'],airi:['ai ri'],keera:['ki ra'],kaine:['kên','kai ne'],quillen:['qui len','quin len'],hayate:['ha da tê','ha ya tê'],
 capheny:['ca phê ni','ca phe ni'],elsu:['en su','el su','e su','ê sư','e lờ su','en xu'],valhein:['van hên','val hen','va hên','van hen','văn hên'],laville:['la vin','la vi le'],slimz:['sờ lim','slim'],teemee:['ti mi'],zip:['díp','zíp'],
 zuka:['du ca','zu ka'],skud:['sờ cút','scút'],thorne:['thoọc','thorn'],ishar:['i sa'],dirak:['đi rắc','di rác'],natalya:['na ta li a'],aleister:['a lê xtơ','a lít tơ'],
 dextra:['đếch tra','dếch tra'],richter:['rích tơ'],tachi:['ta chi'],bijan:['bi dan','bi gian'],marja:['ma gia','mác da'],preyta:['prê ta','pray ta'],tamyn:['ta min'],
 goverra:['gô ve ra'],edras:['ê đờ rát'],heino:['hai nô'],jinna:['gin na','jin na'],kahlii:['ka li'],mganga:['mơ gan ga','m gan ga'],paine:['pên'],stuart:['xtu ớt','stu át'],
 sinestrea:['si nét trê a'],rourke:['rốc'],roxie:['rốc xi'],ryoma:['ri ô ma','ryo ma'],sephera:['sê phê ra'],teeri:['ti ri'],veera:['vi ra']};
const phonW=v=>plain(v).split(/[\s'’-]+/).filter(Boolean).map(phon).join(''); // gộp âm theo từng chữ rồi mới nối
const NAMES=[];
HEROES.forEach(h=>{const vs=new Set([h.name,h.id,...(ALIAS[h.id]||[])]);vs.forEach(v=>{const p=phonW(v);if(p.length>=2)NAMES.push([p,h.id])})});
NAMES.sort((a,b)=>b[0].length-a[0].length);
const EXN=new Map(NAMES.map(x=>[x[0],x[1]]));
/* 1 chữ đơn lẻ phải khớp đúng mặt chữ (tránh "đấy"→Raz, "đánh"→Yan); từ 2 chữ trở lên mới khớp theo âm gần giống */
const PLN=new Map();HEROES.forEach(h=>[h.name,h.id,...(ALIAS[h.id]||[])].forEach(v=>{const k=plain(v).replace(/[^a-z0-9]/g,'');if(k.length>=2&&!PLN.has(k))PLN.set(k,h.id)}));
const exact=(ws)=>{if(ws.length===1)return PLN.get(ws[0].replace(/[^a-z0-9]/g,''))||null;const q=ws.map(phon).join('');return q.length>=3?EXN.get(q)||null:null};
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=[...Array(n+1).keys()];for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
/* tìm tướng trong một đoạn: khớp chính xác (bỏ dấu/khoảng trắng) trước, sau đó khớp gần đúng theo cụm 1–3 từ */
function findHero(seg,strict){
  {const m=String(seg).match(/hero_([a-z]+)/);if(m&&BY[m[1]])return m[1]}
  const w=plain(seg).split(/\s+/).filter(Boolean);if(!w.length)return null;
  const EX=new Map(NAMES.map(x=>[x[0],x[1]]));
  for(let L=Math.min(4,w.length);L>=1;L--)for(let i=0;i+L<=w.length;i++){const id=exact(w.slice(i,i+L));if(id)return id}
  if(strict)return null;
  let best=null;
  for(let L=Math.min(3,w.length);L>=1;L--)for(let i=0;i+L<=w.length;i++){const ws=w.slice(i,i+L);if(ws.every(x=>COMMON.has(x)||CMDW.has(x)))continue;const q=ws.map(phon).join('');if(q.length<(L===1?4:2))continue;
    for(const [p,id] of NAMES){const d=lev(q,p),tol=p.length<=4?0:p.length<=7?1:2;if(d<=tol&&(!best||d<best.d))best={d,id}}}
  return best&&best.id;
}
function nearest(seg,k=4){
  const w=plain(seg).replace(STOPW,' ').split(/\s+/).filter(x=>x.length>0);const best={};
  for(let L=1;L<=Math.min(3,w.length);L++)for(let i=0;i+L<=w.length;i++){const q=w.slice(i,i+L).map(phon).join('');if(q.length<2)continue;
    for(const [p,id] of NAMES){const d=lev(q,p)/Math.max(p.length,q.length);if(d<=.6&&(best[id]==null||d<best[id]))best[id]=d}}
  return Object.entries(best).sort((a,b)=>a[1]-b[1]).slice(0,k).map(x=>x[0]);
}

/* ===== Vốn từ tiếng Việt cho lệnh: chuẩn hoá câu nói sai chính tả, sai dấu, giọng vùng miền, tiếng lóng game thủ =====
   Bước 1 (còn dấu): phân biệt "cầm" (= chơi tướng, tức chọn) với "cấm"; "đội bạn" (= đội mình) với "ban" (= cấm).
   Bước 2 (bỏ dấu): đổi các cách nói/viết sai về từ chuẩn: cam · chon · dich · minh · khac che · ta than · rung · giua · rong · tro thu … */
const TONED=[
 [/(?<=^|[\s,])(cầm|cằm|chơi|xài|dùng|lựa|lụa|lấy|lẫy|lây|trọn|chộn|chọng|chọn|chộng)(?=$|[\s,])/g,' chon '],
 [/(?<=^|[\s,])(cấm|cắm|cẩm|cám|câm|căm|cậm|khóa|khoá|chặn|loại|loai)(?=$|[\s,])/g,' cam '],
 [/(?<=^|[\s,])(đội|team|phe|bên) (bạn|ta|tui|tôi|mình|xanh)(?=$|[\s,])/g,' minh '],
 [/(?<=^|[\s,])(bạn|ạ|à|ơi|nhé|nha|nhen|nghen|hen|đi nào|với nhé|giùm|dùm|hộ)(?=$|[\s,])/g,' '],
 [/(?<=^|[\s,])(chống)(?=$|[\s,])/g,' khac che '],
];
const PHR=[ // [các cách nói (đã bỏ dấu), từ chuẩn]
 [['khac che','khac chet','khac tre','khac chee','khac ce','khat che','khac','cao to','cau to','kao to','cao tơ','counter','con to','bat bai','phan keo','an keo','khac do'],'khac che'],
 [['doi thu','doi thuu','doi phuong','ben kia','team kia','phe kia','doi kia','ben dich','team dich','phe dich','doi dich','doi do','tui no','bon no','tui ho','dich','dit','dic','dich thu'],'dich'],
 [['tui','toi','tao','dong doi','doi xanh','doi minh','ben minh','team minh','phe minh','minh'],'minh'],
 [['ta than','ta thang','ta thanh','ta tan','ta thang','duong ta than','top lane','top','tob','duong tren','dau si','solo','ta than lane'],'ta than'],
 [['di rung','di run','rung','run g','zung','dung rung','jungle','jung','jun go','dan go','gian go','gang go','di dung'],'rung'],
 [['duong giua','duong dua','duong zua','giua','gua','mid','mit','midd','mid lane','phap su'],'giua'],
 [['duong rong','duong dong','rong','xa thu','sa thu','xa thuu','ad','adc','ay di','bot','bot lane','duong duoi','carry'],'rong'],
 [['tro thu','cho thu','tro thuu','tro thui','ho tro','support','sup','sp','sop','sap pot','sup pot','di kem'],'tro thu'],
 [['pick','pic','pich','pik','pic k','bic','lay','lua chon','choose','chon','choon','chonn','chooon','tron','troon','chong','chom','chn'],'chon'],
 [['ban','bend','bann','cam','camm','caam','kam','cmm'],'cam'],
 [['goi y','goi i','goi y','de xuat','suggest','tu van','goi y so'],'goi y'],
 [['hoan tac','hoang tac','hoan tat lai','quay lai','undo','lui lai','huy','huy bo','bo lai'],'hoan tac'],
 [['lam lai','choi lai','reset','xoa het','bat dau lai','lam moi'],'lam lai'],
 [['tat mic','tat mi','tat micro','dung nghe','ngung nghe','tat nghe'],'tat mic'],
];
const PHRX=PHR.flatMap(([vs,c])=>vs.map(v=>[v,c])).sort((a,b)=>b[0].length-a[0].length);
const PHRRE=new RegExp('\\b('+PHRX.map(x=>x[0].replace(/ /g,'\\s+')).join('|')+')\\b','g');
const PHRMAP=new Map(PHRX.map(([v,c])=>[v,c]));
const COMMON=new Set('duoc roi day anh em oi rat manh qua nay kia do the vay nhe nha di den ve va voi cua la co khong chua xong ok uh u a ha hay lam nhieu it gi nao sao duong rong rung giua tuong con thang cho giup nhat toi tui no ho xem mo goi y tier tro thu ta than cai kia nay'.split(' '));
const CMDW=new Set(['minh','dich','cam','chon','rung','giua','rong','top','ban','con','toi','tui','tao','lay','mid','sup','bot','khac','doi','ben','team','phe','ta','than','tro','thu','dan','danh','ra','di','nao','rat','roi','mot','hai','ba']);
function canon(raw){
  let x=' '+String(raw).toLowerCase().normalize('NFC').replace(/[.,!?;:"“”()]/g,' , ')+' ';
  for(const [re,c] of TONED)x=x.replace(re,c).replace(/\s+/g,' ');
  x=plain(x).replace(/\s+/g,' ');
  // giữ nguyên tên tướng (khớp trọn cụm 1–4 chữ) để bước sửa từ không làm hỏng tên, vd "na cờ rốt"
  {const w=x.trim().split(' ');const out=[];for(let i=0;i<w.length;){let hit=null;
     for(let L=Math.min(4,w.length-i);L>=1&&!hit;L--){const q=phon(w.slice(i,i+L).join(''));if(!(L===1&&CMDW.has(w[i]))){const id=exact(w.slice(i,i+L));if(id)hit=[id,L]}}
     if(hit){out.push('hero_'+hit[0]);i+=hit[1]}else{out.push(w[i]);i++}}
   x=' '+out.join(' ')+' '}
  // giữ dấu phẩy để tách nhiều tướng; "va/voi" = và/với
  x=x.replace(PHRRE,m=>PHRMAP.get(m.replace(/\s+/g,' '))||m);
  return x.replace(/\s+/g,' ').replace(/^[ ,]+|[ ,]+$/g,'').trim();
}

let pending=null;
const LANEW=[['T',/ta than|top|duong tren|dau si/],['J',/rung|jungle|di rung/],['M',/giua|mid|phap su/],['A',/rong|xa thu|duong duoi|bot|ad\b|adc/],['S',/tro thu|ho tro|support|sp\b/]];
const laneOf=s=>{const p=plain(s);for(const [k,r] of LANEW)if(r.test(p))return k;return null};
const ENEMY=/\b(dich|doi thu|ben kia|doi do|team dich|phe do)\b/;
const STOPW=/\b(doi ban|doi minh|doi thu|ben kia|di rung|ta than|tro thu|ho tro|xa thu|duong (tren|duoi|giua)|cam|ban|chon|pick|lay|dich|minh|duong|tuong|nhe|nha|rung|giua|rong)\b/g;

/* ---- giọng đọc phản hồi ---- */
let talk=true;
let speaking=false;
function say(t){if(!talk||!window.speechSynthesis||!t)return;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g,''));u.lang='vi-VN';u.rate=1.15;
    const done=()=>{if(!speaking)return;speaking=false;if(on)listen()};
    u.onend=done;u.onerror=done;setTimeout(done,4000); // phòng khi trình duyệt không báo đọc xong
    speaking=true;try{rec&&rec.abort()}catch(e){}
    speechSynthesis.speak(u)}catch(e){speaking=false}}
let hideT,holdUntil=0;function showBar(t,r,stay){if(t)holdUntil=Date.now()+6000;bar.hidden=false;vtxt.textContent=t?'Nghe được: “'+t+'”':'';vres.innerHTML=r||'';clearTimeout(hideT);if(!stay&&!on)hideT=setTimeout(()=>bar.hidden=true,6000)}

/* ---- thực thi câu lệnh ---- */
function nextBan(side){return st.bans[side].findIndex(b=>!b)}
function doBan(id,side){const i=nextBan(side);if(i<0)return `Ô cấm ${side==='ally'?'đội bạn':'đối thủ'} đã đầy`;place(id,{kind:'ban',side,idx:i});return null}
function doPick(id,side,lane){
  if(!lane&&!LK.some(k=>!st[side][k]))return `${side==='ally'?'Đội bạn':'Đối thủ'} đã đủ 5 tướng — nói kèm tên đường để thay (vd “đối thủ chọn ${BY[id].name} đường rồng”)`;
  place(id,{kind:'pick',side,lane:lane||null});return null}
function run(orig,opt={}){
  const raw=canon(orig);const heardTxt=opt.shown||orig;
  const t=raw.replace(/\b(doi|team|phe) ban\b/g,'doi minh');if(!t)return;
  // lệnh hệ thống
  if(/tat mic|dung nghe|ngung nghe/.test(t)){stop();return showBar(heardTxt,'🎙️ Đã tắt mic')}
  if(/hoan tac|undo|quay lai/.test(t)){document.getElementById('undo').click();say('Đã hoàn tác');return showBar(heardTxt,'↶ Đã hoàn tác')}
  if(/lam lai|reset|xoa het/.test(t)){document.getElementById('reset').click();say('Đã làm lại từ đầu');return showBar(heardTxt,'🔄 Đã làm lại')}
  if(/tat (giong|tieng)|im lang/.test(t)){talk=false;return showBar(heardTxt,'🔇 Đã tắt giọng đọc')}
  if(/bat (giong|tieng)/.test(t)){talk=true;say('Đã bật giọng đọc');return showBar(heardTxt,'🔊 Đã bật giọng đọc')}
  if(/tier/.test(t)&&!findHero(raw)){st.mode='tier';const l=laneOf(raw);if(l)st.tierLane=l;render();return showBar(heardTxt,'📊 Mở Tier meta')}
  if(/goi y cam|nen cam gi/.test(t)){st.mode='ban';render();const b=banList()[0];say(b?'Nên cấm '+b.h.name:'');return showBar(heardTxt,b?`⛔ Nên cấm nhất: <b>${b.h.name}</b>`:'')}
  // chọn gợi ý số N
  const gm=t.match(/(chon|cam|lay|pick|ban) (theo )?goi y( so)? ?(\d|mot|hai|ba)?/);
  if(gm){const n={mot:1,hai:2,ba:3}[gm[4]]||+gm[4]||1;const isBan=/cam|ban/.test(gm[1]);
    if(isBan){const x=banList()[n-1];if(!x)return showBar(heardTxt,'Không có gợi ý');const e=doBan(x.h.id,'ally');if(e)return showBar(heardTxt,'⚠️ '+e);say('Đã cấm '+x.h.name);return showBar(heardTxt,`⛔ Đã cấm <b>${x.h.name}</b>`)}
    const lane=laneOf(raw)||st.focus;const x=ranked(lane)[n-1];if(!x)return showBar(heardTxt,'Không có gợi ý');doPick(x.h.id,'ally',lane);say('Đã chọn '+x.h.name+' đường '+LN[lane]);return showBar(heardTxt,`✅ Đã chọn <b>${x.h.name}</b> · đường ${LN[lane]}`)}
  // xem gợi ý một đường
  if(/^(xem|goi y|mo)\b/.test(t)&&laneOf(raw)&&!findHero(t.replace(STOPW,' '),true)){st.mode='pick';st.focus=laneOf(raw);save();render();
    const x=ranked(st.focus)[0];say(x?`Đường ${LN[st.focus]}, nên chọn ${x.h.name}`:'');return showBar(heardTxt,`👀 Gợi ý đường ${LN[st.focus]}${x?`: nên chọn <b>${x.h.name}</b>`:''}`)}
  /* Lệnh "tự quyết": website tự chọn/cấm tướng tốt nhất thay vì chờ người nói tên.
     VD: "chọn tướng khắc chế Aoi", "pick counter Yena", "chọn giúp tôi đường rừng", "cấm giúp", "pick đi" */
  const AUTO=/\b(khac che|khac|counter|tot nhat|manh nhat|ngon nhat|giup|cho (toi|minh|tao|em|anh)|de xuat|hop nhat|nen chon|nen cam|tu chon|tu cam)\b|\b(pick|chon|cam|ban) di$/;
  const head=t.split(/khac che|counter|\bkhac\b/)[0];
  const named=findHero(head.replace(STOPW,' ').replace(/\b(giup|cho|toi|minh|tao|em|anh|di|nao|tot nhat|manh nhat)\b/g,' '),true);
  const loose=named||findHero(head.replace(STOPW,' ').replace(/\b(giup|cho|toi|minh|tao|em|anh|di|nao|tot nhat|manh nhat|danh|tuong)\b/g,' '));
  const laneOnly=/\b(chon|pick|lay)\b/.test(t)&&laneOf(t)&&!loose; // "chọn tướng đánh rừng", "pick đường giữa"
  if((AUTO.test(t)||laneOnly)&&!named&&(/\b(cam|ban|chon|pick|lay)\b/.test(t)||/khac che|counter/.test(t))){
    const ct=currentTarget();
    const wantBan=/\b(cam|ban)\b/.test(t)&&!/\b(chon|pick|lay)\b/.test(t);
    if(wantBan){const x=banList()[0];if(!x)return showBar(heardTxt,'Không còn tướng để cấm');const er=doBan(x.h.id,'ally');if(er)return showBar(heardTxt,'⚠️ '+er);
      say('Cấm '+x.h.name);return showBar(heardTxt,`⛔ Đã cấm <b>${x.h.name}</b> (đội bạn)`)}
    // tướng đối thủ được nhắc tới (sau chữ "khắc chế/counter") → chọn ở đúng đường của tướng đó
    const tail=(t.split(/khac che|counter|khac/)[1]||'');const eid=tail?findHero(tail.replace(STOPW,' ')):null;
    const eLane=eid?LK.find(k=>st.enemy[k]===eid):null;
    let lane=laneOf(raw.replace(/khắc chế|counter/gi,''))||eLane||(st.ally[st.focus]?LK.find(k=>!st.ally[k]):st.focus);
    if(!lane)return showBar(heardTxt,'⚠️ Đội bạn đã đủ 5 tướng');
    if(eid&&!eLane&&!used().has(eid)){/* tướng chưa có trong đội địch: vẫn ưu tiên tướng khắc nó */}
    let list=ranked(lane);
    if(eid&&!eLane){const E=BY[eid];list=list.map(x=>({...x,s:x.s+matchup(x.h,E).s*1.5})).sort((a,b)=>b.s-a.s)}
    const x=list[0];if(!x)return showBar(heardTxt,'Không có tướng phù hợp');
    st.focus=lane;doPick(x.h.id,'ally',lane);
    say('Chọn '+x.h.name);
    return showBar(heardTxt,`✅ Đã chọn <b>${x.h.name}</b> · đường ${LN[lane]}${eid?` (khắc ${BY[eid].name})`:''}`);
  }
  // cấm / chọn tướng (có thể nhiều tướng: "địch chọn yena và aoi")
  const isBan=/\b(cam|ban)\b/.test(t),isPick=/\b(chon|pick|lay)\b/.test(t);
  let side=ENEMY.test(t)?'enemy':(/\b(minh|doi minh)\b/.test(t)?'ally':null);
  const parts=raw.split(/\s+(?:và|va|với|voi|,)\s+|,\s*/i);
  const done=[],errs=[];
  for(const part of parts){
    const seg=plain(part).replace(STOPW,' ');const id=findHero(seg,!(isBan||isPick));if(!id){continue}
    const h=BY[id];if(used().has(id)){errs.push(`${h.name} đã được cấm/chọn rồi`);continue}
    const lane=laneOf(part);
    let kind=isBan?'ban':isPick?'pick':null,sd=side;
    if(!kind){const ct=currentTarget();kind=ct?ct.kind:'pick';sd=sd||(ct?ct.side:'ally')}
    sd=sd||'ally';
    const e=kind==='ban'?doBan(id,sd):doPick(id,sd,lane);
    if(e)errs.push(e);else done.push(`${kind==='ban'?'⛔ Cấm':'✅ Chọn'} <b>${h.name}</b> (${sd==='ally'?'đội bạn':'đối thủ'}${kind==='pick'&&lane?' · '+LN[lane]:''})`);
  }
  if(done.length){
    let tail='';
    const sp=step();
    if(sp&&sp.side==='ally'){if(sp.kind==='ban'){const b=banList()[0];if(b)tail=`Nên cấm ${b.h.name}`}else{const x=ranked(st.focus)[0];if(x)tail=`Gợi ý đường ${LN[st.focus]}: ${x.h.name}`}}
    say(done.map(d=>d.replace(/<[^>]+>/g,'').replace(/[⛔✅]\s*/,'').replace(/\(.*\)/,'')).join(', '));
    return showBar(heardTxt,done.join('<br>')+(errs.length?'<br>⚠️ '+errs.join('; '):'')+(tail?`<br>💡 ${tail}`:''));
  }
  if(errs.length)return showBar(heardTxt,'⚠️ '+[...new Set(errs.map(e=>e.replace(/ \(vd.*\)/,'')))].join('; '));
  if(!isBan&&!isPick)return showBar(heardTxt,'<span class="vdots">(không có lệnh — bỏ qua)</span>'); // nói chuyện bình thường thì không làm gì
  if(!opt.noAI){aiIntent(orig,heardTxt);return}
  const near=nearest(raw);
  if(near.length){const ct=currentTarget();const kind=isBan?'ban':isPick?'pick':(ct?ct.kind:'pick');const sd=side||((isBan||isPick)?'ally':(ct?ct.side:'ally'));
    pending={kind,side:sd,lane:laneOf(raw)};say('Bạn muốn tướng nào?');
    return showBar(heardTxt,`❓ Chưa chắc tên tướng — bấm để ${kind==='ban'?'cấm':'chọn'} (${sd==='ally'?'đội bạn':'đối thủ'}):<div class="vnear">${near.map(id=>`<button data-vpick="${id}">${pic(BY[id])}<span>${BY[id].name}</span></button>`).join('')}</div>`,true)}
  showBar(heardTxt,'❓ Chưa nghe ra tên tướng. Nói chậm và rõ tên tướng, ví dụ: <i>“cấm Tulen”</i>, <i>“địch chọn Yena”</i>, <i>“chọn Aoi đi rừng”</i>.',true);
}

/* ---- AI hiểu lệnh (máy chủ): dùng khi câu nói quá lơ lớ, luật có sẵn không hiểu ---- */
const LANEWORD={T:'ta than',J:'rung',M:'giua',A:'rong',S:'tro thu'};
const idByName=n=>{if(!n)return null;const k=norm(n);const h=HEROES.find(h=>norm(h.name)===k||h.id===k);return h?h.id:findHero(n)};
async function aiIntent(orig,shown){
  showBar(shown,'🧠 Đang hiểu câu nói…',true);log('AI hiểu lệnh');
  let d=null;
  try{const r=await fetch('/api/intent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:orig,heroes:HEROES.map(h=>h.name)})});if(r.ok)d=await r.json()}catch(e){}
  if(!d||!d.action||d.action==='none'){return run(orig,{noAI:true,shown})}
  const side=d.side==='enemy'?'dich ':'';const lane=d.lane?' '+LANEWORD[d.lane]:'';
  const hs=(d.heroes||[]).map(idByName).filter(Boolean).map(id=>BY[id].name);
  let cmd='';
  if(d.action==='undo')cmd='hoan tac';
  else if(d.action==='auto_ban')cmd='cam giup';
  else if(d.action==='auto_pick'){const c=idByName(d.counter);cmd=c?`chon tuong khac che ${BY[c].name}${lane}`:`chon giup${lane||' '+LANEWORD[st.focus]}`}
  else if((d.action==='ban'||d.action==='pick')&&hs.length)cmd=`${side}${d.action==='ban'?'cam':'chon'} ${hs.join(' , ')}${hs.length===1?lane:''}`;
  if(!cmd)return run(orig,{noAI:true,shown});
  log('AI → '+cmd);run(cmd,{noAI:true,shown});
}

/* ---- nghe giọng nói ----
   Bấm 🎙️ một lần: mic mở và GIỮ MỞ cho tới khi bấm lại (hoặc 2 phút không nói gì).
   Trình duyệt hay tự ngắt sau vài giây im lặng — web tự mở lại ngay, người dùng không phải bấm lại.
   Giữ nút 🎙️ (nhấn lâu): nghe trong lúc giữ, thả tay là xử lý câu vừa nói. */
const UA=navigator.userAgent;
const IOS=/iPad|iPhone|iPod/.test(UA)||(/Safari/.test(UA)&&!/Chrome|CriOS|Edg|Android/.test(UA));
const ANDROID=/Android/.test(UA);
const INFRAME=(()=>{try{return window.self!==window.top}catch(e){return true}})();
let rec=null,on=false,heard=false,lastInterim='',lastFinal='',lastFinalAt=0,idleAt=0,restartFails=0;
const vlog=document.getElementById('vlog');const LOG=[];
function log(x){LOG.push(x);if(LOG.length>6)LOG.shift();if(vlog)vlog.textContent='mic: '+LOG.join(' → ')}
const ERR={'not-allowed':INFRAME?'⚠️ Micro bị chặn vì trang đang chạy trong khung Claude. Mở link workers.dev bằng Chrome để dùng giọng nói — hoặc gõ lệnh vào ô bên dưới.':'⚠️ Trình duyệt đang chặn micro. Bấm biểu tượng 🔒 (hoặc ⓘ) cạnh thanh địa chỉ → Micro → <b>Cho phép</b>, tải lại trang rồi bấm 🎙️.',
  'service-not-allowed':'⚠️ Trình duyệt không cho dùng dịch vụ nhận giọng nói. Trên iPhone: Cài đặt → Siri → bật <b>Đọc chính tả</b>. Hoặc dùng Chrome.',
  'audio-capture':'⚠️ Không tìm thấy micro, hoặc micro đang bị ứng dụng khác dùng (Zalo, Messenger, game…). Tắt ứng dụng đó rồi thử lại.',
  'network':'⚠️ Nhận giọng nói cần Internet (Chrome gửi tiếng nói lên máy chủ Google để chuyển thành chữ). Kiểm tra mạng rồi bấm lại 🎙️.',
  'language-not-supported':'⚠️ Trình duyệt chưa hỗ trợ nhận tiếng Việt.'};
function makeRec(){
  const r=new SR();r.lang='vi-VN';r.continuous=!(IOS||ANDROID);r.interimResults=true;r.maxAlternatives=3;
  r.onstart=()=>log('mở');
  r.onaudiostart=()=>{restartFails=0;log('thu âm');if(Date.now()>holdUntil)showBar('',`🎙️ <b>Đang nghe — cứ nói</b> (mic giữ mở tới khi bấm lại 🎙️). VD <i>“cấm Tulen”</i>, <i>“chọn tướng khắc chế Aoi”</i>`,true)};
  r.onspeechstart=()=>log('có tiếng');
  r.onresult=e=>{if(speaking)return;idleAt=Date.now();
    for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];
      if(x.isFinal){heard=true;lastInterim='';let alt=x[0].transcript;for(let a=0;a<x.length;a++)if(findHero(x[a].transcript)){alt=x[a].transcript;break}
        const k=plain(alt).trim();if(k===lastFinal&&Date.now()-lastFinalAt<3000)continue; // Android hay trả trùng câu
        lastFinal=k;lastFinalAt=Date.now();log('chốt câu');run(alt)}
      else{lastInterim=x[0].transcript;holdUntil=0;showBar(x[0].transcript,'<span class="vdots">Đang nghe…</span>',true)}}};
  r.onerror=e=>{log('lỗi '+e.error);
    if(e.error==='no-speech'||e.error==='aborted')return; // im lặng: tự mở lại ở onend
    if(['network','service-not-allowed','language-not-supported'].includes(e.error)){
      /* trình duyệt không tự nhận giọng được (Cốc Cốc, Brave, Opera, mạng chặn Google…) → chuyển sang máy chủ AI của web */
      MODE='ai';try{localStorage.setItem('bp-lq-voice','ai')}catch(_){}
      on=false;try{rec.abort()}catch(_){}
      showBar('','🔁 Trình duyệt này không tự nhận giọng được — chuyển sang <b>chế độ AI của web</b>…',true);
      startAI();return}
    if(ERR[e.error]){on=false;btn.classList.remove('on');showBar('',ERR[e.error],true)}};
  r.onend=()=>{log('ngắt');
    if(!heard&&lastInterim){const t=lastInterim;lastInterim='';run(t)}heard=false;
    if(!on||speaking)return;
    if(Date.now()-idleAt>120000){stop();showBar('','🎙️ Đã tự tắt mic sau 2 phút không nói. Bấm 🎙️ để bật lại.');return}
    setTimeout(listen,200)};
  return r;
}
function listen(){if(!on||speaking)return;
  try{rec=makeRec();rec.start()}
  catch(e){log('không mở lại được');if(++restartFails>4){on=false;btn.classList.remove('on');showBar('','🎙️ Trình duyệt không cho tự mở lại mic. Bấm 🎙️ mỗi lần muốn nói nhé.',true)}else setTimeout(listen,600)}}
function start(){if(MODE==='ai')return startAI();on=true;idleAt=Date.now();restartFails=0;btn.classList.add('on');holdUntil=0;
  showBar('','⏳ Đang mở micro… (lần đầu trình duyệt sẽ hỏi quyền, bấm <b>Cho phép</b>)',true);
  try{rec=makeRec();rec.start()}catch(e){on=false;btn.classList.remove('on');showBar('','⚠️ Không mở được mic: '+e.message,true)}}
function stop(){on=false;btn.classList.remove('on');try{rec&&rec.stop()}catch(e){}stopAI();log('tắt')}
/* ===== Chế độ AI: tự ghi âm từng câu, gửi lên máy chủ của web (Whisper) để chuyển thành chữ =====
   Chạy được trên mọi trình duyệt có micro (Cốc Cốc, Brave, Firefox, Opera…), không phụ thuộc dịch vụ Google. */
let MODE=(()=>{try{return localStorage.getItem('bp-lq-voice')}catch(e){return null}})()||(NOSR?'ai':'web');
let ai=null;
async function startAI(){
  if(ai)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){showBar('','⚠️ Trình duyệt này không cho dùng micro.',true);return}
  btn.classList.add('on');showBar('','⏳ Đang mở micro (chế độ AI)…',true);log('AI: mở mic');
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
  catch(e){btn.classList.remove('on');showBar('',INFRAME?ERR['not-allowed']:'⚠️ Chưa được phép dùng micro. Bấm 🔒 cạnh thanh địa chỉ → Micro → <b>Cho phép</b>, rồi bấm lại 🎙️.',true);log('AI: bị chặn mic');return}
  const AC=window.AudioContext||window.webkitAudioContext;const ctx=new AC();
  try{await ctx.resume()}catch(e){}
  const src=ctx.createMediaStreamSource(stream),proc=ctx.createScriptProcessor(4096,1,1);
  const st2={stream,ctx,src,proc,buf:[],pre:[],talking:false,quiet:0,loud:0,floor:.01,sending:0,idleAt:Date.now()};ai=st2;
  const fr=4096/ctx.sampleRate; // giây mỗi khối
  proc.onaudioprocess=e=>{
    if(ai!==st2)return;
    const d=new Float32Array(e.inputBuffer.getChannelData(0));let sum=0;for(let i=0;i<d.length;i++)sum+=d[i]*d[i];const rms=Math.sqrt(sum/d.length);
    if(speaking){st2.talking=false;st2.buf=[];return} // web đang đọc: không ghi
    const thr=Math.max(.012,st2.floor*2.6);
    if(!st2.talking){st2.floor=st2.floor*.95+rms*.05;st2.pre.push(d);if(st2.pre.length>3)st2.pre.shift();
      if(rms>thr){if(++st2.loud>=2){st2.talking=true;st2.buf=st2.pre.slice();st2.quiet=0;log('AI: có tiếng');showBar('','🎙️ <b>Đang nghe…</b>',true)}}else st2.loud=0;
      if(Date.now()-st2.idleAt>120000){stop();showBar('','🎙️ Đã tự tắt mic sau 2 phút không nói. Bấm 🎙️ để bật lại.')}
      return}
    st2.buf.push(d);
    if(rms<thr)st2.quiet+=fr;else st2.quiet=0;
    const dur=st2.buf.length*fr;
    if(st2.quiet>.85||dur>7){const chunks=st2.buf;st2.buf=[];st2.talking=false;st2.loud=0;st2.idleAt=Date.now();
      if(dur-st2.quiet>.35)sendAI(chunks,ctx.sampleRate)}
  };
  src.connect(proc);proc.connect(ctx.destination);
  log('AI: đang nghe');showBar('','🎙️ <b>Đang nghe (chế độ AI) — cứ nói</b>, ngừng 1 giây là web xử lý. VD <i>“cấm Tulen”</i>, <i>“chọn tướng khắc chế Aoi”</i>',true);
  if(ctx.state!=='running')showBar('','🎙️ Bấm 🎙️ thêm 1 lần nữa để bắt đầu nghe.',true);
}
function stopAI(){const a=ai;ai=null;if(!a)return;try{a.proc.disconnect();a.src.disconnect()}catch(e){}a.stream.getTracks().forEach(t=>t.stop());try{a.ctx.close()}catch(e){}}
/* ghép các khối âm thanh → WAV 16kHz mono (định dạng máy chủ nào cũng đọc được) */
function toWav(chunks,rate){
  const n=chunks.reduce((s,c)=>s+c.length,0),all=new Float32Array(n);let o=0;chunks.forEach(c=>{all.set(c,o);o+=c.length});
  const R=16000,ratio=rate/R,m=Math.floor(n/ratio),pcm=new Int16Array(m);
  for(let i=0;i<m;i++){const a=Math.floor(i*ratio),b=Math.min(n,Math.floor((i+1)*ratio));let s=0;for(let j=a;j<b;j++)s+=all[j];const v=Math.max(-1,Math.min(1,s/Math.max(1,b-a)));pcm[i]=v<0?v*0x8000:v*0x7fff}
  const buf=new ArrayBuffer(44+pcm.length*2),v=new DataView(buf),w=(p,t)=>{for(let i=0;i<t.length;i++)v.setUint8(p+i,t.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+pcm.length*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,R,true);v.setUint32(28,R*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,pcm.length*2,true);
  new Int16Array(buf,44).set(pcm);return new Blob([buf],{type:'audio/wav'});
}
async function sendAI(chunks,rate){
  log('AI: gửi câu');showBar('','⏳ Đang chuyển giọng nói thành chữ…',true);
  try{const r=await fetch('/api/stt',{method:'POST',headers:{'content-type':'audio/wav'},body:toWav(chunks,rate)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){log('AI: lỗi '+r.status);showBar('','⚠️ '+(d.error||('Máy chủ nhận giọng lỗi '+r.status))+(r.status===404?' — trang đang chạy bản không có máy chủ (vd khung Claude). Mở link workers.dev.':''),true);return}
    const t=(d.text||'').replace(/[.。!?]+$/,'').trim();log('AI: “'+t+'”');
    if(!t){showBar('','🤔 Chưa nghe rõ, nói lại nhé.',true);return}
    run(t);
  }catch(e){log('AI: mất mạng');showBar('','⚠️ Không gửi được tới máy chủ (mất mạng hoặc đang mở bản không có máy chủ).',true)}
}
/* bấm = bật/tắt (dùng sự kiện click: điện thoại chỉ cho mở mic trong lần bấm thật) */
function toggle(){if(on||ai){stop();showBar('','🎙️ Đã tắt mic');return}start()}
btn.onclick=toggle;
/* gõ lệnh bằng chữ (dự phòng khi mic bị chặn, hoặc muốn ra lệnh nhanh) */
const vin=document.getElementById('vin');

if(vin)vin.addEventListener('keydown',e=>{if(e.key==='Enter'&&vin.value.trim()){run(vin.value.trim());vin.value=''}});

document.addEventListener('click',e=>{const b=e.target.closest('[data-vpick]');if(!b||!pending)return;const id=b.dataset.vpick,h=BY[id];
  if(used().has(id))return showBar('',`⚠️ ${h.name} đã được cấm/chọn rồi`);
  const pk=pending;pending=null;const er=pk.kind==='ban'?doBan(id,pk.side):doPick(id,pk.side,pk.lane);
  if(er)return showBar('','⚠️ '+er);say((pk.kind==='ban'?'Đã cấm ':'Đã chọn ')+h.name);showBar('',`${pk.kind==='ban'?'⛔ Đã cấm':'✅ Đã chọn'} <b>${h.name}</b> (${pk.side==='ally'?'đội bạn':'đối thủ'})`)});
document.getElementById('vclose').onclick=()=>{if(on)stop();bar.hidden=true};
document.getElementById('vhelp').onclick=()=>showBar('',`<b>Câu lệnh mẫu</b><br>
  ⛔ “cấm Tulen” · “địch cấm Yena” · “cấm theo gợi ý”<br>
  ✅ “chọn Aoi đi rừng” · “đối thủ chọn Violet và Thane” · “chọn gợi ý số 2”<br>
  👀 “xem đường giữa” · “gợi ý cấm” · “tier đường rồng”<br>
  ↶ “hoàn tác” · “làm lại” · “tắt giọng” · “tắt mic”<br>
  🗣️ Nói tự nhiên cũng hiểu: “khoá con Mu rát”, “bên kia lấy giọn với thên”, “cầm Tú lên đi rừng”, “cho em con nào khắc chết ao i”<br>
  <small>Nói tên tướng mà không nói cấm/chọn → tự điền vào lượt hiện tại. Câu quá lơ lớ → AI của web đoán ý.</small>`,true);
window.__voice={run,findHero,canon};
})();
