# Hướng dẫn Chức năng Gửi File/Ảnh trong Chat

## Tổng Quan

Chức năng cho phép người dùng gửi file và ảnh trong chat giữa khách hàng và người bán hàng. Files được upload lên server Node.js, chỉ URL được lưu trong Firebase.

## Cấu Trúc Kiến Trúc

### Backend (Node.js)

-   **Upload Route**: `/api/uploads/chat-files` (POST)
-   **Upload Location**: `/uploads/chat-files/`
-   **Middleware**: Xác thực token + multer upload

### Frontend (React)

-   **Components**: ChatWindow.jsx
-   **API**: chatApi.js
-   **Services**: uploadChatFile(), sendFile()

### Database (Firebase)

-   **Structure**: `chats/{conversationId}/messages/{messageId}`
-   **File Fields**:
    -   `isFile`: true
    -   `fileUrl`: URL file trên server
    -   `fileType`: 'image' | 'file'
    -   `fileName`: tên file gốc
    -   `fileSize`: kích thước bytes
    -   `mimeType`: MIME type

## Cài Đặt

### 1. Backend Setup

File đã được cập nhật:

-   `src/routes/uploadRoutes.js` - thêm endpoint `/chat-files`
-   Tự động tạo thư mục `/uploads/chat-files/` khi cần

### 2. Frontend Setup

-   `.env` - thêm `VITE_API_BASE_URL`
-   `src/services/api/chatApi.js` - thêm `sendFile()` và `uploadChatFile()`
-   `src/components/chat/ChatWindow.jsx` - thêm UI upload files

### 3. Khởi tạo Thư mục (tùy chọn)

Thư mục sẽ tự động được tạo khi file đầu tiên được upload.

Nếu muốn tạo trước:

```bash
mkdir -p /uploads/chat-files
```

## Sử Dụng

### Gửi File/Ảnh

1. Mở chat với người bán
2. Click nút 📎 (Upload) ở dưới input
3. Chọn file (hỗ trợ ảnh, PDF, Word, Excel, txt, zip)
4. Preview hiển thị
5. Click "Gửi file" để gửi

### Hạn Chế File

-   **Kích thước tối đa**: 50MB
-   **Loại file hỗ trợ**:
    -   Ảnh: jpg, jpeg, png, gif, webp, etc.
    -   Documents: pdf, doc, docx, xls, xlsx, txt, zip

### Xem File/Ảnh

-   **Ảnh**: Hiển thị trực tiếp inline
-   **File khác**: Link tải xuống với thông tin kích thước

## Flow Gửi File

```
User chọn file
    ↓
[File Preview hiển thị]
    ↓
Click "Gửi file"
    ↓
uploadChatFile() - POST /api/uploads/chat-files
    ↓
Server xử lý & lưu file
    ↓
Trả về: {fileUrl, fileType, fileName, fileSize, mimeType}
    ↓
sendFile() - Lưu metadata vào Firebase
    ↓
Message hiển thị trong chat
```

## API Endpoints

### POST `/api/uploads/chat-files`

Upload file cho chat

**Headers**:

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body**:

```
file: File object
```

**Response**:

```json
{
    "success": true,
    "fileUrl": "/uploads/chat-files/1639876543-123456789.jpg",
    "fileType": "image",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf"
}
```

## Code Examples

### Gửi tin nhắn

```javascript
import { sendMessage } from '../../services/api/chatApi';

const result = await sendMessage(conversationId, currentUser._id, 'Hello!', {
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
});
```

### Gửi file

```javascript
import { sendFile, uploadChatFile } from '../../services/api/chatApi';

// 1. Upload file
const uploadResult = await uploadChatFile(file);

// 2. Gửi metadata vào Firebase
const result = await sendFile(conversationId, currentUser._id, uploadResult, senderInfo);
```

## Firebase Message Structure

### Text Message

```json
{
    "id": "key123",
    "senderId": "user123",
    "senderName": "John Doe",
    "senderAvatar": "url",
    "senderRole": "customer",
    "text": "Hello",
    "timestamp": 1639876543000,
    "read": false
}
```

### File Message

```json
{
    "id": "key456",
    "senderId": "user123",
    "senderName": "John Doe",
    "senderAvatar": "url",
    "senderRole": "customer",
    "fileUrl": "/uploads/chat-files/1639876543-123.jpg",
    "fileType": "image",
    "fileName": "photo.jpg",
    "fileSize": 512000,
    "mimeType": "image/jpeg",
    "timestamp": 1639876543000,
    "read": false,
    "isFile": true
}
```

## Rendering Messages

### Text Message

```jsx
<p className="text-sm break-words">{message.text}</p>
```

### Image Message

```jsx
<img
    src={`${API_BASE_URL}${message.fileUrl}`}
    alt={message.fileName}
    className="max-w-full h-auto rounded"
/>
```

### File Message

```jsx
<a
    href={`${API_BASE_URL}${message.fileUrl}`}
    download={message.fileName}
    className="flex items-center gap-2 p-2 rounded border"
>
    <Upload className="w-4 h-4" />
    <div>
        <p className="font-semibold">{message.fileName}</p>
        <p>{(message.fileSize / 1024).toFixed(2)} KB</p>
    </div>
</a>
```

## Troubleshooting

### Upload thất bại

1. Kiểm tra token hợp lệ
2. Kiểm tra kích thước file < 50MB
3. Kiểm tra VITE_API_BASE_URL trong .env
4. Xem console.log trong browser

### File không hiển thị

1. Kiểm tra fileUrl có đúng không
2. Kiểm tra file có tồn tại trên server
3. Kiểm tra thư mục `/uploads/chat-files/` có tồn tại không

### CORS Error

Đảm bảo server đã enable CORS cho upload routes

## Bảo Mật

### File Upload

-   ✅ Xác thực token (authMiddleware)
-   ✅ Giới hạn kích thước (50MB)
-   ✅ Kiểm tra MIME type
-   ✅ Rename file tránh xung đột

### Firebase

-   ✅ Chỉ lưu URL (không lưu file content)
-   ✅ Validate data structure
-   ✅ Timestamp tracking

## Phát Triển Tiếp Theo

### Các tính năng có thể thêm

1. Virus scan trước lưu file
2. Giới hạn bandwidth per user
3. Xóa file sau X ngày
4. Tạo thumbnail cho ảnh
5. Preview file trực tiếp (PDF, Office)
6. Video streaming
7. Voice messages
8. Emoji reactions

## Performance

-   **Upload async** - Không block UI
-   **File preview** - Instant preview trước gửi
-   **Compression** - Có thể thêm image compression
-   **CDN** - Có thể serve files từ CDN
-   **Cache** - Browser cache images

## Monitoring

Thêm logging để track:

```javascript
console.log('Upload started:', fileName);
console.log('Upload progress:', progress);
console.log('Upload completed:', fileUrl);
```

## Liên Hệ & Support

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng check:

1. Console errors
2. Network tab trong DevTools
3. Server logs: `pm2 logs`
