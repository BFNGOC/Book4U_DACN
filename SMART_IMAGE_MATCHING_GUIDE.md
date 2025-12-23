# 🖼️ Hướng Dẫn Liên Kết Hình Ảnh Sách - Smart Image Mapping

## 🎯 Cách Thức Hoạt Động

File `seedBooks.js` được cập nhật với **Smart Image Matching** - tự động tìm và liên kết ảnh tương ứng với sách một cách thông minh.

### 🔍 Quy Trình Matching (Priority)

```
1️⃣ Tìm ảnh có tên khớp → Nếu tìm thấy, dùng luôn
        ↓ (Không tìm thấy)
2️⃣ Round-robin chia ảnh đều cho sách
        ↓ (Không có ảnh)
3️⃣ Sách không có ảnh (empty array)
```

---

## 📁 Cách Đặt Tên Ảnh - 3 Phương Pháp

### ✅ **Phương Pháp 1: Tên Ảnh Khớp Tiêu Đề (Recommended)**

**Quy tắc:**

-   Tên ảnh phải khớp với tiêu đề sách **sau khi loại bỏ dấu**
-   Có thể dùng gạch nối (`-`) hoặc gạch dưới (`_`)

**Ví dụ:**

| Tiêu đề Sách                | →   | Tên File Ảnh                     |
| --------------------------- | --- | -------------------------------- |
| Đắc Nhân Tâm                | →   | `dac-nhan-tam.jpg`               |
| Nhà Giả Kim                 | →   | `nha-gia-kim.jpg`                |
| Deep Work                   | →   | `deep-work.jpg`                  |
| Sapiens: Lược Sử Loài Người | →   | `sapiens-luoc-su-loai-nguoi.jpg` |

**Hướng dẫn:**

1. Copy tiêu đề sách
2. Loại bỏ dấu (ä, ề, ồ, etc.) → chữ thường
3. Thay khoảng trắng/ký tự đặc biệt bằng gạch nối
4. Thêm extension: `.jpg`, `.png`, `.jpeg`, `.gif`

---

### ✅ **Phương Pháp 2: Tên File Số Thứ Tự (Auto Round-robin)**

**Quy tắc:**

-   Đặt tên file theo thứ tự sách
-   File `1.jpg` → Sách #1
-   File `2.jpg` → Sách #2
-   v.v.

**Ví dụ:**

```
uploads/books/
├── 1.jpg                    (→ Đắc Nhân Tâm)
├── 2.jpg                    (→ Nhà Giả Kim)
├── 3.jpg                    (→ Harry Potter và Hòn Đá Phù Thủy)
└── 13.jpg                   (→ Tư Duy Nhanh Và Chậm)
```

**Ưu điểm:**

-   Đơn giản nhất
-   Không cần lo về tên tiếng Việt

---

### ✅ **Phương Pháp 3: Trộn Lẫn (Cả 1 & 2)**

Một số ảnh đặt tên khớp tiêu đề, một số đặt số thứ tự:

```
uploads/books/
├── dac-nhan-tam.jpg         (✨ Match bởi tên)
├── 2.jpg                    (→ Nhà Giả Kim - round-robin)
├── harry-potter.jpg         (✨ Match bởi tên)
└── ...
```

---

## 🔄 Chi Tiết Quy Trình Matching

### 📌 Step 1: Đọc Tất Cả Ảnh

```javascript
const allImages = fs
    .readdirSync(imageDir)
    .filter((file) => file.match(/\.(jpg|jpeg|png|gif)$/i)) // Lọc các file ảnh
    .sort() // Sắp xếp A-Z
    .map((file) => `/uploads/books/${file}`); // Tạo full path
```

**Kết quả:** Array các đường dẫn ảnh

```javascript
[
  '/uploads/books/1.jpg',
  '/uploads/books/dac-nhan-tam.jpg',
  '/uploads/books/deep-work.jpg',
  ...
]
```

---

### 📌 Step 2: Tìm Ảnh Tương Ứng cho Mỗi Sách

```javascript
const findImageForBook = (title, index) => {
    // Nếu không có ảnh, return null
    if (allImages.length === 0) {
        return null;
    }

    // Bước A: Convert tiêu đề → slug (loại dấu)
    const titleSlug = slugify(title, { lower: true, strict: true });
    // VD: "Đắc Nhân Tâm" → "dac-nhan-tam"

    // Bước B: Tìm file ảnh có tên chứa slug này
    const matchedImage = allImages.find((img) =>
        img.toLowerCase().includes(titleSlug)
    );

    if (matchedImage) {
        console.log(`✨ Tìm thấy: ${title} → ${matchedImage}`);
        return matchedImage; // ✅ Trả về ảnh tương ứng
    }

    // Bước C: Nếu không tìm thấy, dùng round-robin
    const imageIndex = index % allImages.length;
    return allImages[imageIndex]; // VD: Sách #5 → ảnh #1 (5 % 3)
};
```

---

## 📊 Ví Dụ Mapping Thực Tế

### Kịch Bản: 13 Sách + 8 Ảnh

**File trong `uploads/books/`:**

```
1.jpg
2.jpg
dac-nhan-tam.jpg
deep-work.jpg
harry-potter.jpg
nha-gia-kim.jpg
sherlock-holmes.png
totto-chan.gif
```

**Kết Quả Mapping:**

| #   | Tiêu Đề Sách     | Slug               | Ảnh Được Chọn         | Phương Pháp    |
| --- | ---------------- | ------------------ | --------------------- | -------------- |
| 1   | Đắc Nhân Tâm     | `dac-nhan-tam`     | `dac-nhan-tam.jpg`    | ✨ Match       |
| 2   | Nhà Giả Kim      | `nha-gia-kim`      | `nha-gia-kim.jpg`     | ✨ Match       |
| 3   | Harry Potter     | `harry-potter`     | `harry-potter.jpg`    | ✨ Match       |
| 4   | Sapiens          | `sapiens`          | `1.jpg`               | 🔄 Round-robin |
| 5   | Totto-chan       | `totto-chan`       | `totto-chan.gif`      | ✨ Match       |
| 6   | 7 Thói Quen      | `7-thoi-quen`      | `2.jpg`               | 🔄 Round-robin |
| 7   | Sherlock Holmes  | `sherlock-holmes`  | `sherlock-holmes.png` | ✨ Match       |
| 8   | Dạy Con Làm Giàu | `day-con-lam-giau` | `dac-nhan-tam.jpg`    | 🔄 Round-robin |
| ... | ...              | ...                | ...                   | ...            |

---

## 🚀 Cách Sử Dụng

### **Bước 1: Chuẩn Bị Folder**

```bash
mkdir -p Server/uploads/books
```

### **Bước 2: Thêm Ảnh & Đặt Tên**

**Option A: Match theo tên (Recommended)**

```
Server/uploads/books/
├── dac-nhan-tam.jpg
├── nha-gia-kim.jpg
├── harry-potter.jpg
├── deep-work.jpg
└── ... (các ảnh khác)
```

**Option B: Đặt số thứ tự**

```
Server/uploads/books/
├── 1.jpg
├── 2.jpg
├── 3.jpg
└── ... (tương ứng thứ tự sách)
```

### **Bước 3: Chạy Seed**

```bash
cd Server
npm run seed:books
```

### **Bước 4: Xem Kết Quả Output**

```
🖼️ Tìm thấy 8 ảnh trong uploads/books.
...
✨ Tìm thấy ảnh tương ứng: Đắc Nhân Tâm → /uploads/books/dac-nhan-tam.jpg
...

📸 Chi tiết liên kết sách ↔ ảnh:
  1. Đắc Nhân Tâm
     └─ 🖼️  /uploads/books/dac-nhan-tam.jpg
  2. Nhà Giả Kim
     └─ 🖼️  /uploads/books/nha-gia-kim.jpg
  ...
```

---

## 🔧 Nếu Muốn Thay Đổi Cách Matching

### Edit lại hàm `findImageForBook` trong `seedBooks.js`:

**VD: Thêm priority cho ảnh đặt tên theo thứ tự**

```javascript
const findImageForBook = (title, index) => {
    if (allImages.length === 0) return null;

    // Priority 1: Tìm theo tên số (1.jpg, 2.jpg, etc)
    const numberFile = allImages.find(
        (img) =>
            img.match(/\/(\d+)\.(jpg|jpeg|png|gif)$/i) &&
            img.match(/\/(\d+)\.(jpg|jpeg|png|gif)$/i)[1] === String(index + 1)
    );
    if (numberFile) return numberFile;

    // Priority 2: Tìm theo slug (dac-nhan-tam.jpg)
    const titleSlug = slugify(title, { lower: true, strict: true });
    const matchedImage = allImages.find((img) =>
        img.toLowerCase().includes(titleSlug)
    );
    if (matchedImage) return matchedImage;

    // Priority 3: Round-robin fallback
    return allImages[index % allImages.length];
};
```

---

## 💡 Tips & Tricks

### 📌 Tip 1: Nhanh Chóng Tạo Tên Ảnh Khớp

```bash
# Sử dụng slugify online hoặc script Python
# Ví dụ Python:
python3 << 'EOF'
from slugify import slugify

titles = [
    'Đắc Nhân Tâm',
    'Nhà Giả Kim',
    # ... thêm các tiêu đề khác
]

for i, title in enumerate(titles, 1):
    slug = slugify(title, separator='-', lowercase=True)
    print(f"{i}. {title} -> {slug}.jpg")
EOF
```

### 📌 Tip 2: Batch Rename Ảnh Hiện Có

**Windows PowerShell:**

```powershell
# Đổi tên file ảnh thành 1.jpg, 2.jpg, etc
$files = Get-ChildItem -Path ".\uploads\books\" -Filter "*.jpg"
$counter = 1
$files | ForEach-Object {
    Rename-Item -Path $_.FullName -NewName "$counter.jpg"
    $counter++
}
```

**Linux/Mac:**

```bash
# Rename ảnh theo thứ tự
for i in *.jpg; do
    mv "$i" "$(printf '%d.jpg' $((n++)))"
done
```

### 📌 Tip 3: Verify Matching

```javascript
// Chạy script để check matching trước seed
const titles = ['Đắc Nhân Tâm', 'Nhà Giả Kim', ...];
const allImages = [...];

titles.forEach((title, index) => {
    const titleSlug = slugify(title, { lower: true, strict: true });
    const matched = allImages.find(img => img.toLowerCase().includes(titleSlug));
    console.log(`${title} → ${matched ? '✅ MATCH' : '❌ FALLBACK'}`);
});
```

---

## 🐛 Troubleshooting

| Vấn Đề                     | Nguyên Nhân                          | Giải Pháp                                |
| -------------------------- | ------------------------------------ | ---------------------------------------- |
| ❌ Không tìm thấy ảnh      | Folder `uploads/books` không tồn tại | `mkdir -p Server/uploads/books`          |
| ❌ Sách không có ảnh       | File ảnh khác format (.webp, .bmp)   | Sử dụng `.jpg/.png/.gif`                 |
| ❌ Matching sai            | Tên file không khớp (dấu, ký tự)     | Dùng số thứ tự thay vì tên               |
| ✨ Không match dù tên đúng | Tên file chứa ký tự đặc biệt         | Dùng tên file đơn giản: `1.jpg`, `2.jpg` |

---

## 📝 Output Log Mẫu

```
🖼️ Tìm thấy 5 ảnh trong uploads/books.

🧹 Đã xóa toàn bộ dữ liệu cũ.
📚 Đã tạo 10 thể loại.

✨ Tìm thấy ảnh tương ứng: Đắc Nhân Tâm → /uploads/books/dac-nhan-tam.jpg
✨ Tìm thấy ảnh tương ứng: Nhà Giả Kim → /uploads/books/nha-gia-kim.jpg
✨ Tìm thấy ảnh tương ứng: Deep Work → /uploads/books/deep-work.jpg

✅ Đã thêm 13 sách mẫu vào database.

📸 Chi tiết liên kết sách ↔ ảnh:
  1. Đắc Nhân Tâm
     └─ 🖼️  /uploads/books/dac-nhan-tam.jpg
  2. Nhà Giả Kim
     └─ 🖼️  /uploads/books/nha-gia-kim.jpg
  3. Harry Potter và Hòn Đá Phù Thủy
     └─ 🖼️  /uploads/books/1.jpg
  ...
```

---

**Cập nhật lần cuối:** 23-12-2025
**Phiên bản:** v2.0 - Smart Image Matching
