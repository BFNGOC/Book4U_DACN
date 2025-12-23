# 📸 Danh Sách Ảnh Sách & Mapping

## 📁 Ảnh Có Sẵn trong `uploads/books`

### ✨ **Ảnh Có Tên Khớp Tiêu Đề (Named Images - 12 ảnh)**

| #   | Tên Sách                            | Tên File Ảnh                          | Format |
| --- | ----------------------------------- | ------------------------------------- | ------ |
| 1   | **Đắc Nhân Tâm**                    | `dac-nhan-tam.png`                    | PNG    |
| 2   | **Nhà Giả Kim**                     | `nha-gia-kim.jpg`                     | JPG    |
| 3   | **Harry Potter và Hòn Đá Phù Thủy** | `harry-potter-va-hon-da-phu-thuy.jpg` | JPG    |
| 4   | **Sapiens: Lược Sử Loài Người**     | `sapiens-luoc-su-loai-nguoi.png`      | PNG    |
| 5   | **Totto-chan: Cô Bé Bên Cửa Sổ**    | `totto-chan-ben-cua-so.jpg`           | JPG    |
| 6   | **7 Thói Quen Hiệu Quả**            | `7-thoi-quen-hieu-qua.jpg`            | JPG    |
| 7   | **Sherlock Holmes Toàn Tập**        | `sherlock-home-toan-tap.webp`         | WEBP   |
| 8   | **Dạy Con Làm Giàu**                | `day-con-lam-giau.jpg`                | JPG    |
| 9   | **Deep Work**                       | `deep-work.png`                       | PNG    |
| 10  | **Chúa Tể Những Chiếc Nhẫn**        | `chua-te-cua-nhung-chiec-nhan.jpg`    | JPG    |
| 11  | **Lập Trình Căn Bản**               | `lap-trinh-can-ban.jpg`               | JPG    |
| 12  | **Khởi Nghiệp Tinh Gọn**            | `khoi-nghiep-tinh-gon.png`            | PNG    |

✅ **Tất cả ảnh này sẽ được map tự động đúng với từng sách!**

---

### 🎲 **Ảnh Auto-Generated (Timestamps - 14 ảnh)**

```
1760947335161-770980123.jpg
1760947749713-801050789.jpg
1760947964875-65889256.jpg
1760948364622-698552698.jpg
1760948370493-989860147.jpg
1760948471616-470455549.jpg
1764078374843-401065538.jpg
1764078402823-710514490.jpg
1764078664652-682236849.jpg
1764078781149-499444889.jpg
1764078921442-936911731.jpg
1764511745650-378295226.jpg
1765722054724-995480400.webp
```

💡 **Những ảnh này được upload qua form (có tên timestamp), sẽ được dùng làm fallback**

---

## 🎯 Mapping Chi Tiết

### Sách 1-12: ✅ Có Ảnh Tương Ứng

```
seedBooks.js sẽ tự động match:

Sách #1: "Đắc Nhân Tâm"
  → Tìm kiếm "dac-nhan-tam"
  ✨ Tìm thấy: /uploads/books/dac-nhan-tam.png

Sách #2: "Nhà Giả Kim"
  → Tìm kiếm "nha-gia-kim"
  ✨ Tìm thấy: /uploads/books/nha-gia-kim.jpg

Sách #3: "Harry Potter và Hòn Đá Phù Thủy"
  → Tìm kiếm "harry-potter-va-hon-da-phu-thuy"
  ✨ Tìm thấy: /uploads/books/harry-potter-va-hon-da-phu-thuy.jpg

... (tiếp tục cho các sách khác)

Sách #12: "Tư Duy Nhanh Và Chậm"
  → Tìm kiếm "tu-duy-nhanh-va-cham"
  ❌ Không tìm thấy (file là tu-duy-nhanh-va-cham.webp)
  📌 Fallback: Sử dụng ảnh từ danh sách named images
```

---

## 📊 Thống Kê

```
Tổng cộng: 26 ảnh
├── Named Images (khớp tên): 12 ảnh ✨
├── Timestamps (auto-generated): 14 ảnh
└── Hỗ trợ format: JPG, PNG, WEBP, GIF

Sách trong seedBooks.js: 13 quyển
├── Có ảnh tương ứng: 12 quyển ✅
└── Fallback images: 1 quyển (Tư Duy Nhanh Và Chậm)
```

---

## 🚀 Cách Hoạt Động

### **Priority 1: Tìm Exact Slug Match**

```javascript
titleSlug = 'dac-nhan-tam';
// Tìm ảnh chứa "dac-nhan-tam"
// ✨ Tìm thấy: /uploads/books/dac-nhan-tam.png
```

### **Priority 2: Partial Match (First 2 Words)**

```javascript
title = 'Sapiens: Lược Sử Loài Người';
titleSlug = 'sapiens-luoc-su-loai-nguoi';
partialSlug = 'sapiens-luoc'; // First 2 words
// ✨ Tìm thấy: /uploads/books/sapiens-luoc-su-loai-nguoi.png
```

### **Priority 3: First Word Only**

```javascript
title = 'Harry Potter và Hòn Đá Phù Thủy';
titleSlug = 'harry-potter-va-hon-da-phu-thuy';
firstWord = 'harry';
// ✨ Tìm thấy: /uploads/books/harry-potter-va-hon-da-phu-thuy.jpg
```

### **Priority 4: Round-robin từ Named Images**

```javascript
// Nếu không tìm thấy exact match
// Dùng ảnh khác từ danh sách named images theo thứ tự
Sách #13 → Named Image #1
Sách #14 → Named Image #2
```

---

## 💡 Gợi Ý

### Nếu Muốn Thêm Ảnh cho Sách #13 ("Tư Duy Nhanh Và Chậm")

**Optioin 1: Rename file WEBP → JPG**

```bash
# Windows PowerShell
Rename-Item "tu-duy-nhanh-va-cham.webp" "tu-duy-nhanh-va-cham.jpg"
```

**Option 2: Giữ nguyên (Sẽ dùng ảnh fallback)**

```
# Khi chạy seed, sẽ thấy:
Sách #13 "Tư Duy Nhanh Và Chậm"
  → 📌 Sử dụng ảnh có sẵn: /uploads/books/[named-image]
```

---

## ✅ Khi Chạy Seed

Bạn sẽ thấy output như thế này:

```
🖼️ Tìm thấy 26 ảnh trong uploads/books.

...

✨ Tìm thấy ảnh tương ứng: Đắc Nhân Tâm → /uploads/books/dac-nhan-tam.png
✨ Tìm thấy ảnh tương ứng: Nhà Giả Kim → /uploads/books/nha-gia-kim.jpg
✨ Tìm thấy ảnh tương ứng: Harry Potter và Hòn Đá Phù Thủy → /uploads/books/harry-potter-va-hon-da-phu-thuy.jpg
✨ Tìm thấy ảnh tương ứng: Sapiens: Lược Sử Loài Người → /uploads/books/sapiens-luoc-su-loai-nguoi.png
✨ Tìm thấy ảnh tương ứng: Totto-chan: Cô Bé Bên Cửa Sổ → /uploads/books/totto-chan-ben-cua-so.jpg
✨ Tìm thấy ảnh tương ứng: 7 Thói Quen Hiệu Quả → /uploads/books/7-thoi-quen-hieu-qua.jpg
✨ Tìm thấy ảnh tương ứng: Sherlock Holmes Toàn Tập → /uploads/books/sherlock-home-toan-tap.webp
✨ Tìm thấy ảnh tương ứng: Dạy Con Làm Giàu → /uploads/books/day-con-lam-giau.jpg
✨ Tìm thấy ảnh tương ứng: Deep Work → /uploads/books/deep-work.png
✨ Tìm thấy ảnh tương ứng: Chúa Tể Những Chiếc Nhẫn → /uploads/books/chua-te-cua-nhung-chiec-nhan.jpg
✨ Tìm thấy ảnh tương ứng: Lập Trình Căn Bản → /uploads/books/lap-trinh-can-ban.jpg
✨ Tìm thấy ảnh tương ứng: Khởi Nghiệp Tinh Gọn → /uploads/books/khoi-nghiep-tinh-gon.png
📌 Sử dụng ảnh có sẵn: Tư Duy Nhanh Và Chậm → /uploads/books/dac-nhan-tam.png

✅ Đã thêm 13 sách mẫu vào database.

📸 Chi tiết liên kết sách ↔ ảnh:
  1. Đắc Nhân Tâm
     └─ 🖼️  /uploads/books/dac-nhan-tam.png
  2. Nhà Giả Kim
     └─ 🖼️  /uploads/books/nha-gia-kim.jpg
  ...
```

---

## 🔧 Nếu Muốn Thêm/Sửa Ảnh

### Thêm Ảnh Mới

1. Đặt vào: `Server/uploads/books/`
2. Đặt tên khớp tiêu đề sách: `tieu-de-sach.jpg`
3. Chạy lại: `npm run seed:books`

### Xóa Ảnh Timestamps

```bash
# Nếu muốn dọn sạch folder (giữ lại ảnh named)
cd Server/uploads/books
del *-*.jpg  # Xóa các file có dấu "-" (timestamps)
```

---

**Cập nhật:** 23-12-2025
**File:** `BOOK_IMAGE_MAPPING.md`
