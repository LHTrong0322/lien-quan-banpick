# Ban-Pick Liên Quân

Web mô phỏng màn ban-pick của Liên Quân Mobile (10 cấm). Bạn nhập tướng đối thủ và đồng đội, web gợi ý tướng khắc chế cho từng đường, xếp hạng S / A / B.

- `index.html`, `style.css`, `app.js`: giao diện và cách tính điểm
- `data.js`, `img/`: dữ liệu tướng và ảnh, do `tools/build_data.py` tạo ra

## Dữ liệu

- `data_pro/aog_winter_2026.txt`, `rpl_winter_2026.txt`, `gcs_summer_2026.txt`: số liệu giải ĐTDV, RPL, GCS lấy từ Liquipedia (pick, thắng, cấm, cặp tướng hay đi cùng)
- `data_pro/rank_vn_lqmbgg.txt`: tỉ lệ thắng / chọn / cấm đấu hạng VN (lienquanmobile.gg)
- `data_pro/rank_th_rovmeta.txt`: tier list đấu hạng Thái (rovmeta.com, patch 1.64)
- `tools/metaforge.json`: kèo khắc chế và đồ khắc chế (Thien21112005/aov-metaforge, MIT)

GitHub Actions tự chạy mỗi tuần (`.github/workflows/update-data.yml`) để cập nhật tướng, kỹ năng và ảnh mới. Số liệu giải đấu và rank trong `data_pro/` cần cập nhật tay khi có mùa giải mới.

## Cập nhật dữ liệu tướng

```bash
git clone --depth 1 https://github.com/MLuc24/lien-quan-data
git clone --depth 1 https://github.com/LKTNLAC/Arena-of-Valor-Draft-Suggestion
python3 tools/build_data.py lien-quan-data Arena-of-Valor-Draft-Suggestion . data_pro
```

Nguồn: kỹ năng và tướng lấy từ trang chủ Garena (qua [lien-quan-data](https://github.com/MLuc24/lien-quan-data)). Kèo khắc chế và kết hợp đồng đội lấy từ [Arena-of-Valor-Draft-Suggestion](https://github.com/LKTNLAC/Arena-of-Valor-Draft-Suggestion). Ảnh tướng © Garena/Tencent. Đây là công cụ tham khảo do người hâm mộ làm, không phải sản phẩm chính thức.

Agent build by @Trong0322

## Ra lệnh bằng giọng nói
Bấm nút **🎙️ Giọng nói** (trên điện thoại là nút tròn góc dưới phải), cho phép dùng micro, rồi nói:
- “cấm Tulen”, “địch cấm Yena”, “cấm theo gợi ý”
- “chọn Aoi đi rừng”, “đối thủ chọn Violet và Thane”, “chọn gợi ý số 2”
- “xem đường giữa”, “gợi ý cấm”, “hoàn tác”, “làm lại”, “tắt giọng”, “tắt mic”

Chạy tốt trên Chrome/Edge (máy tính, Android) và Safari (iPhone). Firefox chưa hỗ trợ nhận giọng nói.

## Góp ý bài đánh (người chơi cùng làm thuật toán thông minh hơn)
Tab **💬 Góp ý**: gửi kèo khắc chế, cặp bài hoặc cả bài đánh 5 tướng, kèm cách đánh. Người khác bấm 👍/👎.
Góp ý có nhiều 👍 được cộng điểm khi gợi ý pick (tối đa ngang một kèo khắc chế mạnh); bị 👎 từ 3 trở lên thì bị ẩn và bỏ qua.

Lưu chung bằng **Cloudflare KV**: khai báo sẵn trong `wrangler.jsonc` (binding `CONTRIB`), Cloudflare tự tạo kho ở lần deploy đầu. Code máy chủ nằm ở `src/contrib.js`.
Nếu kho chưa sẵn sàng, trang tự chuyển sang lưu trên máy người dùng.

### Khi trình duyệt không tự nhận giọng được
Một số trình duyệt (Cốc Cốc, Brave, Opera, Firefox, hoặc mạng chặn máy chủ Google) báo lỗi "network".
Web tự chuyển sang **chế độ AI**: ghi âm từng câu ngay trên trình duyệt, gửi lên `/api/stt` (Cloudflare Workers AI, mô hình Whisper) để chuyển thành chữ, rồi chạy lệnh.

### Hiểu tiếng Việt lơ lớ
- Bộ từ vựng (`voice.js` → `TONED`, `PHR`, `ALIAS`) sửa sai chính tả, sai dấu, giọng vùng miền (tr/ch, r/d/gi, v/d, n/ng…) và tiếng lóng ("cầm", "khoá", "bên kia", "cao tơ"…).
- Câu vẫn không hiểu → gửi `/api/intent` (Workers AI, Llama 3.3) để đoán ý, trả về lệnh chuẩn rồi web tự thực hiện.
