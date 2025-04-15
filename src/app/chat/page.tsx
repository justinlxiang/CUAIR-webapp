'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Trash2 } from 'lucide-react';
import Header from '../components/Header';

// Add type definitions for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
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

  const clearChatHistory = async () => {
    try {
      await fetch('http://localhost:8888/clear', {
        method: 'POST',
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-4xl h-[calc(100vh-80px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Nexus AI</h1>
          <Button 
            onClick={clearChatHistory} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </Button>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 flex-grow overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg mb-2 ${
                message.role === 'user' 
                  ? 'bg-blue-200 text-blue-900 ml-auto max-w-[80%]' 
                  : 'bg-white text-black max-w-[80%]'
              }`}
            >
              <span className="font-bold">{message.role === 'user' ? 'You: ' : 'AI: '}</span>
              <span className={message.role === 'assistant' ? 'text-black whitespace-pre-line' : 'whitespace-pre-line'}>
                {message.content}
              </span>
            </div>
          ))}
          {isLoading && !isStreaming && (
            <div className="bg-white p-3 rounded-lg mb-2 max-w-[80%]">
              <span className="font-bold text-black">AI: </span>
              <span className="animate-pulse text-black">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border rounded-lg"
            placeholder="Type or speak your message..."
            disabled={isLoading}
          />
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isListening ? 'Stop' : 'Speak'}
          </Button>
          {isStreaming ? (
            <Button onClick={cancelStreaming} variant="destructive">
              Cancel
            </Button>
          ) : (
            <Button onClick={handleSendMessage} disabled={isLoading}>
              Send
            </Button>
          )}
        </div>
      </div>
    </>
  );
} 