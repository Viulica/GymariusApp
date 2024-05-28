import axios from 'axios';
import { measure } from 'react-native-reanimated';
import { API_KEY } from '@env';

const API_URL = 'https://api.openai.com/v1/chat/completions';

export const askChatbot = async (messages, data) => {
    const maxRetries = 3;
    let retryCount = 0;

    const send = [...messages, data];

    while (retryCount < maxRetries) {
        try {
            const response = await axios.post(
                API_URL,
                { model: "gpt-4-turbo", messages: send},
                {headers: { Authorization: `Bearer ${API_KEY}` }} 
            );
            return response.data.choices[0].message.content;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                retryCount++;
                console.log(error);
                const waitTime = Math.pow(2, retryCount) * 1000;
                console.log(`Waiting ${waitTime} ms to retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error('Error communicating with OpenAI:', error);
                throw error;
            }
        }
    }
    throw new Error('OpenAI request failed after retries.');
};
