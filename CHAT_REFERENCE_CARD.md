# 📋 FIREBASE CHAT - QUICK REFERENCE CARD

## 🎯 Setup (3 Steps)

```
1. Firebase Console → Authentication → Enable Email/Password
2. Realtime Database → Rules → Paste security rules → Publish
3. Test: Customer click "Chat với bán hàng" → Message appears real-time ✓
```

---

## 📁 Files Overview

| File               | Lines | Purpose                                 |
| ------------------ | ----- | --------------------------------------- |
| ChatList.jsx       | 157   | Danh sách conversations                 |
| ChatWindow.jsx     | 165   | Cửa sổ chat & gửi tin nhắn              |
| StartChat.jsx      | 73    | Nút bắt đầu chat                        |
| Chat.jsx           | 89    | Chat page (updated)                     |
| ProductDetails.jsx | 208   | Product page (add chat button)          |
| chatApi.js         | 245   | Firebase API (fixed deleteConversation) |

---

## 🔑 Key Functions

```javascript
// Create conversation ID from 2 user IDs (sorted)
createConversationId(id1, id2) → "id1_id2"

// Send a message
sendMessage(convId, senderId, text, senderInfo)

// Listen to messages (real-time)
getMessages(convId, callback)

// Create or get conversation
getOrCreateConversation(id1, id2, user1Info, user2Info)

// Get user's conversations
getUserConversations(userId, callback)

// Mark messages as read
markMessagesAsRead(convId, userId)

// Delete conversation
deleteConversation(convId)
```

---

## 💾 Data Structure

```javascript
{
  chats: {
    "userId1_userId2": {
      id: "userId1_userId2",
      participants: {
        userId1: {id, name, role},
        userId2: {id, name, role}
      },
      createdAt: timestamp,
      lastMessage: "...",
      lastMessageTime: timestamp,
      messages: {
        msgKey1: {
          id, senderId, senderName, senderAvatar,
          senderRole, text, timestamp, read
        }
      }
    }
  }
}
```

---

## 🔐 Security Rules (Copy-Paste Ready)

```json
{
    "rules": {
        "chats": {
            "$conversationId": {
                ".read": "auth.uid != null && (root.child('chats').child($conversationId).child('participants').child(auth.uid).exists())",
                ".write": "auth.uid != null && (root.child('chats').child($conversationId).child('participants').child(auth.uid).exists())",
                "messages": {
                    "$messageId": {
                        ".write": "newData.child('senderId').val() === auth.uid"
                    }
                }
            }
        },
        ".read": false,
        ".write": false
    }
}
```

---

## 🚀 Usage Examples

### Add Chat Button (Anywhere)

```jsx
import StartChat from '../components/chat/StartChat';

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

### Use ChatList

```jsx
import ChatList from '../components/chat/ChatList';

<ChatList
    onSelectConversation={(convId, otherUser) => {
        setSelectedConversation(convId);
    }}
    selectedConversationId={selectedConversation}
/>;
```

### Use ChatWindow

```jsx
import ChatWindow from '../components/chat/ChatWindow';

<ChatWindow
    conversationId="userId1_userId2"
    otherUser={otherUserObject}
    onBack={() => setSelectedConversation(null)}
/>;
```

---

## 🧪 Quick Test

```
1. Open /product/[slug]
2. Scroll down → Click "Chat với bán hàng"
3. ✓ Should navigate to /chat
4. ✓ Conversation should be selected
5. Type message → Send
6. ✓ Message appears in ChatWindow
7. Open another tab with seller account
8. ✓ Message appears real-time (no refresh needed)
```

---

## 🐛 Common Issues & Fixes

| Issue                    | Cause                                 | Fix                                          |
| ------------------------ | ------------------------------------- | -------------------------------------------- |
| "Permission denied"      | Rules incorrect or user not logged in | Check Firebase Console → Rules & enable Auth |
| Messages don't appear    | Wrong database path                   | Check `databaseURL` in firebase.js           |
| No real-time update      | Listener not attached                 | Check console logs for errors                |
| Unread count not working | `read` field missing                  | Ensure Firebase stores read status           |

---

## 📱 Component Props

### ChatList

```jsx
{
  onSelectConversation: (conversationId, otherUser) => void,
  selectedConversationId: string
}
```

### ChatWindow

```jsx
{
  conversationId: string,
  otherUser: {id, name, role},
  onBack: () => void
}
```

### StartChat

```jsx
{
  sellerId: string,
  sellerInfo: {_id, firstName, lastName, storeLogo}
}
```

---

## ✨ Features Checklist

-   [x] Real-time messaging
-   [x] Multiple conversations
-   [x] Unread badges
-   [x] Search conversations
-   [x] Delete conversations
-   [x] Auto-scroll
-   [x] Mobile responsive
-   [x] Error handling
-   [x] Loading states
-   [x] Time formatting

---

## 📖 Full Docs

-   📚 CHAT_QUICKSTART.md
-   📚 CHAT_FIREBASE_IMPLEMENTATION_GUIDE.md
-   📚 FIREBASE_CHAT_SETUP.md
-   📚 CHAT_IMPLEMENTATION_SUMMARY.md

---

## 🎯 Next Steps

1. ✅ Enable Firebase Auth
2. ✅ Publish Security Rules
3. ✅ Test chat locally
4. ✅ Deploy to production
5. ✅ Monitor Firebase usage

---

## 💡 Pro Tips

-   Use `console.log()` in browser to debug Firebase auth
-   Check Firebase Console → Database → Data tab to view conversations
-   Search conversations are case-insensitive
-   Messages marked as read automatically when conversation opens
-   Delete conversation removes all data (permanent)

---

## 📞 Support

**Files Modified:**

-   ✅ chatApi.js (deleteConversation fixed)
-   ✅ Chat.jsx (auto-select + welcome screen)
-   ✅ ProductDetails.jsx (add chat button)

**Files Created:**

-   ✅ ChatList.jsx
-   ✅ ChatWindow.jsx
-   ✅ StartChat.jsx

**No errors, ready to deploy!** 🚀
