# 🎨 WAREHOUSE MODAL - VISUAL GUIDE

## Create Mode vs Edit Mode

### CREATE MODE (New Warehouse)

```
╔═══════════════════════════════════════════╗
║        ➕ Tạo kho hàng mới               ║
╚═══════════════════════════════════════════╝

📝 Form Fields:

┌─────────────────────────────────────────┐
│ Tên kho *                               │
│ [______________________________________] │
│ Nhập tên kho (VD: Kho Hà Nội 1)        │
└─────────────────────────────────────────┘

┌──────────────────────────┬──────────────┐
│ Họ & Tên quản lý *       │ Số điện thoại*
│ [_______________]       │ [__________]  │
│ Nhập họ tên             │ 0xxxxxxxxx    │
└──────────────────────────┴──────────────┘

┌─────────────────────────────────────────┐
│ Tỉnh / Thành phố *                      │
│ [____Select____▼]                       │
│ (Dropdown closes after selection)       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Quận / Huyện *                          │
│ [____Select____▼]                       │
│ (Populated after province selected)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Phường / Xã *                           │
│ [____Select____▼]                       │
│ (Populated after district selected)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Địa chỉ chi tiết *                      │
│ [_____________________________]          │
│                                         │
└─────────────────────────────────────────┘

Buttons:
[  Hủy  ] [  ➕ Tạo kho  ]
```

---

### EDIT MODE (Update Warehouse)

```
╔═══════════════════════════════════════════╗
║     ✏️ Chỉnh sửa thông tin kho           ║
╚═══════════════════════════════════════════╝

⏳ LOADING... (during code resolution)
  ↙ ↓ ↘
  Fetching address codes...

📝 Form Fields (AUTO-FILLED):

┌─────────────────────────────────────────┐
│ Tên kho *                               │
│ [Kho Hà Nội 1____________________]      │ ← Pre-filled
│ Nhập tên kho (VD: Kho Hà Nội 1)        │
└─────────────────────────────────────────┘

┌──────────────────────────┬──────────────┐
│ Họ & Tên quản lý *       │ Số điện thoại*
│ [Nguyễn Văn A____]       │ [0912345678] │ ← Pre-filled
│ Nhập họ tên              │ 0xxxxxxxxx   │
└──────────────────────────┴──────────────┘

┌─────────────────────────────────────────┐
│ Tỉnh / Thành phố *                      │
│ [Hà Nội______________▼]                 │ ← Pre-selected
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Quận / Huyện *                          │
│ [Hoàn Kiếm____________▼]                │ ← Pre-selected
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Phường / Xã *                           │
│ [Hàng Đào_____________▼]                │ ← Pre-selected
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Địa chỉ chi tiết *                      │
│ [123 Phố Cổ_______________________]     │ ← Pre-filled
│                                         │
└─────────────────────────────────────────┘

Buttons:
[  Hủy  ] [  💾 Cập nhật  ]
```

---

## 🔄 User Interaction Flow

### CREATE WORKFLOW

```
User Location: Inventory Management

1️⃣ User clicks "+ Thêm Kho" button
   ↓
2️⃣ Modal opens (CREATE MODE)
   ├─ Title: "➕ Tạo kho hàng mới"
   ├─ Form: All fields empty
   └─ Buttons: [Hủy] [➕ Tạo kho]
   ↓
3️⃣ User fills in warehouse info
   ├─ Name: Kho Hà Nội 1
   ├─ Manager: Nguyễn Văn A
   ├─ Phone: 0912345678
   └─ Address: Hà Nội → Hoàn Kiếm → Hàng Đào → 123 Phố Cổ
   ↓
4️⃣ User clicks "➕ Tạo kho"
   ├─ Validate all fields
   ├─ Fetch province/district/ward names from codes
   └─ Send to API
   ↓
5️⃣ Success
   ├─ Toast: "✅ Tạo kho thành công"
   ├─ Close modal
   ├─ Refresh warehouse list
   └─ New warehouse appears in grid
```

### EDIT WORKFLOW

```
User Location: Inventory Management

1️⃣ User clicks "✏️ Sửa Kho" on warehouse card
   ↓
2️⃣ Modal opens (EDIT MODE + LOADING)
   ├─ Title: "✏️ Chỉnh sửa thông tin kho"
   ├─ Show: Loading spinner
   └─ Buttons: Disabled during loading
   ↓
3️⃣ Modal loads warehouse address codes
   ├─ Fetch all provinces (API)
   ├─ Find matching province by name
   ├─ Fetch districts for province (API)
   ├─ Find matching district by name
   ├─ Fetch wards for district (API)
   ├─ Find matching ward by name
   └─ Resolve all codes
   ↓
4️⃣ Form displays with pre-filled data
   ├─ Name: "Kho Hà Nội 1" (from warehouse)
   ├─ Manager: "Nguyễn Văn A" (from warehouse)
   ├─ Phone: "0912345678" (from warehouse)
   ├─ Province: "Hà Nội" ✅ (selected from dropdown)
   ├─ District: "Hoàn Kiếm" ✅ (selected from dropdown)
   ├─ Ward: "Hàng Đào" ✅ (selected from dropdown)
   └─ Address: "123 Phố Cổ" (from warehouse)
   ↓
5️⃣ User edits fields (optional)
   ├─ Can change name
   ├─ Can change manager info
   ├─ Can change phone
   ├─ Can change address location
   ├─ Address dropdowns stay responsive
   └─ All changes reflected in form
   ↓
6️⃣ User clicks "💾 Cập nhật"
   ├─ Validate all fields
   ├─ Fetch province/district/ward names from codes
   └─ Send to API
   ↓
7️⃣ Success
   ├─ Toast: "✅ Cập nhật kho thành công"
   ├─ Close modal
   ├─ Refresh warehouse list
   └─ Warehouse card updates with new data
```

---

## 🎯 Key States

### Idle State

```
Modal appears, form visible
All buttons enabled
Ready for user input
```

### Loading State

```
⏳ Loading spinner visible
📝 All inputs exist but loading in progress
🚫 Buttons disabled
```

### Error State

```
⚠️ Error messages under relevant fields
Examples:
├─ "Vui lòng nhập tên kho"
├─ "Vui lòng nhập họ tên quản lý"
├─ "Vui lòng nhập số điện thoại"
├─ "Số điện thoại không hợp lệ"
├─ "Chọn Tỉnh/Thành phố"
├─ "Chọn Quận/Huyện"
├─ "Chọn Phường/Xã"
└─ "Nhập địa chỉ chi tiết"
```

### Success State

```
✅ Toast notification appears
"Tạo kho thành công" (create)
OR
"Cập nhật kho thành công" (edit)

Then:
├─ Modal closes
├─ Warehouse list refreshes
└─ New/updated warehouse appears
```

---

## 🔍 Warehouse Card (Before Clicking Edit)

```
┌────────────────────────────────┐
│ 🏢 Kho Hà Nội 1                │
├────────────────────────────────┤
│ [🏪] Kho mặc định              │
│                                │
│ 📍 123 Phố Cổ                 │
│    Hàng Đào, Hoàn Kiếm        │
│    Hà Nội                     │
│                                │
│ 👤 Nguyễn Văn A               │
│ 📞 0912345678                 │
│                                │
│ [✏️ Sửa Kho]                    │
└────────────────────────────────┘

Click "✏️ Sửa Kho" → Opens Edit Modal
```

---

## 📊 API Call Sequence (Edit Mode)

```
Frontend                          Backend
   |                                |
   |--- GET /api/province/all ---→  |
   |←--- { data: [...] } -----------|
   |
   |--- GET /api/province/districts/01 →|
   |←--- { data: { districts: [...] } }--|
   |
   |--- GET /api/province/wards/001 →|
   |←--- { data: { wards: [...] } }--|
   |
   [User edits and saves]
   |
   |--- PUT /api/warehouse/warehouses/:id →|
   |←--- { success: true } --------|
   |
   [Modal closes, list refreshes]
```

---

## ✨ Visual Enhancements

### Loading Indicator

```
    ↙↓↘
   ↙ ↓ ↘    Đang tải thông tin...
```

### Success Toast

```
╔════════════════════════════════╗
║ ✅ Cập nhật kho thành công    ║
╚════════════════════════════════╝
```

### Error Toast

```
╔════════════════════════════════╗
║ ❌ Lỗi khi cập nhật kho       ║
╚════════════════════════════════╝
```

---

## 🎨 Color Scheme

-   **Background**: White modal on semi-transparent backdrop
-   **Text**: Dark gray (#1f2937)
-   **Buttons**:
    -   Save: Orange (#ea580c, hover: #c2410c)
    -   Cancel: Gray border with hover effect
-   **Error Text**: Red (#ef4444)
-   **Success Toast**: Green background
-   **Loading Spinner**: Blue (#2563eb)

---

## 📱 Responsive Behavior

```
Desktop (>1024px):
┌─────────────────────────┐
│  Modal (max-w-lg)       │
│  [Form with 2-col]      │
└─────────────────────────┘

Tablet (768-1024px):
┌──────────────────────┐
│  Modal (max-w-lg)    │
│  [Form with 2-col]   │
└──────────────────────┘

Mobile (<768px):
┌────────────────────┐
│  Modal full width  │
│  [Form 1-col]      │
└────────────────────┘
```

---

**Visual Guide Version**: 1.0  
**Last Updated**: November 30, 2025
