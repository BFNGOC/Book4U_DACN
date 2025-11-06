const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/add', authMiddleware, cartController.addToCart);
router.get('/', authMiddleware, cartController.getUserCart);
router.put('/update/:bookId', authMiddleware, cartController.updateCartItemQuantity);
router.delete('/remove/:bookId', authMiddleware, cartController.removeFromCart);

module.exports = router;
