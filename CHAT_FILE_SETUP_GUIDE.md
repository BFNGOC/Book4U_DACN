# 🚀 Hướng Dẫn Cấu Hình & Chạy Chức Năng Gửi File/Ảnh trong Chat

## ✅ Điều Kiện Tiên Quyết

-   Node.js 14+
-   npm hoặc yarn
-   Server chạy tại `http://localhost:5000`
-   Firebase DB đã setup

## 📋 Danh Sách Kiểm Tra Trước Khi Chạy

Run this command:

```bash
node test-chat-file-setup.js
```

Kết quả phải là: **8/8 checks passed** ✅

---

## 🔧 Step-by-Step Setup

### Step 1: Cài Dependencies

#### Server

```bash
cd Server

# Install multer (nếu chưa có)
npm install multer

# Hoặc update package.json
npm install
```

**Verify**:

```bash
npm list multer
```

#### Client

```bash
cd Client/Book4U

# Install dependencies
npm install
```

---

### Step 2: Cấu Hình Environment

#### Server `.env` (nếu chưa có)

```bash
cd Server
cat .env | grep -i port  # Xem port chạy
```

Mặc định: `PORT=5000`

#### Client `.env` (đã cập nhật)

```bash
cd Client/Book4U
cat .env | grep VITE_API
```

Phải có:

```
VITE_API_URL = http://localhost:5000
VITE_API_BASE_URL = http://localhost:5000
```

---

### Step 3: Tạo Thư Mục Upload (tùy chọn)

Server sẽ tự tạo nếu không có, nhưng có thể tạo trước:

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "Server/uploads/chat-files"

# macOS/Linux
mkdir -p Server/uploads/chat-files
```

---

### Step 4: Khởi Động Services

#### Terminal 1: Server

```bash
cd Server
npm start
```

Output phải chứa:

```
Server running on port 5000
✅ Connected to MongoDB
✅ Firebase initialized
```

#### Terminal 2: Client

```bash
cd Client/Book4U
npm run dev
```

Output phải chứa:

```
VITE v... dev server running at:

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🧪 Test Manual

### Test 1: Upload Ảnh

1. Mở browser: `http://localhost:5173`
2. Đăng nhập (nếu chưa)
3. Đi đến Chat
4. Chọn/tạo conversation
5. Click nút 📎 (Upload)
6. Chọn ảnh từ máy tính
7. Preview phải hiển thị
8. Click "Gửi file"
9. Ảnh phải hiển thị trong chat

**Expected**:

-   ✅ Preview hiển thị
-   ✅ File size hiện
-   ✅ Upload progress
-   ✅ Message gửi thành công
-   ✅ Ảnh hiển thị inline

### Test 2: Upload File

1. Click 📎 (Upload)
2. Chọn file PDF/Word
3. Preview phải hiển thị
4. Click "Gửi file"
5. File link phải hiển thị

**Expected**:

-   ✅ File name & size hiển thị
-   ✅ Download link khả dụng
-   ✅ Có thể tải file xuống

### Test 3: Error Handling

1. **File quá lớn**

    - Chọn file > 50MB
    - Phải có error: "File quá lớn"

2. **Không có token**

    - Xóa token từ localStorage
    - Try upload
    - Phải có error về authentication

3. **Server down**
    - Stop server
    - Try upload
    - Phải có error về connection

---

## 🐛 Troubleshooting

### Problem: "Cannot find module 'multer'"

**Solution**:

```bash
cd Server
npm install multer
```

### Problem: "VITE_API_BASE_URL is undefined"

**Solution**:
Check `.env` file:

```bash
cat Client/Book4U/.env | grep VITE_API_BASE_URL
```

Should output:

```
VITE_API_BASE_URL = http://localhost:5000
```

If not there, add it manually.

### Problem: Upload 404 Not Found

**Check**:

1. Server running tại port 5000?
2. Route `/api/uploads/chat-files` exists?
3. Token hợp lệ?

**Verify Route**:

```bash
# Terminal 1 (Server running)
# Mở DevTools → Network
# Click Upload
# Kiểm tra request URL
# Phải là: POST http://localhost:5000/api/uploads/chat-files
```

### Problem: "isFile is not defined"

**Solution**:
Check ChatWindow.jsx line 152:

```javascript
const isFile = message.isFile; // ← Must have this
```

### Problem: CORS Error

**Solution** in Server `src/index.js`:

```javascript
const cors = require('cors');
app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
```

---

## 📊 Monitoring

### Check Server Logs

```bash
# macOS/Linux
tail -f Server/logs.txt

# Or use pm2 if running with pm2
pm2 logs
```

Look for:

```
POST /api/uploads/chat-files 200 OK
File saved: /uploads/chat-files/[filename]
```

### Check Browser Console

```javascript
// DevTools F12 → Console
// Should see:
console.log('Upload started:', fileName);
console.log('Upload completed:', fileUrl);
```

### Check Network Tab

```
POST /api/uploads/chat-files
Status: 200 OK
Response: {
  success: true,
  fileUrl: "/uploads/chat-files/...",
  ...
}
```

---

## 🎯 Acceptance Criteria

✅ **File Upload**

-   [x] User can select file via button
-   [x] Preview shows before send
-   [x] File uploaded to server
-   [x] URL saved to Firebase

✅ **File Display**

-   [x] Images display inline
-   [x] Files show as downloadable link
-   [x] File metadata (name, size) shown

✅ **Error Handling**

-   [x] File size > 50MB → error
-   [x] No token → error
-   [x] Server down → error gracefully

✅ **Performance**

-   [x] Upload doesn't block chat UI
-   [x] Preview instant
-   [x] Message history loads quickly

---

## 🚀 Performance Tips

### Optimize Client Upload

```javascript
// Compress image before upload
async function compressImage(file) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // ... compression logic
    return canvas.toBlob();
}
```

### Optimize Server Storage

```bash
# Implement automatic cleanup
# Delete files older than 90 days
cron 0 0 * * * "find /uploads/chat-files -mtime +90 -delete"
```

### Use CDN for Files

```javascript
// Replace fileUrl with CDN URL
const CDN_URL = 'https://cdn.example.com';
const fullUrl = fileUrl.replace('/uploads', CDN_URL);
```

---

## 📈 Future Enhancements

### Phase 2

-   [ ] Virus scan (ClamAV)
-   [ ] Image compression
-   [ ] Thumbnail generation
-   [ ] File type restrictions per role

### Phase 3

-   [ ] Video streaming
-   [ ] Voice messages
-   [ ] Video messages
-   [ ] Real-time upload progress

### Phase 4

-   [ ] End-to-end encryption
-   [ ] File versioning
-   [ ] Collaboration features
-   [ ] Archive management

---

## 📞 Quick Support

| Issue               | Quick Fix                               |
| ------------------- | --------------------------------------- |
| Module not found    | `npm install`                           |
| Port 5000 in use    | `lsof -i :5000` then `kill -9 <PID>`    |
| Files not uploading | Check DevTools Network tab              |
| Images not showing  | Check `VITE_API_BASE_URL`               |
| 404 on upload       | Check route exists in `uploadRoutes.js` |

---

## ✨ Success Indicators

After setup, you should see:

**Server Terminal**:

```
✅ Server running on port 5000
✅ Multer middleware ready
✅ Upload endpoint: POST /api/uploads/chat-files
```

**Client Terminal**:

```
✅ Client running on port 5173
✅ Environment variables loaded
✅ API base URL: http://localhost:5000
```

**Browser**:

```
✅ Upload button visible
✅ File selection works
✅ Preview shows
✅ Send file button ready
✅ Files display in chat
```

---

## 🎓 Learning Resources

-   [Multer Documentation](https://github.com/expressjs/multer)
-   [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
-   [Firebase Real-time DB](https://firebase.google.com/docs/database)
-   [React File Upload](https://reactjs.org/docs/forms.html#handling-multiple-inputs)

---

**Happy Uploading!** 🎉

For more details, see: [CHAT_FILE_SHARING_GUIDE.md](./CHAT_FILE_SHARING_GUIDE.md)
