const express = require('express');
const router = express.Router();
const { getUserRecommendations } = require('../controllers/recommendController');
const { optionalVerifyToken } = require('../middlewares/optionalVerifyToken');

router.get('/user', optionalVerifyToken, getUserRecommendations);

module.exports = router;
