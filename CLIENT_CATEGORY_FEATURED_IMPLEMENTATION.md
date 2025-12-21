# 📱 Hướng Dẫn Tính Năng Thể Loại và Sách Nổi Bật

## ✨ Các Tính Năng Được Thêm

### 1. **Nút Bấm Thể Loại (Category Buttons)**

-   **File**: `src/components/home/CategoryList.jsx`
-   **Tính năng**:
    -   Hiển thị 6 thể loại sách trong lưới (grid layout)
    -   Mỗi thể loại có biểu tượng emoji riêng
    -   Hiệu ứng hover với scale và màu xanh dương
    -   Nhấn vào để đi đến trang thể loại chi tiết
    -   Responsive: 2 cột trên mobile, 3 cột tablet, 6 cột desktop

**Emoji Thể Loại**:

-   📖 Tiểu thuyết
-   💼 Kinh doanh
-   🧠 Tâm lý học
-   🚀 Khoa học - Viễn tưởng
-   ✍️ Văn học Việt Nam
-   🎀 Thiếu nhi

### 2. **Trang Hiển Thị Thể Loại (Category Page)**

-   **File**: `src/pages/CategoryPage.jsx`
-   **Đường dẫn**: `/category/:slug`
-   **Tính năng**:
    -   Hiển thị tất cả sách trong thể loại
    -   Header với gradient màu xanh dương
    -   Sidebar lọc sách:
        -   Sắp xếp: Mới nhất, Giá tăng/giảm, Đánh giá cao nhất
        -   Lọc theo khoảng giá
    -   Hiển thị số lượng sách tìm thấy
    -   Nút quay lại
    -   Thông báo khi không có sách phù hợp

### 3. **Phần Sách Nổi Bật Trong Tháng**

-   **Cập nhật**: `src/pages/Home.jsx`
-   **Tính năng**:
    -   Hiển thị 8 sách nổi bật đầu tiên
    -   Có nút "Xem tất cả" để xem toàn bộ
    -   Section Title: "📚 Sách nổi bật trong tháng"

### 4. **Trang Xem Tất Cả Sách Nổi Bật (Featured Books Page)**

-   **File**: `src/pages/FeaturedBooksPage.jsx`
-   **Đường dẫn**: `/featured-books`
-   **Tính năng**:
    -   Hiển thị tất cả sách nổi bật
    -   Header với gradient màu vàng
    -   Sidebar sắp xếp:
        -   ⭐ Đánh giá cao nhất (mặc định)
        -   🆕 Mới nhất
        -   💰 Giá: Thấp đến Cao
        -   💎 Giá: Cao đến Thấp
    -   Thống kê:
        -   Tổng số sách nổi bật
        -   Đánh giá trung bình
        -   Giá trung bình

### 5. **Cập Nhật Component Section**

-   **File**: `src/components/home/Section.jsx`
-   **Thay đổi**:
    -   Thêm prop `viewAllLink` để link đến trang chi tiết
    -   Nút "Xem tất cả" hiện đầy đủ với icon arrow
    -   Styling được cải thiện với spacing lớn hơn

## 🎨 Giao Diện Đồng Bộ

### Màu Sắc Chính

-   **Primary**: Blue (#3B82F6)
-   **Background**: Light Blue (#F0FAFB)
-   **Cards**: White với shadow nhẹ
-   **Hover**: Blue shade (#2563EB)

### Typography

-   **Heading 1**: text-4xl font-bold
-   **Heading 2**: text-2xl font-bold
-   **Section Title**: text-2xl font-bold text-gray-900
-   **Body**: text-gray-800
-   **Secondary**: text-gray-600

### Layout

-   **Container**: max-w-screen-xl mx-auto
-   **Spacing**: py-6, space-y-12 giữa các section
-   **Grid**:
    -   Mobile: grid-cols-2
    -   Tablet: grid-cols-3
    -   Desktop: grid-cols-4 hoặc grid-cols-6

### Responsive

-   Tất cả component đều responsive với Tailwind CSS
-   Mobile first approach
-   Padding/Margin điều chỉnh cho các breakpoint

## 🔗 Routing Updates

Đã thêm 2 route mới vào `src/routes/index.jsx`:

```jsx
<Route path="/category/:slug" element={<CategoryPage />} />
<Route path="/featured-books" element={<FeaturedBooksPage />} />
```

## 📊 Dữ Liệu

Hiện tại sử dụng dữ liệu fake từ:

-   `src/data/categories.js` - Danh sách 6 thể loại
-   `src/data/products.js` - Danh sách sách với thuộc tính `isFeatured`

## 🚀 Cách Sử Dụng

### Bấm vào thể loại

1. Trên trang Home, nhấn vào bất kỳ nút thể loại nào
2. Tự động điều hướng đến `/category/[slug]`
3. Xem tất cả sách trong thể loại đó

### Xem sách nổi bật

1. Trên trang Home, nhấn "Xem tất cả" ở phần "Sách nổi bật trong tháng"
2. Tự động điều hướng đến `/featured-books`
3. Xem và sắp xếp các sách nổi bật

### Lọc và sắp xếp

1. Sử dụng sidebar ở bên trái
2. Chọn cách sắp xếp hoặc khoảng giá
3. Danh sách sách tự động cập nhật

## 📱 Responsive Breakpoints

| Breakpoint | Kích Thước     | Cột Thể Loại | Cột Sách |
| ---------- | -------------- | ------------ | -------- |
| Mobile     | < 768px        | 2            | 2        |
| Tablet     | 768px - 1024px | 3            | 3        |
| Desktop    | > 1024px       | 6            | 4        |

## ✅ Tính Năng Hoàn Thành

-   ✅ Nút bấm thể loại với biểu tượng emoji
-   ✅ Trang hiển thị thể loại với lọc và sắp xếp
-   ✅ Phần sách nổi bật trong tháng
-   ✅ Nút "Xem tất cả" sách nổi bật
-   ✅ Trang xem tất cả sách nổi bật
-   ✅ Giao diện đồng bộ với web
-   ✅ Responsive design
-   ✅ Hiệu ứng hover và transition
-   ✅ Routing hoàn chỉnh

## 📝 Lưu Ý

1. Dữ liệu hiện tại là fake, khi API sẵn sàng, thay thế `products.filter()` bằng API calls
2. Các emoji thể loại có thể tùy chỉnh trong object `categoryEmojis`
3. Styling sử dụng Tailwind CSS, có thể điều chỉnh qua class names
4. Component đã tối ưu hóa cho responsive design

---

**Last Updated**: December 21, 2025
