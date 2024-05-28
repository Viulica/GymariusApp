require('dotenv').config();

const config = {
    apiKey: process.env.API_KEY,
    apiUrl: 'https://api.openai.com/v1/chat/completions',
};

module.exports = config;
