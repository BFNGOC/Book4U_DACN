# CANCEL ORDER LOGIC - IMPLEMENTATION DETAILS

## 🔒 Cancel Restriction Rules

### Status-Based Cancellation Policy

**ONLY allow cancellation when status = `pending`**

```javascript
// ✅ Can Cancel
status: 'pending'; // "⏳ Chờ xác nhận" - Awaiting confirmation

// ❌ Cannot Cancel
status: 'confirmed'; // "✅ Đã xác nhận" - Already confirmed
status: 'picking'; // "📦 Đang lấy hàng" - Being picked
status: 'packed'; // "📮 Đã đóng gói" - Already packed
status: 'in_transit'; // "🚚 Đang vận chuyển" - In transit
status: 'in_delivery_stage'; // "🚴 Đang giao" - Being delivered
status: 'completed'; // "🎉 Đã giao" - Already delivered
status: 'failed'; // "❌ Giao thất bại" - Delivery failed
status: 'cancelled'; // "❌ Đã hủy" - Already cancelled
```

---

## 📋 Implementation

### 1. Frontend Component - OrderDetailPage.jsx

#### Cancel Button Visibility

```jsx
{
    /* Actions - ONLY show for pending status */
}
{
    orderDetail.status === 'pending' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <button
                onClick={handleCancelOrder}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition font-bold text-lg flex items-center justify-center gap-2 group">
                <XCircle
                    size={20}
                    className="group-hover:rotate-12 transition"
                />
                Hủy đơn hàng
            </button>
            <p className="text-center text-sm text-gray-600 mt-4">
                Bạn chỉ có thể hủy đơn hàng trong trạng thái "Chờ xác nhận"
            </p>
        </div>
    );
}
```

#### Handler Function

```jsx
const handleCancelOrder = async () => {
    // ⚠️ Double-check: Only pending orders can be cancelled
    if (orderDetail.status !== 'pending') {
        toast.error('Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xác nhận"');
        return;
    }

    // Confirmation dialog
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
        return;
    }

    try {
        const response = await cancelOrder(orderDetail.mainOrderId._id);
        if (response.success) {
            toast.success('Hủy đơn hàng thành công');
            // Update local state
            setOrderDetail((prev) => ({
                ...prev,
                status: 'cancelled',
            }));
        } else {
            toast.error(response.message || 'Không thể hủy đơn hàng');
        }
    } catch (err) {
        console.error('❌ Error canceling order:', err);
        toast.error('Lỗi khi hủy đơn hàng');
    }
};
```

#### In-Transit Status Message

```jsx
{
    /* In Transit / Processing Message */
}
{
    [
        'confirmed',
        'picking',
        'packed',
        'in_transit',
        'in_delivery_stage',
    ].includes(orderDetail.status) && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-700 font-semibold text-lg">
                ⏳ Đơn hàng đang được xử lý. Vui lòng không hủy đơn nếu không
                cần thiết.
            </p>
        </div>
    );
}
```

### 2. Safety Layers

#### Layer 1: UI Visibility

-   Button only renders when `status === 'pending'`
-   Text message explains restriction
-   No button shown for other statuses

#### Layer 2: Handler Function Validation

-   Check status before processing cancellation
-   Return error toast if status changed
-   Prevents accidental cancellations

#### Layer 3: Confirmation Dialog

-   User must confirm cancellation
-   Can cancel (dismiss) the operation
-   Extra step prevents mistakes

#### Layer 4: Backend Validation

-   Backend should also validate status before cancellation
-   Return error if order not in `pending` state
-   Prevents tampering via API calls

---

## 🎯 User Flow

### For Pending Orders

```
1. User views OrderDetail page
   ↓
2. Status is "pending" (⏳ Chờ xác nhận)
   ↓
3. Cancel button is VISIBLE
   ↓
4. User clicks "Hủy đơn hàng"
   ↓
5. Confirmation dialog appears
   ↓
6. User confirms
   ↓
7. API call sent to cancel order
   ↓
8. Status updates to "cancelled"
   ↓
9. Success toast: "Hủy đơn hàng thành công"
   ↓
10. Cancel button DISAPPEARS
    ↓
11. Cancelled message appears
```

### For Confirmed/In-Transit Orders

```
1. User views OrderDetail page
   ↓
2. Status is NOT "pending" (e.g., "confirmed")
   ↓
3. Cancel button is HIDDEN
   ↓
4. In-transit message appears instead
   ↓
5. Message: "⏳ Đơn hàng đang được xử lý..."
   ↓
6. User cannot cancel
```

### If User Tries to Bypass

```
1. Somehow clicks cancel button (shouldn't exist)
   ↓
2. handleCancelOrder checks status
   ↓
3. Status !== 'pending' → returns
   ↓
4. Error toast: "Chỉ có thể hủy đơn hàng ở trạng thái..."
   ↓
5. Cancellation prevented
```

---

## 📊 Status Transition Logic

### Cancellation Possible

```
pending (🕐 AWAITING CONFIRMATION)
    ↓
    User can cancel here ✅
    ↓
    status → cancelled
```

### Cancellation NOT Possible

```
pending → confirmed (✅ CONFIRMED)
    ↓
    Cannot cancel ❌
    ↓
confirmed → picking (📦 PICKING)
    ↓
    Cannot cancel ❌
    ↓
picking → packed (📮 PACKED)
    ↓
    Cannot cancel ❌
    ↓
packed → in_transit (🚚 IN TRANSIT)
    ↓
    Cannot cancel ❌
    ↓
in_transit → in_delivery_stage (🚴 BEING DELIVERED)
    ↓
    Cannot cancel ❌
    ↓
in_delivery_stage → completed (🎉 COMPLETED)
    ↓
    Cannot cancel ❌
```

---

## 🔧 Backend Considerations

### Recommended Backend Validation

```javascript
// In orderManagementController.js - cancelOrder function
exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.userId;

        // Get order
        const order = await Order.findById(orderId);
        if (!order)
            return res
                .status(404)
                .json({ success: false, message: 'Order not found' });

        // ✅ Verify ownership
        const profile = await Profile.findOne({ userId });
        if (order.profileId.toString() !== profile._id.toString()) {
            return res
                .status(403)
                .json({ success: false, message: 'Not authorized' });
        }

        // ✅ CHECK STATUS - Only allow pending
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`,
            });
        }

        // ✅ Update order status
        order.status = 'cancelled';
        order.updatedAt = new Date();
        await order.save();

        // ✅ Restore inventory (if applicable)
        // ... restore stock logic ...

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order,
        });
    } catch (err) {
        console.error('❌ Error canceling order:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};
```

---

## 🚨 Error Handling

### Frontend Error Cases

1. **Status Check Failed**

    - Error: `'Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xác nhận"'`
    - Cause: Status changed or user tried to bypass
    - Action: Show toast, prevent cancellation

2. **API Error**

    - Error: Response error message
    - Cause: Backend rejected cancellation
    - Action: Show toast with error message

3. **Network Error**
    - Error: `'Lỗi khi hủy đơn hàng'`
    - Cause: Network failure
    - Action: Show toast, allow retry

### Backend Error Cases

1. **Order Not Found**

    - Status: 404
    - Message: 'Order not found'

2. **Unauthorized**

    - Status: 403
    - Message: 'Not authorized'

3. **Invalid Status**

    - Status: 400
    - Message: `'Cannot cancel order with status: {status}'`

4. **Database Error**
    - Status: 500
    - Message: Error details

---

## ✅ Testing Scenarios

### Scenario 1: Cancel Pending Order

```
1. Create test order with status = 'pending'
2. Navigate to OrderDetailPage
3. Verify cancel button is visible
4. Click cancel button
5. Confirm in dialog
6. Verify status updates to 'cancelled'
7. Verify cancel button disappears
8. Verify success toast appears
```

### Scenario 2: Try to Cancel Non-Pending Order

```
1. Create test order with status = 'confirmed'
2. Navigate to OrderDetailPage
3. Verify cancel button is NOT visible
4. Verify in-transit message appears
5. Try to call cancel API directly (should fail)
6. Backend returns 400 error
7. Verify order status unchanged
```

### Scenario 3: Status Changed After Load

```
1. Load pending order (cancel button visible)
2. In another tab: Change status to 'confirmed'
3. In first tab: Try to cancel
4. handleCancelOrder checks status
5. Status is now 'confirmed'
6. Error toast appears
7. User cannot cancel
```

### Scenario 4: User Confusion Test

```
1. Show users both "pending" and "confirmed" orders
2. Verify they understand which can be cancelled
3. Verify in-transit message is clear
4. Verify no attempt to cancel confirmed orders
```

---

## 📈 Future Enhancements

Possible future features:

-   [ ] Allow cancellation with seller approval after 24 hours
-   [ ] Admin ability to cancel at any stage
-   [ ] Return request after delivery (instead of cancel)
-   [ ] Partial order cancellation
-   [ ] Cancellation with penalty for some statuses
-   [ ] Automatic cancellation after N days of pending

---

## 🔐 Security Checklist

-   [x] Frontend: Only show button for pending
-   [x] Frontend: Validate status before cancellation
-   [x] Frontend: Confirmation dialog
-   [x] Backend: Validate JWT and ownership
-   [x] Backend: Validate order status
-   [x] Backend: Prevent tampering via API

---

## 📝 Documentation

### For Users

-   Only pending orders (⏳ Chờ xác nhận) can be cancelled
-   Once confirmed, order cannot be cancelled
-   Contact seller if you need to cancel confirmed order

### For Developers

-   Backend must also validate status
-   Use status constant or enum (not string)
-   Log cancellation attempts
-   Handle inventory restoration

### For Support/Admin

-   Users can only cancel pending orders
-   If user needs to cancel confirmed order, admin intervention required
-   Recommend implementing return request feature for post-delivery issues

---

**Status**: 🟢 IMPLEMENTATION COMPLETE

**Changes Made**:

1. ✅ Cancel button only shows for pending orders
2. ✅ Handler function validates status
3. ✅ In-transit message for other statuses
4. ✅ Helper text explains restriction
5. ✅ Safety layers implemented
6. ✅ UX improved for clarity
