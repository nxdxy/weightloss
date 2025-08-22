import React, { useState, useRef } from 'react';
import { SparklesIcon, CameraIcon } from './Icons';

interface AnalyzedMealData {
  generatedMealName: string;
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
  description: string;
  tags: string[];
  identifiedIngredients: string[];
  dominantColors: string[];
  cuisineStyle: string;
}

interface SmartLogInputProps {
  onMealLogged: (data: AnalyzedMealData, imagePreview: string | null, date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onApiKeyMissing: () => void;
}

export const SmartLogInput: React.FC<SmartLogInputProps> = ({ onMealLogged, onApiKeyMissing }) => {
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async () => {
    if ((!userInput.trim() && !image) || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('text', userInput);
      formData.append('meal_type', selectedMealType);
      formData.append('date', selectedDate);
      
      if (image) {
        formData.append('image', image);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/meals/analyze-smart-input', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onMealLogged(result.analysis, imagePreview, selectedDate, selectedMealType);
          setUserInput('');
          removeImage();
        } else {
          alert('抱歉，无法分析您的餐食。请尝试更详细地描述，或检查您的网络连接和图片。');
        }
      } else {
        const errorData = await response.json();
        if (errorData.detail?.includes('API_KEY_MISSING')) {
          onApiKeyMissing();
        } else {
          alert('分析时发生错误，请检查您的API密钥或网络连接。');
        }
      }
    } catch (error) {
      console.error('分析错误:', error);
      alert('分析时发生错误，请检查您的网络连接。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <SparklesIcon className="w-6 h-6 text-indigo-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white ml-2">AI 智能膳食日志</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        用自然语言描述您吃的食物，或直接拍照上传，AI会自动为您分析营养成分并记录。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="meal-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">日期</label>
          <input 
            type="date" 
            id="meal-date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="meal-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">餐别</label>
          <select 
            id="meal-type"
            value={selectedMealType}
            onChange={e => setSelectedMealType(e.target.value as any)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
          >
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
            <option value="snack">点心</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isAnalyzing}
          rows={3}
          className="flex-grow w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="例如：午餐吃了沙拉，酱汁是分开放的...（可选，AI会以图片为准）"
        />
        <div className="flex-shrink-0 w-full md:w-40 flex flex-col items-center justify-center gap-2">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="w-full h-32 md:h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <CameraIcon className="w-8 h-8" />
              <span className="text-sm mt-1">上传/拍照</span>
            </button>
          ) : (
            <div className="relative w-full h-32 md:h-full">
              <img src={imagePreview} alt="Meal preview" className="w-full h-full object-cover rounded-lg" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm shadow-md transition-transform hover:scale-110">&times;</button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isAnalyzing}
                className="absolute bottom-1 right-1 bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded-md shadow-sm hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50">
                更换
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isAnalyzing || (!userInput.trim() && !image)}
        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        {isAnalyzing ? '正在分析...' : '用 AI 记录膳食'}
      </button>
    </div>
  );
};
