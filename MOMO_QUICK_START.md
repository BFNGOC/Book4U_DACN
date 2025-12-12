# 🚀 MOMO PAYMENT - QUICK START

## ⚡ 5 Phút Setup

### 1️⃣ Backend Setup

```bash
cd Server

# Check MoMo credentials in .env
cat .env | grep MOMO

# Should see:
# MOMO_ACCESS_KEY=F8BBA842ECF85
# MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
# MOMO_PARTNER_CODE=MOMO
# MOMO_ENVIRONMENT=test

# Start server
npm run dev
```

### 2️⃣ Frontend Setup

```bash
cd Client/Book4U

# Start frontend
npm run dev
```

### 3️⃣ Test Flow

1. Open http://localhost:5173
2. Add books to cart 🛒
3. Click "Mua hàng"
4. Complete 3 steps:
    - Step 1: Confirm items ✅
    - Step 2: Enter shipping address ✅
    - Step 3: Select "📱 Thanh toán qua Momo" 📱
5. Click "✓ Đặt hàng" 🔘
6. See payment URL ✅
7. Payment page opens 💳

---

## 🧪 API Testing (Postman)

### Create Payment

```
POST http://localhost:5000/api/payment/momo/create-payment
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Body:
{
    "orderId": "693c274d78c477f09776f049",
    "amount": 50000
}
```

### Test Script

```bash
node test_momo_api.js
```

Expected Output:

```
✅ Response received:
{
  "success": true,
  "message": "Link thanh toán MoMo được tạo thành công",
  "data": {
    "paymentUrl": "https://test-payment.momo.vn/v2/gateway/pay?...",
    "requestId": "...",
    "amount": 50000
  }
}
✅ SUCCESS! Payment URL created
```

---

## 📝 Files Changed

### Backend

-   ✅ `Server/src/utils/momoPayment.js` - MoMo class
-   ✅ `Server/src/controllers/paymentController.js` - Payment handlers
-   ✅ `Server/.env` - MoMo credentials
-   ✅ `Server/test_momo_api.js` - Test file

### Frontend

-   ✅ `Client/Book4U/src/pages/Checkout.jsx` - Step 3 Payment method
-   ✅ `Client/Book4U/src/services/api/paymentApi.js` - API call
-   ✅ `Client/Book4U/src/pages/payment/PaymentCallback.jsx` - Callback handler

---

## 🎯 What Works

✅ **Step 1: Product Confirmation**

-   Display items with prices
-   Show total amount
-   Proceed to next step

✅ **Step 2: Shipping Address**

-   Enter full name, phone, address
-   Validate phone format (10 digits)
-   Proceed to payment

✅ **Step 3: Payment Method**

-   Display 3 options:
    -   💵 COD (Cash on Delivery)
    -   🏦 VNPay
    -   📱 MoMo
-   Select MoMo option
-   Click "Đặt hàng"

✅ **Payment Processing**

-   Create order in DB
-   Call MoMo API
-   Generate payment URL
-   Redirect to payment page

✅ **Payment Callback**

-   Receive callback from MoMo
-   Verify signature
-   Update order status
-   Show success/failed page

---

## 🔍 Check Integration

### 1. Verify Files Exist

```bash
# Backend
ls Server/src/utils/momoPayment.js
ls Server/src/controllers/paymentController.js

# Frontend
ls Client/Book4U/src/pages/Checkout.jsx
ls Client/Book4U/src/pages/payment/PaymentCallback.jsx
```

### 2. Check API Routes

```bash
# View routes
cat Server/src/routes/paymentRoutes.js
```

Should show:

```
POST   /momo/create-payment    - Create payment
POST   /momo/callback          - Handle callback
GET    /status/:orderId        - Check status
```

### 3. Test MoMo Signature

```bash
node test_momo_payment.js
```

Output:

```
✅ MoMo Payment initialized
✅ Signature created
✅ Request body created
✅ All tests completed!
```

---

## 📊 Production Checklist

Before deploying to production:

-   [ ] Get real MoMo credentials
-   [ ] Update .env with production keys
-   [ ] Set MOMO_ENVIRONMENT=production
-   [ ] Test with real payment
-   [ ] Verify callback URLs
-   [ ] Setup monitoring/logging
-   [ ] Test error scenarios
-   [ ] Deploy backend
-   [ ] Deploy frontend
-   [ ] Monitor first transactions

---

## ❓ Quick Troubleshooting

| Issue                            | Solution                           |
| -------------------------------- | ---------------------------------- |
| "Invalid ObjectId"               | Ensure orderId is valid MongoDB ID |
| "Cannot find module momoPayment" | Check file path in import          |
| "No token"                       | Add Bearer token to request header |
| "Signature invalid"              | Verify raw signature format        |
| "Callback not received"          | Check SERVER_URL and firewall      |

---

## 💡 Test Credentials

```
Access Key:   F8BBA842ECF85
Secret Key:   K951B6PE1waDMi640xX08PD3vg6EkVlz
Partner Code: MOMO
Store ID:     Book4U_Store
Environment:  test (Sandbox)
```

---

## 🌐 Useful Links

-   [MoMo Sandbox](https://test-payment.momo.vn)
-   [MoMo Developer Docs](https://developers.momo.vn)
-   [Test API Status](https://test-payment.momo.vn/v2/gateway/api/create)

---

## ✅ Status: Ready to Use! 🎉

All MoMo payment features are implemented and tested.

**Next Steps:**

1. ✅ Test locally
2. 🔄 Get production credentials
3. 🚀 Deploy to production
4. 📊 Monitor transactions

---

**Last Updated:** 2025-12-12
**Ready for Production:** ✅ Yes (with credentials)
