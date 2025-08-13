
import React from 'react';
import type { MealLog } from '../types';
import { XIcon, SparklesIcon, TagIcon, ClipboardListIcon, SunIcon, BookOpenIcon, RefreshIcon, NutritionIcon } from './Icons';

interface AnalysisDetailModalProps {
    meal: MealLog;
    onClose: () => void;
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

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
    };
    const className = colorMap[color] || 'bg-gray-200 text-gray-800';
    return (
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mr-2 mb-2 ${className}`}>
           {color}
        </span>
    );
};


export const AnalysisDetailModal: React.FC<AnalysisDetailModalProps> = ({ meal, onClose }) => {
    const analysis = meal.analysis;

    if (!analysis) {
        return (
             <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">无详细分析</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">此餐食没有详细的AI分析记录。</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">请尝试使用“AI智能膳食日志”功能重新记录以生成详细分析。</p>
                    <button
                        onClick={onClose}
                        className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        关闭
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Left side: Image */}
                <div className="w-full md:w-1/2 flex-shrink-0 bg-gray-100 dark:bg-gray-900">
                    {meal.image ? (
                        <img src={meal.image} alt={analysis.generatedMealName} className="w-full h-full object-cover"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">无图片</div>
                    )}
                </div>

                {/* Right side: Analysis Details */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-flex items-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                <SparklesIcon className="w-3 h-3 mr-1.5"/>
                                AI 智能分析
                            </span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{analysis.generatedMealName}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{analysis.cuisineStyle}</p>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>

                    <div className="mt-6 space-y-6">
                        <DetailSection title="描述" icon={<BookOpenIcon className="w-4 h-4" />}>
                           <p className="leading-relaxed">{analysis.description}</p>
                        </DetailSection>

                         <DetailSection title="估算营养" icon={<NutritionIcon className="w-4 h-4" />}>
                           <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <span><strong className="font-semibold text-indigo-500">{Math.round(analysis.estimatedCalories)}</strong> kcal</span>
                                <span>蛋白: <strong>{Math.round(analysis.estimatedProteinG)}g</strong></span>
                                <span>碳水: <strong>{Math.round(analysis.estimatedCarbsG)}g</strong></span>
                                <span>脂肪: <strong>{Math.round(analysis.estimatedFatG)}g</strong></span>
                           </div>
                        </DetailSection>

                        <DetailSection title="标签" icon={<TagIcon className="w-4 h-4" />}>
                            <div className="flex flex-wrap">
                                {analysis.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                            </div>
                        </DetailSection>

                        <DetailSection title="识别物体" icon={<ClipboardListIcon className="w-4 h-4" />}>
                            <div className="flex flex-wrap">
                                {analysis.identifiedIngredients.map(item => <Tag key={item}>{item}</Tag>)}
                            </div>
                        </DetailSection>

                        <DetailSection title="颜色信息" icon={<SunIcon className="w-4 h-4" />}>
                             <div className="flex flex-wrap">
                                {analysis.dominantColors.map(color => <ColorTag key={color} color={color} />)}
                            </div>
                        </DetailSection>
                    </div>
                     <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                         <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
