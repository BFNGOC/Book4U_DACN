const authRoutes = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');

function route(app) {
    app.get('/', (req, res) => {
        res.send('Welcome to Social Network API!');
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/products', productRoutes);
}

module.exports = route;
