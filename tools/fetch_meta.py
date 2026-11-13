"""Tự tải số liệu meta mới nhất, ghi đè vào data_pro/ (chạy hằng tuần trong GitHub Actions).

- Rank VN: lienquanmobile.gg/champions  -> data_pro/rank_vn_lqmbgg.txt
- Rank TH: rovmeta.com/tier-list        -> data_pro/rank_th_rovmeta.txt
- Giải đấu: Liquipedia (ĐTDV / RPL / GCS) -> data_pro/aog_*.txt, rpl_*.txt, gcs_*.txt

Nguồn nào lỗi thì giữ nguyên file cũ, không làm hỏng web.
Cách dùng: python3 tools/fetch_meta.py data_pro
"""
import gzip, json, re, sys, time, urllib.request, urllib.parse, datetime, html as H
from bs4 import BeautifulSoup

OUT = sys.argv[1] if len(sys.argv) > 1 else 'data_pro'
UA = 'LienQuanBanPickBot/1.0 (+https://github.com/LHTrong0322/lien-quan-banpick)'
TODAY = datetime.date.today().strftime('%d/%m/%Y')
report = []


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip'})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        if r.headers.get('Content-Encoding') == 'gzip':
            raw = gzip.decompress(raw)
        return raw.decode('utf-8', 'replace')


def save(fn, text):
    open(f'{OUT}/{fn}', 'w').write(text)


# ---------- Rank VN ----------
def rank_vn():
    soup = BeautifulSoup(get('https://lienquanmobile.gg/champions/'), 'html.parser')
    rows = []
    for tr in soup.select('tbody tr'):
        name = tr.select_one('span.name')
        tier = tr.select_one('span.tier')
        cell = {c: tr.select_one(f'td.{c}') for c in ('win_rate', 'pick_rate', 'ban_rate')}
        if not (name and tier and all(cell.values())):
            continue
        num = lambda td: td.get_text(strip=True).replace('%', '').replace(',', '.')
        rows.append('|'.join([name.get_text(strip=True), tier.get_text(strip=True),
                              num(cell['win_rate']), num(cell['pick_rate']), num(cell['ban_rate'])]))
    if len(rows) < 80:
        raise ValueError(f'chỉ đọc được {len(rows)} tướng')
    save('rank_vn_lqmbgg.txt', f'# Nguồn: lienquanmobile.gg/champions (tự cập nhật {TODAY}) — Tướng|Tier|Tỉ lệ thắng|Tỉ lệ chọn|Tỉ lệ cấm (rank VN)\n' + ';'.join(rows) + '\n')
    return len(rows)


# ---------- Rank TH ----------
def rank_th():
    raw = get('https://rovmeta.com/tier-list')
    raw = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', raw)
    text = re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', raw))).replace('▲', ' ').replace('▼', ' ').replace('~', ' ')
    patch = (re.search(r'Patch (\d+\.\d+)', text) or [None, '?'])[1]
    i = text.find('First-pick')
    if i < 0:
        raise ValueError('không thấy bảng tier')
    pro = re.search(r'Rank Pro (.*?) — S\+ TIER', text)
    parts = re.split(r' (S|A|B|C|D) (\d+) ', text[i:])
    groups = {}
    for k in range(1, len(parts) - 2, 3):
        tier, n = parts[k], int(parts[k + 1])
        names = [m.group(1).strip() for m in re.finditer(r"([A-Z][\w'’. ]*?) (Tank|Fighter|Assassin|Mage|Support|Carry)\b", parts[k + 2])][:n]
        if tier not in groups:
            groups[tier] = names
        if len(groups) >= 4:
            break
    if sum(len(v) for v in groups.values()) < 80:
        raise ValueError('đọc được quá ít tướng')
    lines = [f'# Nguồn: rovmeta.com/tier-list — tier rank máy chủ Thái (patch {patch}, tự cập nhật {TODAY}). S = nhóm S+ trên trang']
    lines += [f'{t}:' + ','.join(groups[t]) for t in ('S', 'A', 'B', 'C') if t in groups]
    if pro: lines.append('PRO:' + pro.group(1).strip())
    save('rank_th_rovmeta.txt', '\n'.join(lines) + '\n')
    return sum(len(v) for v in groups.values())


# ---------- Giải đấu (Liquipedia) ----------
def liquipedia(page):
    # Liquipedia chặn tải trang trực tiếp từ máy chủ GitHub → dùng API chính thức (action=parse), đúng quy định:
    # có User-Agent riêng, nén gzip, tối đa 1 lần parse / 30 giây.
    url = ('https://liquipedia.net/honorofkings/api.php?action=parse&format=json&formatversion=2&prop=text&page='
           + urllib.parse.quote(page + '/Statistics'))
    data = json.loads(get(url))
    if 'error' in data:
        raise ValueError(data['error'].get('info', 'lỗi API'))
    soup = BeautifulSoup(data['parse']['text'], 'html.parser')
    games = re.search(r'(\d+) games? played', soup.get_text(' '))
    games = int(games.group(1)) if games else 0
    out = []
    for tr in soup.select('tr.character-stats-row'):
        tds = tr.find_all('td', recursive=False)
        if len(tds) < 20:
            continue
        name = tds[1].get_text(' ', strip=True)
        name = re.sub(r'^(.+) \1$', r'\1', name).replace(' (Marksman)', '*').replace(' (Mage)', '^')
        p, w, b = (int(tds[i].get_text(strip=True) or 0) for i in (2, 3, 15))
        withs = []
        for tb in tds[-1].find_all('table'):
            th = tb.find('th')
            if th and th.get_text(strip=True) == 'Played With':
                for r in tb.find_all('tr'):
                    c = r.find_all('td')
                    if len(c) >= 5 and c[2].get_text(strip=True).isdigit():
                        hn = c[1].get_text(' ', strip=True)
                        hn = re.sub(r'^(.+) \1$', r'\1', hn).replace(' (Marksman)', '*').replace(' (Mage)', '^')
                        withs.append(f'{hn}:{int(c[2].get_text(strip=True))}:{int(c[3].get_text(strip=True))}')
                    if len(withs) >= 4:
                        break
        out.append('|'.join([name, str(p), str(w), str(b), ','.join(withs)]))
    return games, out


def tournaments():
    cfg = json.load(open(f'{OUT}/sources.json'))
    for reg in cfg['leagues']:
        done = False
        for page in reg['pages']:  # thử mùa mới nhất trước
            try:
                games, rows = liquipedia(page)
                time.sleep(31)  # giới hạn của Liquipedia: 1 lần parse / 30 giây
                if games >= reg.get('min_games', 40) and len(rows) >= 30:
                    save(reg['file'], f'{games}#' + ';'.join(rows) + '\n')
                    reg['current'] = page
                    report.append(f"{reg['region']}: {page} ({games} ván, {len(rows)} tướng)")
                    done = True
                    break
            except Exception as e:
                report.append(f"{reg['region']}: bỏ qua {page} ({e.__class__.__name__}: {str(e)[:80]})")
                time.sleep(31)
        if not done:
            report.append(f"{reg['region']}: giữ số liệu cũ")
    json.dump(cfg, open(f'{OUT}/sources.json', 'w'), ensure_ascii=False, indent=2)


for label, fn in [('Rank VN', rank_vn), ('Rank TH', rank_th)]:
    try:
        report.append(f'{label}: {fn()} tướng')
    except Exception as e:
        report.append(f'{label}: lỗi, giữ số liệu cũ ({e.__class__.__name__}: {str(e)[:100]})')
try:
    tournaments()
except Exception as e:
    report.append(f'Giải đấu: lỗi, giữ số liệu cũ ({e})')
print('\n'.join(report))
open(f'{OUT}/last_update.txt', 'w').write(TODAY + '\n' + '\n'.join(report) + '\n')
