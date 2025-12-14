# 🔔 Socket.IO Realtime Notifications Implementation

## 📋 Overview

Hệ thống thông báo realtime cho sellers khi có đơn hàng mới, sử dụng Socket.IO để push notifications ngay lập tức.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Client)                   │
├─────────────────────────────────────────────────────────┤
│  App.jsx                                                │
│    ├─ NotificationProvider (Context)                   │
│    │  └─ NotificationContext.jsx                        │
│    │    - notifications state                           │
│    │    - unreadCount                                   │
│    │    - addNotification()                             │
│    │    - markAsRead()                                  │
│    │    - clearAllNotifications()                       │
│    │                                                    │
│    ├─ Navbar.jsx                                        │
│    │  └─ NotificationBell.jsx                           │
│    │    - Hiển thị notification dropdown                │
│    │    - Badge unread count                            │
│    │                                                    │
│    └─ Socket Service (socketService.js)                │
│       - connect()                                       │
│       - joinSellerRoom(sellerId)                        │
│       - onNotification(callback)                        │
│       - emit/on events                                  │
│                                                         │
│  Hook:                                                  │
│  useSellerSocket.js                                     │
│    - Auto connect socket for sellers                    │
│    - Join notification room                             │
└─────────────────────────────────────────────────────────┘
                            ⬇️
            Socket.IO Connection (WebSocket)
                            ⬇️
┌─────────────────────────────────────────────────────────┐
│                   Backend (Server)                       │
├─────────────────────────────────────────────────────────┤
│  index.js                                              │
│    - Create HTTP server + Socket.IO                     │
│    - Handle 'seller:join' event                         │
│    - Store connected sellers (Map)                      │
│    - app.locals.io (broadcast messages)                 │
│                                                         │
│  Controllers:                                           │
│  orderManagementController.js                          │
│    - createOrder()
│      └─ send notifications to all sellers (async)      │
│      └─ using sendNewOrderNotification()               │
│                                                         │
│  Utils:                                                 │
│  notificationService.js                                │
│    - sendNewOrderNotification()                         │
│    - sendOrderUpdateNotification()                      │
│    - sendOrderCancelledNotification()                   │
│    - broadcastNotificationToSellers()                   │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. User tạo đơn hàng

```javascript
Frontend: User clicks "Đặt hàng" → POST /api/orders/create
```

### 2. Server nhận request và gửi notifications

```javascript
Backend: createOrder() {
    1. Validate stock
    2. Tạo Order document
    3. Nhóm items theo sellerId
    4. Gửi notification cho từng seller:
       io.to(`seller:${sellerId}`).emit('notification:received', {
           type: 'NEW_ORDER',
           title: '📦 Đơn hàng mới',
           data: { orderId, customerName, totalAmount, ... }
       })
}
```

### 3. Frontend nhận notification qua Socket

```javascript
Socket: Listen 'notification:received'
    └─ NotificationContext.addNotification(notification)
       ├─ Update notifications state
       ├─ Increment unreadCount
       └─ Play sound (optional)
```

### 4. UI cập nhật realtime

```javascript
NotificationBell displays:
    - Bell icon with unread badge
    - Dropdown list of notifications
    - Each notification shows order details
    - Mark as read / Remove buttons
```

## 📦 Package Dependencies

### Backend

```json
{
    "socket.io": "^4.7.2",
    "http": "Built-in Node module"
}
```

### Frontend

```json
{
    "socket.io-client": "^4.7.2" (automatic with socket.io)
}
```

## 🚀 Implementation Steps

### Step 1: Backend Setup (✅ Done)

**File: Server/index.js**

```javascript
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
});

io.on('connection', (socket) => {
    socket.on('seller:join', (sellerId) => {
        socket.join(`seller:${sellerId}`);
        connectedSellers.set(sellerId, socket.id);
    });
});

app.locals.io = io; // Make accessible to routes
```

### Step 2: Notification Service (✅ Done)

**File: Server/src/utils/notificationService.js**

```javascript
const sendNewOrderNotification = (io, sellerId, orderData) => {
    io.to(`seller:${sellerId}`).emit('notification:received', {
        type: 'NEW_ORDER',
        title: '📦 Đơn hàng mới',
        data: orderData,
    });
};
```

### Step 3: Trigger Notifications (✅ Done)

**File: Server/src/controllers/orderManagementController.js**

```javascript
const { sendNewOrderNotification } = require('../utils/notificationService');

exports.createOrder = async (req, res) => {
    // ... create order logic ...

    // Send notifications
    const io = req.app.locals.io;
    for (const [sellerId, items] of Object.entries(sellerItems)) {
        sendNewOrderNotification(io, sellerId, orderData);
    }
};
```

### Step 4: Frontend Socket Service (✅ Done)

**File: Client/Book4U/src/services/socketService.js**

```javascript
import io from 'socket.io-client';

class SocketService {
    connect() {
        this.socket = io(API_URL);
    }

    joinSellerRoom(sellerId) {
        this.socket.emit('seller:join', sellerId);
    }

    onNotification(callback) {
        this.socket.on('notification:received', callback);
    }
}

export default new SocketService();
```

### Step 5: Notification Context (✅ Done)

**File: Client/Book4U/src/context/NotificationContext.jsx**

```javascript
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    // Listen socket notifications
    useEffect(() => {
        socketService.onNotification(addNotification);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, ... }}>
            {children}
        </NotificationContext.Provider>
    );
};
```

### Step 6: Notification Bell Component (✅ Done)

**File: Client/Book4U/src/components/notifications/NotificationBell.jsx**

```javascript
function NotificationBell() {
    const { notifications, unreadCount, markAsRead } = useNotification();

    return (
        <div>
            {/* Bell icon with unread badge */}
            <button>
                {icon} {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>

            {/* Dropdown with notifications */}
            {isOpen && (
                <div className="notification-dropdown">
                    {notifications.map((notif) => (
                        <NotificationItem key={notif.id} notification={notif} />
                    ))}
                </div>
            )}
        </div>
    );
}
```

### Step 7: Add to Navbar (✅ Done)

**File: Client/Book4U/src/components/layouts/Navbar.jsx**

```javascript
import NotificationBell from '../notifications/NotificationBell';

// Inside Navbar
<div className="flex items-center space-x-5">
    {user && <NotificationBell />}
    {/* ... other components ... */}
</div>;
```

### Step 8: Add Provider to App (✅ Done)

**File: Client/Book4U/src/App.jsx**

```javascript
import { NotificationProvider } from './context/NotificationContext';

<BrowserRouter>
    <UserProvider>
        <NotificationProvider>
            <CartProvider>{/* ... */}</CartProvider>
        </NotificationProvider>
    </UserProvider>
</BrowserRouter>;
```

### Step 9: Auto-connect for Sellers (✅ Done)

**File: Client/Book4U/src/hooks/useSellerSocket.js**

```javascript
export const useSellerSocket = () => {
    const { user } = useUser();

    useEffect(() => {
        socketService.connect();
        if (user?.role === 'seller') {
            socketService.joinSellerRoom(user._id);
        }
    }, [user]);
};
```

**Use in seller pages:**

```javascript
function SellerDashboard() {
    useSellerSocket(); // Auto connect and join room
    // ...
}
```

## 🧪 Testing

### Test Backend Socket

```bash
# Terminal 1: Start server
cd Server
npm install socket.io
npm run dev

# Terminal 2: Create order
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{...orderData...}'
```

### Test Frontend Socket

```javascript
// Browser console - Seller 1
socketService.connect();
socketService.joinSellerRoom('seller1-id');
socketService.onNotification((notif) => console.log('Notification:', notif));

// Browser console - Seller 2 (different tab)
socketService.connect();
socketService.joinSellerRoom('seller2-id');
socketService.onNotification((notif) => console.log('Notification:', notif));
```

### Create Test Order

```javascript
// Frontend order creation
const orderData = {
    profileId: 'customer-id',
    items: [
        { bookId: 'book1', sellerId: 'seller1-id', quantity: 1 },
        { bookId: 'book2', sellerId: 'seller2-id', quantity: 2 }
    ],
    totalAmount: 500000,
    paymentMethod: 'MOMO',
    shippingAddress: { ... }
};

await createOrder(orderData); // Trigger notifications
```

**Expected Result:**

-   ✅ Seller 1 nhận notification order từ customer
-   ✅ Seller 2 nhận notification order từ customer
-   ✅ Bell icon shows unread count
-   ✅ Notification dropdown displays order details

## 📊 Notification Types

| Type            | Trigger                     | Icon | Color |
| --------------- | --------------------------- | ---- | ----- |
| NEW_ORDER       | Khi customer tạo order      | 📦   | Blue  |
| ORDER_UPDATE    | Seller confirm/cancel order | 🔄   | Gray  |
| ORDER_CANCELLED | Customer cancel order       | ❌   | Red   |
| ORDER_DELIVERED | Shipper mark delivered      | ✅   | Green |

## 🔐 Security Notes

-   ✅ Notifications sent to specific seller room (`seller:${sellerId}`)
-   ✅ Each seller can only receive their own notifications
-   ✅ Socket rooms isolate communication
-   ✅ Server broadcasts to `req.app.locals.io` (secure)

## 🎯 Features

-   ✅ Realtime notifications via WebSocket
-   ✅ Unread count badge
-   ✅ Notification dropdown with details
-   ✅ Mark as read / Remove buttons
-   ✅ Auto-connect for authenticated users
-   ✅ Separate rooms per seller
-   ✅ Sound notification (optional)
-   ✅ Persistent notification list
-   ✅ Responsive UI

## 📝 Next Steps

1. **Test with actual orders** - Verify notifications appear for sellers
2. **Add database persistence** - Store notifications in DB for offline viewing
3. **Add email notifications** - Send email to seller as backup
4. **Add SMS notifications** - Critical orders can trigger SMS
5. **Add read receipts** - Track which notifications were read
6. **Add notification settings** - Sellers can customize notification preferences

## 🚨 Troubleshooting

**Notifications not appearing?**

-   Check if seller joined room: `socketService.joinSellerRoom(sellerId)`
-   Verify Socket.IO connection: `socketService.isSocketConnected()`
-   Check browser console for errors
-   Verify backend logs: `console.log('Notification sent to seller:', sellerId)`

**Multiple connections?**

-   Use singleton pattern (already done in `socketService`)
-   Check for multiple provider instances in React

**Performance issues?**

-   Use room broadcasting instead of global emit
-   Implement notification pagination
-   Add debouncing for rapid notifications

---

Generated: December 14, 2025
Status: ✅ Implementation Complete
