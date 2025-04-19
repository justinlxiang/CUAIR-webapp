'use client';

import { useState, useEffect, useRef } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Add type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from server on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:8888/messages');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        if (isListeningRef.current) {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

          setInputText(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        setTimeout(() => inputRef.current?.focus(), 0);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      isListeningRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const userMessage: Message = { role: 'user', content: inputText };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);
      setIsStreaming(true);
      
      if (isListening && recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.stop();
        setIsListening(false);
        isListeningRef.current = false;
      }

      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        // Add a temporary message for the assistant
        const tempAssistantMessage: Message = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, tempAssistantMessage]);

        // Use the streaming endpoint
        const response = await fetch('http://localhost:8888/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to get response from chatbot');
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get reader from response');
        }

        const decoder = new TextDecoder();
        let assistantMessage = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.chunk !== undefined) {
                  assistantMessage += data.chunk;
                  
                  // Update the assistant message in the messages array
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = assistantMessage;
                    }
                    return newMessages;
                  });
                }
                
                if (data.done) {
                  setIsStreaming(false);
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        
        // If the error is not an abort error, show an error message
        if (error instanceof Error && error.name !== 'AbortError') {
          const errorMessage: Message = { 
            role: 'assistant', 
            content: 'Sorry, I encountered an error. Please try again.' 
          };
          
          // Replace the temporary message with the error message
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = errorMessage;
            return newMessages;
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    inputText,
    isLoading,
    isListening,
    isStreaming,
    handleInputChange,
    handleKeyDown,
    handleSendMessage,
    toggleListening,
    cancelStreaming,
    inputRef,
    messagesEndRef,
  };
} 