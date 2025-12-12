/**
 * DEBUG MOMO SIGNATURE
 *
 * Dữ liệu callback nhận được:
 * {
 *   resultCode: 0,
 *   orderId: '693c2d30cb64c37d6c00b8aa',
 *   requestId: '693c2d30cb64c37d6c00b8aa-1765551408672',
 *   resultMessage: undefined
 * }
 *
 * VẤN ĐỀ: Callback không gửi signature field!
 * Cần verify với raw signature tạo từ các field có sẵn
 */

const crypto = require('crypto');

// MoMo Credentials
const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const secretKey =
    process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';

// Callback data từ MoMo
const callbackData = {
    resultCode: 0,
    orderId: '693c2d30cb64c37d6c00b8aa',
    requestId: '693c2d30cb64c37d6c00b8aa-1765551408672',
    resultMessage: undefined,
    // Các field có thể được gửi từ MoMo
    message: undefined,
    responseTime: undefined,
    extraData: '',
    transactionId: undefined,
    payType: undefined,
    amount: undefined,
    orderInfo: undefined,
    orderType: undefined,
};

console.log('📥 Dữ liệu Callback từ MoMo:');
console.log(JSON.stringify(callbackData, null, 2));

// === CÁCH 1: Raw Signature theo tài liệu MoMo (đối với callback) ===
// Theo https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
// Raw signature format cho callback: accessKey={accessKey}&amount={amount}&extraData={extraData}&message={message}&orderId={orderId}&orderInfo={orderInfo}&orderType={orderType}&partnerCode={partnerCode}&payType={payType}&requestId={requestId}&responseTime={responseTime}&resultCode={resultCode}&transactionId={transactionId}

const rawSignature1 =
    'accessKey=' +
    accessKey +
    '&amount=' +
    (callbackData.amount || '') +
    '&extraData=' +
    (callbackData.extraData || '') +
    '&message=' +
    (callbackData.message || '') +
    '&orderId=' +
    callbackData.orderId +
    '&orderInfo=' +
    (callbackData.orderInfo || '') +
    '&orderType=' +
    (callbackData.orderType || '') +
    '&partnerCode=' +
    partnerCode +
    '&payType=' +
    (callbackData.payType || '') +
    '&requestId=' +
    callbackData.requestId +
    '&responseTime=' +
    (callbackData.responseTime || '') +
    '&resultCode=' +
    callbackData.resultCode +
    '&transactionId=' +
    (callbackData.transactionId || '');

console.log('\n📝 Raw Signature 1 (Full order):');
console.log(rawSignature1);

const computedSignature1 = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature1)
    .digest('hex');

console.log('✅ Computed Signature 1:', computedSignature1);

// === CÁCH 2: Raw Signature chỉ với required fields ===
// MoMo có thể chỉ gửi những field có giá trị
const rawSignature2 =
    'accessKey=' +
    accessKey +
    '&orderId=' +
    callbackData.orderId +
    '&partnerCode=' +
    partnerCode +
    '&requestId=' +
    callbackData.requestId +
    '&resultCode=' +
    callbackData.resultCode;

console.log('\n📝 Raw Signature 2 (Minimal):');
console.log(rawSignature2);

const computedSignature2 = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature2)
    .digest('hex');

console.log('✅ Computed Signature 2:', computedSignature2);

// === CÁCH 3: Kiểm tra xem MoMo có gửi signature không ===
console.log('\n🔍 MoMo Callback có signature?', !!callbackData.signature);

// === GIẢI PHÁP ===
console.log('\n' + '='.repeat(60));
console.log('🔧 GIẢI PHÁP:');
console.log('='.repeat(60));
console.log(`
Vấn đề: MoMo callback không gửi signature field
Nguyên nhân: Có thể MoMo API documentation có thay đổi hoặc callback từ test server

Giải pháp:
1. Disable signature verification tạm thời để test callback
2. Hoặc cập nhật logic verify để handle cả 2 trường hợp:
   - Nếu có signature: verify nó
   - Nếu không: skip verification (risky) hoặc verify với minimal fields

Khuyến nghị:
- Kiểm tra MoMo documentation để đúng raw signature format
- Test với MoMo sandbox để xác nhận format callback
- Thêm logging chi tiết để debug
`);
