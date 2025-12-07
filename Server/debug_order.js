const mongoose = require('mongoose');
const { SellerProfile } = require('./src/models/profileModel');
const WarehouseStock = require('./src/models/warehouseStockModel');
const Order = require('./src/models/orderModel');
require('dotenv').config();

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const sellerId = '690cadd04f339957a3003e88';
        const bookId = '692c5001a45ffbe889f4f30c';
        const orderId = '693579d3b1f8523dd8eb78fc';

        // Check seller
        const seller = await SellerProfile.findById(sellerId);
        console.log('\n📦 Seller:', {
            _id: seller?._id,
            storeName: seller?.storeName,
            warehouseCount: seller?.warehouses?.length,
            warehouses: seller?.warehouses?.map((w) => ({
                _id: w._id,
                name: w.warehouseName,
                location: w.location,
            })),
        });

        // Check warehouse stocks
        const stocks = await WarehouseStock.find({ sellerId, bookId });
        console.log('\n📦 WarehouseStocks for seller & book:', stocks);

        // Check order
        const order = await Order.findById(orderId);
        console.log('\n📦 Order:', {
            _id: order?._id,
            status: order?.status,
            warehouseId: order?.warehouseId,
            items: order?.items?.map((i) => ({
                bookId: i.bookId,
                sellerId: i.sellerId,
                quantity: i.quantity,
            })),
            shippingAddress: order?.shippingAddress,
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

debugData();
