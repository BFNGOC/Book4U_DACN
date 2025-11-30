const express = require('express');
const router = express.Router();
const axios = require('axios');

const PROVINCE_API =
    process.env.VITE_PROVINCES_API || 'https://provinces.open-api.vn/api/v1';

/**
 * GET /api/province/all
 * Lấy tất cả tỉnh/thành phố
 */
router.get('/all', async (req, res) => {
    try {
        const { depth = 3 } = req.query;
        const response = await axios.get(`${PROVINCE_API}/`, {
            params: { depth },
        });

        res.json({
            success: true,
            data: response.data || [],
        });
    } catch (error) {
        console.error('❌ Lỗi lấy tỉnh/thành:', error.message);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách tỉnh/thành',
            error: error.message,
        });
    }
});

/**
 * GET /api/province/districts/:provinceCode
 * Lấy quận/huyện theo mã tỉnh
 */
router.get('/districts/:provinceCode', async (req, res) => {
    try {
        const { provinceCode } = req.params;
        const { depth = 2 } = req.query;

        const response = await axios.get(`${PROVINCE_API}/p/${provinceCode}`, {
            params: { depth },
        });

        res.json({
            success: true,
            data: response.data || {},
        });
    } catch (error) {
        console.error('❌ Lỗi lấy quận/huyện:', error.message);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách quận/huyện',
            error: error.message,
        });
    }
});

/**
 * GET /api/province/wards/:districtCode
 * Lấy phường/xã theo mã quận/huyện
 */
router.get('/wards/:districtCode', async (req, res) => {
    try {
        const { districtCode } = req.params;
        const { depth = 2 } = req.query;

        const response = await axios.get(`${PROVINCE_API}/d/${districtCode}`, {
            params: { depth },
        });

        res.json({
            success: true,
            data: response.data || {},
        });
    } catch (error) {
        console.error('❌ Lỗi lấy phường/xã:', error.message);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách phường/xã',
            error: error.message,
        });
    }
});

module.exports = router;
