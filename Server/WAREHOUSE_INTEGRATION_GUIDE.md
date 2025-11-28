# 🔗 INTEGRATION GUIDE - Warehouse System with Existing Codebase

## 📋 OVERVIEW

Hệ thống warehouse & order management đã được thêm vào codebase. Hướng dẫn này giúp bạn integrate nó với:

-   Frontend (Client/Book4U)
-   Existing controllers & routes
-   Existing user authentication

---

## 1️⃣ BACKEND INTEGRATION

### ✅ FILES ĐÃ ĐƯỢC THÊM

**Data Models** (trong `/Server/src/models/`):

-   ✅ `warehouseModel.js` - Physical warehouse locations
-   ✅ `warehouseStockModel.js` - Stock tracking per warehouse
-   ✅ `warehouseLogModel.js` - Audit trail

**Controllers** (trong `/Server/src/controllers/`):

-   ✅ `warehouseController.js` - Warehouse CRUD & stock import/export
-   ✅ `orderManagementController.js` - Order lifecycle management

**Routes** (trong `/Server/src/routes/`):

-   ✅ `warehouseRoutes.js` - Warehouse endpoints
-   ✅ `orderManagementRoutes.js` - Order endpoints
-   ✅ `index.js` - UPDATED with route registrations

**Services** (trong `/Server/src/services/`):

-   ✅ `stockManagementService.js` - Stock helper functions

**Middlewares** (trong `/Server/src/middlewares/`):

-   ✅ `stockValidateMiddleware.js` - Stock validation for requests

---

### ⚠️ POTENTIAL CONFLICTS - Check These Files

#### 1. `/Server/src/routes/index.js`

**Status**: ✅ Already updated with:

```javascript
const warehouseRoutes = require('./warehouseRoutes');
const orderManagementRoutes = require('./orderManagementRoutes');

app.use('/api/warehouse', warehouseRoutes);
app.use('/api/orders', orderManagementRoutes);
```

**Action**: Verify both lines exist in your routes file.

#### 2. `/Server/src/models/bookModel.js`

**Current State**: Already has `stock` & `soldCount` fields

```javascript
stock: {
  type: Number,
  required: true,
  default: 0
},
soldCount: {
  type: Number,
  default: 0
}
```

**Action**: ✅ No changes needed. System uses existing fields.

#### 3. `/Server/src/models/orderModel.js`

**Check if exists**: Verify Order model structure

-   Should have: items[], totalAmount, status, paymentStatus, etc.
-   ✅ No changes needed. Warehouse system extends existing orders.

#### 4. Authentication Middleware

**File**: `/Server/src/middlewares/authMiddleware.js`
**Status**: All routes use `verifyToken` middleware
**Action**: Ensure your auth middleware is working properly

---

## 2️⃣ DATABASE MIGRATION (IF NEEDED)

### If Starting Fresh with New Collections

Run these Mongoose model initializations:

```javascript
// In your MongoDB connection code
const Warehouse = require('./models/warehouseModel');
const WarehouseStock = require('./models/warehouseStockModel');
const WarehouseLog = require('./models/warehouseLogModel');

// Ensure indexes are created
Warehouse.collection.createIndex({ sellerId: 1 });
WarehouseStock.collection.createIndex(
    { sellerId: 1, bookId: 1, warehouseId: 1 },
    { unique: true }
);
WarehouseLog.collection.createIndex({ sellerId: 1 });
WarehouseLog.collection.createIndex({ bookId: 1 });
```

### Existing Data Migration (Optional)

If you have existing Book data with stock:

```javascript
// Stock is already in Book model, just seed warehouses
const seller = await Profile.findById(sellerId);

// Create default warehouse for seller
const warehouse = await Warehouse.create({
    sellerId: seller._id,
    name: `Default Warehouse - ${seller.name}`,
    address: seller.address || 'TBD',
    capacity: 10000,
});

// Create WarehouseStock entries for all books
for (let book of books) {
    await WarehouseStock.create({
        sellerId: seller._id,
        bookId: book._id,
        warehouseId: warehouse._id,
        quantity: book.stock,
    });
}
```

---

## 3️⃣ FRONTEND INTEGRATION

### 📦 SELLER DASHBOARD - Add Warehouse Management UI

**New Pages to Create** (in `/Client/Book4U/src/pages/seller/`):

#### 1. WarehouseManagement.jsx

```jsx
import React, { useState, useEffect } from 'react';
import useRequireAuth from '../../hooks/useRequireAuth';

export default function WarehouseManagement() {
    const auth = useRequireAuth(['seller']);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            const res = await fetch('/api/warehouse/warehouses', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await res.json();
            setWarehouses(data.warehouses || []);
        } catch (err) {
            console.error('Error fetching warehouses:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="warehouse-management">
            <h1>Manage Warehouses</h1>
            <button onClick={() => alert('Open create warehouse modal')}>
                + Create Warehouse
            </button>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {warehouses.map((wh) => (
                        <tr key={wh._id}>
                            <td>{wh.name}</td>
                            <td>{wh.address}</td>
                            <td>{wh.capacity}</td>
                            <td>{wh.status}</td>
                            <td>
                                <button>View Stock</button>
                                <button>Import</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

#### 2. StockImportExport.jsx

```jsx
import React, { useState } from 'react';

export default function StockImportExport({ warehouseId, books }) {
    const [formData, setFormData] = useState({
        bookId: '',
        quantity: 0,
        reason: '',
    });
    const [action, setAction] = useState('import'); // or 'export'

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint =
            action === 'import'
                ? '/api/warehouse/import-stock'
                : '/api/warehouse/export-stock';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    warehouseId,
                    ...formData,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(`${action} successful!`);
                setFormData({ bookId: '', quantity: 0, reason: '' });
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    return (
        <div className="import-export">
            <h3>{action.toUpperCase()} STOCK</h3>

            <div>
                <label>
                    <input
                        type="radio"
                        value="import"
                        checked={action === 'import'}
                        onChange={(e) => setAction(e.target.value)}
                    />{' '}
                    Import
                </label>
                <label>
                    <input
                        type="radio"
                        value="export"
                        checked={action === 'export'}
                        onChange={(e) => setAction(e.target.value)}
                    />{' '}
                    Export
                </label>
            </div>

            <form onSubmit={handleSubmit}>
                <select
                    value={formData.bookId}
                    onChange={(e) =>
                        setFormData({ ...formData, bookId: e.target.value })
                    }>
                    <option>Select Book</option>
                    {books.map((book) => (
                        <option key={book._id} value={book._id}>
                            {book.title}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            quantity: parseInt(e.target.value),
                        })
                    }
                />

                <textarea
                    placeholder="Reason"
                    value={formData.reason}
                    onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                    }
                />

                <button type="submit">Submit</button>
            </form>
        </div>
    );
}
```

#### 3. StockLogs.jsx

```jsx
import React, { useState, useEffect } from 'react';

export default function StockLogs({ warehouseId }) {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({ type: '', page: 1 });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({
                warehouseId,
                page: filters.page,
                limit: 20,
                ...(filters.type && { type: filters.type }),
            });

            const res = await fetch(`/api/warehouse/logs?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Error fetching logs:', err);
        }
    };

    return (
        <div className="stock-logs">
            <h3>Stock History</h3>

            <select
                value={filters.type}
                onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value, page: 1 })
                }>
                <option value="">All Types</option>
                <option value="import">Import</option>
                <option value="export">Export</option>
                <option value="order_create">Order Created</option>
                <option value="order_cancel">Order Cancelled</option>
            </select>

            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Before</th>
                        <th>After</th>
                        <th>Date</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log._id}>
                            <td>{log.type}</td>
                            <td>{log.quantity}</td>
                            <td>{log.quantityBefore}</td>
                            <td>{log.quantityAfter}</td>
                            <td>
                                {new Date(log.createdAt).toLocaleDateString()}
                            </td>
                            <td>{log.reason}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

---

### 🛒 CUSTOMER CHECKOUT - Integrate Order Creation

**File**: `/Client/Book4U/src/pages/Checkout.jsx`

**Add Stock Validation:**

```jsx
import { useState, useEffect } from 'react';

export default function Checkout() {
    const [cartItems, setCartItems] = useState([]);
    const [stockValid, setStockValid] = useState(true);
    const [validationErrors, setValidationErrors] = useState([]);

    useEffect(() => {
        validateStock();
    }, [cartItems]);

    const validateStock = async () => {
        try {
            const items = cartItems.map((item) => ({
                bookId: item.bookId,
                quantity: item.quantity,
            }));

            const res = await fetch('/api/orders/validate-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ items }),
            });

            const data = await res.json();
            setStockValid(data.allValid);

            if (!data.allValid) {
                const errors = data.validationResults
                    .filter((r) => !r.valid)
                    .map(
                        (r) => `${r.bookTitle}: only ${r.available} available`
                    );
                setValidationErrors(errors);
            }
        } catch (err) {
            console.error('Validation error:', err);
        }
    };

    const handleCreateOrder = async () => {
        if (!stockValid) {
            alert('Some items have insufficient stock');
            return;
        }

        try {
            // Format items with sellerId
            const items = cartItems.map((item) => ({
                bookId: item.bookId,
                sellerId: item.sellerId,
                quantity: item.quantity,
                price: item.price,
            }));

            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    profileId: user._id,
                    items,
                    totalAmount: calculateTotal(),
                    paymentMethod: 'COD',
                    shippingAddress: {
                        street: shippingForm.street,
                        ward: shippingForm.ward,
                        district: shippingForm.district,
                        city: shippingForm.city,
                    },
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert('Order created successfully!');
                navigate(`/orders/${data.order._id}`);
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (err) {
            console.error('Order creation error:', err);
        }
    };

    return (
        <div className="checkout">
            {validationErrors.length > 0 && (
                <div className="alert alert-warning">
                    <h4>Stock Issues:</h4>
                    <ul>
                        {validationErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            <button onClick={handleCreateOrder} disabled={!stockValid}>
                Create Order
            </button>
        </div>
    );
}
```

---

### 👤 CUSTOMER ORDERS - Show Order History

**File**: `/Client/Book4U/src/pages/CustomerOrders.jsx`

```jsx
import React, { useState, useEffect } from 'react';

export default function CustomerOrders() {
    const [orders, setOrders] = useState([]);
    const [user] = useUserContext();

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        if (!user?.profileId) return;

        try {
            const res = await fetch(`/api/orders/user/${user.profileId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await res.json();
            setOrders(data.orders || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Cancel this order?')) return;

        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ reason: 'User cancelled' }),
            });

            const data = await res.json();
            if (data.success) {
                alert('Order cancelled successfully');
                fetchOrders(); // Refresh
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (err) {
            console.error('Cancel error:', err);
        }
    };

    return (
        <div className="customer-orders">
            <h2>My Orders</h2>

            {orders.length === 0 ? (
                <p>No orders yet</p>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => (
                        <div key={order._id} className="order-card">
                            <h4>Order #{order._id.slice(-6)}</h4>
                            <p>Amount: ${order.totalAmount}</p>
                            <p>Status: {order.status}</p>
                            <p>Payment: {order.paymentStatus}</p>

                            <h5>Items:</h5>
                            <ul>
                                {order.items.map((item) => (
                                    <li key={item._id}>
                                        {item.title} x{item.quantity}
                                    </li>
                                ))}
                            </ul>

                            {order.status === 'pending' && (
                                <button
                                    onClick={() =>
                                        handleCancelOrder(order._id)
                                    }>
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

---

## 4️⃣ ROUTING INTEGRATION

### Update Seller Routes

**File**: `/Client/Book4U/src/routes/index.jsx`

Add these new routes:

```jsx
import WarehouseManagement from '../pages/seller/WarehouseManagement';
import StockImportExport from '../components/StockImportExport';
import StockLogs from '../components/StockLogs';

const routes = [
    {
        path: '/seller/warehouse',
        element: (
            <PrivateRoute>
                <WarehouseManagement />
            </PrivateRoute>
        ),
        requireRole: 'seller',
    },
    // ... existing routes
];
```

---

## 5️⃣ API USAGE EXAMPLES

### Example 1: Seller Publishing Book

**Before:**

```javascript
// Old way - just create book
const book = await Book.create({
    title: '...',
    price: 100000,
    stock: 0, // ❌ Can't publish with 0 stock
});
```

**After:**

```javascript
// New way - import stock first
1. POST /api/warehouse/import-stock
   { warehouseId, bookId, quantity: 100 }

2. Then create or update book
   POST /api/books
   { title: "...", price: 100000, stock: 100 }
```

---

### Example 2: Handle Stock Errors

```javascript
try {
  const res = await fetch('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({...})
  });

  const data = await res.json();

  if (!data.success) {
    // Handle specific errors
    if (data.message.includes('stock')) {
      // Show stock validation error to user
      alert('Some items are out of stock');
    } else {
      // Other errors
      alert(`Error: ${data.message}`);
    }
  }
} catch (err) {
  // Network error
}
```

---

## 6️⃣ TESTING CHECKLIST

**Backend Testing:**

-   [x] POST /api/warehouse/warehouses - Create warehouse
-   [x] GET /api/warehouse/warehouses - List warehouses
-   [x] POST /api/warehouse/import-stock - Import stock (verify Book.stock updated)
-   [x] POST /api/warehouse/export-stock - Export stock
-   [x] GET /api/warehouse/logs - View logs
-   [x] POST /api/orders/validate-stock - Pre-order validation
-   [x] POST /api/orders/create - Create order (verify stock deducted)
-   [x] GET /api/orders/:id - Get order details
-   [x] GET /api/orders/user/:profileId - List user orders
-   [x] POST /api/orders/:id/cancel - Cancel order (verify stock restored)

**Frontend Testing:**

-   [ ] Seller can create warehouse
-   [ ] Seller can import/export stock
-   [ ] Seller can view stock logs
-   [ ] Customer can validate stock before checkout
-   [ ] Customer can create order
-   [ ] Customer can cancel order
-   [ ] Stock updates reflect on product page

---

## 7️⃣ MONITORING & DEBUGGING

### Check Stock Consistency

```javascript
// In server terminal
const StockManagementService = require('./services/stockManagementService');

// Check single book
const result = await StockManagementService.checkConsistency(bookId, sellerId);
console.log(result);
// Output: { consistent: true/false, bookStock: X, warehouseTotal: Y }
```

### View All Logs

```javascript
// Check logs for order
GET /api/warehouse/logs?orderId=order_123

// Should show:
// - order_create log (when order made)
// - order_cancel log (if cancelled)
```

---

## 8️⃣ PRODUCTION CHECKLIST

-   [x] All models created & indexes created
-   [x] All routes registered
-   [x] Validation middlewares applied
-   [x] Authentication required
-   [x] Transaction support enabled
-   [x] Audit logging implemented
-   [ ] Rate limiting added (optional)
-   [ ] Monitoring alerts setup (optional)
-   [ ] Backup strategy implemented (optional)
-   [ ] Documentation complete

---

**Integration Guide v1.0**
