# 📊 Book4U Database Schema Documentation

## 🗂️ Tổng Quan Cấu Trúc Database

Hệ thống Book4U sử dụng **MongoDB** với các collections chính sau:

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOK4U DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│  ├─ users (User)                                            │
│  ├─ profiles (Profile + Discriminators)                    │
│  │   ├─ sellers (SellerProfile)                            │
│  │   ├─ admins (AdminProfile)                              │
│  │   └─ shippers (ShipperProfile)                          │
│  ├─ books (Book)                                            │
│  ├─ categories (Category)                                   │
│  ├─ carts (Cart)                                            │
│  ├─ orders (Order)                                          │
│  ├─ orderdetails (OrderDetail)                              │
│  ├─ reviews (Review)                                        │
│  ├─ warehousestocks (WarehouseStock)                        │
│  ├─ warehouselogs (WarehouseLog)                            │
│  ├─ notifications (Notification)                            │
│  ├─ deliverystages (DeliveryStage)                          │
│  ├─ userinteractions (UserInteraction)                      │
│  ├─ roleRequests (RoleRequest)                              │
│  ├─ shippercoverageareas (ShipperCoverageArea)              │
│  └─ chatais (ChatAI)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Chi Tiết Các Collections

### 1️⃣ **users** (User Authentication)

Lưu trữ thông tin xác thực người dùng.

```javascript
{
  _id: ObjectId,
  email: String (required, unique, lowercase, trim),
  password: String | null (có thể login bằng Google),
  googleId: String | null,
  role: String (enum: ['customer', 'seller', 'admin', 'shipper'], default: 'customer'),
  resetPasswordToken: String | null,
  resetPasswordExpires: Date | null,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Liên kết:**

-   `User._id` → `Profile.userId`
-   `User.role` → Quyết định loại Profile (seller, admin, shipper)

---

### 2️⃣ **profiles** (User Profiles - Polymorphic)

Lưu trữ thông tin cơ bản của tất cả người dùng (Base Schema).

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  firstName: String (default: 'user'),
  lastName: String (default: userId.toString().slice(-5)),
  dateOfBirth: Date | null,
  primaryPhone: String | null (trim),
  isPhoneVerified: Boolean (default: false),
  phoneVerificationCode: String,
  phoneVerificationExpires: Date,
  avatar: String (default: '/uploads/default-avatar.png'),
  addresses: [
    {
      fullName: String | null,
      receiverPhone: String | null,
      street: String (required, trim),
      ward: String (required, trim),
      district: String (required, trim),
      province: String (required, trim),
      country: String (default: 'Vietnam'),
      postalCode: String | null,
      isDefault: Boolean (default: false)
    }
  ],
  profileType: String (discriminatorKey: 'seller' | 'admin' | 'shipper' | undefined),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3️⃣ **SellerProfile** (Discriminator của Profile)

Mở rộng Profile với thông tin bán hàng.

```javascript
{
  // Tất cả fields từ Profile +
  businessType: String (enum: ['individual', 'business'], required),
  businessName: String | null,
  businessRegistration: String | null,
  businessLicenseImages: [String],
  taxId: String (required, trim),
  storeName: String (required, trim),
  storeLogo: String (default: '/uploads/default-logo.png'),
  storeDescription: String | null,
  businessAddress: {
    street: String (required, trim),
    ward: String (required, trim),
    district: String (required, trim),
    province: String (required, trim),
    country: String (default: 'Vietnam'),
    postalCode: String
  },
  warehouses: [
    {
      name: String (required, trim),
      street: String (required, trim),
      ward: String (required, trim),
      district: String (required, trim),
      province: String (required, trim),
      country: String (default: 'Vietnam'),
      postalCode: String,
      isDefault: Boolean (default: false),
      managerName: String (required, trim),
      managerPhone: String (required, trim),
      location: {
        latitude: Number | null,
        longitude: Number | null,
        address: String | null,
        accuracy: String (enum: ['gps', 'city', 'city_default'], default: 'city_default'),
        geocodedAt: Date | null
      }
    }
  ],
  bankDetails: {
    accountName: String (required, trim),
    accountNumber: String (required, trim),
    bankName: String (required, trim),
    branchName: String (required, trim),
    swiftCode: String
  },
  rating: Number (default: 0, min: 0, max: 5),
  totalSales: Number (default: 0),
  commissionRate: Number (default: 10),
  isVerified: Boolean (default: false),
  verificationDate: Date | null,
  identificationNumber: String (required, trim),
  identificationImages: {
    front: String (required),
    back: String (required)
  }
}
```

---

### 4️⃣ **AdminProfile** (Discriminator của Profile)

Mở rộng Profile với thông tin quản trị viên.

```javascript
{
  // Tất cả fields từ Profile +
  department: String (enum: ['operations', 'customer_service', 'technical', 'management'],
                      default: 'operations'),
  permissions: [
    String (enum: ['manage_users', 'manage_products', 'manage_orders',
                   'manage_sellers', 'manage_shippers', 'view_analytics',
                   'manage_settings'])
  ],
  employeeId: String (unique, sparse),
  hireDate: Date (default: now)
}
```

---

### 5️⃣ **ShipperProfile** (Discriminator của Profile)

Mở rộng Profile với thông tin shipper giao hàng.

```javascript
{
  // Tất cả fields từ Profile +
  driverLicenseNumber: String (required, trim),
  driverLicenseImages: {
    front: String (required),
    back: String (required)
  },
  portraitImage: String (required),
  vehicleType: String (enum: ['motorcycle', 'car', 'van', 'truck'],
                       default: 'motorcycle', required),
  vehicleRegistration: String (required, trim),
  serviceArea: [
    {
      district: String (required, trim),
      province: String (required, trim)
    }
  ],
  availability: String (enum: ['available', 'busy', 'offline'], default: 'offline'),
  currentLocation: {
    type: String (enum: ['Point'], default: 'Point'),
    coordinates: [Number] (default: [0, 0]) // [longitude, latitude]
  },
  rating: Number (default: 0, min: 0, max: 5),
  completedDeliveries: Number (default: 0),
  bankDetails: {
    accountName: String (required, trim),
    accountNumber: String (required, trim),
    bankName: String (required, trim),
    branchName: String (required, trim),
    swiftCode: String
  },
  isVerified: Boolean (default: false),
  verificationDate: Date | null,
  identificationNumber: String (required, trim),
  identificationImages: {
    front: String (required),
    back: String (required)
  }
}
```

---

### 6️⃣ **books** (Product Books)

Lưu trữ thông tin sách được bán trên nền tảng.

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref: 'Profile' - SellerProfile, required),
  categoryId: ObjectId (ref: 'Category', required),
  title: String (required, trim),
  slug: String (unique, auto-generated từ title),
  author: String (required, trim),
  publisher: String (trim),
  publicationYear: Number (min: 1900, max: current year),
  language: String (default: 'Tiếng Việt'),
  description: String (default: ''),
  price: Number (required, min: 0),
  stock: Number (default: 0, min: 0),
  discount: Number (default: 0, min: 0, max: 100),
  images: [String],
  soldCount: Number (default: 0, min: 0),
  tags: [String] (trim),
  ratingAvg: Number (default: 0, min: 0, max: 5),
  ratingCount: Number (default: 0, min: 0),
  numPages: Number (min: 1),
  format: String (enum: ['bìa mềm', 'bìa cứng', 'ebook'], default: 'bìa mềm'),
  searchText: String (indexed - auto-generated, không dấu),
  isPublished: Boolean (default: false, indexed),
  isFeatured: Boolean (default: false, indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Liên kết:**

-   `Book.sellerId` → `SellerProfile._id`
-   `Book.categoryId` → `Category._id`
-   `Book._id` → `Review.bookId`, `Cart.items[].bookId`, `OrderDetail.bookId`

**Pre-hooks:**

-   `save`: Auto-generate `slug` từ `title`
-   `save`, `insertMany`: Auto-generate `searchText` (không dấu)

---

### 7️⃣ **categories** (Product Categories)

Lưu trữ danh mục sách.

```javascript
{
  _id: ObjectId,
  name: String (required, unique, trim),
  description: String | null,
  image: String | null (URL ảnh danh mục),
  slug: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 8️⃣ **carts** (Shopping Cart)

Lưu trữ giỏ hàng của khách hàng.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, unique),
  items: [
    {
      bookId: ObjectId (ref: 'Book', required),
      quantity: Number (required, min: 1),
      price: Number (required), // giá tại thời điểm thêm
      addedAt: Date (default: now)
    }
  ],
  totalPrice: Number (default: 0),
  lastUpdated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 9️⃣ **orders** (Orders)

Lưu trữ đơn hàng.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  orderCode: String (unique),
  items: [
    {
      bookId: ObjectId (ref: 'Book'),
      quantity: Number,
      price: Number,
      discount: Number
    }
  ],
  totalAmount: Number (required),
  paymentStatus: String (enum: ['pending', 'completed', 'failed'], default: 'pending'),
  deliveryStatus: String (enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
                          default: 'pending'),
  deliveryAddress: {
    // Lưu trữ địa chỉ giao hàng
  },
  shippingFee: Number,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 🔟 **orderdetails** (Order Details)

Chi tiết mỗi mục trong đơn hàng.

```javascript
{
  _id: ObjectId,
  orderId: ObjectId (ref: 'Order', required),
  sellerId: ObjectId (ref: 'Profile' - SellerProfile, required),
  bookId: ObjectId (ref: 'Book', required),
  quantity: Number (required),
  price: Number (required),
  discount: Number (default: 0),
  subtotal: Number (required),
  deliveryStatus: String (enum: ['pending', 'packed', 'shipped', 'delivered', 'cancelled']),
  warehouseId: String | null,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣1️⃣ **reviews** (Product Reviews)

Lưu trữ đánh giá sách từ khách hàng.

```javascript
{
  _id: ObjectId,
  bookId: ObjectId (ref: 'Book', required),
  userId: ObjectId (ref: 'User', required),
  rating: Number (required, min: 1, max: 5),
  comment: String,
  images: [String],
  isVerifiedPurchase: Boolean (default: false),
  helpful: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣2️⃣ **warehousestocks** (Warehouse Inventory)

Quản lý hàng tồn kho của seller trong các kho.

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref: 'Profile', required),
  bookId: ObjectId (ref: 'Book', required),
  warehouseId: String (required), // ID của kho cụ thể
  quantity: Number (required, default: 0, min: 0),
  lastRestocked: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣3️⃣ **warehouselogs** (Warehouse Activity Logs)

Ghi log các hoạt động kho hàng.

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref: 'Profile', required),
  warehouseId: String (required),
  bookId: ObjectId (ref: 'Book') | null,
  action: String (enum: ['in', 'out', 'adjustment', 'check'], required),
  quantity: Number (required),
  reference: {
    type: String (enum: ['order', 'return', 'manual', 'inventory_check']),
    id: ObjectId | String
  },
  notes: String,
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣4️⃣ **notifications** (User Notifications)

Lưu trữ thông báo cho người dùng.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  type: String (enum: ['order_update', 'payment', 'delivery', 'review', 'message', 'system']),
  title: String (required),
  message: String (required),
  relatedId: ObjectId | String (ID của đối tượng liên quan),
  isRead: Boolean (default: false),
  readAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣5️⃣ **deliverystages** (Delivery Tracking)

Lưu trữ các giai đoạn giao hàng.

```javascript
{
  _id: ObjectId,
  orderDetailId: ObjectId (ref: 'OrderDetail', required, unique),
  orderId: ObjectId (ref: 'Order', required),
  sellerId: ObjectId (ref: 'Profile', required),
  shipperId: ObjectId (ref: 'Profile', required),
  stages: [
    {
      stage: String (enum: ['confirmed', 'picked', 'shipped', 'in_transit', 'delivered', 'cancelled']),
      timestamp: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      },
      notes: String,
      image: String
    }
  ],
  currentStage: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣6️⃣ **userinteractions** (User Activity Tracking)

Ghi nhận các tương tác của người dùng (xem, yêu thích, v.v.).

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  bookId: ObjectId (ref: 'Book') | null,
  sellerId: ObjectId (ref: 'Profile') | null,
  interactionType: String (enum: ['view', 'like', 'cart_add', 'purchase', 'search']),
  details: Object (JSON),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣7️⃣ **roleRequests** (Role Change Requests)

Yêu cầu thay đổi vai trò người dùng (ví dụ: customer → seller).

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  requestedRole: String (enum: ['seller', 'shipper']),
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  documents: [String], // URLs to uploaded documents
  reason: String,
  adminNote: String | null,
  reviewedBy: ObjectId (ref: 'User') | null,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣8️⃣ **shippercoverageareas** (Shipper Service Areas)

Xác định khu vực phục vụ của shipper.

```javascript
{
  _id: ObjectId,
  shipperId: ObjectId (ref: 'Profile', required),
  province: String (required, trim),
  district: String (required, trim),
  coverage: {
    type: String (enum: ['Point'], default: 'Point'),
    coordinates: [Number] // [longitude, latitude]
  },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1️⃣9️⃣ **chatais** (Chat AI History)

Lưu trữ lịch sử cuộc trò chuyện AI.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  messages: [
    {
      role: String (enum: ['user', 'assistant']),
      content: String (required),
      timestamp: Date
    }
  ],
  context: {
    currentPage: String,
    bookId: ObjectId | null,
    sellerId: ObjectId | null
  },
  isArchived: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 Mối Quan Hệ Giữa Các Collections

```
User (1)
  │
  ├─→ (1) Profile / SellerProfile / AdminProfile / ShipperProfile
  │          │
  │          ├─ SellerProfile (1)
  │          │    ├─→ (M) Book
  │          │    ├─→ (M) WarehouseStock
  │          │    └─→ (M) WarehouseLog
  │          │
  │          └─ ShipperProfile (1)
  │               └─→ (M) DeliveryStage
  │
  ├─→ (1) Cart
  │    └─→ (M) CartItem → Book
  │
  ├─→ (M) Order
  │    ├─→ (M) OrderDetail
  │    │    ├─→ (1) Book
  │    │    ├─→ (1) SellerProfile
  │    │    └─→ (1) DeliveryStage
  │    └─→ (M) DeliveryStage
  │
  ├─→ (M) Review
  │    └─→ (1) Book
  │
  ├─→ (M) Notification
  │
  ├─→ (M) UserInteraction
  │
  ├─→ (1) RoleRequest
  │
  └─→ (1) ChatAI

Book (1)
  ├─→ (1) SellerProfile
  ├─→ (1) Category
  ├─→ (M) Review
  ├─→ (M) CartItem
  ├─→ (M) OrderDetail
  ├─→ (M) WarehouseStock
  └─→ (M) UserInteraction
```

---

## 📌 Indexes Quan Trọng

```javascript
// books
books.createIndex({ sellerId: 1 });
books.createIndex({ categoryId: 1 });
books.createIndex({ slug: 1 }, { unique: true });
books.createIndex({ searchText: 1 });
books.createIndex({ isPublished: 1 });
books.createIndex({ isFeatured: 1 });

// reviews
reviews.createIndex({ bookId: 1, userId: 1 }, { unique: true });

// carts
carts.createIndex({ userId: 1 }, { unique: true });

// orders
orders.createIndex({ userId: 1 });
orders.createIndex({ orderCode: 1 }, { unique: true });

// orderdetails
orderdetails.createIndex({ orderId: 1, sellerId: 1 });

// warehousestocks
warehousestocks.createIndex(
    { sellerId: 1, bookId: 1, warehouseId: 1 },
    { unique: true }
);

// notifications
notifications.createIndex({ userId: 1, isRead: 1 });

// deliverystages
deliverystages.createIndex({ orderId: 1, orderDetailId: 1 });

// userinteractions
userinteractions.createIndex({ userId: 1, interactionType: 1 });
```

---

## 🎯 Quy Tắc Liên Kết Dữ Liệu

### Khi Tạo Sách (Book)

```
1. Seller đăng nhập với role='seller'
2. System tạo SellerProfile với sellerId = Profile._id
3. Seller tạo Book với:
   - sellerId = SellerProfile._id
   - categoryId = Category._id (Seller chọn)
4. System auto-create WarehouseStock cho mỗi warehouse của seller
```

### Khi Tạo Đơn Hàng (Order)

```
1. Customer thêm Book vào Cart
2. Customer checkout:
   - Create Order với userId = User._id
   - Create OrderDetail cho mỗi Book với:
     - orderId = Order._id
     - bookId = Book._id
     - sellerId = Book.sellerId (lấy từ Book)
3. System tạo DeliveryStage:
   - orderDetailId = OrderDetail._id
   - sellerId = OrderDetail.sellerId
   - shipperId = auto-assign hoặc customer chọn
```

### Khi Giao Hàng (Delivery)

```
1. Shipper confirm Order → DeliveryStage.currentStage = 'confirmed'
2. Shipper pick items từ Warehouse → WarehouseLog.action = 'out'
3. Shipper update DeliveryStage.stages với locations & timestamps
4. Khi delivered → OrderDetail.deliveryStatus = 'delivered'
```

---

## 💡 Ghi Chú Quan Trọng

1. **Polymorphic Collections:** `Profile` collection lưu cả customer, seller, admin, shipper. Sử dụng `discriminatorKey: 'profileType'` để phân biệt.

2. **sellerId vs userId:**

    - `sellerId` trong Book = `SellerProfile._id`
    - `userId` trong User = `User._id`
    - `SellerProfile.userId` = liên kết giữa Profile và User

3. **Search:** Sử dụng `searchText` (không dấu) để tìm kiếm sách, không dùng title trực tiếp.

4. **Coordinates:** GeoJSON sử dụng `[longitude, latitude]` (đảo ngược với thông thường).

5. **Timestamps:** Tất cả collections đều có `createdAt` và `updatedAt` (auto-managed).

6. **Soft Delete:** Hiện chưa implement, nếu cần thêm `isDeleted: Boolean` field.

---

## 📈 Ví Dụ Truy Vấn Thường Gặp

```javascript
// 1. Lấy tất cả sách của 1 seller
db.books.find({ sellerId: ObjectId('...') });

// 2. Lấy sách theo category
db.books.find({ categoryId: ObjectId('...'), isPublished: true });

// 3. Tìm kiếm sách
db.books.find({ searchText: /khi.*ngoai/ }); // regex không dấu

// 4. Lấy đơn hàng của customer
db.orders.find({ userId: ObjectId('...') });

// 5. Lấy hàng tồn kho trong 1 kho
db.warehousestocks.find({ warehouseId: 'warehouse_001' });

// 6. Lấy shipper theo khu vực
db.shippercoverageareas.find({ province: 'Hồ Chí Minh' });

// 7. Lấy notification chưa đọc
db.notifications.find({ userId: ObjectId('...'), isRead: false });
```

---

**Document cập nhật lần cuối:** 23-12-2025
