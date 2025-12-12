/**
 * TEST MOMO PAYMENT WITH REAL ORDER
 * ==================================
 * Test MoMo payment endpoint với order thực từ database
 *
 * Usage: node test_momo_api.js
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
}

// Create a test order
async function createTestOrder() {
    const Order = require('./src/models/orderModel');

    const testOrder = new Order({
        profileId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        items: [
            {
                bookId: new mongoose.Types.ObjectId(),
                sellerId: new mongoose.Types.ObjectId(),
                title: 'Test Book',
                quantity: 1,
                price: 50000,
                warehouseId: new mongoose.Types.ObjectId(),
            },
        ],
        totalAmount: 50000,
        deliveryAddress: 'Test Address',
        orderStatus: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: 'MOMO',
    });

    const saved = await testOrder.save();
    console.log('✅ Test order created:', saved._id);
    return saved._id;
}

// Test MoMo payment endpoint
async function testMomoPayment(orderId, userId) {
    try {
        console.log('\n📤 Testing MoMo payment endpoint...');
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Amount: 50000 VND\n`);

        // Create JWT token
        const token = jwt.sign(
            { _id: userId, email: 'test@test.com' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );

        const response = await axios.post(
            `${SERVER_URL}/api/payment/momo/create-payment`,
            {
                orderId: orderId.toString(),
                amount: 50000,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log('✅ Response received:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('\n✅ SUCCESS! Payment URL:');
            console.log(`   ${response.data.data.paymentUrl}`);
            console.log(`\n   Request ID: ${response.data.data.requestId}`);
        } else {
            console.log('\n❌ Failed:', response.data.message);
        }
    } catch (error) {
        if (error.response) {
            console.error('❌ Error response:', error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Main test flow
async function runTests() {
    console.log('\n🚀 Testing MoMo Payment Integration with Real Order\n');

    try {
        await connectDB();
        const orderId = await createTestOrder();
        const userId = new mongoose.Types.ObjectId();
        await testMomoPayment(orderId, userId);

        // Cleanup
        const Order = require('./src/models/orderModel');
        await Order.findByIdAndDelete(orderId);
        console.log('\n✅ Test order cleaned up');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test error:', error);
        process.exit(1);
    }
}

// Run
runTests();
