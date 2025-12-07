const mongoose = require('mongoose');
const express = require('express');
const app = express();
require('dotenv').config();

// Import models
const Order = require('./src/models/orderModel');
const { SellerProfile } = require('./src/models/profileModel');
const WarehouseStock = require('./src/models/warehouseStockModel');
const WarehouseLog = require('./src/models/warehouseLogModel');
const Book = require('./src/models/bookModel');

// Import controller function
const orderManagementController = require('./src/controllers/orderManagementController');

async function testConfirmOrder() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Mock request object
        const req = {
            params: { orderId: '693579d3b1f8523dd8eb78fc' },
            body: {
                customerLocation: {
                    address: '123 xã Quảng Tiến, Trảng Bom, Đồng Nai',
                },
            },
            user: {
                userId: '690cadcf4f339957a3003e86', // Actual User ID for seller
            },
        };

        // Mock response object
        let responseData = null;
        let responseStatus = null;
        const res = {
            json: (data) => {
                responseData = data;
                console.log('\n✅ Response:', JSON.stringify(data, null, 2));
            },
            status: (code) => {
                responseStatus = code;
                return res;
            },
        };

        console.log('🚀 Calling confirmOrder...\n');
        await orderManagementController.confirmOrder(req, res);

        console.log('\n📊 Response Status:', responseStatus);

        // Verify order was updated
        const updatedOrder = await Order.findById('693579d3b1f8523dd8eb78fc');
        console.log('\n📦 Updated Order:', {
            _id: updatedOrder._id,
            status: updatedOrder.status,
            warehouseId: updatedOrder.warehouseId,
            warehouseName: updatedOrder.warehouseName,
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

testConfirmOrder();
