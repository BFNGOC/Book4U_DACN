const express = require('express');
const router = express.Router();
const { createUploader } = require('../middlewares/uploadMiddleware');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post(
    '/store-logo',
    authMiddleware,
    createUploader('store-logo').single('image'),
    (req, res) => {
        res.status(200).json({
            success: true,
            path: `/uploads/store-logo/${req.file.filename}`,
        });
    }
);

router.post(
    '/identification',
    authMiddleware,
    createUploader('identification').array('images', 2),
    (req, res) => {
        const paths = req.files.map((f) => `/uploads/identification/${f.filename}`);
        res.status(200).json({ success: true, paths });
    }
);

router.post(
    '/business-license',
    authMiddleware,
    createUploader('business-license').array('images', 2),
    (req, res) => {
        const paths = req.files.map((f) => `/uploads/business-license/${f.filename}`);
        res.status(200).json({ success: true, paths });
    }
);

router.post(
    '/driver-license',
    authMiddleware,
    createUploader('driver-license').array('images', 2),
    (req, res) => {
        const paths = req.files.map((f) => `/uploads/driver-license/${f.filename}`);
        res.status(200).json({ success: true, paths });
    }
);

router.post(
    '/chat-files',
    authMiddleware,
    createUploader('chat-files').single('file'),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Không có file được upload',
                });
            }

            const fileUrl = `/uploads/chat-files/${req.file.filename}`;
            const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
            const fileName = req.file.originalname;
            const fileSize = req.file.size;

            res.status(200).json({
                success: true,
                fileUrl,
                fileType,
                fileName,
                fileSize,
                mimeType: req.file.mimetype,
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
);

router.post('/portrait', authMiddleware, createUploader('portrait').single('image'), (req, res) => {
    res.status(200).json({
        success: true,
        path: `/uploads/portrait/${req.file.filename}`,
    });
});

module.exports = router;
