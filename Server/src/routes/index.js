const userRoutes = require('./userRoutes');

function route(app) {
    app.get('/', (req, res) => {
        res.send('Welcome to Social Network API!');
    });

    app.use('/api/user', userRoutes);
}

module.exports = route;
