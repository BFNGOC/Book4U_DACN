const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const roleRequestRoutes = require('./roleRequestRoutes');

function route(app) {
    app.get('/', (req, res) => {
        res.send('Welcome to Social Network API!');
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/role-requests', roleRequestRoutes);
}

module.exports = route;
