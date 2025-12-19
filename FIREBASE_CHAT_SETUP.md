# 📚 Hướng Dẫn Thiết Lập Firebase Chat - Book4U

## 🎯 Tóm Tắt

Hệ thống chat trong Book4U sử dụng Firebase Realtime Database để ghi dữ liệu và Firebase Authentication để xác thực người dùng.

## ✅ Các Bước Thiết Lập

### Bước 1: Vào Firebase Console

1. Mở https://console.firebase.google.com/
2. Đăng nhập bằng tài khoản Gmail
3. Chọn project **book4u-41d1f**

---

### Bước 2: Enable Firebase Authentication

1. Vào menu bên trái → **Build** → **Authentication**
2. Click **Get started**
3. Chọn **Email/Password** → Click **Enable** → **Save**
4. (Tùy chọn) Enable Google Login nếu muốn

---

### Bước 3: Cấu Hình Security Rules

1. Vào **Build** → **Realtime Database**
2. Click tab **Rules** (bên cạnh tab Data)
3. **Xóa toàn bộ** nội dung hiện tại
4. Paste code này:

```json
{
    "rules": {
        "chats": {
            "$conversationId": {
                ".read": "auth.uid != null && (root.child('chats').child($conversationId).child('participants').child(auth.uid).exists())",
                ".write": "auth.uid != null && (root.child('chats').child($conversationId).child('participants').child(auth.uid).exists())",
                "participants": {
                    ".validate": "newData.hasChildren(['read', 'write']) || true"
                },
                "messages": {
                    "$messageId": {
                        ".write": "newData.child('senderId').val() === auth.uid",
                        ".validate": "newData.hasChildren(['text', 'senderId', 'timestamp'])"
                    }
                }
            }
        },
        ".read": false,
        ".write": false
    }
}
```

5. Click nút **Publish** (bên phải)
6. Confirm "Are you sure?" → Click **Publish**
7. Đợi cho đến khi thấy: "Rules published successfully" ✓

---

### Bước 4: Cấu Hình Database URL

Kiểm tra file `Client/Book4U/src/firebase.js`:

```javascript
const firebaseConfig = {
    apiKey: 'AIzaSyCB_8aYZEA8dNlkLBQKyT3WDM48bDQZI08',
    authDomain: 'book4u-41d1f.firebaseapp.com',
    databaseURL: 'https://book4u-41d1f-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'book4u-41d1f',
    storageBucket: 'book4u-41d1f.firebasestorage.app',
    messagingSenderId: '518777416123',
    appId: '1:518777416123:web:a80f08fac48c34d03dbc9e',
};
```

Nếu khác → cập nhật lại.

---

## 📱 Cách Sử Dụng Chat

### Trên Trang Sản Phẩm

1. Xem sản phẩm của seller
2. Scroll xuống
3. Click nút **"Chat với bán hàng"**
4. Tự động chuyển đến trang `/chat` với conversation đó

### Trên Trang Chat

1. **Sidebar trái**: Danh sách tất cả cuộc trò chuyện

    - Tìm kiếm theo tên seller
    - Xóa cuộc trò chuyện
    - Hiển thị số tin nhắn chưa đọc

2. **Khu vực chính**: Cửa sổ chat
    - Hiển thị tất cả tin nhắn
    - Auto scroll xuống tin nhắn mới nhất
    - Gửi tin nhắn mới
    - Xem thời gian gửi

---

## 🔧 Cấu Trúc Dữ Liệu Firebase

```
chats/
├── userId1_userId2/
│   ├── id: "userId1_userId2"
│   ├── participants: {
│   │   userId1: { id, name, role },
│   │   userId2: { id, name, role }
│   │ }
│   ├── createdAt: timestamp
│   ├── lastMessage: "text"
│   ├── lastMessageTime: timestamp
│   ├── lastMessageSenderId: userId
│   └── messages: {
│       messageId1: {
│           id: messageId1,
│           senderId: userId,
│           senderName: "Tên người gửi",
│           senderAvatar: "url",
│           senderRole: "seller|customer",
│           text: "nội dung",
│           timestamp: timestamp,
│           read: boolean
│       },
│       messageId2: { ... }
│   }
```

---

## 🐛 Debug - Nếu Có Lỗi

### Lỗi: "Permission denied"

**Nguyên Nhân:**

-   Security Rules chưa đúng
-   User chưa đăng nhập
-   User không phải participant của conversation

**Giải Pháp:**

1. Kiểm tra lại Security Rules
2. Kiểm tra browser console (F12) xem có lỗi gì
3. Refresh trang (Ctrl+F5)

### Lỗi: "Cannot read properties of undefined"

**Nguyên Nhân:** Dữ liệu conversation chưa được tạo đúng

**Giải Pháp:**

1. Xóa conversation trong Firebase Database
2. Tạo lại bằng cách click "Chat với bán hàng"

### Kiểm Tra UID

Mở browser console (F12), chạy:

```javascript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('UID:', auth.currentUser?.uid);
```

Nếu `undefined` → User chưa đăng nhập đúng

---

## 📊 Giải Thích Security Rules

| Rule                                                                                        | Ý Nghĩa                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `auth.uid != null`                                                                          | Chỉ cho phép user đã đăng nhập              |
| `root.child('chats').child($conversationId).child('participants').child(auth.uid).exists()` | Chỉ cho phép participant của conversation   |
| `.write: "newData.child('senderId').val() === auth.uid"`                                    | Chỉ user gửi mới có thể ghi tin nhắn của họ |

---

## ✨ Tính Năng Hiện Tại

✅ **Gửi/nhận tin nhắn real-time** (tư nhân)
✅ **Auto-scroll** đến tin nhắn mới nhất
✅ **Thời gian tin nhắn** (hiển thị giờ)
✅ **Đánh dấu tin nhắn đã đọc**
✅ **Danh sách cuộc trò chuyện** với preview
✅ **Tìm kiếm** cuộc trò chuyện
✅ **Xóa cuộc trò chuyện**
✅ **Responsive** (Desktop + Mobile)
✅ **Số tin nhắn chưa đọc** tự động cập nhật
✅ **Avatar & tên người gửi**

---

## 🚀 Cách Thêm Chat Cho Các Trang Khác

### Thêm nút "Chat với bán hàng" trên trang nào đó

```jsx
import StartChat from '../components/chat/StartChat';

// Trong component của bạn:
<StartChat sellerId={seller._id} sellerInfo={seller} />;
```

---

## 📝 Checklist Hoàn Tất

-   [ ] Vào Firebase Console
-   [ ] Enable Firebase Authentication (Email/Password)
-   [ ] Vào Realtime Database → Rules
-   [ ] Xóa code cũ
-   [ ] Paste Security Rules mới
-   [ ] Click Publish
-   [ ] Test bằng cách bấm "Chat với bán hàng"
-   [ ] Kiểm tra tin nhắn xuất hiện real-time

---

## 🆘 Hỗ Trợ

Nếu vẫn gặp vấn đề:

1. Mở browser console (F12)
2. Ghi lại error message
3. Kiểm tra Firebase Console → Database → Data (xem có cuộc trò chuyện không)
4. Kiểm tra Security Rules có đúng không
