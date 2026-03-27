# 📚 Book4U - E-Commerce Platform for Books

> **Book4U** là một nền tảng thương mại điện tử toàn diện cho sách, cung cấp các tính năng hiện đại bao gồm quản lý kho, xử lý đơn hàng, thanh toán trực tuyến và hệ thống giao hàng đa giai đoạn.

## 🌟 Giới Thiệu Projects

Book4U là một ứng dụng web két tiếp giữa người mua, người bán và hệ thống giao hàng. Nó cung cấp một trải nghiệm mua sắm sách online hoàn chỉnh với các tính năng nâng cao.

**Live Features:**

- 🛍️ Mua bán sách trực tuyến
- 🔐 Xác thực người dùng (Google OAuth, JWT)
- 💳 Thanh toán qua Momo
- 📦 Quản lý kho hàng tự động
- 🚚 Hệ thống giao hàng đa giai đoạn
- 💬 Chat AI hỗ trợ khách hàng
- ⭐ Đánh giá và bình luận sách
- 🔍 Tìm kiếm và lọc nâng cao
- 📊 Dashboard thống kê cho người bán

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend (Client)

```
Framework & Build:
- React 19.1.1 - UI Framework
- Vite 7.1.7 - Build tool & Dev server
- React Router v7.9.3 - Routing

Styling & Animation:
- Tailwind CSS 4.1.14 - Utility-first CSS
- Framer Motion 12.23.24 - Animation library
- Lucide React 0.544.0 - Icon library
- React Icons 5.5.0 - Icon components

State & API:
- Axios 1.12.2 - HTTP client
- Socket.io Client 4.8.1 - Real-time communication

Authentication & Backend:
- Firebase 12.6.0 - Authentication & Storage
- @react-oauth/google 0.12.2 - Google OAuth integration
- JWT & bcrypt - Token & password management

Data Visualization:
- Recharts 2.15.4 - Charts & graphs

UI Features:
- React Hot Toast 2.6.0 - Toast notifications
```

### Backend (Server)

```
Core Framework:
- Node.js - Runtime
- Express 5.1.0 - Web framework
- MongoDB with Mongoose 8.18.2 - Database

Authentication & Security:
- JWT (jsonwebtoken 9.0.2) - Token-based authentication
- bcrypt 6.0.0 - Password hashing
- Firebase Admin 13.5.0 - Firebase integration
- Google Auth Library 10.3.1 - Google authentication

Payment & Communication:
- Momo API Integration - Payment processing
- Twilio 5.10.3 - SMS verification
- Nodemailer 7.0.6 - Email service

Real-time Features:
- Socket.io 4.8.1 - WebSocket for live updates

AI & Processing:
- @google/generative-ai 0.24.1 - Gemini API for AI chat
- OpenAI 6.9.1 - Alternative AI provider

File Management:
- Multer 2.0.2 - File upload handling

Utilities:
- Express Validator 7.2.1 - Input validation
- Slugify 1.6.6 - URL-friendly strings
- Remove Accents 0.5.0 - Vietnamese text processing
- Lodash 4.17.21 - Utility functions
- Cookie Parser 1.4.7 - Cookie handling
- CORS 2.8.5 - Cross-origin requests
- Dotenv 17.2.2 - Environment variables

Development:
- Nodemon 3.1.10 - Auto-reload during development
```

---

## 📁 Cấu Trúc Dự Án

```
Book4U_DACN/
│
├── Client/                              # Frontend React Application
│   ├── Book4U/
│   │   ├── src/
│   │   │   ├── components/              # Reusable React components
│   │   │   ├── pages/                   # Page components (Home, Product, etc.)
│   │   │   ├── contexts/                # React Context for state management
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── services/                # API service functions
│   │   │   ├── configs/                 # Configuration files
│   │   │   ├── utils/                   # Utility functions
│   │   │   ├── routes/                  # Route definitions
│   │   │   ├── assets/                  # Static assets
│   │   │   ├── data/                    # Mock data & constants
│   │   │   ├── firebase.js              # Firebase configuration
│   │   │   ├── App.jsx                  # Main App component
│   │   │   ├── main.jsx                 # Entry point
│   │   │   └── index.css                # Global styles
│   │   ├── public/                      # Public static files
│   │   ├── package.json                 # Frontend dependencies
│   │   └── vite.config.js               # Vite configuration
│   └── package.json
│
├── Server/                              # Backend Node.js/Express Application
│   ├── src/
│   │   ├── controllers/                 # Business logic controllers
│   │   │
│   │   ├── models/                      # Mongoose schemas
│   │   │
│   │   ├── routes/                      # API route definitions
│   │   │
│   │   ├── services/                    # Business logic services
│   │   │
│   │   ├── middlewares/                 # Express middlewares
│   │   │
│   │   ├── helpers/                     # Helper functions
│   │   │
│   │   ├── configs/                     # Configuration files
│   │   ├── uploads/                     # Uploaded files storage
│   │   └── seedBooks.js                 # Database seeding
│   │
│   ├── uploads/                         # User uploads folder
│   │   ├── books/
│   │   ├── business-license/
│   │   ├── driver-license/
│   │   ├── identification/
│   │   ├── portrait/
│   │   ├── reviews/
│   │   └── store-logo/
│   │
│   ├── index.js                         # Main server file
│   ├── package.json                     # Backend dependencies
│   ├── [Documentation files]            # API & system documentation
│   └── [Postman Collections]            # API testing files
│
├── Book4U_OrderDelivery_API.postman_collection.json  # API collection
└── README.md                            # This file
```

---

## 🎯 Chức Năng Chính

### 👥 Quản Lý Người Dùng & Xác Thực

- **Đăng ký/Đăng nhập** - Hỗ trợ Google OAuth và email/password
- **Xác thực 2FA** - Xác minh qua SMS (Twilio)
- **Quản lý vai trò** - Người mua, người bán, admin, shipper
- **Hồ sơ người dùng** - Avatar, thông tin cá nhân, địa chỉ giao hàng

### 📚 Quản Lý Sách

- **Danh mục sách** - Phân loại và quản lý danh mục
- **Đăng sách** - Người bán có thể đăng sách lên bán
- **Tìm kiếm nâng cao** - Tìm theo tiêu đề, tác giả, danh mục, giá
- **Đánh giá & bình luận** - Hệ thống review chi tiết
- **Gợi ý sách** - Recommend sách dựa trên lịch sử mua hàng

### 🛒 Giỏ Hàng & Thanh Toán

- **Quản lý giỏ hàng** - Thêm/xóa/cập nhật số lượng
- **Thanh toán Momo** - Tích hợp ví điện tử Momo
- **Quản lý đơn hàng** - Xem, hủy, theo dõi đơn hàng
- **Lịch sử mua hàng** - Lưu tất cả giao dịch

### 📦 Quản Lý Kho & Hàng Tồn

- **Kho hàng đa địa chỉ** - Quản lý nhiều chi nhánh kho
- **Tự động cập nhật tồn kho** - Sync khi có đơn hàng
- **Kiểm tra sẵn sàng** - Xác thực trước khi order
- **Ghi nhận audit** - Lịch sử thay đổi tồn kho
- **Phân bổ tự động** - Chọn kho gần nhất để giao hàng

### 🚚 Hệ Thống Giao Hàng

- **Giao hàng đơn giai đoạn** - Giao trực tiếp từ người bán
- **Giao hàng đa giai đoạn** - Qua trung tâm phân loại (fulfillment)
- **Theo dõi shipper** - Xem vị trí shipper thời gian thực
- **Quản lý tuyến đường** - Shipper coverage areas
- **Cập nhật trạng thái** - Pending → Shipping → Delivered
- **Thông báo thời gian thực** - Socket.io real-time updates

### 💬 AI Chat Support

- **Hỗ trợ khách hàng** - Chat với AI (Gemini/OpenAI)
- **Gợi ý sản phẩm** - AI recommend sách
- **Q&A thông minh** - Trả lời câu hỏi về sách

### 👨‍💼 Quản Lý Người Bán

- **Dashboard người bán** - Thống kê bán hàng
- **Quản lý sản phẩm** - CRUD sách
- **Hóa đơn bán hàng** - Công cụ tạo hóa đơn
- **Yêu cầu nâng cấp vai trò** - Từ buyer → seller
- **Cấp phép kinh doanh** - Upload & xác minh được cấp phép

### 📊 Thống Kê & Báo Cáo

- **Dashboard admin** - Tổng quan hệ thống
- **Thống kê bán hàng** - Doanh số theo sản phẩm, người bán
- **Phân tích kho hàng** - Tồn kho, chuyển số lần cao
- **Báo cáo giao hàng** - Độ thành công, thời gian trung bình

---

## 🔐 Bảo Mật

### Các Biện Pháp Bảo Mật Implemented

- ✅ **JWT Authentication** - Token-based authentication
- ✅ **Password Hashing** - bcrypt với salt rounds
- ✅ **CORS** - Chỉ cho phép origin được phép
- ✅ **Input Validation** - express-validator
- ✅ **Role-based Access Control** - Phân quyền theo vai trò
- ✅ **2FA** - SMS verification qua Twilio
- ✅ **Environment Variables** - Bảo vệ API keys
- ✅ **HTTP Only Cookies** - Lưu JWT an toàn

---

> 🚀 **Book4U** - Nền tảng mua bán sách với công nghệ hiện đại & trải nghiệm người dùng tuyệt vời!
