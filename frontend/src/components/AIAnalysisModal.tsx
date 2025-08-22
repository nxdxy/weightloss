import React from 'react';

// 简单的图标组件
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 1.5L5 6l1.5 1.5L5 9l1.5 1.5L5 12l1.5 1.5L5 15l1.5 1.5L5 18l1.5 1.5L5 21M19 3l-1.5 1.5L19 6l-1.5 1.5L19 9l-1.5 1.5L19 12l-1.5 1.5L19 15l-1.5 1.5L19 18l-1.5 1.5L19 21" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Tag = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Palette = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
);

interface AIAnalysisResult {
  title: string;
  cuisine: string;
  description: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
  ingredients: string[];
  colors: string[];
}

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  analysis: AIAnalysisResult | null;
  isAnalyzing: boolean;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  analysis,
  isAnalyzing
}) => {
  if (!isOpen) return null;

  const colorMap: { [key: string]: string } = {
    '深紫色': 'bg-purple-800',
    '绿色': 'bg-green-500',
    '橙色': 'bg-orange-500',
    '棕色': 'bg-amber-700',
    '白色': 'bg-gray-100 border border-gray-300',
    '黄色': 'bg-yellow-400',
    '红色': 'bg-red-500',
    '黑色': 'bg-gray-900'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
        {/* 左侧图片 */}
        <div className="w-1/2 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="食物图片"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* 右侧分析结果 */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                AI 智能分析
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="关闭"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">正在分析中...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* 标题和菜系 */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {analysis.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analysis.cuisine}
                </p>
              </div>

              {/* 描述 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">描述</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {analysis.description}
                </p>
              </div>

              {/* 营养信息 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">估算营养</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {analysis.nutrition.calories} kcal
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">热量</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {analysis.nutrition.protein}g
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">蛋白质</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {analysis.nutrition.carbs}g
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">碳水</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {analysis.nutrition.fat}g
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">脂肪</div>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标签</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 识别物体 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">识别物体</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              {/* 颜色信息 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">颜色信息</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${colorMap[color] || 'bg-gray-400'}`}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 关闭按钮 */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500 dark:text-gray-400">分析失败，请重试</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
