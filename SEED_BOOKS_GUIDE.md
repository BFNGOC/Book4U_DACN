# 📚 Hướng Dẫn Sử Dụng Seed File

## 🎯 Mục Đích

File `seedBooks.js` dùng để tạo dữ liệu giả (fake data) cho database:

-   ✅ 10 danh mục sách (categories)
-   ✅ 30 quyển sách (books)
-   ✅ Phân bổ sách từ 5 seller khác nhau
-   ✅ Sử dụng ảnh thật từ folder `uploads/books`

---

## 📋 Yêu Cầu

### 1️⃣ Chuẩn Bị Seller IDs

Bạn cần có **ít nhất 5 seller accounts** trong database (roles = 'seller').

**Cách lấy Seller IDs:**

```bash
# Kết nối MongoDB và chạy:
db.profiles.find({ profileType: 'seller' }).select({ _id: 1, storeName: 1 })
```

Hoặc qua MongoDB Compass:

1. Mở MongoDB Compass
2. Vào collection `profiles`
3. Filter: `profileType: 'seller'`
4. Copy các `_id` của sellers

### 2️⃣ Cập Nhật Seller IDs trong File

Mở `Server/src/seedBooks.js` và sửa:

```javascript
const sellerIds = [
    'YOUR_ACTUAL_SELLER_ID_1', // Seller 1 - Thay bằng ID thực tế
    'YOUR_ACTUAL_SELLER_ID_2', // Seller 2
    'YOUR_ACTUAL_SELLER_ID_3', // Seller 3
    'YOUR_ACTUAL_SELLER_ID_4', // Seller 4
    'YOUR_ACTUAL_SELLER_ID_5', // Seller 5
];
```

### 3️⃣ Đảm Bảo Ảnh Tồn Tại

```
Server/
├── uploads/
│   └── books/
│       ├── book1.jpg
│       ├── book2.png
│       └── ... (ít nhất vài ảnh)
```

Nếu không có folder `uploads/books`, script sẽ báo lỗi.

---

## 🚀 Cách Sử Dụng

### **Cách 1: Dùng Node.js trực tiếp**

```bash
cd Server
node src/seedBooks.js
```

### **Cách 2: Thêm vào package.json (Recommended)**

```json
{
    "scripts": {
        "seed:books": "node src/seedBooks.js"
    }
}
```

Sau đó chạy:

```bash
npm run seed:books
```

---

## 📊 Output Kỳ Vọng

Khi chạy thành công, bạn sẽ thấy:

```
✅ Kết nối MongoDB thành công
🧹 Đã xóa toàn bộ dữ liệu cũ.
📚 Đã tạo 10 thể loại.
✅ Đã thêm 30 sách mẫu vào database.

📊 Thống kê phân phối sách theo seller:
  1. Seller 68e3c1c6b1dc5225b35ed032: 6 sách
  2. Seller 68e3c1c6b1dc5225b35ed033: 6 sách
  3. Seller 68e3c1c6b1dc5225b35ed034: 6 sách
  4. Seller 68e3c1c6b1dc5225b35ed035: 6 sách
  5. Seller 68e3c1c6b1dc5225b35ed036: 6 sách
```

---

## 🔗 Cấu Trúc Dữ Liệu Được Tạo

### **Categories** (10 danh mục)

```javascript
[
    'Văn học Việt Nam',
    'Văn học nước ngoài',
    'Kinh doanh - Tài chính',
    'Tâm lý - Kỹ năng sống',
    'Thiếu nhi',
    'Khoa học - Triết học',
    'Trinh thám - Hình sự',
    'Self-help',
    'Lịch sử - Văn hoá',
    'Công nghệ - Lập trình',
];
```

### **Books** (Ví dụ 1 quyển sách)

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (← Từ sellerIds array),
  categoryId: ObjectId (← Random từ 10 categories),
  title: 'Đắc Nhân Tâm',
  slug: 'dac-nhan-tam',
  author: 'Nhiều tác giả',
  publisher: 'NXB Tổng hợp',
  publicationYear: 2020 (random 2018-2025),
  language: 'Tiếng Việt',
  description: '',
  price: 145000 (random 80k-230k VNĐ),
  stock: 30 (random 10-60),
  discount: 0 hoặc 10 (30% chance),
  images: ['/uploads/books/book1.jpg'],
  numPages: 450 (random 200-800),
  tags: ['sách', 'đọc', 'bán chạy'],
  ratingAvg: 0,
  ratingCount: 0,
  format: 'bìa mềm' (default),
  isPublished: false (default),
  isFeatured: false (default),
  searchText: 'dac nhan tam nhieu tac gia sach doc ban chay' (no diacritics),
  createdAt: current timestamp,
  updatedAt: current timestamp
}
```

### **Phân Bổ Sách (Round-robin)**

```
Sách 0 (Đắc Nhân Tâm)     → Seller 1
Sách 1 (Nhà Giả Kim)      → Seller 2
Sách 2 (Harry Potter)     → Seller 3
Sách 3 (Sapiens)          → Seller 4
Sách 4 (Totto-chan)       → Seller 5
Sách 5 (7 Thói Quen)      → Seller 1  (lặp lại)
... và cứ tiếp tục
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1️⃣ **Xóa Toàn Bộ Dữ Liệu**

```javascript
// Script sẽ tự động xóa:
await Category.deleteMany();
await Book.deleteMany();
```

**Nếu bạn có dữ liệu quan trọng, hãy backup trước!**

### 2️⃣ **Seller IDs Phải Tồn Tại**

```javascript
// ❌ SAI - Seller không tồn tại
const sellerIds = ['invalid_id_123'];

// ✅ ĐÚNG - Lấy từ database
const sellerIds = ['68e3c1c6b1dc5225b35ed032'];
```

Nếu seller không tồn tại, tuy seed có thể chạy nhưng data sẽ orphan (không có seller).

### 3️⃣ **Images Phải Tồn Tại**

```javascript
// ❌ Nếu không có ảnh
const allImages = []; // mảng rỗng
// Sách sẽ được tạo mà không có ảnh

// ✅ Nếu có ảnh
const allImages = ['/uploads/books/book1.jpg', '/uploads/books/book2.jpg'];
```

### 4️⃣ **MongoDB Connection**

```javascript
// Đảm bảo MONGO_URI đúng trong .env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/book4u
```

---

## 🔧 Chỉnh Sửa Dữ Liệu

### Thêm/Xóa Sách

```javascript
const titles = [
    'Đắc Nhân Tâm',
    'Nhà Giả Kim',
    // Thêm tiêu đề mới ở đây
    'Cuốn Sách Mới Của Tôi',
];
```

### Thay Đổi Giá

```javascript
price: 80000 + Math.floor(Math.random() * 150000), // Giá 80k-230k
// Sửa thành:
price: 100000 + Math.floor(Math.random() * 200000), // Giá 100k-300k
```

### Thay Đổi Số Lượng Tồn Kho

```javascript
stock: 10 + Math.floor(Math.random() * 50), // Stock 10-60
// Sửa thành:
stock: 20 + Math.floor(Math.random() * 100), // Stock 20-120
```

### Thay Đổi Giảm Giá

```javascript
discount: Math.random() < 0.3 ? 10 : 0, // 30% sách giảm 10%
// Sửa thành:
discount: Math.random() < 0.5 ? 15 : 0, // 50% sách giảm 15%
```

---

## 🐛 Gỡ Lỗi (Troubleshooting)

### ❌ Lỗi: "Cannot find module './models/bookModel'"

**Giải pháp:** Chạy từ folder `Server`

```bash
cd Server
node src/seedBooks.js  # ✅ Đúng
```

### ❌ Lỗi: "ENOENT: no such file or directory './uploads/books'"

**Giải pháp:** Tạo folder và thêm ảnh

```bash
mkdir -p Server/uploads/books
# Sau đó thêm ảnh vào folder này
```

### ❌ Lỗi: "MongoError: E11000 duplicate key error"

**Giải pháp:** Slug bị trùng, chạy lại (nó sẽ xóa dữ liệu cũ)

```bash
node src/seedBooks.js
```

### ❌ Lỗi: "ValidationError: ... cast to ObjectId failed for value"

**Giải pháp:** Seller IDs sai format, kiểm tra lại:

```javascript
// Format phải là ObjectId string
'68e3c1c6b1dc5225b35ed032'; // ✅ Đúng 24 ký tự hex
'invalid'; // ❌ Sai
```

### ❌ Lỗi: "MONGO_URI not found"

**Giải pháp:** Tạo/kiểm tra file `.env`

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/book4u
```

---

## ✅ Verify Dữ Liệu Sau Khi Seed

### 1️⃣ Kiểm tra Categories

```javascript
db.categories.find({});
// Kỳ vọng: 10 documents
```

### 2️⃣ Kiểm tra Books

```javascript
db.books.find({});
// Kỳ vọng: 30 documents
```

### 3️⃣ Kiểm tra Phân Bổ theo Seller

```javascript
db.books.aggregate([
    { $group: { _id: '$sellerId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
]);
```

### 4️⃣ Kiểm tra Ảnh

```javascript
db.books.findOne({}).select({ images: 1 });
// Kỳ vọng: images array không rỗng
```

---

## 📝 Ghi Chú

-   **Seed script chạy 1 lần** để tạo dữ liệu ban đầu
-   **Mỗi lần chạy sẽ xóa dữ liệu cũ** (categories + books)
-   **OrderDetails, Reviews, Carts không bị xóa** (phụ thuộc vào books)
-   **Dữ liệu khách hàng (users, profiles) không bị xóa**

---

## 🎓 Tìm Hiểu Thêm

Xem file [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) để hiểu rõ:

-   Cấu trúc Book schema
-   Mối quan hệ giữa Book ↔ SellerProfile ↔ Category
-   Các fields trong Book model

---

**Cập nhật lần cuối:** 23-12-2025
**Người tạo:** AI Assistant
