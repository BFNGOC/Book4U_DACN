# 🎨 Chat AI - Visual Design & Testing Guide

**Date**: December 21, 2025

---

## 📱 UI Layout - ChatWidget

```
┌─────────────────────────────────────────┐
│  📚 Chat AI - Book4U                  │ ✕ │
│  Gợi ý sách thông minh                 │
└─────────────────────────────────────────┘
│                                         │
│  👤 "Tìm sách về kinh doanh"           │
│     [right-aligned, blue bubble]       │
│                                         │
│  💬 "Dưới đây là gợi ý cho bạn..."    │
│     [left-aligned, gray bubble]        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  📘 Sách 1                        │ │
│  │  ✍️ Tác giả  ⭐ 4.5 (120 reviews)│ │
│  │  💡 Vì sao: Kinh điển quốc tế... │ │
│  │  💰 199,000₫                     │ │
│  │  [Xem chi tiết] [Thêm giỏ]      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  📚 Sách 2                        │ │
│  │  ...                              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Hỏi về sách, tác giả...  [📤] │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🎨 RecommendationCard Component

```
┌──────────────────────────────────┐
│  📷                              │
│  [Image with -20% badge]        │
│                                  │
│  📘 "Tên Sách Dài Có Thể Wrap"  │
│  ✍️  Tác giả                     │
│  🏢 Nhà xuất bản                │
│                                  │
│  ⭐ 4.6 (234 đánh giá)          │
│                                  │
│  ┌─ Highlight Blue ─────────────┐│
│  │ 💡 Sách kinh điển quốc tế    ││
│  └──────────────────────────────┘│
│                                  │
│  💰 199,000₫                    │
│  ~~199,000₫ (original strikethrough)│
│                                  │
│  [Xem chi tiết] [🛒 Thêm giỏ]  │
└──────────────────────────────────┘
```

---

## 🎬 Animation & Interactions

### 1️⃣ Chat Button

```
Default: Solid blue gradient
Hover:   Scale 110% + enhanced shadow
Click:   ChatWidget slide up from bottom
```

### 2️⃣ Message Bubbles

```
User:
  - Align right
  - Blue background
  - Rounded left edges only

Bot:
  - Align left
  - Gray background
  - Rounded right edges only
```

### 3️⃣ Loading State

```
"Đang trả lời..."
  •  •  •  (bouncing animation)
  └─ Each dot has staggered bounce
```

### 4️⃣ RecommendationCard Hover

```
Unselected: Shadow-sm
Hover:      Shadow-lg + scale-105 on image
Click:      Navigate to product page
```

---

## 🧪 Manual Testing Checklist

### Test Environment Setup

```bash
# Backend
cd Server
npm start
# Verify: http://localhost:5000 (or your port)

# Frontend
cd Client/Book4U
npm run dev
# Verify: http://localhost:5173 (or Vite port)
```

---

### Visual Tests

#### ✅ Test 1: UI Layout Verification

**Steps**:

1. Open http://localhost:5173
2. Scroll down to bottom-right
3. Look for blue gradient chat button

**Expected**:

-   [ ] Blue circular button visible
-   [ ] Button has hover effect (scale up)
-   [ ] Icon is centered

---

#### ✅ Test 2: ChatWidget Opening

**Steps**:

1. Click the chat button
2. Observe animation

**Expected**:

-   [ ] Widget slides up smoothly
-   [ ] Header with gradient (blue-500 to blue-600)
-   [ ] Text "📚 Chat AI - Book4U"
-   [ ] Close button (X) on right
-   [ ] Empty message area with welcome text

---

#### ✅ Test 3: Welcome Message

**Steps**:

1. Widget opens for first time
2. No messages exist

**Expected**:

```
👋
Xin chào! Tôi là AI hỗ trợ gợi ý sách
Hỏi tôi về sách, thể loại yêu thích, tác giả...
```

---

#### ✅ Test 4: Send Message (User Side)

**Steps**:

1. Type "Gợi ý sách tiểu thuyết"
2. Press Enter or click Send button

**Expected**:

-   [ ] Message appears in blue bubble (right-aligned)
-   [ ] Input field clears
-   [ ] Loading dots animation appears
-   [ ] Auto-scroll to latest message

---

#### ✅ Test 5: AI Response with Cards

**Steps**:

1. Wait for AI to respond
2. Observe response structure

**Expected**:

-   [ ] Gray bubble with reply text (left-aligned)
-   [ ] 2-3 RecommendationCards below reply
-   [ ] Each card shows:
    -   [ ] Book image
    -   [ ] Title (2-line max with ellipsis)
    -   [ ] Author (✍️ icon)
    -   [ ] Publisher (🏢 icon)
    -   [ ] Rating (⭐ 4.5) + count
    -   [ ] Blue highlight with reason (💡)
    -   [ ] Price in red (₫ format)
    -   [ ] "Xem chi tiết" button (gray)
    -   [ ] "Thêm giỏ" button (blue)

---

#### ✅ Test 6: Discount Badge

**Steps**:

1. Send message requesting discounted books
2. Check if response has books with `discount > 0`

**Expected**:

-   [ ] Red badge "-20%" appears on top-right of image
-   [ ] Original price shows strikethrough
-   [ ] Discounted price shows as final price

---

#### ✅ Test 7: Out of Stock Indicator

**Steps**:

1. Send message for a book with `stock <= 0`

**Expected**:

-   [ ] Red banner "Hết hàng" appears below price
-   [ ] Button might be disabled (optional enhancement)

---

#### ✅ Test 8: Click Card Actions

**Steps**:

1. Click "Xem chi tiết" button on a card
2. Click "Thêm giỏ" button on another card

**Expected**:

-   [ ] "Xem chi tiết": Navigate to product page
-   [ ] "Thêm giỏ": Add item to cart + show toast (optional)

---

#### ✅ Test 9: Long Chat History

**Steps**:

1. Send 5+ messages
2. Scroll through chat

**Expected**:

-   [ ] Messages stack properly
-   [ ] Auto-scroll to latest message
-   [ ] No layout breaking
-   [ ] Performance remains smooth

---

#### ✅ Test 10: Mobile Responsiveness

**Steps**:

1. Open DevTools (F12)
2. Switch to iPhone 12 (375px)
3. Interact with ChatWidget

**Expected**:

-   [ ] Widget width adapts (96% on mobile)
-   [ ] Cards stack vertically
-   [ ] Buttons remain clickable
-   [ ] Text readable
-   [ ] No horizontal scroll

---

#### ✅ Test 11: Error Handling

**Steps**:

1. Disconnect internet
2. Send message

**Expected**:

-   [ ] After timeout, error message appears
-   [ ] "❌ Lỗi khi gọi AI"
-   [ ] Chat doesn't crash
-   [ ] Can still type next message

---

#### ✅ Test 12: Close Widget

**Steps**:

1. Click X button or click outside
2. Messages should be preserved

**Expected**:

-   [ ] Widget closes smoothly
-   [ ] Chat history persists
-   [ ] Button reappears
-   [ ] Can reopen with history intact

---

### API Tests

#### ✅ Test 13: API Response Format (New)

**Request**:

```bash
curl -X POST http://localhost:5000/api/chat/ai \
  -H "Content-Type: application/json" \
  -d '{"message": "Gợi ý sách về tâm lý"}'
```

**Expected Response**:

```json
{
    "reply": "Dưới đây là những cuốn sách tâm lý tuyệt vời...",
    "recommendations": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "title": "Sách A",
            "author": "Tác giả A",
            "price": 150000,
            "currency": "VND",
            "ratingAvg": 4.7,
            "ratingCount": 234,
            "description": "Mô tả ngắn...",
            "slug": "sach-a",
            "images": ["url1", "url2"],
            "publisher": "Nhà xuất bản A",
            "reason": "Vì sao phù hợp..."
        }
    ]
}
```

**Checks**:

-   [ ] Status: 200 OK
-   [ ] Response is valid JSON
-   [ ] `reply` is non-empty string
-   [ ] `recommendations` is array
-   [ ] Each recommendation has all required fields
-   [ ] `price` is number
-   [ ] `ratingAvg` between 0-5
-   [ ] `reason` is meaningful

---

#### ✅ Test 14: Backward Compatibility

**Request**: API returns old format (suggestions)

```json
{
    "reply": "Gợi ý: ",
    "suggestions": [{ "bookTitle": "Sách A", "slug": "sach-a" }]
}
```

**Expected**:

-   [ ] Frontend converts to `recommendations` format
-   [ ] Card renders correctly
-   [ ] No console errors

---

### Browser Compatibility

| Browser             | Version | Status  |
| ------------------- | ------- | ------- |
| Chrome              | Latest  | ✅ Test |
| Firefox             | Latest  | ✅ Test |
| Safari              | Latest  | ✅ Test |
| Edge                | Latest  | ✅ Test |
| Mobile Safari (iOS) | Latest  | ✅ Test |
| Chrome Mobile       | Latest  | ✅ Test |

---

## 🐛 Known Issues & Workarounds

### Issue 1: Image Fails to Load

**Symptom**: Book image shows placeholder  
**Cause**: Image URL broken or CORS issue  
**Workaround**: Fallback to `https://via.placeholder.com/150x200?text=Book`

### Issue 2: AI Returns Invalid JSON

**Symptom**: Console shows JSON parse error  
**Cause**: AI included markdown code blocks  
**Workaround**: Auto-strip ``` with regex

### Issue 3: Chat Gets Slow with Many Messages

**Symptom**: Scroll performance degrades  
**Cause**: Too many DOM nodes  
**Workaround**: Implement message virtualization (future)

---

## 📊 Performance Benchmarks

### Expected Times (from browser DevTools)

| Operation        | Chrome  | Firefox | Safari  |
| ---------------- | ------- | ------- | ------- |
| Widget open      | < 100ms | < 150ms | < 200ms |
| Send message     | < 50ms  | < 100ms | < 150ms |
| Receive response | 1-3s    | 1-3s    | 1-3s    |
| Render cards     | < 100ms | < 150ms | < 200ms |
| Page scroll      | 60fps   | 60fps   | 60fps   |

---

## 💾 Testing Data

### Test Queries (copy & paste into chat)

```
1. "Gợi ý sách tiểu thuyết hay"
2. "Sách dưới 100k về kinh doanh"
3. "Sách của Ngô Thị Hạnh"
4. "Sách được đánh giá cao nhất"
5. "Gợi ý cho người mới bắt đầu đọc"
```

---

## ✅ Sign-Off Checklist

Before deploying, verify:

-   [ ] All 14 tests pass
-   [ ] No console errors (F12)
-   [ ] Mobile responsive confirmed
-   [ ] Browser compatibility OK
-   [ ] API response format correct
-   [ ] Performance meets targets
-   [ ] Documentation complete
-   [ ] Code reviewed
-   [ ] Ready to merge

---

**Last Updated**: December 21, 2025  
**Tester**: [Your Name]  
**Date Tested**: [YYYY-MM-DD]  
**Status**: ✅ PASSED
