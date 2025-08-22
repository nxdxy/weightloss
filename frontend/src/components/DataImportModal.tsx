import React, { useState, useRef } from 'react';
import { dataImportApi } from '../lib/api';
import { LoadingSpinner } from './LoadingSpinner';
import { XIcon, SaveIcon } from './Icons';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [importMethod, setImportMethod] = useState<'csv' | 'json' | 'localStorage'>('csv');
  const [localStorageData, setLocalStorageData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let response;
      if (file.name.endsWith('.csv')) {
        response = await dataImportApi.importFromCsv(file);
      } else if (file.name.endsWith('.json')) {
        response = await dataImportApi.importFromJson(file);
      } else {
        alert('不支持的文件格式，请选择CSV或JSON文件');
        return;
      }

      const result = response.data;
      alert(`导入完成！\n导入记录: ${result.imported_logs}\n跳过记录: ${result.skipped_logs}`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(error.response?.data?.detail || '导入失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalStorageImport = async () => {
    if (!localStorageData.trim()) {
      alert('请输入localStorage数据');
      return;
    }

    setIsLoading(true);
    try {
      const data = JSON.parse(localStorageData);
      const response = await dataImportApi.importFromLocalStorage(data);
      const result = response.data;
      
      alert(`导入完成！\n导入记录: ${result.imported_logs}\n跳过记录: ${result.skipped_logs}`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Import failed:', error);
      if (error instanceof SyntaxError) {
        alert('JSON格式错误，请检查数据格式');
      } else {
        alert(error.response?.data?.detail || '导入失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const response = await dataImportApi.exportData();
      const data = response.data;
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('数据导出成功！');
    } catch (error: any) {
      console.error('Export failed:', error);
      alert(error.response?.data?.detail || '导出失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            数据导入/导出
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              导出数据
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              将您的所有健身数据导出为JSON文件，可用于备份或迁移到其他设备。
            </p>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : '导出数据'}
            </button>
          </div>

          {/* Import Section */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              导入数据
            </h3>
            
            {/* Import Method Selection */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="csv"
                    checked={importMethod === 'csv'}
                    onChange={(e) => setImportMethod(e.target.value as 'csv')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">CSV文件导入</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="json"
                    checked={importMethod === 'json'}
                    onChange={(e) => setImportMethod(e.target.value as 'json')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">JSON文件导入</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="localStorage"
                    checked={importMethod === 'localStorage'}
                    onChange={(e) => setImportMethod(e.target.value as 'localStorage')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">localStorage导入</span>
                </label>
              </div>
            </div>

            {importMethod === 'csv' ? (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  选择CSV文件进行导入。支持的字段包括：日期、体重、腰围、饮水量、睡眠、早餐、午餐、晚餐、运动情况等。
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileImport}
                  disabled={isLoading}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <p className="font-medium mb-1">支持的字段名称（中英文）：</p>
                  <p>日期/date, 体重/weight, 腰围/waist, 饮水量/water, 睡眠/sleep, 早餐/breakfast, 午餐/lunch, 晚餐/dinner, 运动情况/activity, 备注/summary</p>
                </div>
              </div>
            ) : importMethod === 'json' ? (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  选择之前导出的JSON文件进行导入。
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  disabled={isLoading}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  粘贴从原版本应用导出的localStorage数据（JSON格式）。
                </p>
                <textarea
                  value={localStorageData}
                  onChange={(e) => setLocalStorageData(e.target.value)}
                  placeholder='粘贴JSON数据，例如: {"dailyLogs": [...], ...}'
                  rows={8}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                />
                <button
                  onClick={handleLocalStorageImport}
                  disabled={isLoading || !localStorageData.trim()}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : '导入数据'}
                </button>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="text-yellow-800 dark:text-yellow-200 text-sm">
              <p className="font-medium mb-1">注意事项：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>导入会跳过已存在的日期记录，不会覆盖现有数据</li>
                <li>请确保导入的数据格式正确</li>
                <li>建议在导入前先导出当前数据作为备份</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
