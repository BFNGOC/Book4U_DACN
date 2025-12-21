const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const bookRoutes = require('./bookRoutes');
const roleRequestRoutes = require('./roleRequestRoutes');
const searchRoutes = require('./searchRoutes');
const uploadRoutes = require('./uploadRoutes');
const phoneVerificationRoutes = require('./phoneVerificationRoutes');
const recommendRoutes = require('./recommendRoutes');
const cartRoutes = require('./cartRoutes');
const sellerRoutes = require('./sellerRoutes');
const notificationRoutes = require('./notificationRoutes');
const orderSellerRoutes = require('./orderSellerRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const orderManagementRoutes = require('./orderManagementRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const multiStageDeliveryRoutes = require('./multiStageDeliveryRoutes');
const shipperCoverageRoutes = require('./shipperCoverageRoutes');
const paymentRoutes = require('./paymentRoutes');
const aiRoutes = require('./aiRoutes');
const provinceRoutes = require('./provinceRoutes');
const reviewRoutes = require('./reviewRoutes');

function route(app) {
    app.get('/', (req, res) => {
        res.send('Welcome to Social Network API!');
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/books', bookRoutes);
    app.use('/api/role-requests', roleRequestRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/uploads', uploadRoutes);
    app.use('/api/phone', phoneVerificationRoutes);
    app.use('/api/recommend', recommendRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/sellers', sellerRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/seller-orders', orderSellerRoutes);
    app.use('/api/warehouse', warehouseRoutes);
    app.use('/api/orders', orderManagementRoutes);
    app.use('/api/delivery', deliveryRoutes);
    app.use('/api/multi-delivery', multiStageDeliveryRoutes);
    app.use('/api/shipper-coverage', shipperCoverageRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/province', provinceRoutes);
    app.use('/api/reviews', reviewRoutes);
}

module.exports = route;
