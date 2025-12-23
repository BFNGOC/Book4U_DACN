# 🔍 Hướng Dẫn Lấy Seller IDs từ Database

## 📌 Tại Sao Cần Seller IDs?

File `seedBooks.js` cần các Seller IDs để liên kết (link) sách với các seller khác nhau. Mỗi quyển sách phải có `sellerId` trỏ tới một seller thực tế trong database.

---

## 🔎 Cách 1: Dùng MongoDB Shell (Recommended)

### 📋 Bước 1: Kết Nối MongoDB

**Nếu dùng MongoDB Atlas (Cloud):**

```bash
mongosh "mongodb+srv://username:password@cluster.mongodb.net/book4u"
```

**Nếu dùng MongoDB Local:**

```bash
mongosh
use book4u
```

### 📋 Bước 2: Tìm Tất Cả Sellers

```javascript
// Lệnh 1: Xem tất cả sellers
db.profiles.find({ profileType: 'seller' })

// Kết quả sẽ giống:
[
  {
    _id: ObjectId("68e3c1c6b1dc5225b35ed032"),
    userId: ObjectId("60d5ec49c1d2a4001f8c1234"),
    firstName: "John",
    lastName: "Seller",
    storeName: "John's Bookstore",
    profileType: "seller",
    isVerified: true,
    ...
  },
  {
    _id: ObjectId("68e3c1c6b1dc5225b35ed033"),
    storeName: "Tech Books Shop",
    ...
  },
  ...
]
```

### 📋 Bước 3: Copy Các ID

Từ kết quả trên, copy các `_id`:

```javascript
68e3c1c6b1dc5225b35ed032
68e3c1c6b1dc5225b35ed033
68e3c1c6b1dc5225b35ed034
...
```

---

## 🔎 Cách 2: Dùng MongoDB Compass (Visual)

### 📋 Bước 1: Mở MongoDB Compass

-   Tải từ: https://www.mongodb.com/products/compass
-   Hoặc dùng MongoDB Compass built-in trong MongoDB

### 📋 Bước 2: Kết Nối Database

1. Paste MongoDB Connection String
2. Click "Connect"
3. Chọn database `book4u`

### 📋 Bước 3: Tìm Collection Profiles

1. Expand folder `book4u`
2. Click vào collection `profiles`
3. Ở phần "Filter", paste:

```json
{ "profileType": "seller" }
```

4. Nhấn Enter để filter

### 📋 Bước 4: Xem Kết Quả

```
┌─────────────────────────────────┬──────────────────────┐
│ _id                             │ storeName            │
├─────────────────────────────────┼──────────────────────┤
│ 68e3c1c6b1dc5225b35ed032       │ John's Bookstore     │
│ 68e3c1c6b1dc5225b35ed033       │ Tech Books Shop      │
│ 68e3c1c6b1dc5225b35ed034       │ Fiction House        │
│ 68e3c1c6b1dc5225b35ed035       │ Children's Books     │
│ 68e3c1c6b1dc5225b35ed036       │ Self-help Corner     │
└─────────────────────────────────┴──────────────────────┘
```

Copy các `_id` (cột bên trái)

---

## 🔎 Cách 3: Dùng Postman API

### 📋 Bước 1: Tạo Request GET

```
Method: GET
URL: http://localhost:5000/api/profiles?profileType=seller
```

### 📋 Bước 2: Gửi Request

```json
// Response sẽ trả về:
{
  "status": "success",
  "data": [
    {
      "_id": "68e3c1c6b1dc5225b35ed032",
      "storeName": "John's Bookstore",
      ...
    },
    {
      "_id": "68e3c1c6b1dc5225b35ed033",
      "storeName": "Tech Books Shop",
      ...
    }
  ]
}
```

Copy các `_id` từ response

---

## 🔎 Cách 4: Dùng Node.js Script

### 📋 Tạo File `getSellerIds.js`

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const { SellerProfile } = require('./models/profileModel');

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // Lấy tất cả sellers
        const sellers = await SellerProfile.find().select('_id storeName');

        console.log('\n🏪 Danh sách Sellers:');
        sellers.forEach((seller, index) => {
            console.log(`${index + 1}. ${seller._id} - ${seller.storeName}`);
        });

        console.log('\n📋 Copy vào seedBooks.js:');
        const ids = sellers.map((s) => `'${s._id}'`).join(',\n    ');
        console.log(`const sellerIds = [\n    ${ids}\n];`);

        mongoose.connection.close();
    })
    .catch((err) => {
        console.error('❌ Error:', err);
        mongoose.connection.close();
    });
```

### 📋 Chạy Script

```bash
cd Server
node getSellerIds.js
```

### 📋 Output

```
✅ Connected to MongoDB

🏪 Danh sách Sellers:
1. 68e3c1c6b1dc5225b35ed032 - John's Bookstore
2. 68e3c1c6b1dc5225b35ed033 - Tech Books Shop
3. 68e3c1c6b1dc5225b35ed034 - Fiction House
4. 68e3c1c6b1dc5225b35ed035 - Children's Books
5. 68e3c1c6b1dc5225b35ed036 - Self-help Corner

📋 Copy vào seedBooks.js:
const sellerIds = [
    '68e3c1c6b1dc5225b35ed032',
    '68e3c1c6b1dc5225b35ed033',
    '68e3c1c6b1dc5225b35ed034',
    '68e3c1c6b1dc5225b35ed035',
    '68e3c1c6b1dc5225b35ed036'
];
```

---

## ⚠️ Nếu Không Có Sellers?

Nếu database trống và chưa có sellers, bạn cần tạo trước:

### 📋 Option 1: Tạo User + Seller Profile (Recommended)

```javascript
// 1. Tạo User
const user = await User.create({
    email: 'seller1@example.com',
    password: 'hashed_password',
    role: 'seller',
});

// 2. System sẽ auto-create SellerProfile với userId = user._id
// 3. Copy SellerProfile._id để dùng trong seedBooks.js
```

### 📋 Option 2: Insert Trực Tiếp (Không Recommended)

```javascript
// ⚠️ Không nên làm cách này vì thiếu data User
db.profiles.insertOne({
    userId: ObjectId(),
    firstName: 'Test',
    lastName: 'Seller',
    profileType: 'seller',
    storeName: 'Test Store',
    businessType: 'individual',
    taxId: '0123456789',
    // ... other required fields
});
```

---

## ✅ Verify Sellers Sau Khi Có IDs

```javascript
// Kiểm tra 1 seller
db.profiles.findById(ObjectId('68e3c1c6b1dc5225b35ed032'))

// Kỳ vọng:
{
  _id: ObjectId('68e3c1c6b1dc5225b35ed032'),
  storeName: 'John\'s Bookstore',
  isVerified: true,
  profileType: 'seller'
}
```

---

## 🎯 Cập Nhật seedBooks.js

### Sau khi có Seller IDs, sửa file:

**File:** `Server/src/seedBooks.js`

**Dòng 14-22:**

```javascript
// 🏪 Danh sách các seller test (thay bằng ID thực tế từ database của bạn)
const sellerIds = [
    '68e3c1c6b1dc5225b35ed032', // Seller 1 - John's Bookstore
    '68e3c1c6b1dc5225b35ed033', // Seller 2 - Tech Books Shop
    '68e3c1c6b1dc5225b35ed034', // Seller 3 - Fiction House
    '68e3c1c6b1dc5225b35ed035', // Seller 4 - Children's Books
    '68e3c1c6b1dc5225b35ed036', // Seller 5 - Self-help Corner
];
```

---

## 🚀 Chạy Seed Sau Khi Update

```bash
cd Server
npm run seed:books

# Hoặc
node src/seedBooks.js
```

---

## 📊 Kết Quả Kỳ Vọng

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

## 💡 Tips & Tricks

### 📌 Lưu Seller IDs vào File

```bash
# MongoDB Shell
db.profiles.find({ profileType: 'seller' }, { _id: 1 }).pretty() > sellers.txt
```

### 📌 Kiểm Tra Sellers Có Sách

```javascript
db.books.aggregate([
  { $group: { _id: "$sellerId", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Output:
[
  { _id: ObjectId('68e3c1c6b1dc5225b35ed032'), count: 6 },
  { _id: ObjectId('68e3c1c6b1dc5225b35ed033'), count: 6 },
  ...
]
```

### 📌 Xóa Tất Cả Sách của 1 Seller

```javascript
db.books.deleteMany({
    sellerId: ObjectId('68e3c1c6b1dc5225b35ed032'),
});
```

---

**Cập nhật lần cuối:** 23-12-2025
**Người tạo:** AI Assistant
