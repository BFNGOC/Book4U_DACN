require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {
    try {
        // lấy danh sách model hiện có
        const response = await client.models();
        console.log('Danh sách model có sẵn:');
        response.models.forEach((model) => {
            console.log(
                `- ${model.name} | ${model.displayName} | SupportedMethods: ${model.supportedMethods}`
            );
        });
    } catch (error) {
        console.error('Lỗi khi lấy list model:', error);
    }
})();
