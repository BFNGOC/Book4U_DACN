const mongoose = require('mongoose');
const { SellerProfile } = require('./src/models/profileModel');
require('dotenv').config();

async function checkWarehouseLocation() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        const seller = await SellerProfile.findById('690cadd04f339957a3003e88');

        seller.warehouses.forEach((w, i) => {
            console.log(`Warehouse ${i}:`, {
                _id: w._id,
                name: w.name,
                location: w.location,
            });
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkWarehouseLocation();
