import React, { useState } from 'react';
import { useCreateDailyLog } from '../hooks/useApi';
import { LoadingSpinner } from './LoadingSpinner';
import { XIcon, SaveIcon } from './Icons';

interface AddDailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddDailyLogModal: React.FC<AddDailyLogModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    waist_cm: '',
    water_l: '',
    sleep_h: '',
    activity: '',
    summary: ''
  });

  const createDailyLog = useCreateDailyLog();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        date: formData.date,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        waist_cm: formData.waist_cm ? parseFloat(formData.waist_cm) : undefined,
        water_l: formData.water_l ? parseFloat(formData.water_l) : undefined,
        sleep_h: formData.sleep_h ? parseFloat(formData.sleep_h) : undefined,
        activity: formData.activity || undefined,
        summary: formData.summary || undefined
      };

      await createDailyLog.mutateAsync(submitData);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight_kg: '',
        waist_cm: '',
        water_l: '',
        sleep_h: '',
        activity: '',
        summary: ''
      });
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to create daily log:', error);
      alert(error.response?.data?.detail || 'Failed to create daily log');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            添加每日记录
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                日期 *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                体重 (kg)
              </label>
              <input
                type="number"
                name="weight_kg"
                value={formData.weight_kg}
                onChange={handleChange}
                step="0.1"
                min="20"
                max="500"
                placeholder="输入体重"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                腰围 (cm)
              </label>
              <input
                type="number"
                name="waist_cm"
                value={formData.waist_cm}
                onChange={handleChange}
                step="0.1"
                min="30"
                max="200"
                placeholder="输入腰围"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                饮水量 (L)
              </label>
              <input
                type="number"
                name="water_l"
                value={formData.water_l}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="20"
                placeholder="输入饮水量"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                睡眠时间 (小时)
              </label>
              <input
                type="number"
                name="sleep_h"
                value={formData.sleep_h}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="24"
                placeholder="输入睡眠时间"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              运动活动
            </label>
            <textarea
              name="activity"
              value={formData.activity}
              onChange={handleChange}
              rows={3}
              placeholder="描述今天的运动活动..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              日总结
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={3}
              placeholder="今天的总结..."
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={createDailyLog.isPending}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createDailyLog.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createDailyLog.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
