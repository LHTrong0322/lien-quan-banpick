"""Gộp 2 bộ dữ liệu thành site/data.js + site/img/*.webp
- Garena (MLuc24/lien-quan-data): tên, lớp, đường, loại sát thương, hiệu ứng kỹ năng, tầm đánh
- Cộng đồng (LKTNLAC/Arena-of-Valor-Draft-Suggestion): vai trò phụ, ảnh, kèo khắc chế, kết hợp
"""
import json, re, sys, unicodedata, os
from PIL import Image

G = sys.argv[1]   # đường dẫn lien-quan-data
C = sys.argv[2]   # đường dẫn Arena-of-Valor-Draft-Suggestion
OUT = sys.argv[3] # thư mục site
PRO_DIR = sys.argv[4] if len(sys.argv) > 4 else None  # thư mục dữ liệu giải đấu (data/pro)

def norm(s):
    s = unicodedata.normalize('NFD', s.replace('đ', 'd').replace('Đ', 'D'))
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    return re.sub(r"[^a-z0-9]", '', s.lower())

g = json.load(open(f'{G}/data/heroes.json'))
ch = json.load(open(f'{C}/data/heroes.json'))
counters = json.load(open(f'{C}/data/counters.json'))
syn = json.load(open(f'{C}/data/synergies.json'))

cmap = {}
for h in ch:
    k = norm(h['name'])
    if h['id'].startswith('flowborn'):
        k = 'flowborn'
        if k in cmap:
            cmap[k]['roles'] = sorted(set(cmap[k]['roles'] + h['roles']))
            continue
    cmap[k] = dict(h)
ALIAS = {'kilgroth': 'kiigroth', 'teeri': 'terri'}  # id lỗi chính tả trong bộ cộng đồng

LANE_G = {'Đường Tà Thần': 'T', 'Đi rừng': 'J', 'Đường giữa': 'M', 'Đường Rồng': 'A', 'Hỗ trợ': 'S'}
LANE_C = {'Top': 'T', 'Jungle': 'J', 'Mid': 'M', 'ADC': 'A', 'Support': 'S'}

HARD_CC = re.compile(r'choáng|hất tung|áp chế|câm lặng|trói|kéo .{0,20}(về|lại)|khiêu khích|đóng băng|hóa đá|mê hoặc|làm ngủ', re.I)
CHANNEL = re.compile(r'vận (sức|công|chiêu)|niệm chú|trong thời gian vận|liên tục trong .{0,10}giây.{0,40}(không thể di chuyển|đứng yên)', re.I)
PCT_HP = re.compile(r'% máu đã mất|% máu tối đa của (mục tiêu|nạn nhân|kẻ địch|đối phương)|máu tối đa của (mục tiêu|nạn nhân|kẻ địch)', re.I)

# Bổ sung tay những đặc điểm khó suy ra từ mô tả kỹ năng
POKE = {'elsu','krixi','dirak','preyta','ignis','iggy','yue','jinna','azzenka','darcy','ilumia','heino','flowborn','lorion','ishar','evita'}
EARLY = {'valhein','ryoma','nakroth','zephys','errol','omen','amily','thane','zuka','aoi','sinestrea','qi','bijan','kriknak'}
LATE = {'yorn','telannas','capheny','laville','hayate','thorne','murad','florentino','yena','butterfly','lubu','elandorr','erin','stuart','allain','yan','tulen','raz','liliana'}
ENGAGE = {'thane','toro','mina','lumburr','omega','wiro','roxie','baldum','ormarr','arum','grakk','cresht','gildur','ybneth','ata','max','skud','superman','qi','arduin','maloch','teemee','xeniel'}
ADD = {'nakroth':'d','kahlii':'n','zill':'bdu','raz':'b','liliana':'b','tulen':'b','zata':'b','krixi':'p','airi':'b','keera':'d','quillen':'d','ngokhong':'d','toro':'c','thane':'c','grakk':'c','arum':'c','aleister':'c','teemee':'c','sinestrea':'b','kriknak':'d'}
Q = ['arum','aleister','grakk','toro','thane','ormarr','lumburr','baldum','mina','gildur','ybneth','cresht','ignis','azzenka','ilumia','veera','lorion','omen','amily','qi','ata','max','skud','superman','wonderwoman','enzo','airi','ishar','alice','annette','rouie','kahlii','dieuthuyen','omega','wiro','roxie','arduin','teemee','xeniel']
for q in Q: ADD[q] = ADD.get(q,'') + 'qc'
REM = {'arum':'dx','thane':'x'}
# Meta mùa S3-2026 (tổng hợp từ các bảng xếp hạng & tỷ lệ cấm công khai, 6–11/2026)
META = {'toro':2,'ybneth':1,'gildur':1,'yue':2,'zata':2,'nakroth':2,'aoi':2,'zuka':1,'ngokhong':1,'tulen':1,'liliana':1,'raz':1,
        'natalya':1,'lorion':1,'valhein':1,'yorn':1,'violet':1,'hayate':1,'capheny':1,'florentino':2,'yena':1,'omen':1,'qi':1,
        'ryoma':1,'thane':1,'zip':1,'grakk':1,'elsu':2,'aya':2,'taara':2,'sinestrea':2,'mina':1,'dyadia':1}

heroes, seen = [], set()
os.makedirs(f'{OUT}/img', exist_ok=True)
for h in g:
    k = norm(h['name'])
    if k in seen:  # Flowborn có 2 bản ghi (giữa + rồng)
        prev = next(x for x in heroes if x['id'] == k)
        l = LANE_G.get(h.get('lane'))
        if l and l not in prev['lanes']: prev['lanes'].append(l)
        continue
    seen.add(k)
    c = cmap.get(k) or cmap.get(ALIAS.get(k, ''), None)
    lanes = []
    if LANE_G.get(h.get('lane')): lanes.append(LANE_G[h['lane']])
    for r in (c or {}).get('roles', []):
        if LANE_C[r] not in lanes: lanes.append(LANE_C[r])
    if not lanes: lanes = ['M']
    # đường phụ (từ dữ liệu cộng đồng) chỉ giữ khi hợp lớp tướng
    FIT = {'T': {'Đấu sĩ', 'Đỡ đòn'}, 'J': {'Sát thủ', 'Đấu sĩ'}, 'M': {'Pháp sư'}, 'A': {'Xạ thủ'}, 'S': {'Trợ thủ', 'Đỡ đòn'}}
    cls_ = set(h.get('classes', []))
    lanes = lanes[:1] + [l for l in lanes[1:] if FIT[l] & cls_]
    tags = set(h.get('tags', []))
    eff = {e for s in h['skills'] for e in s.get('effects', [])}
    desc = ' '.join(s.get('description', '') for s in h['skills'])
    stats = {s['id']: s['value'] for s in h.get('stats', [])}
    cls = h.get('classes', [])
    f = set()
    if 'Đỡ đòn' in cls: f.add('t')
    if 'Sát thủ' in cls: f.add('b')
    if 'Trợ thủ' in cls and ({'Hồi máu', 'Lá chắn'} & tags): f.add('h')
    if 'Dịch chuyển' in tags: f.add('d')
    if 'Hồi máu' in tags or 'Hồi phục' in eff: f.add('s')
    if ('Sát thương chuẩn' in tags or PCT_HP.search(desc)) and not ({'Đỡ đòn', 'Trợ thủ'} & set(cls)): f.add('x')
    if 'Miễn khống' in tags or {'Giải khống', 'Miễn khống'} & eff: f.add('w')
    if {'Không bị khóa mục tiêu', 'Vô địch', 'Miễn nhiễm'} & eff: f.add('u')
    if 'Tàng hình' in tags or 'Ẩn thân' in eff: f.add('i')
    if {'Choáng', 'Hất tung', 'Áp chế', 'Câm lặng', 'Trói chân', 'Đóng băng', 'Khiêu khích'} & eff or HARD_CC.search(desc): f.add('c')
    if CHANNEL.search(desc): f.add('n')
    if h.get('damageType') == 'Phép': f.add('m')
    if 'Ranged' in stats.get('attackrange', '') or 'Xạ thủ' in cls or 'Pháp sư' in cls: f.add('r')
    if k in POKE: f.add('p')
    if k in EARLY: f.add('e')
    if k in LATE: f.add('l')
    if k in ENGAGE: f.add('g')
    # ----- chiêu thức tiêu biểu cho từng vai trò (để viết bài đánh cụ thể) -----
    CC_RANK = ['Áp chế', 'Choáng', 'Hất tung', 'Khiêu khích', 'Đóng băng', 'Trói chân', 'Câm lặng', 'Đẩy lùi', 'Khống chế']
    def pick(test, prefer_ult=False):
        sks = [x for x in h['skills'] if x['slot'] != 'passive'] or h['skills']
        if prefer_ult: sks = sks[::-1]
        for x in sks:
            r = test(x)
            if r: return [x['slotLabel'], x['name'], r if isinstance(r, str) else '']
        return None
    def cc_test(x):
        eff = x.get('effects', [])
        for e in CC_RANK:
            if e in eff: return e.lower()
        m = HARD_CC.search(x.get('description', ''))
        return m.group(0).lower() if m else None
    sk = {}
    best = None
    for x in [y for y in h['skills'] if y['slot'] != 'passive']:
        r = cc_test(x)
        if r and (best is None or CC_RANK.index(r.capitalize()) < CC_RANK.index(best[2].capitalize()) if r.capitalize() in CC_RANK and best and best[2].capitalize() in CC_RANK else best is None):
            best = [x['slotLabel'], x['name'], r]
    if best: sk['cc'] = best
    for key, test, ult in [
        ('dash', lambda x: 'Dịch chuyển' in x.get('effects', []) or re.search(r'\blướt|lao (tới|đến|về)|dịch chuyển|biến đến|nhảy', x.get('description', ''), re.I), False),
        ('tru', lambda x: ('Chuẩn' in x.get('effects', []) or PCT_HP.search(x.get('description', ''))) and 'sát thương chuẩn' if 'Chuẩn' in x.get('effects', []) else ('sát thương theo % máu' if PCT_HP.search(x.get('description', '')) else None), True),
        ('imm', lambda x: ('Miễn khống' in x.get('effects', []) or 'Giải khống' in x.get('effects', []) or re.search(r'miễn nhiễm khống chế|miễn khống|giải trừ khống chế|kháng hiệu ứng', x.get('description', ''), re.I)) and 'miễn khống chế', False),
        ('unt', lambda x: ({'Không bị khóa mục tiêu', 'Vô địch', 'Miễn nhiễm'} & set(x.get('effects', []))) and 'không thể bị chọn làm mục tiêu', False),
        ('inv', lambda x: ('Ẩn thân' in x.get('effects', []) or re.search(r'tàng hình|ẩn thân', x.get('description', ''), re.I)) and 'tàng hình', False),
        ('heal', lambda x: ('Hồi phục' in x.get('effects', []) or re.search(r'hồi (phục )?\d|hồi lại|hồi máu|hút máu', x.get('description', ''), re.I)) and 'hồi máu', False),
        ('shield', lambda x: ({'Lá chắn', 'Miễn thương'} & set(x.get('effects', []))) and 'lá chắn/giảm sát thương', False),
        ('chan', lambda x: CHANNEL.search(x.get('description', '')) and 'vận chiêu', False),
        ('ult', lambda x: x['slot'] == '3' and 'chiêu cuối', False),
    ]:
        r = pick(test, ult)
        if r: sk[key] = r
    if 'cc' in sk: f.add('c')
    if 'cc' in sk and sk['cc'][2] in ('áp chế', 'choáng', 'hất tung', 'khiêu khích', 'đóng băng', 'trói chân'): f.add('q')
    f |= set(ADD.get(k,''))
    f -= set(REM.get(k,''))
    if 't' in f: f.discard('r')
    if 'r' in f and 'd' in f and ('Xạ thủ' in cls): f.add('k')
    img = None
    if c and c.get('image') and os.path.exists(f"{C}/{c['image']}"):
        img = f'img/{k}.webp'
        Image.open(f"{C}/{c['image']}").convert('RGB').resize((112, 112), Image.LANCZOS).save(f'{OUT}/{img}', 'WEBP', quality=80)
    if not img and h.get('portrait'): img = h['portrait']  # ảnh trên trang Garena (chỉ hiện khi web chạy ngoài Claude)
    heroes.append({'id': k, 'cid': (c or {}).get('id'), 'name': h['name'].replace('’', "'"), 'title': h.get('title', ''),
                   'cls': cls, 'lanes': lanes, 'f': ''.join(sorted(f)), 'img': img, 'meta': 0, 'sk': sk})

# ánh xạ tên tướng ở các nguồn khác về id
PRO_NAME = {'wirosableng': 'wiro', 'zanis': 'trieuvan', 'diaochan': 'dieuthuyen', 'lubu': 'lubo', 'jinnar': 'jinna', 'flowborn': 'flowborn'}
ids = {x['id'] for x in heroes}
def pid(n):
    k = norm(n.replace('*', '').replace('^', ''))
    k = PRO_NAME.get(k, k)
    return k if k in ids else None
VS = {}
cid2id = {x['cid']: x['id'] for x in heroes if x['cid']}
# Bổ sung từ Thien21112005/aov-metaforge (MIT): chỉ lấy 29 tướng có dữ liệu riêng (bỏ mẫu chung)
ITEMS = {i['name'].lower(): i['name'] for i in json.load(open(f'{G}/data/items.json'))}
MF_ITEMS = {}
MF_TIPS = {}
MF_CNT = []
mf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'metaforge.json')
if os.path.exists(mf_path):
    ids_ = {x['id'] for x in heroes}
    for h in json.load(open(mf_path)):
        if h.get('counter_tips', '').startswith('Chú ý lượng trang bị'): continue
        k = norm(h['id'].replace('-', ''))
        if k not in ids_: continue
        its = [ITEMS[i.lower()] for i in h.get('counter_items', []) if i.lower() in ITEMS]
        if h.get('counter_tips'): MF_TIPS[k] = h['counter_tips']
        if its: MF_ITEMS[k] = its
        for e in h.get('countered_by', []):
            e = norm(e.replace('-', ''))
            if e in ids_ and e != k: MF_CNT.append([e, k])
cnt = [[cid2id[x['heroA']], cid2id[x['heroB']], x['score']] for x in counters if x['heroA'] in cid2id and x['heroB'] in cid2id]
cnt_set = {(a, b) for a, b, _ in cnt}
cnt += [[a, b, 6] for a, b in MF_CNT if (a, b) not in cnt_set]
# Kèo khắc chế + đồng minh từ lienquanmobile.gg (VN): "Tướng khắc chế X" → [counter, X]
LQ_ALLY = []
if PRO_DIR and os.path.exists(f'{PRO_DIR}/lqmb_matchups.json'):
    lq = json.load(open(f'{PRO_DIR}/lqmb_matchups.json'))['heroes']
    cnt_d = {(a, b): i for i, (a, b, _) in enumerate(cnt)}
    for nm, d in lq.items():
        hid = pid(nm)
        if not hid: continue
        for i_, c in enumerate(d.get('countered_by', [])):
            a = pid(c)
            if not a or a == hid: continue
            sc = 8 - min(i_, 3)  # xếp đầu danh sách = khắc chế mạnh hơn
            if (a, hid) in cnt_d: cnt[cnt_d[(a, hid)]][2] = max(cnt[cnt_d[(a, hid)]][2], sc) + 1
            else: cnt.append([a, hid, sc]); cnt_d[(a, hid)] = len(cnt) - 1
        for c in d.get('allies', []):
            a = pid(c)
            if a and a != hid: LQ_ALLY.append([hid, a, 6])

sy = [[cid2id[x['heroA']], cid2id[x['heroB']], x['score']] for x in syn if x['heroA'] in cid2id and x['heroB'] in cid2id]
sy_set = {tuple(sorted(x[:2])) for x in sy}
sy += [x for x in LQ_ALLY if tuple(sorted(x[:2])) not in sy_set]
for x in heroes: x.pop('cid')
# ===== Dữ liệu giải đấu chuyên nghiệp (Liquipedia): VN = ĐTDV, TH = RPL, TW = GCS =====
PRO, PAIRS, REG = {}, {}, []
if PRO_DIR:
    LEAGUE = {'Arena_of_Glory': 'ĐTDV', 'RoV_Pro_League': 'RPL', 'Garena_Challenger_Series': 'GCS'}
    SEASON = {'Spring': 'Xuân', 'Summer': 'Hè', 'Winter': 'Đông', 'Fall': 'Thu'}
    src = json.load(open(f'{PRO_DIR}/sources.json'))['leagues']
    for lg in src:
        fn, reg = lg['file'], lg['region']
        nm, yr, ss = lg['current'].split('/')
        label = f"{LEAGUE.get(nm, nm)} mùa {SEASON.get(ss, ss)} {yr}"
        raw = open(f'{PRO_DIR}/{fn}').read().strip()
        games, body = raw.split('#', 1)
        games = int(games); REG.append([reg, label, games])
        for row in body.split(';'):
            parts = row.split('|')
            hid = pid(parts[0])
            if not hid: continue
            p, w, b = int(parts[1]), int(parts[2]), int(parts[3])
            d = PRO.setdefault(hid, {})
            o = d.get(reg, [0, 0, 0])
            d[reg] = [o[0] + p, o[1] + w, o[2] + b]
            for it in filter(None, (parts[4] if len(parts) > 4 else '').split(',')):
                nm, n, ww = it.rsplit(':', 2)
                h2 = pid(nm)
                if not h2 or h2 == hid: continue
                key = tuple(sorted((hid, h2)))
                PAIRS.setdefault(key, {})[reg] = (int(n), int(ww))
            vs = parts[5] if len(parts) > 5 and ':' in parts[5] else ''
            for it in filter(None, vs.split(',')):  # đối đầu trực tiếp ở giải: hid gặp h2, thắng ww/n
                nm, n, ww = it.rsplit(':', 2)
                h2 = pid(nm)
                if not h2 or h2 == hid: continue
                o = VS.setdefault((hid, h2), [0, 0]); o[0] += int(n); o[1] += int(ww)
    # điểm meta mỗi khu vực = độ phổ biến (pick + cấm trên tổng ván) + tỉ lệ thắng đã làm mượt
    G = {r[0]: r[2] for r in REG}
    for hid, d in PRO.items():
        sc = []
        for reg, g in G.items():
            p, w, b = d.get(reg, [0, 0, 0])
            pres = (p + b) / g
            wr = (w + 5) / (p + 10)
            sc.append(pres * 100 + (wr - .5) * 60 * min(1, p / 20))
        d['score'] = round(sum(sc) / len(sc), 1)
    # ===== Dữ liệu đấu hạng: VN (lienquanmobile.gg) + TH (rovmeta.com) =====
    RANK = {}
    for line in open(f'{PRO_DIR}/rank_vn_lqmbgg.txt'):
        if line.startswith('#') or not line.strip(): continue
        for row in line.strip().split(';'):
            n_, t_, wr, pr, br = row.split('|')
            hid = pid(n_)
            if hid: RANK.setdefault(hid, {})['vn'] = [float(wr), float(pr), float(br), t_]
    for line in open(f'{PRO_DIR}/rank_th_rovmeta.txt'):
        if line.startswith('#') or ':' not in line: continue
        t_, names = line.strip().split(':', 1)
        if t_ == 'PRO':  # nhóm "Pro" không có hạng trên rovmeta → tạm xếp A
            low = ' ' + names.lower() + ' '
            for x in heroes:
                if ' ' + x['name'].lower() + ' ' in low: RANK.setdefault(x['id'], {}).setdefault('th', 'A')
            continue
        for n_ in names.split(','):
            hid = pid(n_)
            if hid: RANK.setdefault(hid, {})['th'] = t_
    def pct(d):
        vals = sorted(d.values()); n_ = len(vals)
        return {k: (sum(1 for v in vals if v < x) + .5 * sum(1 for v in vals if v == x)) / n_ for k, x in d.items()}
    P_pro = pct({k: v['score'] for k, v in PRO.items()})
    P_vn = pct({k: v['vn'][1] + v['vn'][2] * 1.5 + (v['vn'][0] - 50) * 2 for k, v in RANK.items() if 'vn' in v})
    TH_NUM = {'S': 1, 'A': .7, 'B': .4, 'C': .15}
    COMB = {}
    for x in heroes:
        k = x['id']; parts = []
        if k in P_pro: parts.append((.45, P_pro[k]))
        elif PRO_DIR: parts.append((.45, 0))
        if k in P_vn: parts.append((.3, P_vn[k]))
        if 'th' in RANK.get(k, {}): parts.append((.25, TH_NUM[RANK[k]['th']]))
        if parts: COMB[k] = sum(w * v for w, v in parts) / sum(w for w, _ in parts)
    order = sorted(COMB, key=lambda k: -COMB[k]); n = len(order)
    for x in heroes:
        k = x['id']
        if k in COMB:
            i = order.index(k)
            t = 'S' if i < n * .12 else 'A' if i < n * .35 else 'B' if i < n * .7 else 'C'
        else: t = 'C'
        x['tier'] = t; x['meta'] = {'S': 2, 'A': 1.2, 'B': .4, 'C': -.2}[t]
        x['rank'] = RANK.get(k, {})
        if k in PRO: PRO[k]['tier'] = t
COMBOS = []
for (a, b), regs in PAIRS.items():
    n = sum(v[0] for v in regs.values()); w = sum(v[1] for v in regs.values())
    if n >= 8:
        COMBOS.append([a, b, n, w, ''.join(sorted(regs))])
COMBOS.sort(key=lambda c: -((c[3] + 3) / (c[2] + 6)))

PROVS = [[a, b, n, w] for (a, b), (n, w) in VS.items() if n >= 5]  # đối đầu trực tiếp ở giải
import datetime
UPDATED = datetime.date.today().strftime('%d/%m/%Y')
if PRO_DIR and os.path.exists(f'{PRO_DIR}/last_update.txt'):
    UPDATED = open(f'{PRO_DIR}/last_update.txt').readline().strip() or UPDATED
js = ('// Tự sinh bởi build_data.py — không sửa tay\n'
      f'const HEROES={json.dumps(heroes, ensure_ascii=False, separators=(",", ":"))};\n'
      f'const COUNTERS={json.dumps(cnt, separators=(",", ":"))};\n'
      f'const SYNERGY={json.dumps(sy, separators=(",", ":"))};\n'
      f'const PRO={json.dumps(PRO, separators=(",", ":"))};\n'
      f'const COMBOS={json.dumps(COMBOS, separators=(",", ":"))};\n'
      f'const COUNTER_ITEMS={json.dumps(MF_ITEMS, ensure_ascii=False, separators=(",", ":"))};\n'
      f'const PROVS={json.dumps(PROVS, separators=(",", ":"))};\n'
      f'const COUNTER_TIPS={json.dumps(MF_TIPS, ensure_ascii=False, separators=(",", ":"))};\n'
      f'const UPDATED={json.dumps(UPDATED, ensure_ascii=False)};\n'
      f'const REGIONS={json.dumps(REG, ensure_ascii=False, separators=(",", ":"))};\n')
open(f'{OUT}/data.js', 'w').write(js)
print(len(PRO), 'pro heroes', len(COMBOS), 'combos');print(len(heroes), 'heroes', sum(1 for x in heroes if x['img']), 'imgs', len(cnt), 'counters', len(sy), 'syn')
print([x['name'] for x in heroes if not x['img']])
for n in ('nakroth', 'arum', 'kahlii', 'hayate', 'thane', 'murad', 'elsu', 'aleister'):
    x = next(y for y in heroes if y['id'] == n); print(n, x['lanes'], x['f'], x['cls'])
