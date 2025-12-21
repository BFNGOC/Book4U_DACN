const OpenAI = require('openai');

class AIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: 'https://openrouter.ai/api/v1',
        });
    }

    async sendMessage(userMessage, contextData) {
        try {
            const { books = [], orders = [], user = {}, history = [] } = contextData;

            const chatLog = history
                .slice()
                .reverse()
                .map(
                    (h) =>
                        `User: ${h.userMessage}\nBot: ${h.aiResponse?.reply || h.aiResponse || ''}`
                )
                .join('\n');

            const context = `
Bạn là trợ lý AI chuyên về gợi ý sách của cửa hàng Book4U (Tiếng Việt).

📌 QUY TẮC QUAN TRỌNG:
- CHỈ TRẢN VỀ JSON THÔI, không kèm \`\`\` hay mô tả bổ sung.
- Output PHẢI là JSON hợp lệ.
- Không thêm text ngoài JSON.
- Luôn trả lời bằng Tiếng Việt.

📋 CẤU TRÚC JSON CHÍNH XÁC:

{
  "reply": "Lời chào hoặc phản hồi gợi ý của bạn (Tiếng Việt)",
  "recommendations": [
    {
      "_id": "MongoDB ID",
      "title": "Tên sách chính xác từ DB",
      "author": "Tác giả",
      "price": 199000,
      "currency": "VND",
      "ratingAvg": 4.5,
      "ratingCount": 120,
      "description": "Mô tả ngắn 1-2 câu",
      "slug": "slug-sach",
      "images": ["url-image-1"],
      "publisher": "Nhà xuất bản",
      "reason": "Vì sao phù hợp với yêu cầu người dùng"
    }
  ]
}

⚠️ NẾU KHÔNG CÓ SỐ LIỆU:
{
  "reply": "Xin lỗi, tôi không tìm thấy sách phù hợp",
  "recommendations": []
}

🔍 HƯỚNG DẪN GỢI Ý:
1. Đọc yêu cầu người dùng (thể loại, tác giả, giá, từ khóa, v.v.).
2. TÌM KIẾM trong danh sách sách theo tiêu chí phù hợp.
3. Chọn tối đa 5 sách TỐT NHẤT theo đúng yêu cầu.
4. SẮP XẾP: ưu tiên sách có rating cao + giá phù hợp.
5. KIỂM TRA: đảm bảo giá, tác giả, rating có thực từ DB.
6. GỢI Ý: viết lý do rõ ràng vì sao sách phù hợp.

📚 THÔNG TIN DATABASE:
Danh sách sách: ${JSON.stringify(books.slice(0, 50))}
Đơn hàng người dùng: ${JSON.stringify(orders.slice(0, 5))}
Thông tin người dùng: ${JSON.stringify(user)}

Lịch sử chat:
${chatLog}
`;

            const completion = await this.client.chat.completions.create({
                model: 'deepseek/deepseek-chat',
                messages: [
                    { role: 'system', content: context },
                    { role: 'user', content: userMessage },
                ],
            });

            const raw = completion.choices[0].message?.content || '';

            // --- AUTO REMOVE CODEBLOCK IF AI RETURNS ONE ---
            const cleaned = raw.replace(/```json|```/g, '').trim();

            let parsed;
            try {
                parsed = JSON.parse(cleaned);
            } catch (parseErr) {
                console.error('AI JSON parse error:', parseErr);
                parsed = {
                    reply: cleaned,
                    recommendations: [],
                };
            }

            // Support both old format (suggestions) and new format (recommendations)
            if (!parsed.recommendations && parsed.suggestions) {
                parsed.recommendations = parsed.suggestions.map((sug) => ({
                    title: sug.bookTitle,
                    slug: sug.slug,
                    author: 'Unknown',
                    price: 0,
                    ratingAvg: 0,
                    reason: 'Gợi ý từ hệ thống',
                }));
            }

            return parsed;
        } catch (err) {
            console.error('OpenRouter API Error:', err);
            throw new Error('Không thể kết nối AI');
        }
    }
}

module.exports = new AIService();
