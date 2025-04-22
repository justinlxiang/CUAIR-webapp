'use client';

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Trash2, RefreshCw, Send, Volume2, VolumeX } from 'lucide-react';
import Header from '../components/Header';
import { useSharedChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

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

export default function ChatPage() {
  const chatPageEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    setMessages,
    inputText,
    isLoading,
    isListening,
    isStreaming,
    voiceEnabled,
    toggleVoice,
    handleInputChange,
    handleKeyDown,
    handleSendMessage,
    toggleListening,
    cancelStreaming,
    inputRef
  } = useSharedChat();

  // Add useEffect for auto-scrolling
  useEffect(() => {
    chatPageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChatHistory = async () => {
    try {
      const response = await fetch('http://localhost:8888/clear', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }
      setMessages([]); // Clear the messages in the frontend state
      
      // Force a reload of the messages from the server
      const messagesResponse = await fetch('http://localhost:8888/messages');
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const clearContext = async () => {
    try {
      await fetch('http://localhost:8888/clear-context', {
        method: 'POST',
      });
      
      // Add a separator message to indicate context was cleared
      const separatorMessage = {
        role: 'assistant' as const,
        content: '--- Context cleared ---'
      };
      
      setMessages((prev) => [...prev, separatorMessage]);
    } catch (error) {
      console.error('Error clearing context:', error);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-4xl h-[calc(100vh-80px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Nexus AI</h1>
          <div className="flex gap-2">
            <Button
              onClick={toggleVoice}
              variant={voiceEnabled ? "default" : "secondary"}
              className="flex items-center gap-2"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </Button>
            <Button 
              onClick={clearContext} 
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Context
            </Button>
            <Button 
              onClick={clearChatHistory} 
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-black rounded-lg p-4 flex-grow overflow-y-auto mb-4 border border-border">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "p-3 rounded-lg mb-2 border border-border break-words overflow-wrap-anywhere",
                message.role === 'user' 
                  ? 'bg-blue-200 text-blue-900 ml-auto max-w-[80%]' 
                  : message.content === '--- Context cleared ---'
                    ? 'bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center w-full'
                    : 'bg-white dark:bg-black text-gray-900 dark:text-white max-w-[80%]'
              )}
            >
              <span className="font-bold">{message.role === 'user' ? 'You: ' : 'Nexus AI: '}</span>
              <span className={cn(
                "whitespace-pre-line break-words",
                message.role === 'user' ? 'text-blue-900' : 'text-gray-900 dark:text-white'
              )}>
                {message.content}
              </span>
            </div>
          ))}
          {isLoading && !isStreaming && (
            <div className="bg-white dark:bg-black text-gray-900 dark:text-white p-3 rounded-lg mb-2 max-w-[80%] border border-border">
              <span className="font-bold">Nexus AI: </span>
              <span>Thinking...</span>
            </div>
          )}
          <div ref={chatPageEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border rounded-lg bg-background"
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
              <Send className="h-4 w-4" />
              Send
            </Button>
          )}
        </div>
      </div>
    </>
  );
} 