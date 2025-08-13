import React, { useState, useEffect } from 'react';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100" />
);

export const SettingsPage: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini-api-key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleSave = () => {
        setSaveStatus('saving');
        try {
            localStorage.setItem('gemini-api-key', apiKey);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000); // Reset status after 2 seconds
        } catch (error) {
            console.error("Failed to save API key to localStorage", error);
            setSaveStatus('error');
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">应用设置</h1>
                    <p className="mt-2 text-base text-gray-600 dark:text-gray-400 sm:text-lg">配置您的个人设置以启用 AI 功能。</p>
                </div>

                <div className="mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google Gemini API 密钥</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        为了使用 AI 聊天、膳食分析和报告生成等智能功能，您需要提供自己的 Google Gemini API 密钥。此密钥将仅存储在您的浏览器中，不会发送到我们的服务器。
                    </p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        您可以从 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Google AI Studio</a> 获取您的免费 API 密钥。
                    </p>

                    <div className="mt-6">
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            您的 Gemini API 密钥
                        </label>
                        <div className="mt-1 flex flex-col sm:flex-row items-stretch gap-2">
                            <Input
                                id="api-key"
                                name="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="在此处粘贴您的 API 密钥"
                                className="flex-grow"
                            />
                            <button
                                onClick={handleSave}
                                disabled={saveStatus === 'saving' || !apiKey.trim()}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                {saveStatus === 'saving' ? '保存中...' : '保存密钥'}
                            </button>
                        </div>
                         {saveStatus === 'saved' && (
                            <p className="mt-2 text-sm text-green-600 dark:text-green-400">密钥已成功保存！</p>
                        )}
                        {saveStatus === 'error' && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">保存失败，请检查浏览器设置。</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
