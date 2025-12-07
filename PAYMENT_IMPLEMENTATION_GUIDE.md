# 💳 Hướng dẫn Xử lý Thanh toán VNPAY & MOMO

## 📋 Tổng quan

Hệ thống đã tích hợp 3 phương thức thanh toán:

1. **COD** (Cash On Delivery) - Thanh toán khi nhận hàng
2. **VNPAY** - Thanh toán qua cổng VNPAY
3. **MOMO** - Thanh toán qua ví MoMo

---

## 🔧 Cấu hình Server

### 1. Thêm biến môi trường (.env)

```env
# Payment Gateway Configuration
# VNPAY Sandbox
VNPAY_TMN_CODE=TESTMERCHANT
VNPAY_HASH_SECRET=TESTSECRET

# MOMO Sandbox
MOMO_PARTNER_CODE=MOMO
MOMO_SECRET_KEY=MOMOTEST

# Client URL for payment redirects
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
```

### 2. Payment Controller (`Server/src/controllers/paymentController.js`)

**Các method chính:**

#### `createVNPayPaymentUrl(req, res)`

-   **Endpoint:** POST `/api/payment/vnpay/create-payment-url`
-   **Input:** `{ orderId, amount }`
-   **Output:** `{ success: true, data: { paymentUrl } }`
-   **Xử lý:**
    1. Lấy đơn hàng từ DB
    2. Tạo HMAC signature với VNPAY_HASH_SECRET
    3. Build payment URL với tất cả params
    4. Lưu transactionRef vào order.paymentInfo
    5. Trả về payment URL

#### `handleVNPayCallback(req, res)`

-   **Endpoint:** POST `/api/payment/vnpay/callback`
-   **Input:** Query params từ VNPAY
-   **Output:** Success/failed response
-   **Xử lý:**
    1. Kiểm tra vnp_TransactionStatus === '00'
    2. Cập nhật order.paymentStatus = 'paid'
    3. Lưu paymentInfo.status = 'success'

#### `createMomoPayment(req, res)`

-   **Endpoint:** POST `/api/payment/momo/create-payment`
-   **Input:** `{ orderId, amount }`
-   **Output:** `{ success: true, data: { paymentUrl } }`
-   **Xử lý:**
    1. Tạo HMAC signature
    2. Lưu requestId vào order.paymentInfo
    3. Trả về MOMO payment URL

#### `getPaymentStatus(req, res)`

-   **Endpoint:** GET `/api/payment/status/:orderId`
-   **Output:** Payment status từ order

---

## 🎨 Frontend Implementation

### 1. Checkout Flow

**File:** `Client/Book4U/src/pages/Checkout.jsx`

**Step 3: Payment Method Selection**

```jsx
// User chọn phương thức thanh toán
const [paymentMethod, setPaymentMethod] = useState('COD');

// Khi click "Đặt hàng" (handlePlaceOrder):
if (paymentMethod === 'COD') {
    // Redirect tới /orders/{orderId}
    navigate(`/orders/${orderId}`);
} else if (paymentMethod === 'VNPAY') {
    // Gọi API tạo link VNPAY
    const paymentRes = await createVNPayPayment(orderId, total);
    // Redirect tới VNPAY gateway
    window.location.href = paymentRes.data.paymentUrl;
} else if (paymentMethod === 'MOMO') {
    // Gọi API tạo link MOMO
    const paymentRes = await createMomoPayment(orderId, total);
    // Redirect tới MOMO gateway
    window.location.href = paymentRes.data.paymentUrl;
}
```

### 2. Payment Callback Handler

**File:** `Client/Book4U/src/pages/payment/PaymentCallback.jsx`

**3 States:**

1. **Processing** - Đang xử lý callback từ gateway
2. **Success** - Thanh toán thành công, hiển thị order info
3. **Failed** - Thanh toán thất bại, cho phép retry

```jsx
// Xử lý VNPAY callback
const vnpTxnRef = searchParams.get('vnp_TxnRef');
const vnpTransactionStatus = searchParams.get('vnp_TransactionStatus');

if (vnpTransactionStatus === '00') {
    setStatus('success');
} else {
    setStatus('failed');
}

// Xử lý MOMO callback
const momoResultCode = searchParams.get('resultCode');
if (momoResultCode === '0') {
    setStatus('success');
} else {
    setStatus('failed');
}
```

### 3. Payment Routes

**File:** `Client/Book4U/src/routes/index.jsx`

```jsx
<Route path="/payment/vnpay/callback" element={<PaymentCallback />} />
<Route path="/payment/momo/callback" element={<PaymentCallback />} />
```

---

## 🧪 Testing

### Test VNPAY (Sandbox)

1. **Tạo đơn hàng trong checkout**

    - Chọn phương thức: "🏦 Thanh toán qua VNPay"
    - Click "Đặt hàng" → Redirect tới VNPAY

2. **Trên VNPAY Gateway**

    - Sử dụng card test: `9704198526191432198` (VietcomBank)
    - OTP: `000000`
    - Expire: `25/12`
    - Kết quả: Success/Failed

3. **Kiểm tra kết quả**
    - ✅ Success: Redirect tới `/payment/vnpay/callback?vnp_TransactionStatus=00`
    - ✅ Database: order.paymentStatus = 'paid'
    - ✅ UI: Hiển thị "✓ Thanh toán thành công"

### Test MOMO (Sandbox)

1. **Tạo đơn hàng trong checkout**

    - Chọn phương thức: "📱 Thanh toán qua Momo"
    - Click "Đặt hàng" → Redirect tới MOMO

2. **Trên MOMO Gateway**

    - Nhập thông tin
    - Confirm payment

3. **Kiểm tra kết quả**
    - ✅ Redirect tới `/payment/momo/callback?orderId=...&resultCode=0`
    - ✅ Database: order.paymentStatus = 'paid'
    - ✅ UI: Hiển thị "✓ Thanh toán thành công"

### Test COD

1. **Tạo đơn hàng trong checkout**

    - Chọn phương thức: "💵 Thanh toán khi nhận hàng (COD)"
    - Click "Đặt hàng"

2. **Kết quả**
    - ✅ Redirect trực tiếp tới `/orders/{orderId}`
    - ✅ paymentStatus = 'pending' (chờ xác nhận từ shipper)
    - ✅ Có thể hủy đơn nếu cần

---

## 📊 Database Schema Updates

### Order Model Addition

```javascript
order.paymentInfo = {
    method: 'VNPAY' | 'MOMO' | 'COD',
    transactionRef: String, // VNPAY
    requestId: String, // MOMO
    status: 'pending' | 'success' | 'failed',
    createdAt: Date,
    completedAt: Date,
};

order.paymentStatus = 'pending' | 'paid' | 'failed';
order.paymentMethod = 'COD' | 'VNPAY' | 'MOMO';
```

---

## 🔐 Security Notes

### VNPAY

-   ✅ HMAC SHA512 signature verification
-   ✅ Secure hash with VNPAY_HASH_SECRET
-   ✅ Transaction reference tracing
-   ⚠️ Production: Sử dụng real TMN_CODE & HASH_SECRET

### MOMO

-   ✅ HMAC SHA256 signature
-   ✅ Partner code verification
-   ⚠️ Production: Sử dụng real PARTNER_CODE & SECRET_KEY

### General

-   ✅ Verify payment status từ gateway callback
-   ✅ Server-side order status update
-   ✅ Transaction logging cho audit trail
-   ⚠️ Không rely trên client-side payment confirmation

---

## 🚀 Production Deployment

### Step 1: Register Payment Gateways

**VNPAY:**

-   Truy cập: https://sandbox.vnpayment.vn
-   Đăng ký tài khoản merchant
-   Lấy `Mã TMN` (TMN_CODE)
-   Lấy `Hash Secret` (HASH_SECRET)
-   Cấu hình Return URL: `{CLIENT_URL}/payment/vnpay/callback`

**MOMO:**

-   Truy cập: https://momo.vn/developer
-   Đăng ký partner account
-   Lấy `Partner Code`
-   Lấy `Secret Key`
-   Cấu hình IPN URL: `{SERVER_URL}/api/payment/momo/callback`

### Step 2: Update .env

```env
# Production VNPAY
VNPAY_TMN_CODE=your_production_tmncode
VNPAY_HASH_SECRET=your_production_hash_secret

# Production MOMO
MOMO_PARTNER_CODE=your_partner_code
MOMO_SECRET_KEY=your_secret_key

# Production URLs
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://api.yourdomain.com
```

### Step 3: Update Payment URLs

```javascript
// paymentController.js - Change from sandbox to production

// VNPAY: Thay 'sandbox.vnpayment.vn' bằng 'api.vnpayment.vn'
const paymentUrl = new URL('https://api.vnpayment.vn/paygate');

// MOMO: Thay 'test-payment.momo.vn' bằng production URL
```

### Step 4: Testing

-   ✅ Test all 3 payment methods
-   ✅ Test order creation → payment → callback flow
-   ✅ Verify database updates
-   ✅ Check payment status page
-   ✅ Test refund functionality

---

## 🐛 Troubleshooting

### Issue: Payment URL không load

**Solution:**

1. Kiểm tra .env có VNPAY_TMN_CODE, HASH_SECRET?
2. Kiểm tra network tab xem API response?
3. Verify CLIENT_URL match với redirect URL?

### Issue: Callback không được nhận

**Solution:**

1. Kiểm tra return URL cấu hình đúng?
2. Verify redirect URL trên payment gateway
3. Kiểm tra server logs có error?

### Issue: Order không update paymentStatus

**Solution:**

1. Kiểm tra transactionRef lưu đúng vào DB?
2. Verify callback query params?
3. Check database transaction logic?

---

## 📞 Support Resources

-   **VNPAY Docs:** https://sandbox.vnpayment.vn/docs
-   **MOMO Docs:** https://developers.momo.vn
-   **Test Cards:** Xem VNPAY sandbox documentation

---

**Last Updated:** December 7, 2025
**Status:** ✅ Ready for Testing
