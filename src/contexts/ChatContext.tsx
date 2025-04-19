'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Message } from '@/hooks/useChat';

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  isStreaming: boolean;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSendMessage: () => Promise<void>;
  toggleListening: () => void;
  cancelStreaming: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Load chat history when the component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch('http://localhost:8888/messages');
        if (!response.ok) throw new Error('Failed to load chat history');
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: inputText.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      abortController.current = new AbortController();
      const response = await fetch('http://localhost:8888/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortController.current.signal,
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantMessage = { role: 'assistant' as const, content: '' };
      setIsStreaming(true);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Split the chunk into lines and process each SSE event
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.chunk) {
                assistantMessage.content += data.chunk;
                setMessages([...updatedMessages, { ...assistantMessage }]);
              }
              if (data.done) {
                break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream cancelled');
      } else {
        console.error('Error:', error);
        setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortController.current = null;
    }
  };

  const toggleListening = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const cancelStreaming = () => {
    if (abortController.current) {
      abortController.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const value: ChatContextType = {
    messages,
    setMessages,
    inputText,
    setInputText,
    isLoading,
    setIsLoading,
    isListening,
    setIsListening,
    isStreaming,
    setIsStreaming,
    inputRef,
    messagesEndRef,
    handleInputChange,
    handleKeyDown,
    handleSendMessage,
    toggleListening,
    cancelStreaming,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useSharedChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useSharedChat must be used within a ChatProvider');
  }
  return context;
} 