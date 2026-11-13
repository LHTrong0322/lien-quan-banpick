"""Gộp 2 bộ dữ liệu thành site/data.js + site/img/*.webp
- Garena (MLuc24/lien-quan-data): tên, lớp, đường, loại sát thương, hiệu ứng kỹ năng, tầm đánh
- Cộng đồng (LKTNLAC/Arena-of-Valor-Draft-Suggestion): vai trò phụ, ảnh, kèo khắc chế, kết hợp
"""
import json, re, sys, unicodedata, os
from PIL import Image

G = sys.argv[1]   # đường dẫn lien-quan-data
C = sys.argv[2]   # đường dẫn Arena-of-Valor-Draft-Suggestion
OUT = sys.argv[3] # thư mục site

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
PCT_HP = re.compile(r'% máu tối đa|% máu đã mất|máu tối đa của (mục tiêu|nạn nhân|kẻ địch)', re.I)

# Bổ sung tay những đặc điểm khó suy ra từ mô tả kỹ năng
POKE = {'elsu','krixi','dirak','preyta','ignis','iggy','yue','jinna','azzenka','darcy','ilumia','heino','flowborn','lorion','ishar','evita'}
EARLY = {'valhein','ryoma','nakroth','zephys','errol','omen','amily','thane','zuka','aoi','sinestrea','qi','bijan','kriknak'}
LATE = {'yorn','telannas','capheny','laville','hayate','thorne','murad','florentino','yena','butterfly','lubu','elandorr','erin','stuart','allain','yan','tulen','raz','liliana'}
ENGAGE = {'thane','toro','mina','lumburr','omega','wiro','roxie','baldum','ormarr','arum','grakk','cresht','gildur','ybneth','ata','max','skud','superman','qi','arduin','maloch','teemee','xeniel'}
ADD = {'nakroth':'d','kahlii':'n','zill':'bdu','raz':'b','liliana':'b','tulen':'b','zata':'b','krixi':'p','airi':'b','keera':'d','quillen':'d','ngokhong':'d','toro':'c','thane':'c','grakk':'c','arum':'c','aleister':'c','teemee':'c','sinestrea':'b','kriknak':'d'}
Q = ['arum','aleister','grakk','toro','thane','ormarr','lumburr','baldum','mina','gildur','ybneth','cresht','ignis','azzenka','ilumia','veera','tulen','lorion','omen','amily','qi','ata','max','skud','superman','wonderwoman','enzo','airi','ishar','alice','annette','rouie','kahlii','dieuthuyen','omega','wiro','roxie','arduin','teemee','xeniel']
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
    if 'Sát thương chuẩn' in tags or PCT_HP.search(desc): f.add('x')
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
    f |= set(ADD.get(k,''))
    f -= set(REM.get(k,''))
    if 't' in f: f.discard('r')
    if 'r' in f and 'd' in f and ('Xạ thủ' in cls): f.add('k')
    img = None
    if c and c.get('image') and os.path.exists(f"{C}/{c['image']}"):
        img = f'img/{k}.webp'
        Image.open(f"{C}/{c['image']}").convert('RGB').resize((112, 112), Image.LANCZOS).save(f'{OUT}/{img}', 'WEBP', quality=80)
    heroes.append({'id': k, 'cid': (c or {}).get('id'), 'name': h['name'].replace('’', "'"), 'title': h.get('title', ''),
                   'cls': cls, 'lanes': lanes, 'f': ''.join(sorted(f)), 'img': img, 'meta': META.get(k, 0)})

cid2id = {x['cid']: x['id'] for x in heroes if x['cid']}
cnt = [[cid2id[x['heroA']], cid2id[x['heroB']], x['score']] for x in counters if x['heroA'] in cid2id and x['heroB'] in cid2id]
sy = [[cid2id[x['heroA']], cid2id[x['heroB']], x['score']] for x in syn if x['heroA'] in cid2id and x['heroB'] in cid2id]
for x in heroes: x.pop('cid')
js = ('// Tự sinh bởi build_data.py — không sửa tay\n'
      f'const HEROES={json.dumps(heroes, ensure_ascii=False, separators=(",", ":"))};\n'
      f'const COUNTERS={json.dumps(cnt, separators=(",", ":"))};\n'
      f'const SYNERGY={json.dumps(sy, separators=(",", ":"))};\n')
open(f'{OUT}/data.js', 'w').write(js)
print(len(heroes), 'heroes', sum(1 for x in heroes if x['img']), 'imgs', len(cnt), 'counters', len(sy), 'syn')
print([x['name'] for x in heroes if not x['img']])
for n in ('nakroth', 'arum', 'kahlii', 'hayate', 'thane', 'murad', 'elsu', 'aleister'):
    x = next(y for y in heroes if y['id'] == n); print(n, x['lanes'], x['f'], x['cls'])
