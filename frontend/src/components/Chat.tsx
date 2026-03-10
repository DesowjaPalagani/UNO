'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Message {
  id?: string;
  username: string;
  message: string;
  timestamp: Date;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  username: string;
  className?: string;
}

const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  username,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <motion.div
      className={clsx(
        'flex flex-col h-96 w-80 bg-gray-900 rounded-lg border border-gray-700 shadow-lg',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 rounded-t-lg">
        <h3 className="font-semibold text-gray-200 text-sm">💬 Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={`${msg.username}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'text-sm p-2 rounded max-w-xs',
                msg.username === username
                  ? 'bg-blue-900 text-blue-100 ml-auto'
                  : 'bg-gray-800 text-gray-200'
              )}
            >
              <p className={clsx('font-semibold text-xs mb-1', msg.username === username ? 'text-blue-300' : 'text-gray-400')}>
                {msg.username}
              </p>
              <p className="break-words">{msg.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 rounded-b-lg flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          className="form-input flex-1 text-sm py-2"
          aria-label="Chat message input"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          className="btn btn-primary px-3 py-2 text-sm"
          disabled={!inputValue.trim()}
        >
          Send
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Chat;