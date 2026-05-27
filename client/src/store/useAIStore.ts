import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeminiModelId } from '@/lib/gemini';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: boolean;
  loading?: boolean;
}

interface AIState {
  messages: AIMessage[];
  model: GeminiModelId;
  setMessages: (messages: AIMessage[] | ((messages: AIMessage[]) => AIMessage[])) => void;
  clearMessages: () => void;
  setModel: (model: GeminiModelId) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      messages: [],
      model: 'gemini-2.5-flash',
      setMessages: (messages) =>
        set((state) => ({
          messages: typeof messages === 'function' ? messages(state.messages) : messages,
        })),
      clearMessages: () => set({ messages: [] }),
      setModel: (model) => set({ model }),
    }),
    {
      name: 'tradedesk-ai',
      partialize: (state) => ({
        model: state.model,
        messages: state.messages
          .filter((message) => !message.loading)
          .slice(-40),
      }),
    }
  )
);
