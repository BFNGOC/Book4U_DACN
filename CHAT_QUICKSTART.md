# ⚡ QUICK START - Firebase Chat

## 🚀 3 Bước Để Hoạt Động

### ✅ Bước 1: Enable Firebase Authentication

```
Firebase Console
  → Build → Authentication
  → Get started
  → Email/Password → Enable → Save
```

### ✅ Bước 2: Cấu Hình Security Rules

```
Firebase Console
  → Build → Realtime Database
  → Rules tab
  → Xóa nội dung cũ
  → Paste rules từ CHAT_FIREBASE_IMPLEMENTATION_GUIDE.md
  → Publish
```

### ✅ Bước 3: Test

```
1. Đăng nhập customer
2. Vào trang sản phẩm
3. Click "Chat với bán hàng"
4. ✓ Chuyển đến /chat
5. Gửi tin nhắn
6. ✓ Tin nhắn xuất hiện real-time
```

---

## 📁 Files Tạo

```
✅ Client/Book4U/src/components/chat/ChatList.jsx
✅ Client/Book4U/src/components/chat/ChatWindow.jsx
✅ Client/Book4U/src/components/chat/StartChat.jsx
```

## 📝 Files Sửa

```
✅ Client/Book4U/src/services/api/chatApi.js
✅ Client/Book4U/src/pages/Chat.jsx
✅ Client/Book4U/src/pages/ProductDetails.jsx
```

---

## 💬 API Functions (chatApi.js)

```javascript
// Tạo ID conversation
createConversationId(userId1, userId2);

// Gửi tin nhắn
sendMessage(conversationId, senderId, message, senderInfo);

// Lắng nghe tin nhắn
getMessages(conversationId, callback);

// Tạo/lấy conversation
getOrCreateConversation(userId1, userId2, user1Info, user2Info);

// Lấy danh sách conversations
getUserConversations(userId, callback);

// Đánh dấu đã đọc
markMessagesAsRead(conversationId, userId);

// Xóa conversation
deleteConversation(conversationId);
```

---

## 🧪 Test Checklist

-   [ ] Firebase Authentication enabled
-   [ ] Security Rules published
-   [ ] ChatList component hiển thị
-   [ ] ChatWindow component hiển thị tin nhắn
-   [ ] StartChat button xuất hiện trên ProductDetails
-   [ ] Gửi tin nhắn thành công
-   [ ] Tin nhắn xuất hiện real-time
-   [ ] Unread count hoạt động
-   [ ] Xóa conversation thành công
-   [ ] Tìm kiếm conversation thành công
-   [ ] Mobile responsive OK

---

## 🔗 Xem Tài Liệu Đầy Đủ

📖 **CHAT_FIREBASE_IMPLEMENTATION_GUIDE.md** - Hướng dẫn chi tiết
📖 **FIREBASE_CHAT_SETUP.md** - Setup từng bước
