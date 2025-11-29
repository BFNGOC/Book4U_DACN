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
            const context = `
You are the assistant of Book4U bookstore.

IMPORTANT RULES:
- YOU MUST RETURN RAW JSON ONLY.
- DO NOT wrap with \`\`\` or \`\`\`json.
- DO NOT add descriptions.
- DO NOT output anything outside JSON.
- The output must ALWAYS be valid JSON.

Correct format:

{
  "reply": "string",
  "suggestions": [
    { "bookTitle": "string", "slug": "string" }
  ]
}

If information is missing, return EXACTLY:

{
  "reply": "I don't know",
  "suggestions": []
}

Database info:
${JSON.stringify(contextData)}
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
                    suggestions: [],
                };
            }

            return parsed;
        } catch (err) {
            console.error('OpenRouter API Error:', err);
            throw new Error('Không thể kết nối AI');
        }
    }
}

module.exports = new AIService();
