const express = require('express');
const router = express.Router();

const { suggestBooks, getSearchResults } = require('../controllers/searchController');

router.get('/suggest', suggestBooks); // gợi ý nhanh
router.get('/', getSearchResults); // trang kết quả chính

module.exports = router;
