import React, { useState } from 'react';
import { getImageUrl } from '../lib/api';

// 自定义图标组件
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

const Tag = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const List = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const Palette = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
  </svg>
);

const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const Activity = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: any;
  onReanalyze?: () => void;
}

const DetailSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <div className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
      {icon}
      <h4 className="ml-2 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="text-sm text-gray-800 dark:text-gray-200 pl-7">{children}</div>
  </div>
);

const Tag_: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 mr-2 mb-2">
    {children}
  </span>
);

const ColorTag: React.FC<{ color: string }> = ({ color }) => {
  const colorMap: { [key: string]: string } = {
    '红色': 'bg-red-200 text-red-800', 'red': 'bg-red-200 text-red-800',
    '绿色': 'bg-green-200 text-green-800', 'green': 'bg-green-200 text-green-800',
    '蓝色': 'bg-blue-200 text-blue-800', 'blue': 'bg-blue-200 text-blue-800',
    '黄色': 'bg-yellow-200 text-yellow-800', 'yellow': 'bg-yellow-200 text-yellow-800',
    '橙色': 'bg-orange-200 text-orange-800', 'orange': 'bg-orange-200 text-orange-800',
    '紫色': 'bg-purple-200 text-purple-800', 'purple': 'bg-purple-200 text-purple-800',
    '白色': 'bg-gray-100 text-gray-800 border border-gray-300', 'white': 'bg-gray-100 text-gray-800 border border-gray-300',
    '黑色': 'bg-gray-800 text-gray-100', 'black': 'bg-gray-800 text-gray-100',
    '棕色': 'bg-yellow-800 text-yellow-100', 'brown': 'bg-yellow-800 text-yellow-100',
    '深紫色': 'bg-purple-800 text-purple-100', '深色': 'bg-gray-800 text-gray-100',
  };
  const className = colorMap[color] || 'bg-gray-200 text-gray-800';
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mr-2 mb-2 ${className}`}>
      {color}
    </span>
  );
};

export const MealDetailModal: React.FC<MealDetailModalProps> = ({ isOpen, onClose, meal, onReanalyze }) => {
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  if (!isOpen || !meal) return null;

  const analysis = meal.analysis_data;
  const hasImage = meal.image_path && meal.image_path.trim() !== '';

  const handleReanalyze = async () => {
    if (!meal.id) return;

    setIsReanalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/meals/reanalyze/${meal.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('餐食重新分析完成！');
          onReanalyze?.();
          onClose();
        } else {
          alert('重新分析失败，请稍后重试');
        }
      } else {
        const errorData = await response.json();
        if (errorData.detail?.includes('API_KEY_MISSING')) {
          alert('请先在设置页面配置Gemini API密钥');
        } else {
          alert('重新分析失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('重新分析错误:', error);
      alert('重新分析失败，请检查网络连接');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // 完整的图文分析界面
  const renderCompleteAnalysis = () => (
    <>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 mr-1.5"/>
              AI 智能分析
            </span>
            <button
              type="button"
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                isReanalyzing
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20'
              }`}
              title={isReanalyzing ? "正在重新分析..." : "重新分析"}
            >
              {isReanalyzing ? (
                <div className="w-3 h-3 animate-spin rounded-full border border-indigo-500 border-t-transparent mr-1"></div>
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              {isReanalyzing ? '分析中...' : '重新分析'}
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {analysis?.generatedMealName || '餐食记录'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {analysis?.cuisineStyle || ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="关闭"
        >
          <X className="w-6 h-6"/>
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <DetailSection title="描述" icon={<BookOpen className="w-4 h-4" />}>
          <p className="leading-relaxed">{analysis?.description || '暂无描述'}</p>
        </DetailSection>

        <DetailSection title="估算营养" icon={<Activity className="w-4 h-4" />}>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span><strong className="font-semibold text-indigo-500">{Math.round(analysis?.estimatedCalories || 0)}</strong> kcal</span>
            <span>蛋白: <strong>{Math.round(analysis?.estimatedProteinG || 0)}g</strong></span>
            <span>碳水: <strong>{Math.round(analysis?.estimatedCarbsG || 0)}g</strong></span>
            <span>脂肪: <strong>{Math.round(analysis?.estimatedFatG || 0)}g</strong></span>
          </div>
        </DetailSection>

        <DetailSection title="标签" icon={<Tag className="w-4 h-4" />}>
          <div className="flex flex-wrap">
            {analysis?.tags && analysis.tags.length > 0 ? (
              analysis.tags.map((tag: string, index: number) => <Tag_ key={index}>{tag}</Tag_>)
            ) : (
              <span className="text-gray-500">暂无标签</span>
            )}
          </div>
        </DetailSection>

        <DetailSection title="识别物体" icon={<List className="w-4 h-4" />}>
          <div className="flex flex-wrap">
            {analysis?.identifiedIngredients && analysis.identifiedIngredients.length > 0 ? (
              analysis.identifiedIngredients.map((ingredient: string, index: number) => <Tag_ key={index}>{ingredient}</Tag_>)
            ) : (
              <span className="text-gray-500">暂无识别食材</span>
            )}
          </div>
        </DetailSection>

        <DetailSection title="颜色信息" icon={<Palette className="w-4 h-4" />}>
          <div className="flex flex-wrap">
            {analysis?.dominantColors && analysis.dominantColors.length > 0 ? (
              analysis.dominantColors.map((color: string, index: number) => <ColorTag key={index} color={color} />)
            ) : (
              <span className="text-gray-500">暂无颜色信息</span>
            )}
          </div>
        </DetailSection>

        {/* 减脂专业评价 */}
        {(analysis?.fatLossRating || (analysis?.fatLossAdvantages && analysis.fatLossAdvantages.length > 0) || (analysis?.fatLossDisadvantages && analysis.fatLossDisadvantages.length > 0) || (analysis?.improvementTips && analysis.improvementTips.length > 0)) && (
          <DetailSection title="减脂专业评价" icon={<Activity className="w-4 h-4 text-green-500" />}>
            <div className="space-y-4">
              {/* 减脂适宜度评分 */}
              {analysis?.fatLossRating && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">减脂适宜度:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(10)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < (analysis.fatLossRating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {analysis.fatLossRating}/10
                    </span>
                  </div>
                </div>
              )}

              {/* 减脂分析 */}
              {(analysis?.fatLossAdvantages?.length > 0 || analysis?.fatLossDisadvantages?.length > 0) ? (
                <div className="space-y-3">
                  {analysis.fatLossAdvantages && analysis.fatLossAdvantages.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        优点
                      </h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 leading-relaxed space-y-1">
                        {analysis.fatLossAdvantages.map((advantage, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-0.5">•</span>
                            <span>{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.fatLossDisadvantages && analysis.fatLossDisadvantages.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                      <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2 flex items-center">
                        <span className="text-orange-500 mr-2">⚠</span>
                        缺点
                      </h4>
                      <ul className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed space-y-1">
                        {analysis.fatLossDisadvantages.map((disadvantage, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-orange-500 mr-2 mt-0.5">•</span>
                            <span>{disadvantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">专业分析</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                    AI分析暂时不完整，建议点击"重新分析"获取详细的减脂评价。
                  </p>
                </div>
              )}

              {/* 改进建议 */}
              {analysis?.improvementTips && analysis.improvementTips.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">改进建议</h4>
                  <ul className="space-y-1">
                    {analysis.improvementTips.map((tip: string, index: number) => (
                      <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DetailSection>
        )}
      </div>
    </>
  );

  // 纯文字餐食的简化界面
  const renderTextOnlyAnalysis = () => (
    <>
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
              <BookOpen className="w-3 h-3 mr-1.5"/>
              文字记录
            </span>
            <button
              type="button"
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                isReanalyzing
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20'
              }`}
              title={isReanalyzing ? "正在重新分析..." : "重新分析"}
            >
              {isReanalyzing ? (
                <div className="w-3 h-3 animate-spin rounded-full border border-indigo-500 border-t-transparent mr-1"></div>
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              {isReanalyzing ? '分析中...' : '重新分析'}
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {analysis?.generatedMealName || '餐食记录'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {analysis?.cuisineStyle || ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="关闭"
        >
          <X className="w-6 h-6"/>
        </button>
      </div>

      {/* 营养信息卡片 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-indigo-500" />
          营养成分
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(analysis?.estimatedCalories || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">热量 (kcal)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.round(analysis?.estimatedProteinG || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">蛋白质 (g)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(analysis?.estimatedCarbsG || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">碳水 (g)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Math.round(analysis?.estimatedFatG || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">脂肪 (g)</div>
          </div>
        </div>
      </div>

      {/* 描述 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-gray-500" />
          描述
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          {analysis?.description || '暂无描述'}
        </p>
      </div>

      {/* 标签 */}
      {analysis?.tags && analysis.tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-gray-500" />
            标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.tags.map((tag: string, index: number) => (
              <Tag_ key={index}>{tag}</Tag_>
            ))}
          </div>
        </div>
      )}

      {/* 减脂专业评价 */}
      {(analysis?.fatLossRating || (analysis?.fatLossAdvantages && analysis.fatLossAdvantages.length > 0) || (analysis?.fatLossDisadvantages && analysis.fatLossDisadvantages.length > 0) || (analysis?.improvementTips && analysis.improvementTips.length > 0)) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-500" />
            减脂专业评价
          </h3>
          <div className="space-y-4">
            {/* 减脂适宜度评分 */}
            {analysis?.fatLossRating && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">减脂适宜度:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(10)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < (analysis.fatLossRating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {analysis.fatLossRating}/10
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 减脂分析 */}
            {(analysis?.fatLossAdvantages?.length > 0 || analysis?.fatLossDisadvantages?.length > 0) ? (
              <div className="space-y-3">
                {analysis.fatLossAdvantages && analysis.fatLossAdvantages.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      优点
                    </h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 leading-relaxed space-y-1">
                      {analysis.fatLossAdvantages.map((advantage, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2 mt-0.5">•</span>
                          <span>{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.fatLossDisadvantages && analysis.fatLossDisadvantages.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2 flex items-center">
                      <span className="text-orange-500 mr-2">⚠</span>
                      缺点
                    </h4>
                    <ul className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed space-y-1">
                      {analysis.fatLossDisadvantages.map((disadvantage, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-500 mr-2 mt-0.5">•</span>
                          <span>{disadvantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">专业分析</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                  AI分析暂时不完整，建议点击"重新分析"获取详细的减脂评价。
                </p>
              </div>
            )}

            {/* 改进建议 */}
            {analysis?.improvementTips && analysis.improvementTips.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">改进建议</h4>
                <ul className="space-y-1">
                  {analysis.improvementTips.map((tip: string, index: number) => (
                    <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden ${
          hasImage ? 'max-w-4xl flex flex-col md:flex-row' : 'max-w-2xl flex flex-col'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {hasImage ? (
          <>
            {/* Left side: Image */}
            <div className="w-full md:w-1/2 flex-shrink-0 bg-gray-100 dark:bg-gray-900">
              <img
                src={getImageUrl(meal.image_path)}
                alt={analysis?.generatedMealName || '餐食'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right side: Complete Analysis Details */}
            <div className="w-full md:w-1/2 p-6 overflow-y-auto">
              {/* 完整的图文分析界面 */}
              {renderCompleteAnalysis()}
            </div>
          </>
        ) : (
          /* 纯文字餐食的简化界面 */
          <div className="w-full p-6 overflow-y-auto">
            {renderTextOnlyAnalysis()}
          </div>
        )}
      </div>
    </div>
  );
};
