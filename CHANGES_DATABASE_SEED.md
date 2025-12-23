# 📝 Tóm Tắt Các Thay Đổi - Database & Seed Data

## 🎯 Tổng Quan

Đã hoàn thành **tài liệu hóa database** và **cập nhật seed file** để liên kết dữ liệu sách với nhiều seller khác nhau.

---

## 📊 Các File Được Tạo/Sửa

### ✅ 1. **DATABASE_SCHEMA.md** (NEW)

**Vị trí:** `Book4U_DACN/DATABASE_SCHEMA.md`

**Nội dung:**

-   📋 Tổng quan 19 collections trong database
-   🔗 Chi tiết schema của mỗi collection
-   🔐 Các mối quan hệ (relationships) giữa collections
-   📌 Indexes quan trọng
-   🎯 Quy tắc liên kết dữ liệu
-   💡 Ghi chú & ví dụ truy vấn

**Lợi ích:**

-   🎓 Hiểu rõ cấu trúc database
-   🔍 Biết cách sách liên kết với seller, category
-   📈 Hướng dẫn design & optimize queries

---

### ✅ 2. **SEED_BOOKS_GUIDE.md** (NEW)

**Vị trí:** `Book4U_DACN/SEED_BOOKS_GUIDE.md`

**Nội dung:**

-   🚀 Cách sử dụng `seedBooks.js`
-   ✅ Yêu cầu chuẩn bị (seller IDs, images)
-   📊 Cấu trúc dữ liệu được tạo
-   🔧 Cách chỉnh sửa dữ liệu
-   🐛 Gỡ lỗi (troubleshooting)
-   ✓ Verify dữ liệu sau seed

**Lợi ích:**

-   👨‍💼 Hướng dẫn từng bước
-   🔧 Biết cách tùy chỉnh số liệu
-   🐛 Giải quyết lỗi nhanh chóng

---

### ✅ 3. **GET_SELLER_IDS_GUIDE.md** (NEW)

**Vị trí:** `Book4U_DACN/GET_SELLER_IDS_GUIDE.md`

**Nội dung:**

-   🔎 4 cách lấy Seller IDs từ database
    1. MongoDB Shell
    2. MongoDB Compass (Visual)
    3. Postman API
    4. Node.js Script
-   ⚠️ Nếu không có sellers
-   ✅ Verify & update seedBooks.js

**Lợi ích:**

-   🔍 Tìm Seller IDs dễ dàng
-   🎯 Chính xác 100% khi update file
-   💡 Có multiple options để chọn

---

### ✅ 4. **Server/src/seedBooks.js** (UPDATED)

**Vị trị:** `Server/src/seedBooks.js`

**Thay Đổi Chính:**

```javascript
// ❌ CŨ: Chỉ 1 seller
const sellerId = '68e3c1c6b1dc5225b35ed032';
const booksWithCategory = sampleBooks.map((book) => ({
    ...book,
    sellerId, // ← Tất cả sách chỉ thuộc 1 seller
    categoryId: randomCategory._id,
}));

// ✅ MỚI: Nhiều sellers (round-robin)
const sellerIds = [
    '68e3c1c6b1dc5225b35ed032', // Seller 1
    '68e3c1c6b1dc5225b35ed033', // Seller 2
    // ... thêm sellerIds khác
];

const booksWithCategory = sampleBooks.map((book, index) => {
    const assignedSellerId = sellerIds[index % sellerIds.length]; // ← Round-robin
    return {
        ...book,
        sellerId: assignedSellerId, // ← Khác nhau tuỳ sách
        categoryId: randomCategory._id,
    };
});

// ✅ THÊM: Thống kê phân phối sách
console.log('\n📊 Thống kê phân phối sách theo seller:');
sellerIds.forEach((sellerId, index) => {
    const booksForSeller = booksWithCategory.filter(
        (book) => book.sellerId === sellerId
    );
    console.log(
        `  ${index + 1}. Seller ${sellerId}: ${booksForSeller.length} sách`
    );
});
```

**Kết Quả:**

-   ✅ 30 sách được phân bổ cho 5 sellers (6 sách/seller)
-   ✅ In ra thống kê chi tiết
-   ✅ Flexible - dễ thêm/bớt sellers

---

## 📈 Dữ Liệu Được Tạo

### Categories (10)

```
Văn học Việt Nam
Văn học nước ngoài
Kinh doanh - Tài chính
Tâm lý - Kỹ năng sống
Thiếu nhi
Khoa học - Triết học
Trinh thám - Hình sự
Self-help
Lịch sử - Văn hoá
Công nghệ - Lập trình
```

### Books (30) - Phân Bổ Theo Seller

```
Round-robin distribution:
Sách 1,6,11,16,21,26   → Seller 1 (6 sách)
Sách 2,7,12,17,22,27   → Seller 2 (6 sách)
Sách 3,8,13,18,23,28   → Seller 3 (6 sách)
Sách 4,9,14,19,24,29   → Seller 4 (6 sách)
Sách 5,10,15,20,25,30  → Seller 5 (6 sách)
```

### Các Fields Mỗi Sách

```javascript
{
  sellerId:        ObjectId (← FROM sellerIds),
  categoryId:      ObjectId (← RANDOM),
  title:           String,
  slug:            String (auto-generated),
  author:          'Nhiều tác giả',
  publisher:       'NXB Tổng hợp',
  publicationYear: Number (2018-2025),
  price:           Number (80k-230k VNĐ),
  stock:           Number (10-60 units),
  discount:        0 hoặc 10%,
  images:          [String] (from uploads/books),
  numPages:        Number (200-800),
  tags:            ['sách', 'đọc', 'bán chạy'],
  format:          'bìa mềm' (default),
  isPublished:     false (default),
  isFeatured:      false (default),
  ratingAvg:       0 (default),
  ratingCount:     0 (default),
  searchText:      String (auto-generated, no diacritics),
  createdAt:       Date,
  updatedAt:       Date
}
```

---

## 🔗 Mối Liên Kết (Relationships)

### Book → SellerProfile

```
Book.sellerId (ObjectId) ──→ SellerProfile._id
                              ├─ storeName
                              ├─ businessType
                              ├─ warehouses[]
                              └─ rating
```

### Book → Category

```
Book.categoryId (ObjectId) ──→ Category._id
                               ├─ name
                               ├─ description
                               ├─ image
                               └─ slug
```

---

## 🚀 Cách Sử Dụng

### 1️⃣ Lấy Seller IDs

```bash
# Xem hướng dẫn
cat GET_SELLER_IDS_GUIDE.md

# Hoặc dùng MongoDB Shell
mongosh
use book4u
db.profiles.find({ profileType: 'seller' })
```

### 2️⃣ Update seedBooks.js

```bash
# Edit file
nano Server/src/seedBooks.js

# Thay thế Seller IDs (dòng 14-22)
const sellerIds = [
    'YOUR_SELLER_ID_1',
    'YOUR_SELLER_ID_2',
    'YOUR_SELLER_ID_3',
    'YOUR_SELLER_ID_4',
    'YOUR_SELLER_ID_5',
];
```

### 3️⃣ Chạy Seed

```bash
cd Server
npm run seed:books

# Output:
# ✅ Kết nối MongoDB thành công
# 🧹 Đã xóa toàn bộ dữ liệu cũ.
# 📚 Đã tạo 10 thể loại.
# ✅ Đã thêm 30 sách mẫu vào database.
# 📊 Thống kê phân phối sách theo seller...
```

### 4️⃣ Verify Dữ Liệu

```bash
# MongoDB Shell
db.books.countDocuments()  # Kỳ vọng: 30
db.categories.countDocuments()  # Kỳ vọng: 10

# Check phân phối seller
db.books.aggregate([
  { $group: { _id: "$sellerId", count: { $sum: 1 } } }
])
```

---

## 📚 Tài Liệu Liên Quan

| File                                               | Mục Đích            | Người Dùng       |
| -------------------------------------------------- | ------------------- | ---------------- |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)           | Tài liệu hoá schema | Developer, DBA   |
| [SEED_BOOKS_GUIDE.md](SEED_BOOKS_GUIDE.md)         | Hướng dẫn dùng seed | Developer, QA    |
| [GET_SELLER_IDS_GUIDE.md](GET_SELLER_IDS_GUIDE.md) | Lấy Seller IDs      | Developer, Setup |

---

## ⚡ Quick Reference

### Command Chạy Seed

```bash
cd Server
npm run seed:books
```

### Xóa Toàn Bộ Books & Categories

```javascript
db.books.deleteMany({});
db.categories.deleteMany({});
```

### Xóa Sách của 1 Seller

```javascript
db.books.deleteMany({ sellerId: ObjectId('...') });
```

### Kiểm Tra Sách của 1 Seller

```javascript
db.books.find({ sellerId: ObjectId('...') }).count();
```

---

## ✨ Lợi Ích Thay Đổi

| Trước                         | Sau                               |
| ----------------------------- | --------------------------------- |
| ❌ Tất cả 30 sách từ 1 seller | ✅ 30 sách từ 5 sellers khác nhau |
| ❌ Không rõ cấu trúc database | ✅ Có DATABASE_SCHEMA.md chi tiết |
| ❌ Khó sử dụng seedBooks      | ✅ Có hướng dẫn từng bước         |
| ❌ Khó lấy Seller IDs         | ✅ Có 4 cách khác nhau            |
| ❌ Không biết phân phối sách  | ✅ In ra thống kê chi tiết        |

---

## 🎓 Kiến Thức Mới

### Polymorphic Collections

-   Profile → Discriminator → SellerProfile, AdminProfile, ShipperProfile

### Round-robin Distribution

```javascript
assignedSellerId = sellerIds[index % sellerIds.length];
```

### Pre-hooks MongoDB

```javascript
// Auto-generate slug & searchText khi save/insertMany
bookSchema.pre('save', function() { ... })
bookSchema.pre('insertMany', function(next, docs) { ... })
```

---

## 🔧 Troubleshooting

| Lỗi                   | Nguyên Nhân        | Giải Pháp                       |
| --------------------- | ------------------ | ------------------------------- |
| MongoError: E11000    | Slug trùng         | Chạy lại seed (xóa dữ liệu cũ)  |
| ENOENT: uploads/books | Không có folder    | `mkdir -p Server/uploads/books` |
| ValidationError       | Seller ID sai      | Xem GET_SELLER_IDS_GUIDE.md     |
| Cannot find module    | Chạy từ folder sai | `cd Server` trước chạy          |

---

## 📋 Checklist Trước Chạy Seed

-   [ ] Đã tạo ít nhất 5 seller accounts
-   [ ] Đã lấy Seller IDs từ database
-   [ ] Đã cập nhật Seller IDs vào seedBooks.js
-   [ ] Đã tạo folder `Server/uploads/books`
-   [ ] Đã thêm ít nhất vài ảnh vào folder
-   [ ] Đã kiểm tra MONGO_URI trong .env
-   [ ] Đã backup dữ liệu quan trọng (nếu cần)

---

**Cập nhật lần cuối:** 23-12-2025
**Status:** ✅ Complete
**Phiên bản:** v1.0
