'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { useSharedChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const floatingChatEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
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

  // Scroll to bottom when chat opens or messages change
  useEffect(() => {
    floatingChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (isOpen) {
      floatingChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-[100]"
        onClick={toggleChat}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      <div
        className={cn(
          "fixed bottom-20 right-4 w-[350px] bg-background rounded-lg shadow-lg z-[100] transition-all duration-300 ease-in-out flex flex-col border border-border",
          isOpen ? "h-[500px] opacity-100" : "h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Nexus AI</h2>
          <div className="flex gap-2">
            <Button
              variant={voiceEnabled ? "default" : "secondary"}
              size="icon"
              onClick={toggleVoice}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-black">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "p-3 rounded-lg mb-2 border border-border break-words overflow-wrap-anywhere text-sm",
                message.role === 'user' 
                  ? 'bg-blue-200 text-blue-900 ml-auto max-w-[80%]' 
                  : message.content === '--- Context cleared ---'
                    ? 'bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center w-full'
                    : 'bg-white dark:bg-black text-gray-900 dark:text-white max-w-[80%]'
              )}
            >
              <span className="font-bold text-sm">{message.role === 'user' ? 'You: ' : 'Nexus AI: '}</span>
              <span className={cn(
                "whitespace-pre-line break-words text-sm",
                message.role === 'user' ? 'text-blue-900' : 'text-gray-900 dark:text-white'
              )}>
                {message.content}
              </span>
            </div>
          ))}
          {isLoading && !isStreaming && (
            <div className="bg-white dark:bg-black text-gray-900 dark:text-white p-3 rounded-lg mb-2 max-w-[80%] border border-border text-sm">
              <span className="font-bold">Nexus AI: </span>
              <span>Thinking...</span>
            </div>
          )}
          <div ref={floatingChatEndRef} />
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border rounded-lg bg-background text-sm"
            placeholder="Type or speak your message..."
            disabled={isLoading}
          />
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="icon"
            disabled={isLoading}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          {isStreaming ? (
            <Button onClick={cancelStreaming} variant="destructive" size="icon">
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSendMessage} disabled={isLoading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
} 