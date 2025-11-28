# Warehouse System - Quick Reference Guide

## 🚀 Quick Start

### Import Services (Client)

```javascript
import {
    getWarehousesBySeller,
    importStock,
    exportStock,
    getWarehouseLogs,
    getProductTotalStock,
    createOrder,
    cancelOrder,
} from '@/services/api/warehouseApi';
```

### Common Operations

#### 1. Get All Warehouses

```javascript
const res = await getWarehousesBySeller();
if (res.success) {
    const warehouses = res.data; // Array of warehouses
}
```

#### 2. Import Stock

```javascript
const res = await importStock({
    warehouseId: warehouse._id,
    bookId: book._id,
    quantity: 100,
    reason: 'New supplier shipment',
});
```

#### 3. Export Stock

```javascript
const res = await exportStock({
    warehouseId: warehouse._id,
    bookId: book._id,
    quantity: 20,
    reason: 'Customer return',
});
```

#### 4. Get Stock History

```javascript
const res = await getWarehouseLogs({
    warehouseId: warehouse._id,
    type: 'import', // or 'export', 'order_create', etc.
    page: 1,
    limit: 20,
});
```

#### 5. Get Total Stock

```javascript
const res = await getProductTotalStock(bookId);
// res.data.totalStock = sum of all warehouses
// res.data.stocks = array of warehouse quantities
```

#### 6. Create Order (Auto Stock Deduction)

```javascript
const res = await createOrder({
  profileId: customerId,
  items: [
    {
      bookId: '...',
      sellerId: '...',
      quantity: 2
    }
  ],
  totalAmount: 250000,
  paymentMethod: 'credit_card',
  shippingAddress: { ... }
});
// Stock automatically deducted!
```

#### 7. Cancel Order (Auto Stock Restoration)

```javascript
const res = await cancelOrder(orderId, {
    reason: 'Customer requested',
});
// Stock automatically restored!
```

---

## 📊 API Response Format

### Success Response

```javascript
{
  success: true,
  message: "Operation message",
  data: { ... },        // Actual data
  meta: { ... }         // Metadata (pagination, etc.)
}
```

### Error Response

```javascript
{
  success: false,
  message: "Error description",
  data: [],
  meta: {}
}
```

### Pagination Response

```javascript
{
  success: true,
  data: [ ... ],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    pages: 8
  }
}
```

---

## 🗄️ Data Structures

### Warehouse Object

```javascript
{
  _id: ObjectId,
  name: "Kho TP.HCM",
  street: "123 Nguyễn Huệ",
  ward: "Phường Bến Nghé",
  district: "Quận 1",
  province: "TP.HCM",
  country: "Vietnam",
  postalCode: "70000",
  managerName: "Nguyễn Văn A",
  managerPhone: "0901234567",
  isDefault: false
}
```

### WarehouseStock Object

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  warehouseName: "Kho TP.HCM",
  quantity: 80,
  soldCount: 20,
  lastUpdatedStock: Date
}
```

### WarehouseLog Object

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,
  bookId: ObjectId,
  warehouseId: ObjectId,
  warehouseName: "Kho TP.HCM",
  type: "import",                    // or "export", "order_create", etc.
  quantity: 100,
  quantityBefore: 0,
  quantityAfter: 100,
  orderId: ObjectId,                 // null if not related to order
  reason: "Initial import",
  performedBy: ObjectId,
  status: "success",
  createdAt: Date
}
```

### Order Object

```javascript
{
  _id: ObjectId,
  profileId: ObjectId,
  items: [
    {
      bookId: ObjectId,
      sellerId: ObjectId,
      quantity: 2
    }
  ],
  totalAmount: 250000,
  paymentMethod: "credit_card",
  shippingAddress: { ... },
  status: "pending",                 // or "completed", "cancelled", etc.
  paymentStatus: "unpaid",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Common Scenarios

### Scenario 1: Seller Sets Up Warehouse

```javascript
// 1. Create warehouse
const createRes = await createWarehouse({
    name: 'Kho Chính',
    street: '123 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP.HCM',
    managerName: 'Nguyễn Văn A',
    managerPhone: '0901234567',
});
const warehouseId = createRes.data._id;

// 2. Import initial stock
await importStock({
    warehouseId,
    bookId: book1._id,
    quantity: 100,
    reason: 'Initial purchase from publisher',
});

// 3. View total stock
const stockRes = await getProductTotalStock(book1._id);
console.log(stockRes.data.totalStock); // 100
```

### Scenario 2: Seller Moves Stock Between Warehouses

```javascript
// Export from warehouse 1
await exportStock({
    warehouseId: warehouse1._id,
    bookId: book._id,
    quantity: 50,
    reason: 'Transfer to warehouse 2',
});

// Import to warehouse 2
await importStock({
    warehouseId: warehouse2._id,
    bookId: book._id,
    quantity: 50,
    reason: 'Transfer from warehouse 1',
});
```

### Scenario 3: Customer Places Order

```javascript
// 1. Validate stock first (optional but recommended)
const validation = await validateStockBeforeOrder({
  items: [
    { bookId: book1._id, quantity: 2, sellerId: seller._id },
    { bookId: book2._id, quantity: 1, sellerId: seller._id }
  ]
});

if (!validation.success) {
  // Show error to customer
  return;
}

// 2. Create order
const orderRes = await createOrder({
  profileId: customer._id,
  items: [
    { bookId: book1._id, quantity: 2, sellerId: seller._id },
    { bookId: book2._id, quantity: 1, sellerId: seller._id }
  ],
  totalAmount: 350000,
  paymentMethod: "credit_card",
  shippingAddress: { ... }
});

// Stock automatically deducted!
// WarehouseLog entries created automatically!
```

### Scenario 4: Customer Cancels Order

```javascript
const cancelRes = await cancelOrder(orderId, {
    reason: 'Changed mind',
});

// Stock automatically restored to original warehouse!
// order_cancel log entries created automatically!
```

### Scenario 5: View Inventory History

```javascript
// Get all import operations
const logs = await getWarehouseLogs({
    warehouseId: warehouse._id,
    type: 'import',
    page: 1,
    limit: 50,
});

logs.data.forEach((log) => {
    console.log(`${log.quantity} units from ${log.reason}`);
    console.log(`Before: ${log.quantityBefore}, After: ${log.quantityAfter}`);
});
```

---

## ⚙️ Error Handling

### Handle API Errors

```javascript
try {
    const res = await importStock(data);

    if (!res.success) {
        // API returned error
        alert(res.message);
        return;
    }

    // Success
    console.log(res.data);
} catch (err) {
    // Network error
    console.error('Network error:', err);
    alert('Lỗi kết nối. Vui lòng thử lại.');
}
```

### Common Error Messages

```
"Kho không tồn tại hoặc không thuộc về bạn"
→ Check warehouseId, ensure seller owns warehouse

"Tồn kho không đủ. Tồn: 50, Cần: 100"
→ Not enough stock, check available quantity first

"Sách không tồn tại hoặc không thuộc về bạn"
→ Invalid bookId or seller doesn't own the book

"Bạn phải đăng nhập để thực hiện thao tác này"
→ Token expired, redirect to login

"Đơn hàng không tồn tại"
→ Invalid orderId

"Không thể hủy đơn đã hoàn thành hoặc đang giao"
→ Order status doesn't allow cancellation
```

---

## 🔍 Query Filters

### Log Filters

```javascript
// By warehouse
getWarehouseLogs({ warehouseId: '...' });

// By operation type
getWarehouseLogs({ type: 'import' }); // import|export|order_create|order_cancel

// By date (use pagination)
getWarehouseLogs({ page: 2, limit: 20 });

// Combined
getWarehouseLogs({
    warehouseId: '...',
    type: 'order_create',
    page: 1,
    limit: 50,
});
```

### Order Filters

```javascript
// By status
getCustomerOrders(profileId, { status: 'pending' });

// By pagination
getCustomerOrders(profileId, { page: 1, limit: 10 });

// Combined
getCustomerOrders(profileId, {
    status: 'completed',
    page: 1,
    limit: 20,
});
```

---

## 💾 State Management Example

### React Hook

```javascript
function WarehouseManagement() {
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [stocks, setStocks] = useState([]);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        const res = await getWarehousesBySeller();
        if (res.success) {
            setWarehouses(res.data);
            setSelectedWarehouse(res.data[0]);
            loadStocks(res.data[0]._id);
        }
    };

    const loadStocks = async (warehouseId) => {
        const res = await getWarehouseLogs({
            warehouseId,
            page: 1,
            limit: 20,
        });
        if (res.success) {
            setLogs(res.data);
        }
    };

    return (
        <div>
            {warehouses.map((w) => (
                <button
                    key={w._id}
                    onClick={() => {
                        setSelectedWarehouse(w);
                        loadStocks(w._id);
                    }}>
                    {w.name}
                </button>
            ))}
        </div>
    );
}
```

---

## 🔐 Security Notes

### Authentication

-   All endpoints require valid JWT token
-   Token expires after 24 hours (or configured duration)
-   Include `Authorization: Bearer <token>` header

### Authorization

-   Can only access own warehouses
-   Cannot see other seller's stock data
-   Backend verifies `sellerId` matches `req.user._id`

### Data Validation

-   Quantities must be positive
-   Warehouse name required
-   Phone format validation: `0` + 9 digits
-   ObjectIds validated before DB operations

---

## 📈 Performance Tips

### Optimize Queries

```javascript
// Good: Specify what you need
const logs = await getWarehouseLogs({
    warehouseId: '...',
    type: 'import',
});

// Bad: Get everything then filter
const allLogs = await getWarehouseLogs({});
const filtered = allLogs.filter((l) => l.type === 'import');
```

### Cache Frontend Data

```javascript
// Cache warehouses to avoid repeated API calls
const [warehouses, setWarehouses] = useState([]);

useEffect(() => {
    if (warehouses.length === 0) {
        loadWarehouses();
    }
}, []);
```

### Use Pagination

```javascript
// Good: Paginated
const page1 = await getWarehouseLogs({
    warehouseId: '...',
    page: 1,
    limit: 20,
});

// Bad: Load all logs at once
const allLogs = await getWarehouseLogs({
    warehouseId: '...',
    limit: 10000,
});
```

---

## 🐛 Debugging

### Enable Network Monitoring

```javascript
// Add to fetch handler
const res = await importStock(data);
console.log('Response:', res);
console.log('Status:', res.success);
console.log('Data:', res.data);
```

### Check Backend Logs

```bash
# View server console for transaction logs
# Look for: "Transaction: committed" or "Transaction: aborted"
```

### Test Individual Endpoints

```bash
# Use curl to test directly
curl -X GET http://localhost:5000/api/warehouse/warehouses \
  -H "Authorization: Bearer <token>"
```

### Verify Database State

```bash
# Connect to MongoDB and check collections
db.warehousestocks.findOne()
db.warehouselogs.findOne()
db.profiles.findOne()
```

---

## 📝 Code Examples

### Complete Import Workflow

```javascript
async function importNewStock(warehouseId, bookId, quantity) {
    try {
        // Validate inputs
        if (!warehouseId || !bookId || quantity <= 0) {
            throw new Error('Invalid inputs');
        }

        // Call API
        const res = await importStock({
            warehouseId,
            bookId,
            quantity,
            reason: 'Manual import',
        });

        // Handle response
        if (!res.success) {
            throw new Error(res.message);
        }

        // Update UI
        console.log('✅ Import successful');
        console.log(`New quantity: ${res.data.warehouseStock.quantity}`);

        return res.data;
    } catch (err) {
        console.error('❌ Import failed:', err.message);
        alert(err.message);
    }
}
```

### Complete Order Creation

```javascript
async function placeOrder(items, customerId) {
    try {
        // 1. Validate stock
        const validation = await validateStockBeforeOrder({ items });
        if (!validation.success || !validation.allValid) {
            alert('❌ Insufficient stock for some items');
            return;
        }

        // 2. Create order
        const orderRes = await createOrder({
            profileId: customerId,
            items,
            totalAmount: calculateTotal(items),
            paymentMethod: 'credit_card',
            shippingAddress: getShippingAddress(),
        });

        if (!orderRes.success) {
            throw new Error(orderRes.message);
        }

        // 3. Confirm
        console.log('✅ Order created:', orderRes.data._id);
        return orderRes.data;
    } catch (err) {
        console.error('❌ Order failed:', err);
        alert(`Order failed: ${err.message}`);
    }
}
```

---

## 🔗 Related Files

**Backend:**

-   `/Server/src/models/warehouseStockModel.js`
-   `/Server/src/models/warehouseLogModel.js`
-   `/Server/src/controllers/warehouseController.js`
-   `/Server/src/controllers/orderManagementController.js`
-   `/Server/src/routes/warehouseRoutes.js`
-   `/Server/src/routes/orderManagementRoutes.js`

**Frontend:**

-   `/Client/Book4U/src/services/api/warehouseApi.js`
-   `/Client/Book4U/src/components/seller/SellerInventoryManagement.jsx`
-   `/Client/Book4U/src/components/modal/WarehouseModal.jsx`

**Documentation:**

-   `/Server/WAREHOUSE_API_DOCS.md`
-   `/Server/WAREHOUSE_TESTING_GUIDE.md`
-   `/WAREHOUSE_IMPLEMENTATION_SUMMARY.md`

---

## 🎓 Learning Resources

1. **Start Here**: Read `WAREHOUSE_IMPLEMENTATION_SUMMARY.md`
2. **API Reference**: Check `WAREHOUSE_API_DOCS.md`
3. **Testing**: Follow `WAREHOUSE_TESTING_GUIDE.md`
4. **Code**: Study component implementation in client/server
5. **Debugging**: Use provided curl examples to test endpoints

---

**Last Updated**: November 28, 2025
**Quick Reference v1.0**
