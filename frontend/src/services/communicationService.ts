import axios from 'axios';
import { Channel, Message, User } from '../components/communication/shared/types';

// Use the API Gateway URL or direct service URL for dev if needed
// Typically in this project, it seems to be localhost:8080 or based on environment
const API_URL = 'http://localhost:8005/api/v1'; // Direct to service for now, or via Gateway 8080/api/v1? 
// Gateway maps /api/v1/channels -> communication-service
// So we should use Gateway URL: http://localhost:8080/api/v1

const GATEWAY_URL = 'http://localhost:8005/api/v1';

const api = axios.create({
    baseURL: GATEWAY_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for auth token (if stored in localStorage/cookies)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const communicationService = {
    getChannels: async (): Promise<Channel[]> => {
        const response = await api.get('/channels');
        return response.data;
    },

    createChannel: async (name: string, type: 'public' | 'private' | 'direct', members: string[]): Promise<Channel> => {
        const response = await api.post('/channels', { name, type, members });
        return response.data;
    },

    getMessages: async (channelId: string): Promise<Message[]> => {
        const response = await api.get(`/channels/${channelId}/messages`);
        return response.data;
    },

    sendMessage: async (channelId: string, content: string, senderId: string): Promise<Message> => {
        const response = await api.post(`/channels/${channelId}/messages`, { content, senderId });
        return response.data;
    },
};
