# 💬 CHỨC NĂNG CHAT FIREBASE - Hướng Dẫn Hoàn Toàn

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cài Đặt Firebase](#cài-đặt-firebase)
3. [Cấu Trúc Dữ Liệu](#cấu-trúc-dữ-liệu)
4. [Cách Sử Dụng](#cách-sử-dụng)
5. [Các Tệp Đã Tạo/Sửa](#các-tệp-đã-tạosửa)
6. [Debug](#debug)

---

## 🎯 Tổng Quan

Hệ thống chat Book4U cho phép khách hàng và bán hàng trò chuyện trực tiếp bằng Firebase Realtime Database. Giống như livestream chat nhưng là chat riêng tư.

### Tính Năng Chính

✅ **Chat Real-time** - Tin nhắn xuất hiện ngay lập tức
✅ **Danh sách Conversations** - Quản lý tất cả cuộc trò chuyện
✅ **Tìm kiếm** - Tìm nhanh cuộc trò chuyện theo tên
✅ **Số Tin Nhắn Chưa Đọc** - Hiển thị tự động
✅ **Xóa Conversation** - Xóa cuộc trò chuyện không cần
✅ **Responsive** - Hoạt động tốt trên desktop & mobile
✅ **Auto-scroll** - Tự động cuộn xuống tin nhắn mới nhất
✅ **Avatar & Thông Tin** - Hiển thị người gửi

---

## 🔧 Cài Đặt Firebase

### Bước 1: Enable Firebase Authentication

1. Vào https://console.firebase.google.com/
2. Chọn project **book4u-41d1f**
3. Menu bên trái → **Build** → **Authentication**
4. Click **Get started** (nếu chưa)
5. Chọn **Email/Password**
6. Click **Enable** → **Save**

✅ **Quan trọng:** Firebase Authentication phải được enable để chat hoạt động!

### Bước 2: Cấu Hình Security Rules

1. Vào **Build** → **Realtime Database**
2. Click tab **Rules** (bên cạnh tab Data)
3. **Xóa toàn bộ** nội dung cũ

4. Paste security rules này:

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
6. Confirm → Đợi "Rules published successfully" ✓

### Bước 3: Kiểm Tra Database URL

File: `Client/Book4U/src/firebase.js`

Xác nhận `databaseURL` là:

```
https://book4u-41d1f-default-rtdb.asia-southeast1.firebasedatabase.app
```

Nếu khác → cập nhật file.

---

## 📊 Cấu Trúc Dữ Liệu

### Database Structure

```
book4u-41d1f-default-rtdb
└── chats/
    ├── userId1_userId2/
    │   ├── id: "userId1_userId2"
    │   ├── participants: {
    │   │   userId1: {
    │   │       id: userId1,
    │   │       name: "Tên Người Dùng",
    │   │       role: "customer" | "seller"
    │   │   },
    │   │   userId2: { ... }
    │   │ }
    │   ├── createdAt: 1702899200000
    │   ├── lastMessage: "Nội dung tin nhắn cuối"
    │   ├── lastMessageTime: 1702899210000
    │   ├── lastMessageSenderId: "userId1"
    │   └── messages: {
    │       messageKey1: {
    │           id: "messageKey1",
    │           senderId: "userId1",
    │           senderName: "Tên Người Gửi",
    │           senderAvatar: "url/avatar.jpg",
    │           senderRole: "customer" | "seller",
    │           text: "Nội dung tin nhắn",
    │           timestamp: 1702899210000,
    │           read: false
    │       },
    │       messageKey2: { ... }
    │   }
    └── userId3_userId4/
        └── ...
```

### Giải Thích

| Field             | Ý Nghĩa                                                    |
| ----------------- | ---------------------------------------------------------- |
| `$conversationId` | ID tạo từ 2 userID, sắp xếp theo thứ tự: `userId1_userId2` |
| `participants`    | Danh sách 2 người trong cuộc trò chuyện                    |
| `messages`        | Tất cả tin nhắn trong conversation                         |
| `lastMessage`     | Tin nhắn cuối cùng (dùng cho preview)                      |
| `read`            | Có được đọc rồi không (đánh dấu tin nhắn đã đọc)           |

---

## 🚀 Cách Sử Dụng

### 1. Người Dùng Khách Hàng

#### Trên Trang Sản Phẩm (ProductDetails)

1. Xem chi tiết sản phẩm: `/product/[slug]`
2. Scroll xuống phần **"Người bán"**
3. Nhìn thấy nút **"Chat với bán hàng"** (xanh)
4. Click → Tự động tạo conversation
5. Chuyển đến `/chat` với conversation đó

#### Trên Trang Chat

1. Vào `/chat`
2. **Sidebar trái**: Danh sách cuộc trò chuyện
    - Tìm kiếm theo tên seller
    - Xóa conversation
    - Số tin nhắn chưa đọc
3. **Khu vực chính**: Cửa sổ chat
    - Hiển thị tin nhắn
    - Nhập tin nhắn mới
    - Thời gian gửi

### 2. Seller

-   Cũng vào `/chat` để xem tất cả cuộc trò chuyện với khách hàng
-   Trả lời tin nhắn real-time

---

## 📁 Các Tệp Đã Tạo/Sửa

### ✨ Tệp Mới Tạo

#### 1. `Client/Book4U/src/components/chat/ChatList.jsx` (150 dòng)

**Mục đích:** Hiển thị danh sách cuộc trò chuyện

**Tính năng:**

-   Liệt kê tất cả conversations
-   Tìm kiếm theo tên
-   Hiển thị unread count
-   Xóa conversation
-   Preview tin nhắn cuối cùng

**Props:**

```jsx
<ChatList
    onSelectConversation={(conversationId, otherUser) => {...}}
    selectedConversationId={selectedConversation}
/>
```

#### 2. `Client/Book4U/src/components/chat/ChatWindow.jsx` (160 dòng)

**Mục đích:** Cửa sổ chat, hiển thị và gửi tin nhắn

**Tính năng:**

-   Hiển thị tất cả tin nhắn
-   Auto scroll
-   Gửi tin nhắn mới
-   Đánh dấu đã đọc
-   Error handling
-   Loading state

**Props:**

```jsx
<ChatWindow
    conversationId="userId1_userId2"
    otherUser={otherUserObject}
    onBack={() => {...}}
/>
```

#### 3. `Client/Book4U/src/components/chat/StartChat.jsx` (80 dòng)

**Mục đích:** Nút "Chat với bán hàng" để bắt đầu cuộc trò chuyện

**Tính năng:**

-   Tạo hoặc lấy conversation
-   Kiểm tra đăng nhập
-   Loading state
-   Error handling

**Props:**

```jsx
<StartChat
    sellerId="sellerId123"
    sellerInfo={{
        _id: '...',
        firstName: '...',
        lastName: '...',
        storeLogo: '...',
    }}
/>
```

### ✏️ Tệp Đã Sửa

#### 1. `Client/Book4U/src/services/api/chatApi.js`

**Thay đổi:**

-   Thêm import `remove` từ firebase/database
-   Fix `deleteConversation()` dùng `remove()` thay vì `set(null)`

**Các hàm chính:**

```javascript
// 1. Tạo ID conversation (sắp xếp userID)
createConversationId(userId1, userId2);

// 2. Gửi tin nhắn
sendMessage(conversationId, senderId, message, senderInfo);

// 3. Lắng nghe tin nhắn
getMessages(conversationId, callback);

// 4. Tạo/lấy conversation
getOrCreateConversation(userId1, userId2, user1Info, user2Info);

// 5. Lấy danh sách conversations
getUserConversations(userId, callback);

// 6. Đánh dấu đã đọc
markMessagesAsRead(conversationId, userId);

// 7. Xóa conversation
deleteConversation(conversationId);
```

#### 2. `Client/Book4U/src/pages/Chat.jsx`

**Thay đổi:**

-   Thêm `useLocation` hook
-   Auto select conversation từ `/chat?conversationId=xxx`
-   Tối ưu responsive design
-   Thêm welcome screen

#### 3. `Client/Book4U/src/pages/ProductDetails.jsx`

**Thay đổi:**

-   Import `StartChat` component
-   Thêm nút "Chat với bán hàng" dưới thông tin seller
-   Pass seller info đến StartChat

---

## 💻 Cách Thêm Chat Vào Trang Khác

### Thêm Nút Chat

```jsx
import StartChat from '../components/chat/StartChat';

// Trong component:
<StartChat
    sellerId={seller._id}
    sellerInfo={{
        _id: seller._id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        storeLogo: seller.storeLogo,
    }}
/>;
```

### Thêm Trang Chat

Đã có route `/chat` trong `index.jsx`, không cần thêm gì.

---

## 🐛 Debug

### Lỗi: "Permission denied"

**Nguyên Nhân:**

-   Security Rules sai
-   User chưa đăng nhập
-   User không phải participant của conversation

**Giải Pháp:**

1. Kiểm tra Security Rules (Firebase Console)
2. Mở browser console (F12)
3. Kiểm tra có error gì
4. Test user đã đăng nhập không:

```javascript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('UID:', auth.currentUser?.uid);
```

### Lỗi: "Cannot read properties of undefined"

**Nguyên Nhân:** Dữ liệu conversation không đúng cấu trúc

**Giải Pháp:**

1. Xóa conversation trong Firebase Database
2. Tạo lại bằng cách click "Chat với bán hàng"

### Kiểm Tra Dữ Liệu

1. Firebase Console
2. Realtime Database → **Data** tab
3. Xem `chats` folder có conversation không
4. Kiểm tra structure có đúng không

---

## 🧪 Test Local

### Setup

1. Clone repo
2. Install dependencies:

```bash
cd Client/Book4U
npm install
```

3. Khởi động frontend:

```bash
npm run dev
```

4. Vào http://localhost:5173

### Test Flow

1. **Đăng nhập** tài khoản khách hàng
2. Vào trang sản phẩm (ProductDetails)
3. Scroll xuống → Click **"Chat với bán hàng"**
4. ✓ Nếu chuyển đến `/chat` thành công → OK
5. Click conversation → Hiển thị chat
6. Gõ tin nhắn → Gửi
7. ✓ Nếu tin nhắn xuất hiện → OK

### Test Real-time

1. **Tab 1:** Customer chat với Seller
2. **Tab 2:** Seller mở `/chat` (đăng nhập seller account)
3. **Tab 1:** Gửi tin nhắn
4. ✓ **Tab 2:** Tin nhắn xuất hiện ngay lập tức (real-time)

---

## 📋 Checklist Hoàn Tất

-   [ ] Firebase Authentication enabled
-   [ ] Security Rules cấu hình đúng
-   [ ] Database URL đúng
-   [ ] ChatList.jsx tạo thành công
-   [ ] ChatWindow.jsx tạo thành công
-   [ ] StartChat.jsx tạo thành công
-   [ ] ProductDetails.jsx có nút chat
-   [ ] Chat.jsx cập nhật
-   [ ] chatApi.js cập nhật
-   [ ] Test local: Gửi tin nhắn
-   [ ] Test real-time: 2 tab
-   [ ] Test responsive: Mobile

---

## 🎯 Next Steps (Tương Lai)

### Có thể thêm:

-   Ghi âm tin nhắn voice
-   Gửi hình ảnh/file
-   Typing indicator ("...đang gõ")
-   Read receipt (✓ đã xem)
-   Mute conversation
-   Block user
-   Pin important messages
-   Message reactions (👍 😂 ❤️)
-   Forwarding messages

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. **Kiểm tra Firebase Console:**

    - Authentication: Email/Password enabled?
    - Realtime Database: Security Rules đúng?
    - Database: Có `chats` folder không?

2. **Mở browser console (F12):**

    - Có error message không?
    - Copy error → tìm giải pháp

3. **Kiểm tra server logs:**

    - Backend có error không?
    - User có trong database không?

4. **Test user info:**
    ```javascript
    import { getAuth } from 'firebase/auth';
    const auth = getAuth();
    console.log('Current User:', auth.currentUser);
    console.log('UID:', auth.currentUser?.uid);
    ```

---

## ✨ Hoàn Thành!

Hệ thống chat Book4U đã sẵn sàng sử dụng! 🎉

-   ✅ Real-time messaging
-   ✅ Danh sách conversations
-   ✅ Tìm kiếm & xóa
-   ✅ Mobile responsive
-   ✅ Auto-scroll & unread count

**Bắt đầu chat ngay!** 💬
