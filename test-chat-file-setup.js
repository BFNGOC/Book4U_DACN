#!/usr/bin/env node

/**
 * Test File Upload Setup
 * Xác minh rằng tất cả các components hoạt động chính xác
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra Setup Chức năng Gửi File/Ảnh trong Chat\n');

const checks = [];

// 1. Kiểm tra backend route
const uploadRoutesPath = path.join(__dirname, 'Server/src/routes/uploadRoutes.js');
try {
    const content = fs.readFileSync(uploadRoutesPath, 'utf-8');
    const hasChatFilesRoute = content.includes('/chat-files');
    checks.push({
        name: 'Backend Route /chat-files',
        status: hasChatFilesRoute ? '✅' : '❌',
        path: uploadRoutesPath,
    });
} catch (e) {
    checks.push({
        name: 'Backend Route /chat-files',
        status: '⚠️',
        error: e.message,
    });
}

// 2. Kiểm tra frontend .env
const envPath = path.join(__dirname, 'Client/Book4U/.env');
try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const hasBaseUrl = content.includes('VITE_API_BASE_URL');
    checks.push({
        name: 'Frontend .env VITE_API_BASE_URL',
        status: hasBaseUrl ? '✅' : '❌',
        path: envPath,
    });
} catch (e) {
    checks.push({
        name: 'Frontend .env VITE_API_BASE_URL',
        status: '⚠️',
        error: e.message,
    });
}

// 3. Kiểm tra chatApi.js có functions mới
const chatApiPath = path.join(__dirname, 'Client/Book4U/src/services/api/chatApi.js');
try {
    const content = fs.readFileSync(chatApiPath, 'utf-8');
    const hasSendFile = content.includes('export const sendFile');
    const hasUploadChatFile = content.includes('export const uploadChatFile');
    checks.push({
        name: 'Frontend sendFile() function',
        status: hasSendFile ? '✅' : '❌',
        path: chatApiPath,
    });
    checks.push({
        name: 'Frontend uploadChatFile() function',
        status: hasUploadChatFile ? '✅' : '❌',
        path: chatApiPath,
    });
} catch (e) {
    checks.push({
        name: 'Frontend chat API functions',
        status: '⚠️',
        error: e.message,
    });
}

// 4. Kiểm tra ChatWindow.jsx updates
const chatWindowPath = path.join(__dirname, 'Client/Book4U/src/components/chat/ChatWindow.jsx');
try {
    const content = fs.readFileSync(chatWindowPath, 'utf-8');
    const hasFileUpload = content.includes('handleFileSelect');
    const hasFileSend = content.includes('handleSendFile');
    const hasPreview = content.includes('previewFile');
    checks.push({
        name: 'ChatWindow handleFileSelect()',
        status: hasFileUpload ? '✅' : '❌',
        path: chatWindowPath,
    });
    checks.push({
        name: 'ChatWindow handleSendFile()',
        status: hasFileSend ? '✅' : '❌',
        path: chatWindowPath,
    });
    checks.push({
        name: 'ChatWindow File Preview UI',
        status: hasPreview ? '✅' : '❌',
        path: chatWindowPath,
    });
} catch (e) {
    checks.push({
        name: 'ChatWindow updates',
        status: '⚠️',
        error: e.message,
    });
}

// 5. Kiểm tra upload folder
const uploadFolderPath = path.join(__dirname, 'Server/uploads');
try {
    if (fs.existsSync(uploadFolderPath)) {
        checks.push({
            name: 'Server /uploads folder',
            status: '✅',
            path: uploadFolderPath,
        });
    } else {
        checks.push({
            name: 'Server /uploads folder',
            status: '⚠️',
            note: 'Thư mục sẽ tự tạo khi upload file đầu tiên',
        });
    }
} catch (e) {
    checks.push({
        name: 'Server /uploads folder',
        status: '⚠️',
        error: e.message,
    });
}

// In kết quả
console.log('═'.repeat(60));
checks.forEach((check, idx) => {
    console.log(`${idx + 1}. ${check.name}`);
    console.log(`   Status: ${check.status}`);
    if (check.path) console.log(`   Path: ${check.path}`);
    if (check.error) console.log(`   Error: ${check.error}`);
    if (check.note) console.log(`   Note: ${check.note}`);
    console.log();
});
console.log('═'.repeat(60));

const passedCount = checks.filter((c) => c.status === '✅').length;
const totalCount = checks.length;

console.log(`\n📊 Kết quả: ${passedCount}/${totalCount} checks passed\n`);

if (passedCount === totalCount) {
    console.log('🎉 Setup hoàn tất! Sẵn sàng gửi file/ảnh trong chat.\n');
    console.log('📝 Bước tiếp theo:');
    console.log('   1. npm install (nếu chưa làm)');
    console.log('   2. Khởi động server: npm start');
    console.log('   3. Khởi động client: npm run dev');
    console.log('   4. Test gửi file trong chat\n');
} else {
    console.log('⚠️  Vui lòng kiểm tra các items có lỗi trước khi tiếp tục.\n');
}
