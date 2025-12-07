const mongoose = require('mongoose');
const { SellerProfile } = require('./src/models/profileModel');
require('dotenv').config();

async function checkSeller() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find seller by ID
        const sellerId = '690cadd04f339957a3003e88';
        const seller = await SellerProfile.findById(sellerId);

        console.log('Seller:', {
            _id: seller?._id,
            userId: seller?.userId,
            storeName: seller?.storeName,
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkSeller();
