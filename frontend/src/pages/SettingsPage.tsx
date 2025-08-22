import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useApiKeyStatus } from '../hooks/useApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SaveIcon } from '../components/Icons';

export const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const { updateApiKey, isLoading } = useAuthStore();
  const { data: apiKeyStatus } = useApiKeyStatus();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      alert('请输入有效的 API 密钥');
      return;
    }

    try {
      await updateApiKey(apiKey);
      setApiKey('');
      alert('API 密钥更新成功！');
    } catch (error) {
      console.error('Failed to update API key:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">设置</h1>

      <div className="space-y-6">
        {/* API Key Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Gemini API 配置
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API 密钥状态
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  apiKeyStatus?.has_api_key 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {apiKeyStatus?.has_api_key ? '已配置' : '未配置'}
                </span>
              </div>
              
              {!apiKeyStatus?.has_api_key && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <div className="text-yellow-800 dark:text-yellow-200 text-sm">
                    <p className="font-medium mb-1">需要配置 Gemini API 密钥</p>
                    <p>AI 功能需要 Google Gemini API 密钥才能正常工作。请在下方输入您的 API 密钥。</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                更新 API 密钥
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入您的 Gemini API 密钥"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {showApiKey ? '隐藏' : '显示'}
                </button>
                <button
                  onClick={handleSaveApiKey}
                  disabled={isLoading || !apiKey.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <SaveIcon className="w-4 h-4 mr-2" />
                      保存
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="text-blue-800 dark:text-blue-200 text-sm">
                <p className="font-medium mb-2">如何获取 Gemini API 密钥：</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>访问 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Google AI Studio</a></li>
                  <li>登录您的 Google 账户</li>
                  <li>创建新的 API 密钥</li>
                  <li>复制密钥并粘贴到上方输入框中</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            应用信息
          </h2>
          
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>应用名称:</span>
              <span className="text-gray-900 dark:text-white">AI 健身伙伴</span>
            </div>
            <div className="flex justify-between">
              <span>版本:</span>
              <span className="text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>技术栈:</span>
              <span className="text-gray-900 dark:text-white">React + FastAPI</span>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            隐私与安全
          </h2>
          
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">数据存储</h3>
              <p>您的个人数据和健身记录安全存储在本地数据库中，不会上传到第三方服务器。</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">API 密钥安全</h3>
              <p>您的 Gemini API 密钥经过加密存储，仅用于 AI 功能调用，不会被分享或泄露。</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">图片处理</h3>
              <p>上传的餐食图片存储在本地文件系统中，用于 AI 分析后可随时删除。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
