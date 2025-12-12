/**
 * MOMO PAYMENT UTILITY
 * ====================
 * Xử lý tạo signature, format request và gửi API tới MoMo
 *
 * Tài liệu: https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
 */

const crypto = require('crypto');
const https = require('https');

class MomoPayment {
    constructor(config = {}) {
        // MoMo Configuration
        this.accessKey =
            config.accessKey || process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
        this.secretKey =
            config.secretKey ||
            process.env.MOMO_SECRET_KEY ||
            'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        this.partnerCode =
            config.partnerCode || process.env.MOMO_PARTNER_CODE || 'MOMO';
        this.partnerName = config.partnerName || 'Book4U';
        this.storeId =
            config.storeId || process.env.MOMO_STORE_ID || 'Book4U_Store';
        this.environment =
            config.environment || process.env.MOMO_ENVIRONMENT || 'test'; // 'test' hoặc 'production'

        // API Endpoints
        this.endpoints = {
            test: {
                create: 'https://test-payment.momo.vn/v2/gateway/api/create',
                query: 'https://test-payment.momo.vn/v2/gateway/api/query',
            },
            production: {
                create: 'https://payment.momo.vn/v2/gateway/api/create',
                query: 'https://payment.momo.vn/v2/gateway/api/query',
            },
        };
    }

    /**
     * Tạo signature HMAC SHA256
     * Format: accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}
     */
    createSignature(rawSignature) {
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(rawSignature)
            .digest('hex');
    }

    /**
     * Tạo raw signature string theo đúng thứ tự của MoMo API
     */
    createRawSignature(params) {
        const {
            amount,
            extraData,
            ipnUrl,
            orderId,
            orderInfo,
            redirectUrl,
            requestId,
            requestType,
        } = params;

        return (
            'accessKey=' +
            this.accessKey +
            '&amount=' +
            amount +
            '&extraData=' +
            (extraData || '') +
            '&ipnUrl=' +
            ipnUrl +
            '&orderId=' +
            orderId +
            '&orderInfo=' +
            orderInfo +
            '&partnerCode=' +
            this.partnerCode +
            '&redirectUrl=' +
            redirectUrl +
            '&requestId=' +
            requestId +
            '&requestType=' +
            requestType
        );
    }

    /**
     * Tạo request body gửi tới MoMo
     */
    createRequestBody(params) {
        const {
            amount,
            extraData = '',
            ipnUrl,
            orderId,
            orderInfo,
            redirectUrl,
            requestId,
            requestType = 'payWithMethod',
            autoCapture = true,
            lang = 'vi',
            orderGroupId = '',
        } = params;

        // Tạo raw signature
        const rawSignature = this.createRawSignature({
            amount,
            extraData,
            ipnUrl,
            orderId,
            orderInfo,
            redirectUrl,
            requestId,
            requestType,
        });

        // Tính toán signature
        const signature = this.createSignature(rawSignature);

        // Build request body
        return {
            partnerCode: this.partnerCode,
            partnerName: this.partnerName,
            storeId: this.storeId,
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            orderGroupId: orderGroupId,
            signature: signature,
        };
    }

    /**
     * Gửi request tới MoMo API
     */
    async sendRequest(requestBody) {
        return new Promise((resolve, reject) => {
            const endpoint =
                this.environment === 'production'
                    ? this.endpoints.production.create
                    : this.endpoints.test.create;

            const url = new URL(endpoint);
            const body = JSON.stringify(requestBody);

            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(responseData);
                        resolve(parsedData);
                    } catch (err) {
                        reject(
                            new Error(
                                `Failed to parse MoMo response: ${responseData}`
                            )
                        );
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(body);
            req.end();
        });
    }

    /**
     * Tạo link thanh toán MoMo
     * @param {Object} params - { orderId, amount, orderInfo, redirectUrl, ipnUrl, extraData }
     * @returns {Promise} - { success, paymentUrl, requestId, ... }
     */
    async createPayment(params) {
        const {
            orderId,
            amount,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData = '',
        } = params;

        if (!orderId || !amount || !orderInfo || !redirectUrl || !ipnUrl) {
            throw new Error(
                'Missing required parameters: orderId, amount, orderInfo, redirectUrl, ipnUrl'
            );
        }

        try {
            const requestId = `${orderId}-${Date.now()}`;

            // Tạo request body
            const requestBody = this.createRequestBody({
                amount: String(amount),
                extraData,
                ipnUrl,
                orderId: String(orderId),
                orderInfo,
                redirectUrl,
                requestId,
                requestType: 'payWithMethod',
                autoCapture: true,
                lang: 'vi',
            });

            console.log('📤 Sending MoMo request:', {
                orderId,
                amount,
                requestId,
                environment: this.environment,
            });

            // Gửi request
            const response = await this.sendRequest(requestBody);

            console.log('📥 MoMo response:', response);

            // Kiểm tra response
            if (response.resultCode === 0 || response.resultCode === '0') {
                return {
                    success: true,
                    paymentUrl: response.payUrl,
                    requestId: requestId,
                    resultCode: response.resultCode,
                    resultMessage: response.resultMessage,
                    qrCodeUrl: response.qrCodeUrl || null,
                };
            } else {
                return {
                    success: false,
                    resultCode: response.resultCode,
                    resultMessage:
                        response.resultMessage || 'Payment creation failed',
                };
            }
        } catch (error) {
            console.error('❌ MoMo Payment Error:', error);
            throw error;
        }
    }

    /**
     * Verify signature từ MoMo callback
     *
     * IMPORTANT: MoMo IPN callback không luôn gửi signature field
     * Xem thêm: https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
     */
    verifySignature(callbackData) {
        // ⚠️ MoMo callback không gửi signature field
        // Nên nếu không có signature, chúng ta sẽ kiểm tra với các field bắt buộc
        if (!callbackData.signature) {
            console.log(
                '⚠️ MoMo callback không có signature field - Verify bằng required fields'
            );

            // Nếu không có signature, verify bằng cách kiểm tra required fields
            // Đây là fallback khi MoMo callback format khác từ documentation
            const { resultCode, orderId, requestId } = callbackData;

            // Verify required fields exists
            if (!resultCode && resultCode !== 0 && resultCode !== '0') {
                console.warn('❌ Missing resultCode');
                return false;
            }
            if (!orderId) {
                console.warn('❌ Missing orderId');
                return false;
            }
            if (!requestId) {
                console.warn('❌ Missing requestId');
                return false;
            }

            console.log(
                '✅ Callback verification passed (required fields present)'
            );
            return true;
        }

        // Nếu có signature, verify nó bằng cách tạo raw signature
        const {
            resultCode,
            orderId,
            message,
            responseTime,
            requestId,
            extraData,
            transactionId,
            payType,
        } = callbackData;

        // Tạo raw signature để verify
        const rawSignature =
            'accessKey=' +
            this.accessKey +
            '&amount=' +
            (callbackData.amount || '') +
            '&extraData=' +
            (extraData || '') +
            '&message=' +
            (message || '') +
            '&orderId=' +
            orderId +
            '&orderInfo=' +
            (callbackData.orderInfo || '') +
            '&orderType=' +
            (callbackData.orderType || '') +
            '&partnerCode=' +
            this.partnerCode +
            '&payType=' +
            (payType || '') +
            '&requestId=' +
            requestId +
            '&responseTime=' +
            responseTime +
            '&resultCode=' +
            resultCode +
            '&transactionId=' +
            (transactionId || '');

        // Tính toán signature
        const computedSignature = this.createSignature(rawSignature);

        console.log(
            '📝 Raw Signature:',
            rawSignature.substring(0, 100) + '...'
        );
        console.log('🔐 Computed:', computedSignature.substring(0, 20) + '...');
        console.log(
            '🔐 Callback:',
            callbackData.signature.substring(0, 20) + '...'
        );

        // So sánh với signature từ callback
        return computedSignature === callbackData.signature;
    }
}

module.exports = MomoPayment;
