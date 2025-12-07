const mongoose = require('mongoose');
const Order = require('./src/models/orderModel');
const { SellerProfile } = require('./src/models/profileModel');
const WarehouseStock = require('./src/models/warehouseStockModel');
const {
    selectNearestWarehouse,
    getWarehouseStocksWithLocation,
} = require('./src/utils/warehouseSelection');
require('dotenv').config();

async function testWarehouseSelection() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const sellerId = mongoose.Types.ObjectId('690cadd04f339957a3003e88');
        const bookId = mongoose.Types.ObjectId('692c5001a45ffbe889f4f30c');

        // Get warehouse stocks with location
        console.log('📦 Getting warehouse stocks with location...');
        const warehouseStocks = await getWarehouseStocksWithLocation({
            WarehouseStock,
            SellerProfile,
            sellerId,
            bookId,
            session,
        });

        console.log('✅ Warehouse Stocks:', warehouseStocks);

        // Select nearest warehouse
        const customerLocation = {
            latitude: 10.75,
            longitude: 106.65,
            address: 'Quảng Tiến, Trảng Bom, Đồng Nai',
        };

        console.log('\n🎯 Selecting nearest warehouse...');
        const selection = selectNearestWarehouse({
            warehouseStocks,
            customerLocation,
            requiredQuantity: 3,
        });

        console.log('✅ Selection Result:', selection);

        await session.abortTransaction();
        process.exit(0);
    } catch (err) {
        await session.abortTransaction();
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

testWarehouseSelection();
