const multer = require('multer');
const path = require('path');
const fs = require('fs');

function getUploadPath(type) {
    const baseDir = path.join(__dirname, '../../uploads');
    const subDir = path.join(baseDir, type);

    if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
    }

    return subDir;
}

function createUploader(type) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, getUploadPath(type));
        },
        filename: (req, file, cb) => {
            const uniqueName =
                Date.now() +
                '-' +
                Math.round(Math.random() * 1e9) +
                path.extname(file.originalname);
            cb(null, uniqueName);
        },
    });

    return multer({ storage });
}

module.exports = { createUploader };
