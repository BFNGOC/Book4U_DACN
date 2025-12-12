# 📊 MOMO PAYMENT - SYSTEM ARCHITECTURE DIAGRAM

## 🌐 System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        BOOK4U E-COMMERCE                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              FRONTEND (React - Port 5173)                  │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  1. Checkout.jsx (Payment Step)                           │ │
│  │     ├─ Display items & total                             │ │
│  │     ├─ Enter shipping address                            │ │
│  │     ├─ Select payment method:                            │ │
│  │     │  ✓ COD (Cash on Delivery)                          │ │
│  │     │  ✓ VNPAY (Bank transfer)                           │ │
│  │     │  ✓ MOMO (E-wallet)  ◄── USER SELECT              │ │
│  │     └─ Click "Đặt hàng" (Place Order)                   │ │
│  │                                                            │ │
│  │  2. paymentApi.js (API Layer)                             │ │
│  │     └─ createMomoPayment(orderId, amount)               │ │
│  │                                                            │ │
│  │  3. PaymentCallback.jsx (Result Page)                     │ │
│  │     ├─ Processing state (spinner)                        │ │
│  │     ├─ Success state (green ✓)                           │ │
│  │     └─ Failed state (red ✗)                              │ │
│  │                                                            │ │
│  └────────────┬─────────────────────────────────────────────┘ │
│               │                                                │
│               │ HTTPS POST                                    │
│               │ /api/payment/momo/create-payment              │
│               │ {orderId, amount}                             │
│               ▼                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              BACKEND (Node.js - Port 5000)                 │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  1. paymentController.js                                  │ │
│  │     ├─ createMomoPayment()                               │ │
│  │     │  ├─ Validate orderId                              │ │
│  │     │  ├─ Check order exists                            │ │
│  │     │  ├─ Initialize MomoPayment                        │ │
│  │     │  ├─ Call momoPayment.createPayment()             │ │
│  │     │  ├─ Save paymentInfo to order                    │ │
│  │     │  └─ Return payment URL                           │ │
│  │     │                                                   │ │
│  │     └─ handleMomoCallback()                             │ │
│  │        ├─ Verify callback signature                    │ │
│  │        ├─ Update order: paymentStatus='paid'          │ │
│  │        └─ Return response                              │ │
│  │                                                            │ │
│  │  2. momoPayment.js (Utility Class)                        │ │
│  │     ├─ constructor(config)                              │ │
│  │     ├─ createSignature(rawSignature)                    │ │
│  │     │  → HMAC SHA256 with secretKey                    │ │
│  │     ├─ createRawSignature(params)                      │ │
│  │     │  → Format: accessKey=X&amount=X&...             │ │
│  │     ├─ createRequestBody(params)                       │ │
│  │     │  → Build JSON for MoMo API                      │ │
│  │     ├─ sendRequest(requestBody)                        │ │
│  │     │  → HTTPS POST to MoMo API                       │ │
│  │     ├─ createPayment(params)                           │ │
│  │     │  → Main entry point                             │ │
│  │     └─ verifySignature(callbackData)                   │ │
│  │        → Verify IPN callback                           │ │
│  │                                                            │ │
│  │  3. paymentRoutes.js                                      │ │
│  │     ├─ POST /momo/create-payment                        │ │
│  │     ├─ POST /momo/callback                              │ │
│  │     └─ GET /status/:orderId                             │ │
│  │                                                            │ │
│  │  4. .env Configuration                                    │ │
│  │     ├─ MOMO_ACCESS_KEY                                  │ │
│  │     ├─ MOMO_SECRET_KEY                                  │ │
│  │     ├─ MOMO_PARTNER_CODE                                │ │
│  │     ├─ MOMO_ENVIRONMENT (test/prod)                     │ │
│  │     └─ CLIENT_URL, SERVER_URL                           │ │
│  │                                                            │ │
│  └────────────┬─────────────────────────────────────────────┘ │
│               │                                                │
│               │ HTTPS POST                                    │
│               │ (with signature)                              │
│               ▼                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         MOMO PAYMENT GATEWAY (Sandbox/Production)         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Test: https://test-payment.momo.vn/v2/gateway/api      │ │
│  │  Prod: https://payment.momo.vn/v2/gateway/api           │ │
│  │                                                            │ │
│  │  1. Verify signature                                     │ │
│  │  2. Validate request                                     │ │
│  │  3. Generate payment URL                                 │ │
│  │  4. Return response                                      │ │
│  │                                                            │ │
│  │  Response:                                               │ │
│  │  {                                                       │ │
│  │    resultCode: 0,  (success)                            │ │
│  │    payUrl: "https://test-payment.momo.vn/...",         │ │
│  │    qrCodeUrl: null,                                     │ │
│  │    ...                                                  │ │
│  │  }                                                       │ │
│  │                                                            │ │
│  └────────────┬─────────────────────────────────────────────┘ │
│               │                                                │
│               │ Return to frontend                            │
│               │ {success: true, paymentUrl: "..."}            │
│               ▼                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              USER PAYMENT PAGE                             │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Frontend redirects:                                      │ │
│  │  window.location.href = paymentUrl                        │ │
│  │                                                            │ │
│  │  User sees MoMo payment page:                             │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  MOMO PAYMENT GATEWAY                            │   │ │
│  │  ├──────────────────────────────────────────────────┤   │ │
│  │  │  Số tiền: 50,000 VND                             │   │ │
│  │  │  Mô tả: Thanh toán đơn hàng...                  │   │ │
│  │  │                                                  │   │ │
│  │  │  [Login] [Select Payment] [Confirm]             │   │ │
│  │  │                                                  │   │ │
│  │  │  User:                                           │   │ │
│  │  │  1. Enters login credentials                    │   │ │
│  │  │  2. Selects payment method                      │   │ │
│  │  │  3. Confirms transaction                        │   │ │
│  │  │  4. Completes payment                           │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  Scenarios:                                               │ │
│  │  ✓ Payment successful → Callback IPN                     │ │
│  │  ✗ Payment failed → Redirect to callback page            │ │
│  │  ⏳ Payment pending → Keep user on page                   │ │
│  │                                                            │ │
│  └────────────┬─────────────────────────────────────────────┘ │
│               │                                                │
│               │ IPN Callback (Asynchronous)                   │
│               │ POST /api/payment/momo/callback               │
│               │ {orderId, resultCode, signature, ...}        │
│               ▼                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         DATABASE (MongoDB)                                 │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Order Collection:                                        │ │
│  │  {                                                        │ │
│  │    _id: ObjectId,                                        │ │
│  │    orderId: String,                                      │ │
│  │    userId: ObjectId,                                     │ │
│  │    items: [...],                                         │ │
│  │    totalAmount: 50000,                                   │ │
│  │                                                            │ │
│  │    paymentMethod: "MOMO",                                │ │
│  │    paymentStatus: "paid",  ◄── UPDATED by callback     │ │
│  │                                                            │ │
│  │    paymentInfo: {                                        │ │
│  │      method: "MOMO",                                    │ │
│  │      requestId: "...",                                 │ │
│  │      transactionId: "2012234567",                      │ │
│  │      status: "success",                                │ │
│  │      createdAt: DateTime,                              │ │
│  │      completedAt: DateTime                             │ │
│  │    },                                                  │ │
│  │                                                            │ │
│  │    orderStatus: "pending",                               │ │
│  │    createdAt: DateTime,                                 │ │
│  │    ...                                                  │ │
│  │  }                                                        │ │
│  │                                                            │ │
│  └────────────┬─────────────────────────────────────────────┘ │
│               │                                                │
│               │ Redirect after payment                        │
│               │ (user browser)                                │
│               ▼                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         PAYMENT CALLBACK PAGE                              │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  PaymentCallback.jsx processes:                           │ │
│  │  ├─ Get URL params (orderId, resultCode)                 │ │
│  │  ├─ Call checkPaymentStatus(orderId)                     │ │
│  │  ├─ Determine status (success/failed/pending)            │ │
│  │  └─ Display result page                                  │ │
│  │                                                            │ │
│  │  SUCCESS PAGE:                                            │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  ✓ Thanh toán thành công                         │   │ │
│  │  │  Mã đơn hàng: 693c274d78c477f09776f049           │   │ │
│  │  │                                                  │   │ │
│  │  │  [Xem chi tiết đơn hàng] [Quay lại trang chủ]  │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  FAILED PAGE:                                             │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  ✗ Thanh toán thất bại                           │   │ │
│  │  │  Vui lòng thử lại                                │   │ │
│  │  │                                                  │   │ │
│  │  │  [Xem chi tiết] [Thử thanh toán lại]           │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📋 Data Flow Sequence

```
SYNCHRONOUS FLOW (User interaction):
═════════════════════════════════════════════════════════════════

1. USER                          FRONTEND               BACKEND
   │                                │                      │
   ├─ Add items to cart ────────────→│                      │
   │                                │                      │
   ├─ Click "Mua hàng" ─────────────→│                      │
   │                                │                      │
   ├─ Checkout - Step 1 ───────────→│                      │
   │                                │                      │
   ├─ Checkout - Step 2 ───────────→│                      │
   │                                │                      │
   ├─ Checkout - Step 3 ───────────→│ Select MoMo          │
   │                                │                      │
   ├─ Click "Đặt hàng" ────────────→│ createOrder() ──────→│
   │                                │                      │ Order created
   │                                │←─ orderId ────────────┤
   │                                │ createMomoPayment() →│
   │                                │←─ paymentUrl ────────┤
   │                                │                      │
   └─ Redirect to paymentUrl ──────→ MoMo Payment Page    │


ASYNCHRONOUS FLOW (Payment processing):
═════════════════════════════════════════════════════════════════

1. MOMO                          BACKEND              DATABASE
   │                                │                      │
   ├─ User confirms payment ────────→│ Receive callback    │
   │                                │ Verify signature    │
   │                                ├──────→ Update order │
   │                                ├───────  paymentStatus
   │                                │  = "paid"
   │                                │←──────────────────────┤
   │                                │                      │
   └─ Redirect user to callback page→ Frontend PageCallback

2. FRONTEND                      BACKEND              DATABASE
   │                                │                      │
   ├─ PaymentCallback.jsx ──────────→│ checkPaymentStatus() │
   │                                │←─ payment info ──────┤
   │                                │                      │
   └─ Display success/failed page ──│                      │


ERROR HANDLING FLOW:
═════════════════════════════════════════════════════════════════

1. Invalid ObjectId:
   USER → FRONTEND → BACKEND
                     │
                     ├─ Validate orderId
                     ├─ Try findById()
                     └─ Catch error
                        │
                        └─→ Response 400: "ID không hợp lệ"
                            │
                            └─→ FRONTEND Toast error
                                │
                                └─→ USER sees error message

2. Signature Verification Failed:
   MOMO IPN → BACKEND
             │
             ├─ Receive callback
             ├─ Verify signature
             ├─ Signature invalid
             │
             └─→ Response 400: "Invalid signature"
                 │
                 └─→ Order NOT updated
                     │
                     └─→ Payment stays "unpaid"

3. MoMo API Error:
   BACKEND → MOMO API
            │
            ├─ Send request
            ├─ Receive error
            │
            └─→ Response 400: Error message
                │
                └─→ FRONTEND
                    │
                    └─→ USER sees error + can retry
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY FEATURES                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: HTTPS/TLS Encryption                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ All communication encrypted in transit             │    │
│  │ Frontend ←→ Backend ←→ MoMo                        │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 2: HMAC SHA256 Signing                              │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Request signature:                                │    │
│  │ rawSig = "accessKey=X&amount=X&..."              │    │
│  │ signature = HMAC_SHA256(rawSig, secretKey)       │    │
│  │                                                   │    │
│  │ Only MoMo can verify with secret key             │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 3: Callback Verification                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Receive IPN callback from MoMo                   │    │
│  │ Verify signature matches                         │    │
│  │ If invalid → Reject callback                     │    │
│  │ Only update order if signature valid             │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 4: ObjectId Validation                              │
│  ┌───────────────────────────────────────────────────┐    │
│  │ Check orderId is valid MongoDB ObjectId          │    │
│  │ Prevent injection attacks                        │    │
│  │ Validate format before DB query                  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 5: JWT Authentication                               │
│  ┌───────────────────────────────────────────────────┐    │
│  │ All payment endpoints require Bearer token       │    │
│  │ Token verified before processing                 │    │
│  │ User can only pay own orders                     │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 6: Error Handling                                   │
│  ┌───────────────────────────────────────────────────┐    │
│  │ All exceptions caught                            │    │
│  │ Sensitive data not exposed                       │    │
│  │ Detailed logs for debugging                      │    │
│  │ User-friendly error messages                     │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    TEST EXECUTION                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Unit Tests:                                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ✅ Signature creation                            │ │
│  │ ✅ Raw signature format                          │ │
│  │ ✅ Request body building                         │ │
│  │ ✅ Error handling                                │ │
│  │                                                  │ │
│  │ Command: node test_momo_payment.js              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  Integration Tests:                                    │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ✅ MongoDB connection                            │ │
│  │ ✅ Order creation                                │ │
│  │ ✅ Payment endpoint call                         │ │
│  │ ✅ Payment URL generation                        │ │
│  │                                                  │ │
│  │ Command: node test_momo_api.js                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  E2E Tests:                                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ✅ Frontend checkout page                        │ │
│  │ ✅ MoMo option selection                         │ │
│  │ ✅ Order placement                               │ │
│  │ ✅ Payment page redirect                         │ │
│  │ ✅ Callback handling                             │ │
│  │ ✅ Success/failed page display                   │ │
│  │                                                  │ │
│  │ Manual: Open localhost:5173, complete flow      │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 PRODUCTION DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND DEPLOYMENT:                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Vercel / Netlify                                   │  │
│  │ ├─ Build: npm run build                            │  │
│  │ ├─ Output: /dist folder                            │  │
│  │ ├─ Serve: Static files via CDN                     │  │
│  │ └─ URL: https://book4u.vercel.app                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  BACKEND DEPLOYMENT:                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Railway / Heroku / Render                          │  │
│  │ ├─ Start: npm run dev                              │  │
│  │ ├─ Environment: .env production                    │  │
│  │ ├─ Database: MongoDB Atlas                         │  │
│  │ └─ URL: https://api.book4u.com                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  DATABASE:                                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ MongoDB Atlas                                      │  │
│  │ ├─ Cluster: Production                             │  │
│  │ ├─ Backup: Daily automated                         │  │
│  │ ├─ Collections: orders, users, books, etc.        │  │
│  │ └─ Monitoring: Real-time metrics                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  MOMO PRODUCTION:                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ MoMo Live Environment                              │  │
│  │ ├─ Access Key: (production)                        │  │
│  │ ├─ Secret Key: (production)                        │  │
│  │ ├─ API: https://payment.momo.vn                   │  │
│  │ └─ Webhook: https://api.book4u.com/...            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  MONITORING & LOGGING:                                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Error Tracking: Sentry / LogRocket                 │  │
│  │ Payment Logs: CloudWatch / ELK                     │  │
│  │ Performance: New Relic / Datadog                   │  │
│  │ Uptime: Uptimerobot                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** 2025-12-12  
**Status:** Ready for Production ✅
