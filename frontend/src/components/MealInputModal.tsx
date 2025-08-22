import React, { useState, useRef } from 'react';
import { XIcon, FileTextIcon, CameraIcon, UploadIcon, SparklesIcon } from './Icons';
import { mealApi, getImageUrl } from '../lib/api';

interface MealInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  mealName: string;
  date: string;
  existingMeal?: any; // 现有餐食数据，用于编辑模式
  dailyLogId?: number; // 日志ID，用于删除现有餐食
  onSuccess?: () => void;
}

export const MealInputModal: React.FC<MealInputModalProps> = ({
  isOpen,
  onClose,
  mealType,
  mealName,
  date,
  existingMeal,
  dailyLogId,
  onSuccess
}) => {
  const [inputMethod, setInputMethod] = useState<'text' | 'image' | null>(null);
  const [textInput, setTextInput] = useState(existingMeal?.text || '');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    existingMeal?.image_path ? getImageUrl(existingMeal.image_path) : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!existingMeal;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!inputMethod) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && existingMeal && dailyLogId) {
        // 编辑模式：删除现有餐食，然后创建新的
        const response = await fetch(`/api/meals/daily-logs/${dailyLogId}/meals/${encodeURIComponent(mealName)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('删除现有餐食失败');
        }
      }

      if (inputMethod === 'text' && textInput.trim()) {
        // 文字录入
        const response = await mealApi.createMeal({
          date,
          meal_type: mealType,
          text: textInput.trim()
        });

        if (!response.data.success) {
          throw new Error(response.data.error || '创建餐食失败');
        }
      } else if (inputMethod === 'image' && selectedImage) {
        // 图片上传
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('date', date);
        formData.append('meal_type', mealType);
        if (textInput.trim()) {
          formData.append('text', textInput.trim());
        }

        const response = await mealApi.createMealWithImage(formData);

        if (!response.data.success) {
          throw new Error(response.data.error || '创建餐食失败');
        }
      }

      // 重置状态
      setInputMethod(null);
      setTextInput('');
      setSelectedImage(null);
      setImagePreview(null);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save meal:', error);
      alert(isEditMode ? '更新餐食失败，请重试' : '添加餐食失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setInputMethod(null);
    setTextInput('');
    setSelectedImage(null);
    setImagePreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? `编辑${mealName}` : `添加${mealName}`}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!inputMethod ? (
            // 选择录入方式
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {isEditMode ? '请选择重新录入方式：' : '请选择录入方式：'}
              </p>
              
              <button
                onClick={() => setInputMethod('text')}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
              >
                <div className="flex flex-col items-center gap-3">
                  <FileTextIcon className="w-8 h-8 text-gray-400 group-hover:text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">文字录入</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">描述您吃的食物</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setInputMethod('image')}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
              >
                <div className="flex flex-col items-center gap-3">
                  <CameraIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">拍照上传</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">上传食物照片，AI自动分析</div>
                  </div>
                </div>
              </button>
            </div>
          ) : inputMethod === 'text' ? (
            // 文字录入界面
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileTextIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">文字录入</span>
              </div>
              
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`例如：${mealName}吃了牛肉面，配菜是小菜...`}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setInputMethod(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  返回
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!textInput.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditMode ? '更新中...' : '添加中...'}</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>{isEditMode ? '用AI重新分析' : '用AI记录餐食'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // 图片上传界面
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CameraIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">拍照上传</span>
              </div>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              
              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UploadIcon className="w-5 h-5 text-gray-400" />
                    <CameraIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    点击上传图片
                  </span>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm shadow-md hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="可选：补充描述食物信息..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setInputMethod(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  返回
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedImage || isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditMode ? '重新分析中...' : '分析中...'}</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>{isEditMode ? 'AI重新分析并更新' : 'AI分析并记录'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
