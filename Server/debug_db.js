// Check SellerProfile with seller ID from order
db.sellerprofiles.findOne({ _id: ObjectId('690cadd04f339957a3003e88') });

// Check WarehouseStock for this seller and book
db.warehousestocks.find({
    sellerId: ObjectId('690cadd04f339957a3003e88'),
    bookId: ObjectId('692c5001a45ffbe889f4f30c'),
});

// Check Order
db.orders.findOne({ _id: ObjectId('693579d3b1f8523dd8eb78fc') });
