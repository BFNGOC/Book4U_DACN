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
const orderSellerRoutes = require('./orderSellerRoutes');

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
    app.use('/api/seller-orders', orderSellerRoutes);
}

module.exports = route;
