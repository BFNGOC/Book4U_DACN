/**
 * TEST MOMO PAYMENT
 * ==================
 * Test file để verify MoMo payment integration
 *
 * Usage: node test_momo_payment.js
 */

require('dotenv').config();
const MomoPayment = require('./src/utils/momoPayment');

async function testMomoPayment() {
    console.log('\n🚀 Testing MoMo Payment Integration...\n');

    try {
        // Initialize MoMo Payment
        const momoPayment = new MomoPayment({
            accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
            secretKey:
                process.env.MOMO_SECRET_KEY ||
                'K951B6PE1waDMi640xX08PD3vg6EkVlz',
            partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
            environment: process.env.MOMO_ENVIRONMENT || 'test',
        });

        console.log('✅ MoMo Payment initialized with:');
        console.log(`   Access Key: ${momoPayment.accessKey}`);
        console.log(`   Partner Code: ${momoPayment.partnerCode}`);
        console.log(`   Environment: ${momoPayment.environment}\n`);

        // Test 1: Create signature
        console.log('📝 Test 1: Creating HMAC SHA256 Signature...');
        const testParams = {
            amount: '50000',
            extraData: 'test_order_123',
            ipnUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
            orderId: 'test_order_123',
            orderInfo: 'pay with MoMo',
            redirectUrl:
                'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
            requestId: 'request_123',
            requestType: 'payWithMethod',
        };

        const rawSignature = momoPayment.createRawSignature(testParams);
        console.log('Raw Signature:');
        console.log(rawSignature);
        console.log('');

        const signature = momoPayment.createSignature(rawSignature);
        console.log(`✅ Signature created: ${signature}\n`);

        // Test 2: Create request body
        console.log('📝 Test 2: Creating Request Body...');
        const requestBody = momoPayment.createRequestBody({
            amount: '50000',
            extraData: 'test_order_123',
            ipnUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
            orderId: 'test_order_123',
            orderInfo: 'pay with MoMo',
            redirectUrl:
                'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
            requestId: 'request_123',
        });

        console.log('✅ Request body created:');
        console.log(JSON.stringify(requestBody, null, 2));
        console.log('');

        // Test 3: Send payment request (requires internet)
        console.log('📝 Test 3: Sending Payment Request to MoMo...');
        try {
            const paymentResult = await momoPayment.createPayment({
                orderId: 'test_order_' + Date.now(),
                amount: 50000,
                orderInfo: 'Test Payment with MoMo',
                redirectUrl:
                    'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
                ipnUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
                extraData: 'test_data',
            });

            console.log('✅ Payment result:');
            console.log(JSON.stringify(paymentResult, null, 2));

            if (paymentResult.success) {
                console.log('\n✅ SUCCESS! Payment URL created:');
                console.log(`   Payment URL: ${paymentResult.paymentUrl}`);
                console.log(`   Request ID: ${paymentResult.requestId}`);
            } else {
                console.log('\n⚠️ Payment creation failed:');
                console.log(`   Result Code: ${paymentResult.resultCode}`);
                console.log(`   Message: ${paymentResult.resultMessage}`);
            }
        } catch (error) {
            console.log(
                '⚠️ Failed to send payment request (may be network issue):'
            );
            console.log(`   Error: ${error.message}`);
        }

        console.log('\n✅ All tests completed!\n');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
testMomoPayment();
