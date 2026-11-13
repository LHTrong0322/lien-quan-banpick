# Ban-Pick Liên Quân

Web mô phỏng màn ban-pick của Liên Quân Mobile (10 cấm). Bạn nhập tướng đối thủ và đồng đội, web gợi ý tướng khắc chế cho từng đường, xếp hạng S / A / B.

- `index.html`, `style.css`, `app.js`: giao diện và cách tính điểm
- `data.js`, `img/`: dữ liệu tướng và ảnh, do `tools/build_data.py` tạo ra

## Cập nhật dữ liệu tướng

```bash
git clone --depth 1 https://github.com/MLuc24/lien-quan-data
git clone --depth 1 https://github.com/LKTNLAC/Arena-of-Valor-Draft-Suggestion
python3 tools/build_data.py lien-quan-data Arena-of-Valor-Draft-Suggestion .
```

Nguồn: kỹ năng và tướng lấy từ trang chủ Garena (qua [lien-quan-data](https://github.com/MLuc24/lien-quan-data)). Kèo khắc chế và kết hợp đồng đội lấy từ [Arena-of-Valor-Draft-Suggestion](https://github.com/LKTNLAC/Arena-of-Valor-Draft-Suggestion). Ảnh tướng © Garena/Tencent. Đây là công cụ tham khảo do người hâm mộ làm, không phải sản phẩm chính thức.

Agent build by @Trong0322
