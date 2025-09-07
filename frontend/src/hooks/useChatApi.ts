import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Chat API hook for sending messages
export const useSendMessage = () => {
  return useMutation({
    mutationFn: async (message: string) => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/chat`,
        { message },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onError: (error: any) => {
      console.error('Chat API Error:', error);
      throw error;
    },
  });
};

// Chat history hook (for future use)
export const useChatHistory = () => {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/chat/history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    enabled: false, // Disable auto-fetch for now
  });
};
