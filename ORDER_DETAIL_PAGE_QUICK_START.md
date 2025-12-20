# ORDER DETAIL PAGE - QUICK START GUIDE

## 🎯 User Flow

### For Customers:

1. **Go to Orders Page**: `/orders`

    - See list of all your OrderDetails
    - Each card shows preview info

2. **Click "Xem chi tiết" Button**

    - Navigates to `/order-detail/{orderDetailId}`
    - Loads complete order information

3. **View Complete Order Information**:

    - ✅ Order header with ID and dates
    - ✅ Seller profile with rating and contact
    - ✅ Full item list with images
    - ✅ Shipping address details
    - ✅ Real-time delivery tracking (maps, shipper info)
    - ✅ Price breakdown

4. **Manage Order** (while in transit):
    - ✅ Cancel button (if status allows)
    - Confirmation required before cancelling

---

## 🔧 Testing the Feature

### 1. Test Backend Endpoint

**Endpoint**: `GET /api/orders/detail/:orderDetailId`

```bash
# Example request with valid OrderDetailId
curl -X GET "http://localhost:5000/api/orders/detail/64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "mainOrderId": { ... },
    "sellerId": { ... },
    "items": [ ... ],
    "shippingAddress": { ... },
    "deliveryStages": [ ... ],
    "status": "in_delivery_stage",
    "totalAmount": 250000
  }
}
```

### 2. Test Frontend Page

**Steps**:

1. Login to customer account
2. Go to `/orders` page
3. Find an OrderDetail with delivery stages
4. Click "Xem chi tiết" button
5. Verify page loads without errors
6. Check all sections display correctly:
    - Order header ✅
    - Seller info with rating ✅
    - Items with images ✅
    - Shipping address ✅
    - Delivery tracker ✅
    - Price summary ✅

### 3. Test Delivery Tracking

**In OrderDetailPage**:

1. Scroll to "Trạng thái vận chuyển" section
2. Should see timeline with 1-3 stages
3. Each stage shows:
    - Status badge
    - Warehouse/shipper info
    - Current location
    - Tracking number (Stage 2)
4. Auto-updates every 30 seconds
5. Click location to open Google Maps

### 4. Test Order Cancellation

**Steps**:

1. Find OrderDetail with status: pending, confirmed, picking, packed, in_transit, or in_delivery_stage
2. Click "Hủy đơn hàng" button
3. Confirm cancellation in dialog
4. Status should update to "cancelled"
5. Button should disappear after cancellation

---

## 📊 Data Requirements

### Prerequisites

The following data must exist in database:

1. **OrderDetail Document**

    ```javascript
    {
      _id: ObjectId,
      mainOrderId: ObjectId (reference to Order),
      sellerId: ObjectId (reference to Seller Profile),
      items: [{
        bookId: ObjectId (reference to Book),
        quantity: number,
        price: number
      }],
      shippingAddress: {
        fullName: string,
        phone: string,
        address: string,
        province: string,
        district: string,
        ward: string
      },
      deliveryStages: [ObjectId], // references to DeliveryStage
      status: string,
      totalAmount: number,
      createdAt: Date
    }
    ```

2. **Related Documents**:
    - Order (MainOrder) with profileId matching current user
    - Seller Profile with shopName and performance.averageRating
    - Book with title, authors, coverImageUrl, price
    - DeliveryStage for each stage with tracking info
    - ShipperProfile for assigned shippers

### Sample Query

```javascript
// To verify data is properly populated:
db.orderdetails
    .findById(orderDetailId)
    .populate('mainOrderId')
    .populate('sellerId')
    .populate('items.bookId')
    .populate('deliveryStages');
```

---

## 🐛 Troubleshooting

### Issue: Page shows "Không tìm thấy đơn hàng"

**Possible Causes**:

1. OrderDetailId doesn't exist
2. User doesn't own this OrderDetail
3. Backend endpoint returning 404

**Solution**:

```javascript
// Check in browser console:
// 1. Verify orderDetailId is correct
console.log(useParams()); // Check orderDetailId

// 2. Check if API call succeeds
fetch(`/api/orders/detail/${orderDetailId}`, {
    headers: { Authorization: `Bearer ${token}` },
})
    .then((r) => r.json())
    .then((d) => console.log(d));
```

### Issue: Delivery Tracker not showing

**Possible Causes**:

1. deliveryStages array is empty
2. Stage data not properly populated
3. DeliveryStageTracker component has error

**Solution**:

1. Check OrderDetail has deliveryStages populated
2. Check backend response includes full stage data
3. Open browser DevTools console for errors

### Issue: Seller information missing

**Possible Causes**:

1. sellerId not populated
2. Seller Profile missing required fields
3. API response incomplete

**Solution**:

```javascript
// Check Seller Profile has:
// - shopName (or firstName + lastName)
// - performance.averageRating
// - primaryPhone

db.profiles
    .findById(sellerId)
    .select('shopName firstName lastName performance primaryPhone');
```

### Issue: Book cover images not showing

**Possible Causes**:

1. coverImageUrl is invalid
2. Image file deleted or moved
3. CORS issues with image hosting

**Solution**:

1. Verify coverImageUrl is valid URL
2. Test image URL in browser
3. Check image hosting service is accessible

---

## 🔐 Security Notes

### Authentication

-   ✅ JWT required (authMiddleware)
-   ✅ User must own the OrderDetail
-   ✅ Ownership verified via mainOrder.profileId

### Authorization

-   ✅ Can only view own OrderDetails
-   ✅ Can only cancel order if not already completed/failed
-   ✅ Cannot modify other user's orders

### Data Privacy

-   ✅ Phone numbers and addresses shown only to order owner
-   ✅ Seller info visible (shop name, public rating only)
-   ✅ No payment details exposed in detail page

---

## 📈 Performance Optimization

### Current Implementation

-   DeliveryStageTracker polls every 30 seconds
-   Could be optimized with WebSocket for real-time updates

### Recommendations

1. **Lazy load images**: Use intersection observer for book covers
2. **Pagination**: If order has 100+ items, paginate items list
3. **WebSocket**: Replace polling with real-time updates
4. **Caching**: Cache OrderDetail locally for faster reloads

---

## 🎓 Component Structure

```
OrderDetailPage (pages/OrderDetailPage.jsx)
├── Header Navigation
│   └── Back Button
├── Order Header Card
│   ├── Order ID
│   ├── Order Date
│   ├── Item Count
│   └── Status Badge
├── Seller Information Card
│   ├── Shop Name
│   ├── Star Rating
│   ├── Phone Link
│   └── Contact Button
├── Items List Card
│   ├── Book Cover Image
│   ├── Book Title
│   ├── Author(s)
│   ├── Quantity
│   └── Price Breakdown
├── Shipping Address Card
│   ├── Full Name
│   ├── Phone
│   ├── Address
│   └── Province/District/Ward
├── Delivery Tracker Card
│   └── <DeliveryStageTracker />
│       ├── Timeline
│       ├── Stage Info
│       ├── Maps Links
│       ├── Shipper Details
│       └── Tracking Numbers
├── Order Summary Card
│   ├── Item Subtotal
│   ├── Shipping Cost
│   └── Total Amount
├── Actions Card
│   └── Cancel Button (conditional)
└── Status Messages
    ├── Completed (green)
    ├── Cancelled (gray)
    ├── Loading (spinner)
    └── Error (with back button)
```

---

## 🚀 Next Steps

### For Production

1. ✅ Test all functionality thoroughly
2. ✅ Verify backend security
3. ✅ Test on mobile devices
4. ✅ Monitor performance
5. ✅ Deploy to production

### Future Enhancements

-   [ ] Add print order receipt feature
-   [ ] Add order timeline/history
-   [ ] Add return/refund request
-   [ ] Add review submission after delivery
-   [ ] Add order status notifications
-   [ ] Add live chat with seller

---

## 📞 Support

If issues occur:

1. Check backend logs: `server.log`
2. Check browser console: DevTools > Console
3. Verify database connection
4. Verify authentication token is valid
5. Check network requests in DevTools > Network tab

**Debug Command**:

```javascript
// In browser console on OrderDetailPage:
console.log('OrderDetailId:', useParams());
console.log('Order Data:', orderDetail);
console.log('Loading:', loading);
console.log('Error:', error);
```
