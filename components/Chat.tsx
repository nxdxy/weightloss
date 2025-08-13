
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { sendChatMessageStream } from '../services/geminiService';
import { SendIcon, CameraIcon, UserIcon, XIcon } from './Icons';

// A markdown to HTML converter for chat messages
const renderMarkdown = (text: string) => {
    const processInline = (line: string): React.ReactNode => {
      const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      let line = lines[i];

      // Trim margins and font sizes for chat bubbles
      if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="font-semibold mt-2 mb-1">{processInline(line.substring(4))}</h3>); i++; continue;
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-lg font-bold mt-2 mb-1">{processInline(line.substring(3))}</h2>); i++; continue;
      }
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-xl font-bold mt-2 mb-1">{processInline(line.substring(2))}</h1>); i++; continue;
      }
      if (line.trim() === '---') {
        elements.push(<hr key={i} className="my-2 border-gray-300 dark:border-gray-600" />); i++; continue;
      }

      // Handle lists with one level of nesting
      const isUnordered = line.trim().startsWith('* ');
      const isOrdered = line.trim().match(/^\d+\.\s/);
      
      if (isUnordered || isOrdered) {
        const listItems: JSX.Element[] = [];
        const ListTag = isOrdered ? 'ol' : 'ul';
        const listClass = (isOrdered ? "list-decimal" : "list-disc") + " list-outside pl-5 space-y-1 my-2";
        const baseIndent = line.search(/\S|$/);

        while (i < lines.length) {
            let currentLine = lines[i];
            let trimmedLine = currentLine.trim();
            const currentIndent = currentLine.search(/\S|$/);
            
            const currentIsUnordered = trimmedLine.startsWith('* ');
            const currentIsOrdered = trimmedLine.match(/^\d+\.\s/);
            
            if (currentIndent < baseIndent || (!currentIsUnordered && !currentIsOrdered)) {
              break; // End of list
            }
            
            const content = currentIsOrdered ? trimmedLine.replace(/^\d+\.\s/, '') : trimmedLine.substring(2);
            i++;

            // Peek ahead for a simple nested list
            let nestedList: JSX.Element | null = null;
            if (i < lines.length) {
                const nextLine = lines[i];
                const nextIndent = nextLine.search(/\S|$/);
                if (nextIndent > currentIndent) {
                    const nestedItems: JSX.Element[] = [];
                    const nestedListType = lines[i].trim().match(/^\d+\.\s/) ? 'ol' : 'ul';
                    const nestedListClass = (nestedListType === 'ol' ? "list-decimal" : "list-disc") + " list-outside pl-5 space-y-1 my-1";
                    
                    while (i < lines.length && lines[i].search(/\S|$/) === nextIndent) {
                         const nestedContent = lines[i].trim().replace(/^\d+\.\s/, '').replace(/^\*\s/, '');
                         nestedItems.push(<li key={i}>{processInline(nestedContent)}</li>);
                         i++;
                    }
                    const NestedListTag = nestedListType === 'ol' ? 'ol' : 'ul';
                    nestedList = <NestedListTag className={nestedListClass}>{nestedItems}</NestedListTag>
                }
            }

            listItems.push(<li key={i-1}>{processInline(content)}{nestedList}</li>);
        }
        elements.push(<ListTag key={`list-${i}`} className={listClass}>{listItems}</ListTag>);
        continue;
      }
      
      // Handle Paragraphs
      if (line.trim() !== '') {
        let paraLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '') {
            paraLines.push(lines[i]);
            i++;
        }
        
        const paraContent = paraLines.map((pLine, pIndex) => (
          <React.Fragment key={pIndex}>
            {processInline(pLine)}
            {pIndex < paraLines.length - 1 && <br />}
          </React.Fragment>
        ));

        elements.push(<p key={i} className="my-1 leading-relaxed">{paraContent}</p>);
        continue;
      }
      i++;
    }
    return <div className="markdown-body">{elements}</div>;
};


const ChatMessageDisplay: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 sm:gap-4 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && (
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              AI
            </div>
        )}
        <div className={`max-w-[85%] sm:max-w-md lg:max-w-lg p-3 sm:p-4 rounded-xl shadow-md ${isUser ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
          {message.image && <img src={message.image} alt="user upload" className="rounded-lg mb-2 max-h-60" />}
          {isUser ? (
             <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            renderMarkdown(message.text)
          )}
        </div>
        {isUser && (
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-300" />
            </div>
        )}
    </div>
  );
};

export const ChatInterface: React.FC<{ onApiKeyMissing: () => void }> = ({ onApiKeyMissing }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([{ id: 'init', role: 'model', text: '您好！今天我能为您的健身之旅提供什么帮助？您可以向我提问，或者上传您的餐食照片进行分析。'}])
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = ''; // Allow re-uploading the same file
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !image) || isLoading) return;
    
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      ...(imagePreview && { image: imagePreview }),
    };
    // Add user message to the UI immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Reset inputs
    const currentInput = input;
    const currentImage = image;
    setInput('');
    setImage(null);
    setImagePreview(null);
    
    try {
      // Pass the history *before* the new user message was added
      const historyForApi = messages.slice(1);
      const stream = await sendChatMessageStream(historyForApi, currentInput, currentImage);
      
      let modelResponse = '';
      const modelMessageId = `model-${Date.now()}`;
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '...' }]);

      for await (const chunk of stream) {
          modelResponse += chunk.text;
          setMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, text: modelResponse } : m));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      let errorMessage = `抱歉，我遇到了一个错误: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof Error && error.message.includes('API_KEY_MISSING')) {
          onApiKeyMissing();
          errorMessage = "AI功能未激活。请先前往“设置”页面配置您的API密钥，然后重试。";
      }
      setMessages(prev => [...prev.filter(m => m.text !== '...'), { id: `err-${Date.now()}`, role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, image, imagePreview, isLoading, messages, onApiKeyMissing]);

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((msg) => (
                <ChatMessageDisplay key={msg.id} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">AI</div>
                  <div className="max-w-lg p-4 rounded-xl shadow-md bg-white dark:bg-gray-700">
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                      </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-2 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto">
              {imagePreview && (
                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg relative w-fit">
                    <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded" />
                    <button onClick={removeImage} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">&times;</button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <CameraIcon className="w-6 h-6" />
                  </button>
                  <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="询问健身问题或描述您的餐食..."
                      disabled={isLoading}
                      className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                      onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handleSubmit()}}
                  />
                  <button type="submit" disabled={isLoading || (!input.trim() && !image)} className="p-2 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                      <SendIcon className="w-6 h-6" />
                  </button>
              </form>
            </div>
        </div>
    </div>
  );
};