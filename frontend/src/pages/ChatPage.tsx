import React, { useState, useRef, useEffect } from 'react';
import { useChatHistory } from '../hooks/useApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SendIcon, ImageIcon } from '../components/Icons';
import { chatApi, getImageUrl } from '../lib/api';

// Markdown renderer for AI responses
const renderMarkdown = (text: string) => {
  const processInline = (line: string): React.ReactNode => {
    const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-cyan-300 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Handle Headers
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const content = line.replace(/^#+\s*/, '');
      const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      const headerClass = level === 1 ? 'text-xl font-bold my-3 text-cyan-400' :
                         level === 2 ? 'text-lg font-semibold my-2 text-cyan-300' :
                         'text-base font-medium my-2 text-gray-300';
      elements.push(<HeaderTag key={i} className={headerClass}>{processInline(content)}</HeaderTag>);
      i++;
      continue;
    }

    // Handle Tables - improved detection for various table formats
    if (line.includes('|')) {
      const tableRows: JSX.Element[] = [];
      let isFirstRow = true;

      // Look ahead to see if this looks like a table
      let tableStartIndex = i;
      let potentialTableLines = [];
      let j = i;

      while (j < lines.length && lines[j].includes('|')) {
        const currentLine = lines[j].trim();
        if (currentLine === '') {
          break;
        }
        potentialTableLines.push(currentLine);
        j++;
      }

      // If we have at least 2 lines with |, treat as table
      if (potentialTableLines.length >= 2) {
        for (const tableLine of potentialTableLines) {
          // Skip separator rows (like |---|---|---| or |-------|-------|)
          if (tableLine.match(/^\|?[\s\-\|]+\|?$/)) {
            continue;
          }

          // Split by | and clean up cells
          let cells = tableLine.split('|');

          // Remove empty cells at start/end if they exist
          if (cells[0].trim() === '') cells = cells.slice(1);
          if (cells[cells.length - 1].trim() === '') cells = cells.slice(0, -1);

          cells = cells.map(cell => cell.trim());

          if (cells.length > 1) {
            const CellTag = isFirstRow ? 'th' : 'td';
            const cellClass = isFirstRow
              ? 'px-4 py-3 font-semibold text-left text-cyan-300 border-b border-gray-600/50'
              : 'px-4 py-3 text-gray-200 border-b border-gray-700/30';

            const row = (
              <tr key={`table-row-${tableStartIndex}-${tableRows.length}`} className={isFirstRow ? 'bg-gray-800/60 border-b border-gray-600/50' : 'hover:bg-gray-800/40 border-b border-gray-700/30'}>
                {cells.map((cell, cellIndex) => (
                  <CellTag key={cellIndex} className={cellClass}>
                    {processInline(cell)}
                  </CellTag>
                ))}
              </tr>
            );

            tableRows.push(row);
            isFirstRow = false;
          }
        }

        if (tableRows.length > 0) {
          elements.push(
            <div key={`table-${tableStartIndex}`} className="my-4 overflow-x-auto">
              <table className="min-w-full border border-gray-600/50 rounded-xl bg-gray-800/30 backdrop-blur-sm">
                <tbody>
                  {tableRows}
                </tbody>
              </table>
            </div>
          );
        }

        // Skip all the lines we processed
        i = j;
        continue;
      }
    }

    // Handle Code Blocks
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++; // Skip the opening ```

      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      if (i < lines.length) i++; // Skip the closing ```

      elements.push(
        <pre key={`code-${i}`} className="bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 p-4 rounded-xl my-3 overflow-x-auto">
          <code className="text-sm text-cyan-300 font-mono">{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Handle Lists
    if (line.match(/^\s*[\*\-\+]\s/) || line.match(/^\s*\d+\.\s/)) {
      const listItems: JSX.Element[] = [];
      const isOrdered = line.match(/^\s*\d+\.\s/);
      const ListTag = isOrdered ? 'ol' : 'ul';
      const listClass = isOrdered ? 'list-decimal list-inside my-3 space-y-2 text-gray-200' : 'list-disc list-inside my-3 space-y-2 text-gray-200';

      while (i < lines.length && (lines[i].match(/^\s*[\*\-\+]\s/) || lines[i].match(/^\s*\d+\.\s/))) {
        const content = lines[i].replace(/^\s*(?:[\*\-\+]|\d+\.)\s/, '');
        listItems.push(<li key={i} className="text-gray-200 leading-relaxed">{processInline(content)}</li>);
        i++;
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

      elements.push(<p key={i} className="my-2 leading-relaxed text-gray-200">{paraContent}</p>);
      continue;
    }
    i++;
  }
  return <div className="markdown-body">{elements}</div>;
};

export const ChatPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: chatHistory, isLoading: historyLoading } = useChatHistory(50);

  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('确定要清空所有聊天记录吗？此操作不可撤销。')) {
      return;
    }

    setIsClearingHistory(true);
    try {
      await chatApi.clearHistory();
      setMessages([]);
      alert('聊天记录已清空');
    } catch (error) {
      console.error('清空聊天记录失败:', error);
      alert('清空聊天记录失败，请重试');
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !image) || isLoading) return;

    setIsLoading(true);

    // Add user message to UI immediately (will be updated with server data)
    const tempUserMessageId = Date.now();
    const userMessage = {
      id: tempUserMessageId,
      role: 'user',
      text: message,
      image_path: imagePreview, // Temporary preview, will be replaced with server path
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Clear inputs
    const currentMessage = message;
    const currentImage = image;
    setMessage('');
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('message', currentMessage);
      if (currentImage) {
        formData.append('image', currentImage);
      }

      // Send message and handle streaming response
      const response = await chatApi.sendMessage(formData);
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let aiResponse = '';
      const aiMessageId = Date.now() + 1;
      
      // Add AI message placeholder
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'model',
        text: '...',
        created_at: new Date().toISOString()
      }]);

      // Read streaming response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle user message update with server data
              if (data.user_message) {
                setMessages(prev => prev.map(msg =>
                  msg.id === tempUserMessageId
                    ? {
                        ...msg,
                        id: data.user_message.id,
                        image_path: data.user_message.image_path,
                        created_at: data.user_message.created_at
                      }
                    : msg
                ));
              }

              // Handle AI response chunks
              if (data.chunk) {
                aiResponse += data.chunk;
                setMessages(prev => prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, text: aiResponse }
                    : msg
                ));
              }

              if (data.done) {
                break;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'model',
        text: '抱歉，发送消息时出现错误。请稍后重试。',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* 科技风格标题 */}
      {messages.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur opacity-50"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 p-6">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                <h1 className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider">
                  AI FITNESS COACH
                </h1>
                <div className="w-3 h-3 bg-cyan-400 rounded-full ml-3 animate-pulse"></div>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={isClearingHistory}
                className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg text-red-400 font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  {isClearingHistory ? 'CLEARING...' : 'CLEAR HISTORY'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12">
                <div className="text-8xl mb-6 animate-pulse">🏋️‍♀️</div>
                <h3 className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider mb-4">
                  AI FITNESS COACH
                </h3>
                <div className="text-gray-400 max-w-3xl mx-auto">
                  <p className="mb-6 text-lg">您好！我是您的专业减肥健身教练和营养师。我可以为您提供：</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-lg">
                        <h4 className="font-bold text-cyan-400 font-mono uppercase tracking-wider mb-3 flex items-center">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                          💡 KNOWLEDGE BASE
                        </h4>
                        <ul className="text-sm space-y-2 text-gray-300">
                          <li className="flex items-center"><div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>减肥理论与方法</li>
                          <li className="flex items-center"><div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>健身运动建议</li>
                          <li className="flex items-center"><div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>食物选择指导</li>
                          <li className="flex items-center"><div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>营养搭配建议</li>
                        </ul>
                      </div>
                    </div>
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-lg">
                        <h4 className="font-bold text-green-400 font-mono uppercase tracking-wider mb-3 flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                          📸 IMAGE ANALYSIS
                        </h4>
                        <ul className="text-sm space-y-2 text-gray-300">
                          <li className="flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>自动识别食物类型</li>
                          <li className="flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>估算营养成分</li>
                          <li className="flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>热量计算分析</li>
                          <li className="flex items-center"><div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>减肥建议评价</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-gray-500 font-mono uppercase tracking-wider">您可以直接提问或上传食物照片开始咨询！</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`group relative max-w-[85%] sm:max-w-md lg:max-w-lg p-3 sm:p-4 rounded-xl shadow-lg transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-500/50'
                  : 'bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 text-gray-100 hover:border-gray-600/50'
              }`}>
                {/* AI消息的科技风格装饰 */}
                {msg.role === 'model' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  </>
                )}

                {msg.image_path && (
                  <div className="relative mb-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg blur opacity-50"></div>
                    <img
                      src={getImageUrl(msg.image_path)}
                      alt="Message attachment"
                      className="relative rounded-lg max-h-60 w-full object-cover border border-gray-600/50"
                    />
                  </div>
                )}

                <div className="relative">
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      {renderMarkdown(msg.text)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {imagePreview && (
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 w-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl blur opacity-50"></div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="输入您的消息..."
                className="relative w-full px-4 py-3 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-gray-100 placeholder-gray-400 resize-none transition-all duration-300"
                rows={3}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                aria-label="上传食物图片"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="group relative p-3 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 hover:border-gray-500/50 rounded-xl text-gray-400 hover:text-cyan-400 disabled:opacity-50 transition-all duration-300"
                title="上传图片"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <ImageIcon className="relative w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={isLoading || (!message.trim() && !image)}
                className="group relative p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-500/50 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                title="发送消息"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <div className="relative">
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <SendIcon className="w-5 h-5" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
