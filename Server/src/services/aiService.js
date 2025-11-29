const OpenAI = require('openai');

class AIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY, // đổi từ DEEPSEEK_API_KEY
            baseURL: 'https://openrouter.ai/api/v1', // OpenRouter baseURL
        });
    }

    async sendMessage(userMessage, contextData) {
        try {
            const context = `
You are the assistant of Book4U bookstore.
Database info:
${JSON.stringify(contextData)}

Answer ONLY using this info.
If the answer is not in the data, say you don't know.
      `;

            const completion = await this.client.chat.completions.create({
                model: 'deepseek/deepseek-chat', // model OpenRouter
                messages: [
                    { role: 'system', content: context },
                    { role: 'user', content: userMessage },
                ],
            });

            return completion.choices[0].message?.content || '';
        } catch (err) {
            console.error('OpenRouter API Error:', err);
            throw new Error('Không thể kết nối AI');
        }
    }
}

module.exports = new AIService();
