# 💳 MOMO PAYMENT INTEGRATION - Full Guide

## 🎯 Overview

Đã tích hợp MoMo Payment vào hệ thống Book4U với hỗ trợ thanh toán online thực tế sử dụng MoMo API v2.

### ✅ Tính Năng Đã Implement

-   ✅ Tạo link thanh toán MoMo (PayWithMethod flow)
-   ✅ HMAC SHA256 signature signing theo spec MoMo
-   ✅ Callback handling & signature verification
-   ✅ Payment status tracking
-   ✅ Error handling & logging
-   ✅ Hỗ trợ Test environment (Sandbox)

---

## 📁 Files Changed/Created

### Backend

#### 1. **`Server/src/utils/momoPayment.js`** (NEW)

Utility class xử lý tất cả MoMo payment logic:

-   `createSignature()` - HMAC SHA256 signing
-   `createRawSignature()` - Format raw signature string
-   `createRequestBody()` - Build JSON request body
-   `sendRequest()` - Send HTTPS request to MoMo API
-   `createPayment()` - Main method to create payment
-   `verifySignature()` - Verify callback signature

```javascript
const MomoPayment = require('../utils/momoPayment');

const momoPayment = new MomoPayment({
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    partnerCode: process.env.MOMO_PARTNER_CODE,
    environment: 'test', // hoặc 'production'
});
```

#### 2. **`Server/src/controllers/paymentController.js`** (MODIFIED)

-   ✅ `createMomoPayment()` - Gọi MoMo API thực tế
-   ✅ `handleMomoCallback()` - Xử lý callback từ MoMo + signature verification

#### 3. **`Server/.env`** (UPDATED)

Thêm MoMo credentials:

```env
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_PARTNER_CODE=MOMO
MOMO_STORE_ID=Book4U_Store
MOMO_ENVIRONMENT=test
```

#### 4. **`Server/test_momo_payment.js`** (NEW)

Test file để verify MoMo integration:

```bash
node test_momo_payment.js
```

---

## 🔧 API Endpoints

### Create MoMo Payment

**POST** `/api/payment/momo/create-payment`

**Request:**

```json
{
    "orderId": "order_123",
    "amount": 50000
}
```

**Response (Success):**

```json
{
    "success": true,
    "message": "Link thanh toán MoMo được tạo thành công",
    "data": {
        "paymentUrl": "https://test-payment.momo.vn/...",
        "requestId": "order_123-1702323456789",
        "qrCodeUrl": null,
        "amount": 50000,
        "orderId": "order_123"
    }
}
```

### Handle MoMo Callback

**POST** `/api/payment/momo/callback`

MoMo gửi callback sau khi user thanh toán:

```json
{
    "resultCode": 0,
    "resultMessage": "Successful.",
    "orderId": "order_123",
    "requestId": "order_123-1702323456789",
    "transactionId": "2012234567",
    "responseTime": 1614000000000,
    "amount": 50000,
    "signature": "..."
}
```

**Response:**

-   `resultCode=0`: ✅ Payment success
-   `resultCode=1000`: ⏳ Payment pending
-   Khác: ❌ Payment failed

---

## 📊 Payment Flow

```
┌─────────────┐
│   Frontend  │ User chọn thanh toán MoMo
└──────┬──────┘
       │ POST /api/payment/momo/create-payment
       ▼
┌─────────────┐
│  Backend    │ Tạo request, sign với HMAC SHA256
└──────┬──────┘
       │ HTTPS POST
       ▼
┌─────────────┐
│   MoMo API  │ Validate, return payment URL
└──────┬──────┘
       │ paymentUrl
       ▼
┌─────────────┐
│   Frontend  │ Redirect to MoMo payment page
└──────┬──────┘
       │ User chuyển tiền
       ▼
┌─────────────┐
│   MoMo      │ Xử lý thanh toán
└──────┬──────┘
       │ POST /api/payment/momo/callback (IPN)
       ▼
┌─────────────┐
│   Backend   │ Verify signature, cập nhật order
└──────┬──────┘
       │ Cập nhật DB
       ▼
┌─────────────┐
│   Frontend  │ Redirect to /payment/momo/callback
└─────────────┘
```

---

## 🔐 Security Features

### 1. HMAC SHA256 Signature

Mọi request được ký bằng secret key:

```javascript
const rawSignature = 'accessKey=...&amount=...&...';
const signature = HMAC_SHA256(rawSignature, secretKey);
```

### 2. Callback Verification

Xác minh callback từ MoMo bằng signature verification:

```javascript
const isValid = momoPayment.verifySignature(callbackData);
```

### 3. Request Validation

-   Kiểm tra orderId & amount có hợp lệ
-   Kiểm tra order tồn tại trong DB
-   Verify response code từ MoMo

---

## 🧪 Testing

### 1. Local Test

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run test
node test_momo_payment.js
```

Test sẽ:

-   ✅ Tạo HMAC SHA256 signature
-   ✅ Build request body
-   ✅ Gửi request tới MoMo Test API
-   ✅ Hiển thị payment URL

### 2. Manual Test với Postman

**Create Payment:**

```
POST http://localhost:5000/api/payment/momo/create-payment
Headers: Content-Type: application/json
Body:
{
    "orderId": "test_order_123",
    "amount": 50000
}
```

**Expected Response:**

```json
{
    "success": true,
    "data": {
        "paymentUrl": "https://test-payment.momo.vn/v2/gateway/api/create?...",
        "requestId": "test_order_123-1702323456789"
    }
}
```

### 3. Test Scenario

1. Tạo order trong DB
2. Gọi `/api/payment/momo/create-payment` với orderId & amount
3. Nhận payment URL
4. Click payment URL → MoMo payment page
5. User thanh toán (Test card: 5555 5555 5555 5555)
6. MoMo gửi callback → Order status = "paid"

---

## 🌍 Environment Variables

### Development (Test)

```env
MOMO_ENVIRONMENT=test
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
```

### Production

```env
MOMO_ENVIRONMENT=production
MOMO_ACCESS_KEY=<your_production_key>
MOMO_SECRET_KEY=<your_production_secret>
```

> ⚠️ **IMPORTANT**: Thay thế production credentials sau khi được cấp từ MoMo

---

## 📝 Frontend Integration

Frontend đã được cập nhật để support MoMo payment:

**File:** `Client/Book4U/src/services/api/paymentApi.js`

```javascript
export const createMomoPayment = (orderId, amount) =>
    fetchHandler(
        axiosPrivate,
        `/api/payment/momo/create-payment`,
        { orderId, amount },
        'Lỗi tạo thanh toán MOMO',
        'POST'
    );
```

**Usage:**

```jsx
const handlePaymentMoMo = async () => {
    const response = await createMomoPayment(orderId, amount);
    if (response.success) {
        window.location.href = response.data.paymentUrl;
    }
};
```

---

## 🐛 Troubleshooting

### Issue: "resultCode" khác 0

**Cause:** Request format hoặc signature không đúng
**Solution:**

1. Verify credentials trong .env
2. Check raw signature format
3. Xem logs: `console.log('Sending MoMo request:', ...)`

### Issue: Callback không được nhận

**Cause:** IPN URL config không đúng
**Solution:**

1. Verify `SERVER_URL` trong .env
2. Ensure server có thể receive HTTPS requests
3. Dùng ngrok để test locally: `ngrok http 5000`

### Issue: Signature verification fails

**Cause:** Callback data format không khớp
**Solution:**

1. Log callback data từ MoMo
2. Recompute signature theo format
3. Compare với signature từ MoMo

---

## 📚 References

-   [MoMo Developer Docs](https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method)
-   [Test API Endpoint](https://test-payment.momo.vn/v2/gateway/api/create)
-   [Video Tutorial](https://www.youtube.com/watch?v=bIDtT4_dlY0&t=389s)

---

## ✅ Checklist

-   [x] Create MoMo utility class
-   [x] Implement HMAC SHA256 signing
-   [x] Implement payment creation
-   [x] Implement callback handling
-   [x] Add .env configuration
-   [x] Create test file
-   [x] Write documentation
-   [ ] Test with real MoMo credentials
-   [ ] Deploy to production
-   [ ] Monitor payment transactions

---

## 🚀 Next Steps

1. **Test Locally**: `node test_momo_payment.js`
2. **Manual Test**: Use Postman to create payment
3. **Real Testing**: Switch to real MoMo credentials
4. **Monitor**: Check logs & payment status in DB
5. **Deploy**: Push to production when ready

---

**Status**: ✅ Integration Complete - Ready for Testing

Created: 2025-12-12
Updated: 2025-12-12
