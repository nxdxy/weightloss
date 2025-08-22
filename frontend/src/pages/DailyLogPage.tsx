import React, { useState, useEffect } from 'react';
import { useDailyLogs } from '../hooks/useApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AddDailyLogModal } from '../components/AddDailyLogModal';
import { DataImportModal } from '../components/DataImportModal';
import { MealDetailModal } from '../components/MealDetailModal';
import { MealInputModal } from '../components/MealInputModal';
import { getImageUrl } from '../lib/api';

// 运动条目接口
interface ExerciseEntry {
  id: string;
  type: string;
  amount: string;
}

// 简单的图标组件
const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 1.5L5 6l1.5 1.5L5 9l1.5 1.5L5 12l1.5 1.5L5 15l1.5 1.5L5 18l1.5 1.5L5 21M19 3l-1.5 1.5L19 6l-1.5 1.5L19 9l-1.5 1.5L19 12l-1.5 1.5L19 15l-1.5 1.5L19 18l-1.5 1.5L19 21" />
  </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const Camera = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// 运动条目管理组件
interface ExerciseManagerProps {
  exercises: ExerciseEntry[];
  onChange: (exercises: ExerciseEntry[]) => void;
}

const ExerciseManager: React.FC<ExerciseManagerProps> = ({ exercises, onChange }) => {
  const [localExercises, setLocalExercises] = useState(exercises);
  const [showBatchInput, setShowBatchInput] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // 同步外部数据到本地状态
  useEffect(() => {
    setLocalExercises(exercises);
  }, [exercises]);

  const addExercise = () => {
    const newExercise: ExerciseEntry = {
      id: Date.now().toString(),
      type: '',
      amount: ''
    };
    const updated = [...localExercises, newExercise];
    setLocalExercises(updated);
    // 不立即调用 onChange，等用户输入内容后再保存
  };

  // 批量导入运动数据
  const handleBatchImport = () => {
    if (!batchText.trim()) return;

    // 使用解析函数解析文本
    const parsedExercises = parseExerciseText(batchText);

    // 过滤掉无效的运动记录
    const validParsedExercises = parsedExercises.filter(ex =>
      ex.type.trim() !== '' && ex.amount.trim() !== ''
    );

    if (validParsedExercises.length === 0) {
      alert('没有解析到有效的运动记录，请检查输入格式');
      return;
    }

    // 合并到现有运动记录
    const updated = [...localExercises, ...validParsedExercises];
    setLocalExercises(updated);
    setHasChanges(true);

    // 清空输入框并关闭
    setBatchText('');
    setShowBatchInput(false);
  };

  // 解析运动文本的函数（复制主组件的逻辑）
  const parseExerciseText = (text: string): ExerciseEntry[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const exercises: ExerciseEntry[] = [];

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // 解析每一行中的多个运动项目
      const items = trimmedLine.split(';').map(item => item.trim()).filter(item => item);

      items.forEach((item, itemIndex) => {
        const id = `batch-${Date.now()}-${lineIndex}-${itemIndex}`;

        // 匹配不同的格式模式
        if (item.match(/^步数:\s*\d+/)) {
          const match = item.match(/^步数:\s*(\d+)/);
          if (match) {
            exercises.push({ id, type: '步数', amount: match[1] });
          }
        } else if (item.match(/^爬楼:\s*\d+层?/)) {
          const match = item.match(/^爬楼:\s*(\d+)层?/);
          if (match) {
            exercises.push({ id, type: '爬楼', amount: `${match[1]}层` });
          }
        } else if (item.match(/^骑行:\s*.+/)) {
          const match = item.match(/^骑行:\s*(.+)/);
          if (match) {
            exercises.push({ id, type: '骑行', amount: match[1] });
          }
        } else if (item.match(/^类型:\s*.+/)) {
          const match = item.match(/^类型:\s*(.+)/);
          if (match) {
            exercises.push({ id, type: match[1], amount: '' });
          }
        } else if (item.match(/^时长:\s*.+/)) {
          const match = item.match(/^时长:\s*(.+)/);
          if (match) {
            exercises.push({ id, type: '运动时长', amount: match[1] });
          }
        } else if (item.match(/^循环:\s*\d+/)) {
          const match = item.match(/^循环:\s*(\d+)/);
          if (match) {
            exercises.push({ id, type: '训练循环', amount: `${match[1]}组` });
          }
        } else if (item.match(/^其他:\s*.+/)) {
          const match = item.match(/^其他:\s*(.+)/);
          if (match) {
            exercises.push({ id, type: '其他活动', amount: match[1] });
          }
        } else if (item.includes(':')) {
          const match = item.match(/^(.+?)[:：]\s*(.+)$/);
          if (match) {
            exercises.push({ id, type: match[1].trim(), amount: match[2].trim() });
          }
        } else {
          exercises.push({ id, type: item, amount: '' });
        }
      });
    });

    return exercises;
  };

  const updateExercise = (id: string, field: 'type' | 'amount', value: string) => {
    const updated = localExercises.map(ex =>
      ex.id === id ? { ...ex, [field]: value } : ex
    );
    setLocalExercises(updated);
    setHasChanges(true);
  };

  const removeExercise = (id: string) => {
    const updated = localExercises.filter(ex => ex.id !== id);
    setLocalExercises(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    // 过滤掉无效的运动记录（type和amount都为空的记录）
    const validExercises = localExercises.filter(ex =>
      ex.type.trim() !== '' || ex.amount.trim() !== ''
    );
    onChange(validExercises);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalExercises(exercises);
    setHasChanges(false);
  };

  return (
    <div className="space-y-2">
      {localExercises.map((exercise) => (
        <div key={exercise.id} className="flex gap-2 items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
          <div className="flex-1">
            <input
              type="text"
              value={exercise.type}
              onChange={(e) => updateExercise(exercise.id, 'type', e.target.value)}
              placeholder="运动类型"
              className="w-full p-1.5 text-xs border-0 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={exercise.amount}
              onChange={(e) => updateExercise(exercise.id, 'amount', e.target.value)}
              placeholder="运动量"
              className="w-full p-1.5 text-xs border-0 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            />
          </div>
          <button
            type="button"
            onClick={() => removeExercise(exercise.id)}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="删除"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* 批量导入界面 - 紧凑版 */}
      {showBatchInput && (
        <div className="mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="粘贴运动数据，例如：步数: 12345; 爬楼: 16层"
            rows={2}
            className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleBatchImport}
              className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs"
            >
              导入
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchText('');
                setShowBatchInput(false);
              }}
              className="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-xs"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1">
        <button
          type="button"
          onClick={addExercise}
          className="flex-1 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded text-xs text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1"
        >
          <PlusCircleIcon className="w-3 h-3" />
          添加运动
        </button>
        <button
          type="button"
          onClick={() => setShowBatchInput(!showBatchInput)}
          className="px-2 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded text-xs text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center"
          title="批量导入"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* 保存和取消按钮 */}
      {hasChanges && (
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
          >
            保存
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
};

// 可编辑字段组件
interface EditableMetricProps {
  value: number | null;
  unit: string;
  label: string;
  color: string;
  onSave: (value: string) => void;
}

const EditableMetric: React.FC<EditableMetricProps> = ({ value, unit, label, color, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="text-center">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          min={label === '体重' ? '20' : label === '饮水' ? '0' : label === '睡眠' ? '0' : '0'}
          max={label === '体重' ? '500' : label === '饮水' ? '20' : label === '睡眠' ? '24' : '1000'}
          step="0.1"
          className="w-16 text-center text-xl font-bold border border-gray-300 rounded px-1"
          placeholder={`输入${label}`}
          aria-label={`编辑${label}`}
          autoFocus
        />
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    );
  }

  return (
    <div className="text-center cursor-pointer" onClick={() => setIsEditing(true)}>
      <div className={`text-2xl font-bold ${color}`}>
        {value || 0}{unit}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
};

// 可编辑的每日记录卡片组件
interface EditableDailyLogCardProps {
  log: any;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onMealClick: (mealLog: any) => void;
  onDeleteMeal: (logId: string, mealType: string) => void;
  onEmptyMealClick: (mealType: 'breakfast' | 'lunch' | 'dinner', mealName: string, date: string, existingMeal?: any, dailyLogId?: number) => void;
}

const EditableDailyLogCard: React.FC<EditableDailyLogCardProps> = ({
  log,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
  onAnalyze,
  onMealClick,
  onDeleteMeal,
  onEmptyMealClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [waistValue, setWaistValue] = useState(log.waist_cm?.toString() || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExerciseManager, setShowExerciseManager] = useState(false);

  // 同步外部数据变化
  useEffect(() => {
    setWaistValue(log.waist_cm?.toString() || '');
  }, [log.waist_cm]);

  const handleFieldUpdate = (field: string, value: string) => {
    // 对于数值字段，在输入过程中不进行范围验证，只在失去焦点时验证
    onUpdate(log.id.toString(), field, value);
  };

  const handleFieldBlur = (field: string, value: string) => {
    // 在失去焦点时更新数据，让后端处理验证
    onUpdate(log.id.toString(), field, value);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyze(log.id.toString());
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 移除这个函数，它应该在外部组件中定义

  // 解析运动数据
  const parseExercises = (activityText: string): ExerciseEntry[] => {
    if (!activityText) return [];

    try {
      // 尝试解析JSON格式
      const parsed = JSON.parse(activityText);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // 如果不是JSON，尝试解析文本格式
      const lines = activityText.split('\n').filter(line => line.trim());
      const exercises: ExerciseEntry[] = [];

      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // 解析每一行中的多个运动项目
        const items = trimmedLine.split(';').map(item => item.trim()).filter(item => item);

        items.forEach((item, itemIndex) => {
          const id = `${lineIndex}-${itemIndex}`;

          // 匹配不同的格式模式
          if (item.match(/^步数:\s*\d+/)) {
            // 步数: 12345
            const match = item.match(/^步数:\s*(\d+)/);
            if (match) {
              exercises.push({
                id,
                type: '步数',
                amount: match[1]
              });
            }
          } else if (item.match(/^爬楼:\s*\d+层?/)) {
            // 爬楼: 16层
            const match = item.match(/^爬楼:\s*(\d+)层?/);
            if (match) {
              exercises.push({
                id,
                type: '爬楼',
                amount: `${match[1]}层`
              });
            }
          } else if (item.match(/^骑行:\s*.+/)) {
            // 骑行: 10min 或 骑行: 4.25km
            const match = item.match(/^骑行:\s*(.+)/);
            if (match) {
              exercises.push({
                id,
                type: '骑行',
                amount: match[1]
              });
            }
          } else if (item.match(/^类型:\s*.+/)) {
            // 类型: 力量训练
            const match = item.match(/^类型:\s*(.+)/);
            if (match) {
              exercises.push({
                id,
                type: match[1],
                amount: ''
              });
            }
          } else if (item.match(/^时长:\s*.+/)) {
            // 时长: 30min
            const match = item.match(/^时长:\s*(.+)/);
            if (match) {
              exercises.push({
                id,
                type: '运动时长',
                amount: match[1]
              });
            }
          } else if (item.match(/^循环:\s*\d+/)) {
            // 循环: 3
            const match = item.match(/^循环:\s*(\d+)/);
            if (match) {
              exercises.push({
                id,
                type: '训练循环',
                amount: `${match[1]}组`
              });
            }
          } else if (item.match(/^其他:\s*.+/)) {
            // 其他: 全身按摩1小时
            const match = item.match(/^其他:\s*(.+)/);
            if (match) {
              exercises.push({
                id,
                type: '其他活动',
                amount: match[1]
              });
            }
          } else if (item.includes(':')) {
            // 通用格式: 类型: 数值
            const match = item.match(/^(.+?)[:：]\s*(.+)$/);
            if (match) {
              exercises.push({
                id,
                type: match[1].trim(),
                amount: match[2].trim()
              });
            }
          } else {
            // 没有冒号的情况，整个作为类型
            exercises.push({
              id,
              type: item,
              amount: ''
            });
          }
        });
      });

      return exercises;
    }
    return [];
  };

  // 序列化运动数据
  const serializeExercises = (exercises: ExerciseEntry[]): string => {
    return JSON.stringify(exercises);
  };

  const exercises = parseExercises(log.activity || '');

  const handleExercisesChange = (newExercises: ExerciseEntry[]) => {
    // 过滤掉无效的运动记录（type和amount都为空的记录）
    const validExercises = newExercises.filter(ex =>
      ex.type.trim() !== '' && ex.amount.trim() !== ''
    );
    const serialized = serializeExercises(validExercises);
    handleFieldUpdate('activity', serialized);
  };

  return (
    <div className="relative group overflow-hidden bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 dark:from-gray-800/95 dark:via-gray-700/95 dark:to-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500">
      {/* 科技感边框光效 */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
      <div className="absolute inset-[1px] bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 dark:from-gray-800/90 dark:via-gray-700/90 dark:to-gray-800/90 rounded-2xl"></div>

      {/* 卡片头部 - 科技风格 */}
      <div className="relative flex items-center justify-between p-4 border-b border-gray-700/50">
        {/* 左侧：选择器和日期 */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(log.id.toString())}
              className="w-4 h-4 text-cyan-500 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
              aria-label="选择此记录"
            />
            <div className="absolute inset-0 bg-cyan-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50"></div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              {new Date(log.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </h3>
          </div>
        </div>

        {/* 右侧：控制按钮 */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="group/btn relative p-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 rounded-lg transition-all duration-300"
            title={isExpanded ? "收起详情" : "展开详情"}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 to-gray-500/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative text-gray-400 group-hover/btn:text-white transition-colors duration-300">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="group/btn relative p-2 bg-indigo-900/30 hover:bg-indigo-800/40 border border-indigo-600/50 hover:border-indigo-500/50 rounded-lg transition-all duration-300 disabled:opacity-50"
            title={isAnalyzing ? "正在生成AI小结..." : "生成AI小结"}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative text-indigo-400 group-hover/btn:text-indigo-300 transition-colors duration-300">
              {isAnalyzing ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onDelete(log.id.toString())}
            className="group/btn relative p-2 bg-red-900/30 hover:bg-red-800/40 border border-red-600/50 hover:border-red-500/50 rounded-lg transition-all duration-300"
            title="删除记录"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-pink-600/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative text-red-400 group-hover/btn:text-red-300 transition-colors duration-300">
              <Trash2 className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* 卡片主体 - 科技风格布局 */}
      <div className="relative p-4 space-y-4">
        {/* 科技风格数据面板 */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {/* 体重 */}
          <div className="group relative overflow-hidden bg-gray-900/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:border-indigo-500/50">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="text-indigo-400 opacity-80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              </div>
              <EditableMetric
                value={log.weight_kg}
                unit="kg"
                label="WEIGHT"
                color="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
                onSave={(value) => handleFieldUpdate('weight_kg', value)}
              />
            </div>
          </div>

          {/* 饮水 */}
          <div className="group relative overflow-hidden bg-gray-900/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:border-cyan-500/50">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="text-cyan-400 opacity-80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <EditableMetric
                value={log.water_l}
                unit="L"
                label="HYDRATION"
                color="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400"
                onSave={(value) => handleFieldUpdate('water_l', value)}
              />
            </div>
          </div>

          {/* 睡眠 */}
          <div className="group relative overflow-hidden bg-gray-900/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:border-purple-500/50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="text-purple-400 opacity-80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <EditableMetric
                value={log.sleep_h}
                unit="h"
                label="SLEEP"
                color="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400"
                onSave={(value) => handleFieldUpdate('sleep_h', value)}
              />
            </div>
          </div>

          {/* 摄入 */}
          <div className="group relative overflow-hidden bg-gray-900/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:border-green-500/50">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative text-center">
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-400 opacity-80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                {log.actual_intake || 0}
              </div>
              <div className="text-xs font-bold text-green-400/80 uppercase tracking-wider">INTAKE</div>
            </div>
          </div>

          {/* 消耗 */}
          <div className="group relative overflow-hidden bg-gray-900/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:border-orange-500/50">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative text-center">
              <div className="flex items-center justify-between mb-2">
                <div className="text-orange-400 opacity-80">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                {log.estimated_expenditure || 0}
              </div>
              <div className="text-xs font-bold text-orange-400/80 uppercase tracking-wider">BURN</div>
            </div>
          </div>
        </div>



        {/* 三餐记录 - 优化布局 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            三餐记录
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: '早餐', type: 'breakfast', icon: '🌅', color: 'from-orange-500/20 to-yellow-500/20', borderColor: 'border-orange-500/30' },
              { name: '午餐', type: 'lunch', icon: '☀️', color: 'from-green-500/20 to-emerald-500/20', borderColor: 'border-green-500/30' },
              { name: '晚餐', type: 'dinner', icon: '🌙', color: 'from-purple-500/20 to-indigo-500/20', borderColor: 'border-purple-500/30' }
            ].map(({ name, type, icon, color, borderColor }) => {
              const mealLog = (log as any)[type];
              return (
                <div key={name} className={`group relative overflow-hidden bg-gray-900/60 dark:bg-gray-800/60 backdrop-blur-sm border ${borderColor} rounded-xl transition-all duration-300 hover:scale-105 hover:border-opacity-80`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="relative">
                    {mealLog && mealLog.image_path ? (
                      // 有图片的餐食记录 - 科技风格
                      <div className="cursor-pointer" onClick={() => onMealClick(mealLog)}>
                        <div className="relative">
                          <img
                            src={getImageUrl(mealLog.image_path)}
                            alt={name}
                            className="w-full h-24 object-cover rounded-t-xl"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded-t-xl">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                              <button
                                type="button"
                                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
                                title="查看详情"
                              >
                                <FileText className="w-4 h-4 text-indigo-600" />
                              </button>
                              <button
                                type="button"
                                className="p-2 bg-blue-500/90 backdrop-blur-sm rounded-full hover:bg-blue-500 transition-all"
                                title="重新录入"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEmptyMealClick(type as 'breakfast' | 'lunch' | 'dinner', name, log.date, mealLog, log.id);
                                }}
                              >
                                <Camera className="w-4 h-4 text-white" />
                              </button>
                              <button
                                type="button"
                                className="p-2 bg-red-500/90 backdrop-blur-sm rounded-full hover:bg-red-500 transition-all"
                                title="删除餐食"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMeal(log.id.toString(), name);
                                }}
                              >
                                <TrashIcon className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{icon}</span>
                              <span className="text-sm font-medium text-white">{name}</span>
                            </div>
                            <div className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                              {(() => {
                                // 优先使用 analysis_data 中的卡路里
                                if (mealLog.analysis_data?.estimatedCalories) {
                                  return Math.round(mealLog.analysis_data.estimatedCalories);
                                }
                                // 如果没有，尝试从文本中提取卡路里
                                const calorieMatch = mealLog.text?.match(/\((\d+)\s*kcal\)/);
                                return calorieMatch ? parseInt(calorieMatch[1]) : 0;
                              })()} kcal
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-300 mb-1 line-clamp-1">
                            {mealLog.analysis_data?.generatedMealName || '未命名餐食'}
                          </div>
                          {mealLog.text && (
                            <div className="text-xs text-gray-400 line-clamp-1">
                              {(() => {
                                // 移除卡路里信息，只显示食物内容
                                const foodText = mealLog.text.replace(/\s*\(\d+\s*kcal\)\s*$/, '');
                                return foodText.length > 30 ? foodText.substring(0, 30) + '...' : foodText;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : mealLog && mealLog.text ? (
                      // 只有文字的餐食记录 - 科技风格
                      <div className="cursor-pointer p-3" onClick={() => onMealClick(mealLog)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{icon}</span>
                            <span className="text-sm font-medium text-white">{name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-1 rounded-full border border-blue-500/30">
                              <FileText className="w-3 h-3 mr-1"/>
                              文字
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                              <button
                                type="button"
                                className="p-1 bg-blue-500/90 backdrop-blur-sm rounded-full hover:bg-blue-500 transition-all"
                                title="重新录入"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEmptyMealClick(type as 'breakfast' | 'lunch' | 'dinner', name, log.date, mealLog, log.id);
                                }}
                              >
                                <Camera className="w-3 h-3 text-white" />
                              </button>
                              <button
                                type="button"
                                className="p-1 bg-red-500/90 backdrop-blur-sm rounded-full hover:bg-red-500 transition-all"
                                title="删除餐食"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMeal(log.id.toString(), name);
                                }}
                              >
                                <TrashIcon className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm font-medium text-gray-300 mb-2 line-clamp-1">
                          {mealLog.analysis_data?.generatedMealName || '未命名餐食'}
                        </div>

                        {mealLog.text && (
                          <div className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                            {(() => {
                              // 移除卡路里信息，只显示食物内容
                              const foodText = mealLog.text.replace(/\s*\(\d+\s*kcal\)\s*$/, '');
                              return foodText;
                            })()}
                          </div>
                        )}

                        {/* 营养信息 - 科技风格 */}
                        <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-2 border border-gray-700/50">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center">
                              <div className="text-sm font-bold text-green-400">
                                {(() => {
                                  // 优先使用 analysis_data 中的卡路里
                                  if (mealLog.analysis_data?.estimatedCalories) {
                                    return Math.round(mealLog.analysis_data.estimatedCalories);
                                  }
                                  // 如果没有，尝试从文本中提取卡路里
                                  const calorieMatch = mealLog.text?.match(/\((\d+)\s*kcal\)/);
                                  return calorieMatch ? parseInt(calorieMatch[1]) : 0;
                                })()}
                              </div>
                              <div className="text-xs text-gray-500">热量</div>
                            </div>
                            {mealLog.analysis_data && (
                              <div className="text-center">
                                <div className="text-xs text-gray-300">
                                  蛋白 {Math.round(mealLog.analysis_data.estimatedProteinG || 0)}g
                                </div>
                                <div className="text-xs text-gray-300">
                                  碳水 {Math.round(mealLog.analysis_data.estimatedCarbsG || 0)}g
                                </div>
                                <div className="text-xs text-gray-500">
                                  脂肪 {Math.round(mealLog.analysis_data.estimatedFatG || 0)}g
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 空的餐食记录 - 科技风格
                      <div
                        className="p-4 text-center border-2 border-dashed border-gray-600/50 rounded-xl cursor-pointer hover:border-indigo-400/80 transition-all duration-300 group"
                        onClick={() => onEmptyMealClick(type as 'breakfast' | 'lunch' | 'dinner', name, log.date)}
                      >
                        <div className="flex items-center justify-center mb-3">
                          <span className="text-2xl mr-2">{icon}</span>
                          <span className="text-lg font-medium text-gray-400">{name}</span>
                        </div>
                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-700/50 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 border border-gray-600/50 group-hover:border-indigo-400/50 transition-all duration-300">
                          <FileText className="w-6 h-6 text-gray-400 group-hover:text-indigo-400 transition-colors duration-300" />
                        </div>
                        <div className="text-sm text-gray-400 group-hover:text-indigo-300 transition-colors duration-300 mb-1">
                          点击添加餐食
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-indigo-400 transition-colors duration-300">
                          支持图片或文字录入
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 展开/收起按钮 - 优化样式 */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all"
        >
          <span className="mr-2 font-medium">{isExpanded ? '收起详情' : '展开详情'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* 详细信息 - 科技风格控制面板 */}
        {isExpanded && (
          <div className="relative mt-6">
            {/* 科技感分割线 */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

            <div className="pt-6 space-y-6">
              {/* 控制面板网格 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 左侧：身体数据面板 */}
                <div className="lg:col-span-4 space-y-4">
                  {/* 腰围输入 - 科技风格 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-gray-900/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                        <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">WAIST MEASUREMENT</label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={waistValue}
                          onChange={(e) => setWaistValue(e.target.value)}
                          onBlur={(e) => handleFieldBlur('waist_cm', e.target.value)}
                          placeholder="000.0"
                          min="30"
                          max="200"
                          step="0.1"
                          className="w-full bg-transparent border-2 border-gray-700 focus:border-cyan-500 rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none transition-colors duration-300 placeholder-gray-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400 text-sm font-mono">CM</div>
                      </div>
                    </div>
                  </div>

                  {/* 营养数据面板 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-gray-900/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center mb-4">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                        <h5 className="text-xs font-bold text-purple-400 uppercase tracking-wider">NUTRITION MATRIX</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'PROTEIN', value: log.protein_g || 0, unit: 'g', color: 'from-blue-500 to-cyan-500', textColor: 'text-cyan-400' },
                          { label: 'CARBS', value: log.carbs_g || 0, unit: 'g', color: 'from-orange-500 to-yellow-500', textColor: 'text-orange-400' },
                          { label: 'FAT', value: log.fat_g || 0, unit: 'g', color: 'from-red-500 to-pink-500', textColor: 'text-red-400' },
                          { label: 'BMR', value: log.bmr || 0, unit: '', color: 'from-purple-500 to-indigo-500', textColor: 'text-purple-400' }
                        ].map((item) => (
                          <div key={item.label} className="relative overflow-hidden bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10`}></div>
                            <div className="relative">
                              <div className="text-xs text-gray-400 font-mono mb-1">{item.label}</div>
                              <div className={`text-lg font-bold font-mono ${item.textColor}`}>
                                {item.value}{item.unit}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 中间：运动控制台 */}
                <div className="lg:col-span-4">
                  <div className="relative group h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-gray-900/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                          <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider">EXERCISE CONTROL</h5>
                        </div>
                        {exercises.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowExerciseManager(!showExerciseManager)}
                            className="text-xs text-green-400 hover:text-green-300 font-mono uppercase tracking-wider transition-colors duration-300"
                          >
                            {showExerciseManager ? 'HIDE' : 'EDIT'}
                          </button>
                        )}
                      </div>

                      {/* 只有在没有运动记录或者显示管理器时才显示输入界面 */}
                      {(exercises.length === 0 || showExerciseManager) && (
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                          <ExerciseManager
                            exercises={exercises}
                            onChange={handleExercisesChange}
                          />
                        </div>
                      )}

                      {/* 当有运动记录且不显示管理器时，显示运动数据 */}
                      {exercises.length > 0 && !showExerciseManager && (
                        <div className="space-y-3">
                          {/* 运动统计概览 */}
                          <div className="mb-4">
                            <div className="relative overflow-hidden bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-10"></div>
                              <div className="relative text-center">
                                <div className="text-xs text-gray-400 font-mono mb-2">TOTAL EXERCISES</div>
                                <div className="text-2xl font-bold font-mono text-green-400">
                                  {exercises.length}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 运动详情列表 */}
                          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                            {exercises.map((exercise, index) => (
                              <div key={exercise.id || index} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/20">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-green-400 truncate">
                                    {exercise.type || '未命名运动'}
                                  </div>
                                  {exercise.amount && (
                                    <div className="text-xs text-gray-400 font-mono">
                                      {exercise.amount}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右侧：AI分析面板 */}
                <div className="lg:col-span-4">
                  {log.summary && (
                    <div className="relative group h-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-gray-900/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full">
                        <div className="flex items-center mb-4">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></div>
                          <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI ANALYSIS</h5>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 h-full">
                          <div className="text-sm text-gray-300 leading-relaxed font-light">
                            {log.summary}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DailyLogPage: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [showMealInputModal, setShowMealInputModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<{
    type: 'breakfast' | 'lunch' | 'dinner';
    name: string;
    date: string;
    existingMeal?: any;
    dailyLogId?: number;
  } | null>(null);
  const { data: logs, isLoading, refetch } = useDailyLogs();

  const handleSelectAll = () => {
    if (selectedIds.size === logs?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs?.map(log => log.id.toString()) || []));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMealClick = (mealLog: any) => {
    setSelectedMeal(mealLog);
  };

  const handleDeleteMeal = async (logId: string, mealType: string) => {
    if (!confirm(`确定要删除${mealType}记录吗？`)) {
      return;
    }

    try {
      // URL编码餐食类型
      const encodedMealType = encodeURIComponent(mealType);
      const response = await fetch(`/api/meals/daily-logs/${logId}/meals/${encodedMealType}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        refetch(); // 刷新数据
      } else {
        const errorData = await response.json();
        alert(`删除失败：${errorData.detail || '请重试'}`);
      }
    } catch (error) {
      console.error('删除餐食记录失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleEmptyMealClick = (mealType: 'breakfast' | 'lunch' | 'dinner', mealName: string, date: string, existingMeal?: any, dailyLogId?: number) => {
    setSelectedMealType({ type: mealType, name: mealName, date, existingMeal, dailyLogId });
    setShowMealInputModal(true);
  };

  const handleMealInputSuccess = () => {
    refetch(); // 刷新数据
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    try {
      // 数值字段需要类型转换和验证
      const numericFields = ['weight_kg', 'waist_cm', 'water_l', 'sleep_h', 'bmr', 'tdee', 'actual_intake', 'estimated_expenditure', 'protein_g', 'carbs_g', 'fat_g', 'calorie_deficit'];

      let processedValue = value;
      if (numericFields.includes(field)) {
        // 如果是空字符串，发送 null
        if (value === '' || value === null || value === undefined) {
          processedValue = null;
        } else {
          // 尝试转换为数字
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            alert(`请输入有效的数字`);
            return;
          }

          // 基本范围检查（让后端处理详细验证）
          if (numValue < 0) {
            alert('请输入正数');
            return;
          }

          processedValue = numValue;
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/daily-logs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: processedValue }),
      });

      if (response.ok) {
        refetch();
      } else {
        const errorData = await response.json();
        console.error('更新失败:', errorData);
        alert(`更新失败: ${errorData.detail || '请稍后重试'}`);
      }
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败，请检查网络连接');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/daily-logs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        refetch();
      } else {
        alert('删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请检查网络连接');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    if (window.confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) {
      try {
        const token = localStorage.getItem('token');
        const deletePromises = Array.from(selectedIds).map(id =>
          fetch(`/api/daily-logs/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        );

        await Promise.all(deletePromises);
        setSelectedIds(new Set());
        refetch();
      } catch (error) {
        console.error('批量删除失败:', error);
        alert('批量删除失败，请稍后重试');
      }
    }
  };

  const handleAnalyzeOne = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/meals/analyze-full-day/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('AI分析完成！');
          refetch();
        } else {
          alert('AI分析失败，请稍后重试');
        }
      } else {
        const errorData = await response.json();
        if (errorData.detail?.includes('API_KEY_MISSING')) {
          alert('请先在设置页面配置Gemini API密钥');
        } else {
          alert('AI分析失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('AI分析错误:', error);
      alert('AI分析失败，请检查网络连接');
    }
  };

  const handleBatchAnalyze = async () => {
    if (selectedIds.size === 0) {
      alert('请先选择要分析的记录');
      return;
    }

    const confirmMessage = `确定要对选中的 ${selectedIds.size} 条记录进行批量分析吗？`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const selectedIdsArray = Array.from(selectedIds);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/meals/batch-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          log_ids: selectedIdsArray.map(id => parseInt(id))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`批量分析完成！成功分析 ${result.success_count} 条记录，失败 ${result.failed_count} 条记录`);
        setSelectedIds(new Set()); // 清空选择
        refetch(); // 刷新数据
      } else {
        const errorData = await response.json();
        if (errorData.detail?.includes('API_KEY_MISSING')) {
          alert('请先在设置页面配置Gemini API密钥');
        } else {
          alert(`批量分析失败：${errorData.detail || '请重试'}`);
        }
      }
    } catch (error) {
      console.error('批量分析失败:', error);
      alert('批量分析失败，请重试');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black">
      {/* 科技感背景网格 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      <div className="relative max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              {/* 标题光效 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg blur opacity-20"></div>
              <div className="relative">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
                  FITNESS DASHBOARD
                </h1>
                <p className="text-gray-400 font-mono text-sm uppercase tracking-wider">
                  HEALTH DATA MANAGEMENT SYSTEM
                </p>
              </div>
            </div>
          <div className="flex flex-wrap gap-3 items-center justify-start sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <PlusIcon className="w-5 h-5 mr-2" />
                <span className="font-mono text-sm uppercase tracking-wider">NEW RECORD</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="group relative inline-flex items-center px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 text-gray-300 hover:text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <UploadIcon className="w-5 h-5 mr-2" />
                <span className="font-mono text-sm uppercase tracking-wider">IMPORT DATA</span>
              </div>
            </button>
          </div>
        </div>
      </div>



      {/* 批量操作栏 */}
      {logs && logs.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === logs.length && logs.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  全选 ({selectedIds.size}/{logs.length})
                </span>
              </label>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleBatchAnalyze}
                  className="inline-flex items-center px-3 py-1.5 border border-indigo-500 shadow-sm text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  批量分析
                </button>
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="inline-flex items-center px-3 py-1.5 border border-red-500 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除所选
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 记录列表 */}
      {!logs || logs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无记录</h3>
          <p className="text-gray-500 dark:text-gray-400">点击"新建记录"按钮开始记录您的健康数据吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <EditableDailyLogCard
              key={log.id}
              log={log}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              isSelected={selectedIds.has(log.id.toString())}
              onSelect={handleSelectOne}
              onAnalyze={handleAnalyzeOne}
              onMealClick={handleMealClick}
              onDeleteMeal={handleDeleteMeal}
              onEmptyMealClick={handleEmptyMealClick}
            />
          ))}
        </div>
      )}

      {/* 模态框 */}
      <AddDailyLogModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetch}
      />

      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={refetch}
      />

      <MealDetailModal
        isOpen={!!selectedMeal}
        onClose={() => setSelectedMeal(null)}
        meal={selectedMeal}
        onReanalyze={() => {
          refetch(); // 刷新数据
        }}
      />

      <MealInputModal
        isOpen={showMealInputModal}
        onClose={() => setShowMealInputModal(false)}
        mealType={selectedMealType?.type || 'lunch'}
        mealName={selectedMealType?.name || ''}
        date={selectedMealType?.date || ''}
        existingMeal={selectedMealType?.existingMeal}
        dailyLogId={selectedMealType?.dailyLogId}
        onSuccess={handleMealInputSuccess}
      />
      </div>
    </div>
  );
};



