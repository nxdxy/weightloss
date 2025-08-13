
import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { DailyLogEntry, AnalyzedMealData, FullDayAnalysisData, UserInfo, Page, MealLog } from '../types';
import { UploadIcon, SparklesIcon, CameraIcon, UserIcon, XIcon, TrashIcon, CheckIcon, ScaleIcon, WaterDropIcon, ClockIcon, ActivityIcon, ClipboardDocumentListIcon, FireIcon, TargetIcon } from './Icons';
import { analyzeMealInput, analyzeFullDayNutrition } from '../services/geminiService';
import { Page as PageEnum } from '../types';
import { AnalysisDetailModal } from './AnalysisDetailModal';

interface DataLogProps {
  logs: DailyLogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<DailyLogEntry[]>>;
  userInfo: UserInfo;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
  onApiKeyMissing: () => void;
}

const EditableCell: React.FC<{
    value: string | number | null;
    onSave: (value: string) => void;
    type?: string;
    align?: 'left' | 'right' | 'center';
    multiline?: boolean;
}> = ({ value, onSave, type = 'text', align = 'left', multiline = false }) => {
    const [editing, setEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleSave = () => {
        onSave(currentValue?.toString() || '');
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            handleSave();
        } else if (e.key === 'Escape') {
            setCurrentValue(value);
            setEditing(false);
        }
    };
    
    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current instanceof HTMLInputElement) {
                inputRef.current.select();
            }
        }
    }, [editing]);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    if (editing) {
        return multiline ? (
             <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={currentValue === null ? '' : String(currentValue)}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={`w-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded p-2 text-gray-900 dark:text-white text-${align} min-h-[80px] resize-y`}
                rows={3}
            />
        ) : (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type}
                value={currentValue === null ? '' : String(currentValue)}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={`w-full h-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded p-1 text-gray-900 dark:text-white text-${align}`}
            />
        );
    }

    const isEmpty = value === null || value === undefined || String(value).trim() === '';

    return (
        <div onClick={() => setEditing(true)} className={`w-full h-full cursor-pointer whitespace-pre-wrap ${isEmpty ? '' : `text-${align}`}`}>
            {isEmpty
                ? <span className="text-gray-400 dark:text-gray-600 italic">空</span> 
                : String(value)}
        </div>
    );
};


const MealCell: React.FC<{
    meal: MealLog;
    onTextSave: (text: string) => void;
    onCardClick: () => void;
}> = ({ meal, onTextSave, onCardClick }) => {
    const hasAnalysis = meal.analysis && Object.keys(meal.analysis).length > 0;
    return (
        <div 
            className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 flex items-stretch h-full min-h-[4rem]"
            onClick={onCardClick}
        >
            {meal.image && (
                 <div className="w-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 relative">
                    <img 
                        src={meal.image} 
                        alt="Meal photo" 
                        className="w-full h-full object-cover" 
                    />
                    {hasAnalysis && (
                         <div className="absolute bottom-1 right-1 bg-indigo-500 text-white p-1 rounded-full flex items-center shadow">
                            <SparklesIcon className="w-2.5 h-2.5" />
                        </div>
                    )}
                </div>
            )}
            <div className="p-2 text-left flex-grow flex items-center">
                <EditableCell value={meal.text} onSave={onTextSave} align="left" />
            </div>
        </div>
    );
};

// Helper function to parse a single CSV row, handling quoted fields.
const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < row.length && row[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(field);
                field = '';
            } else {
                field += char;
            }
        }
    }
    result.push(field);
    return result;
};

const SmartLogInput: React.FC<{ onMealLogged: (data: AnalyzedMealData, imagePreview: string | null, date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void; onApiKeyMissing: () => void; }> = ({ onMealLogged, onApiKeyMissing }) => {
    const [userInput, setUserInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Allow re-uploading the same file
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    const handleSubmit = async () => {
        if ((!userInput.trim() && !image) || isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const mealTypeLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '点心' };
            const result = await analyzeMealInput(userInput, image, mealTypeLabels[selectedMealType]);
            if (result) {
                onMealLogged(result, imagePreview, selectedDate, selectedMealType);
                setUserInput('');
                removeImage();
            } else {
                alert('抱歉，无法分析您的餐食。请尝试更详细地描述，或检查您的网络连接和图片。');
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('API_KEY_MISSING')) {
                onApiKeyMissing();
            } else {
                console.error(error);
                alert('分析时发生错误，请检查您的API密钥或网络连接。');
            }
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

// Robust date parser that handles YYYY-MM-DD and YYYY/M/D formats as local dates.
const parseDateStringToLocal = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    
    const match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in JS Date
        const day = parseInt(match[3], 10);
        const d = new Date(year, month, day);
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            return d;
        }
    }
    
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
};

// Compares if two Date objects represent the same calendar day, ignoring time.
const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const calculateBMR = (userInfo: UserInfo, weightKg: number | null): number | null => {
  const { age, gender, height } = userInfo;
  if (!age || !gender || !height || !weightKg) {
    return null;
  }

  // Mifflin-St Jeor like formula provided by user
  if (gender === 'male') {
    return (10 * weightKg) + (6.25 * height) - (5 * age) + 5;
  } else if (gender === 'female') {
    return (10 * weightKg) + (6.25 * height) - (5 * age) - 161;
  }
  
  return null; // For 'other' gender
};

const processAllLogs = (logs: DailyLogEntry[], userInfo: UserInfo): DailyLogEntry[] => {
    const logsSortedAsc = [...logs].sort((a, b) => (parseDateStringToLocal(a.date)?.getTime() || 0) - (parseDateStringToLocal(b.date)?.getTime() || 0));
    let lastKnownWeight = userInfo.initialWeight;

    return logsSortedAsc.map(log => {
        if (log.weightKg !== null && log.weightKg > 0) {
            lastKnownWeight = log.weightKg;
        }

        const bmr = calculateBMR(userInfo, lastKnownWeight);
        const estimatedExpenditure = log.estimatedExpenditure || 0;
        
        let tdee: number | null = null;
        if (bmr !== null) {
            tdee = Math.round(bmr + estimatedExpenditure);
        }

        let calorieDeficit: number | null = null;
        if (tdee !== null && log.actualIntake !== null) {
            calorieDeficit = tdee - log.actualIntake;
        }
        
        return {
            ...log,
            bmr: bmr !== null ? Math.round(bmr) : null,
            tdee: tdee,
            calorieDeficit: calorieDeficit,
        };
    });
};

const MetricItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number | null;
  onSave: (value: string) => void;
  unit?: string;
  type?: 'text' | 'number';
}> = ({ icon: Icon, label, value, onSave, unit, type = 'text' }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex items-center">
      <Icon className="w-6 h-6 text-indigo-500 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
        <div className="flex items-baseline">
          <div className="text-gray-900 dark:text-white font-semibold text-lg flex-grow">
            <EditableCell value={value} onSave={onSave} type={type} align="left" />
          </div>
          {unit && <span className="text-sm text-gray-400 dark:text-gray-500 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

const TextSection: React.FC<{
  label: string;
  value: string | null;
  onSave: (value: string) => void;
  icon: React.ElementType;
}> = ({ label, value, onSave, icon: Icon }) => {
    return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 h-full">
            <div className="flex items-center mb-2">
                <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{label}</h4>
            </div>
            <div className="w-full text-gray-800 dark:text-gray-200 text-sm">
                 <EditableCell value={value} onSave={onSave} align="left" multiline={true} />
            </div>
        </div>
    );
};

const DailyLogCard: React.FC<{
    log: DailyLogEntry;
    isSelected: boolean;
    isAnalyzing: boolean;
    isDeleting: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, field: keyof DailyLogEntry, value: string) => void;
    onUpdateMealText: (id: string, mealType: 'breakfast' | 'lunch' | 'dinner', newText: string) => void;
    onReanalyze: (id: string) => void;
    onDelete: (id: string) => void;
    onConfirmDelete: (id: string) => void;
    onCancelDelete: () => void;
    onMealClick: (meal: MealLog) => void;
}> = ({
    log, isSelected, isAnalyzing, isDeleting, onSelect, onUpdate, onUpdateMealText,
    onReanalyze, onDelete, onConfirmDelete, onCancelDelete, onMealClick
}) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border transition-all duration-200 ${isSelected ? 'border-indigo-500 shadow-indigo-200/50 dark:shadow-indigo-800/50' : 'border-transparent'}`}>
            {/* Card Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-100 dark:bg-gray-900"
                        checked={isSelected}
                        onChange={() => onSelect(log.id)}
                        aria-label={`Select log for date ${log.date}`}
                    />
                    <div className="ml-4">
                        <EditableCell 
                           value={log.date}
                           onSave={(value) => onUpdate(log.id, 'date', value)}
                           align="left"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-x-1">
                    {isDeleting ? (
                        <>
                            <button onClick={() => onConfirmDelete(log.id)} title="确认删除" className="p-1.5 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-gray-700 transition-colors">
                                <CheckIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={onCancelDelete} title="取消" className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 transition-colors">
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => onReanalyze(log.id)} 
                                title="重新分析营养和消耗" 
                                disabled={isAnalyzing}
                                className="p-1.5 rounded-full text-indigo-500 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`}/>
                            </button>
                            <button onClick={() => onDelete(log.id)} title="删除记录" className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 transition-colors">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricItem icon={ScaleIcon} label="体重" unit="kg" type="number" value={log.weightKg} onSave={(v) => onUpdate(log.id, 'weightKg', v)} />
                    <MetricItem icon={TargetIcon} label="腰围" unit="cm" type="number" value={log.waistCm} onSave={(v) => onUpdate(log.id, 'waistCm', v)} />
                    <MetricItem icon={WaterDropIcon} label="饮水" unit="L" type="number" value={log.waterL} onSave={(v) => onUpdate(log.id, 'waterL', v)} />
                    <MetricItem icon={ClockIcon} label="睡眠" unit="h" type="number" value={log.sleepH} onSave={(v) => onUpdate(log.id, 'sleepH', v)} />
                </div>
                
                {/* Meals */}
                <div>
                     <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-2">三餐记录</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MealCell meal={log.breakfast} onCardClick={() => onMealClick(log.breakfast)} onTextSave={(v) => onUpdateMealText(log.id, 'breakfast', v)} />
                        <MealCell meal={log.lunch} onCardClick={() => onMealClick(log.lunch)} onTextSave={(v) => onUpdateMealText(log.id, 'lunch', v)} />
                        <MealCell meal={log.dinner} onCardClick={() => onMealClick(log.dinner)} onTextSave={(v) => onUpdateMealText(log.id, 'dinner', v)} />
                    </div>
                </div>

                {/* Activity & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextSection label="运动情况" icon={ActivityIcon} value={log.activity} onSave={(v) => onUpdate(log.id, 'activity', v)} />
                    <TextSection label="当日小结" icon={ClipboardDocumentListIcon} value={log.summary} onSave={(v) => onUpdate(log.id, 'summary', v)} />
                </div>

                {/* Analysis Details */}
                <details className="group pt-2">
                    <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
                        详细营养分析
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </summary>
                     <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <MetricItem icon={FireIcon} label="运动消耗" unit="kcal" type="number" value={log.estimatedExpenditure} onSave={(v) => onUpdate(log.id, 'estimatedExpenditure', v)} />
                            <MetricItem icon={SparklesIcon} label="基础代谢" unit="kcal" type="number" value={log.bmr} onSave={(v) => onUpdate(log.id, 'bmr', v)} />
                            <MetricItem icon={SparklesIcon} label="总消耗" unit="kcal" type="number" value={log.tdee} onSave={(v) => onUpdate(log.id, 'tdee', v)} />
                            <MetricItem icon={FireIcon} label="摄入热量" unit="kcal" type="number" value={log.actualIntake} onSave={(v) => onUpdate(log.id, 'actualIntake', v)} />
                            <MetricItem icon={SparklesIcon} label="热量缺口" unit="kcal" type="number" value={log.calorieDeficit} onSave={(v) => onUpdate(log.id, 'calorieDeficit', v)} />
                            <MetricItem icon={SparklesIcon} label="蛋白质" unit="g" type="number" value={log.proteinG} onSave={(v) => onUpdate(log.id, 'proteinG', v)} />
                            <MetricItem icon={SparklesIcon} label="碳水" unit="g" type="number" value={log.carbsG} onSave={(v) => onUpdate(log.id, 'carbsG', v)} />
                            <MetricItem icon={SparklesIcon} label="脂肪" unit="g" type="number" value={log.fatG} onSave={(v) => onUpdate(log.id, 'fatG', v)} />
                        </div>
                    </div>
                </details>

            </div>
        </div>
    );
};


export const DataLog: React.FC<DataLogProps> = ({ logs, setLogs, userInfo, setCurrentPage, onApiKeyMissing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [modalMeal, setModalMeal] = useState<MealLog | null>(null);

  const isProfileComplete = userInfo.age && userInfo.gender && userInfo.height;
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
        setModalMeal(null);
       }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
        const dateA = parseDateStringToLocal(a.date)?.getTime() || 0;
        const dateB = parseDateStringToLocal(b.date)?.getTime() || 0;
        return dateB - dateA;
    });
  }, [logs]);
  
  const handleMealLogged = (data: AnalyzedMealData, imagePreview: string | null, dateStr: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const targetDate = parseDateStringToLocal(dateStr);
    if (!targetDate) {
        alert("提供的日期无效，无法记录膳食。");
        return;
    }

    setLogs(prevLogs => {
        let logsCopy = [...prevLogs];
        const existingLogIndex = logsCopy.findIndex(log => isSameDay(parseDateStringToLocal(log.date), targetDate));

        const newMealData: MealLog = {
            text: `${data.generatedMealName} (~${Math.round(data.estimatedCalories)} kcal)`,
            image: imagePreview,
            analysis: data
        };

        if (mealType === 'snack') {
            // Handle snack: add to summary and macros, but don't replace a meal slot.
            if (existingLogIndex > -1) {
                const updatedLog = { ...logsCopy[existingLogIndex] };
                const snackNote = `[点心] ${newMealData.text}`;
                updatedLog.summary = updatedLog.summary && updatedLog.summary.trim() !== '' ? `${updatedLog.summary}\n${snackNote}` : snackNote;
                updatedLog.actualIntake = (updatedLog.actualIntake || 0) + data.estimatedCalories;
                updatedLog.proteinG = (updatedLog.proteinG || 0) + data.estimatedProteinG;
                updatedLog.carbsG = (updatedLog.carbsG || 0) + data.estimatedCarbsG;
                updatedLog.fatG = (updatedLog.fatG || 0) + data.estimatedFatG;
                logsCopy[existingLogIndex] = updatedLog;
            } else {
                 const newLog = createNewLogEntry(dateStr);
                 const snackNote = `[点心] ${newMealData.text}`;
                 newLog.summary = snackNote;
                 newLog.actualIntake = data.estimatedCalories;
                 newLog.proteinG = data.estimatedProteinG;
                 newLog.carbsG = data.estimatedCarbsG;
                 newLog.fatG = data.estimatedFatG;
                 logsCopy = [newLog, ...logsCopy];
            }
        } else {
            // Handle breakfast, lunch, dinner: Overwrite the meal slot and adjust totals.
            if (existingLogIndex > -1) {
                const updatedLog = { ...logsCopy[existingLogIndex] };
                const oldMeal = updatedLog[mealType];
                const oldCalories = oldMeal?.analysis?.estimatedCalories || 0;
                const oldProtein = oldMeal?.analysis?.estimatedProteinG || 0;
                const oldCarbs = oldMeal?.analysis?.estimatedCarbsG || 0;
                const oldFat = oldMeal?.analysis?.estimatedFatG || 0;

                updatedLog.actualIntake = (updatedLog.actualIntake || 0) - oldCalories + data.estimatedCalories;
                updatedLog.proteinG = (updatedLog.proteinG || 0) - oldProtein + data.estimatedProteinG;
                updatedLog.carbsG = (updatedLog.carbsG || 0) - oldCarbs + data.estimatedCarbsG;
                updatedLog.fatG = (updatedLog.fatG || 0) - oldFat + data.estimatedFatG;

                updatedLog[mealType] = newMealData;
                logsCopy[existingLogIndex] = updatedLog;

            } else {
                const newLog = createNewLogEntry(dateStr);
                newLog[mealType] = newMealData;
                newLog.actualIntake = data.estimatedCalories;
                newLog.proteinG = data.estimatedProteinG;
                newLog.carbsG = data.estimatedCarbsG;
                newLog.fatG = data.estimatedFatG;
                logsCopy = [newLog, ...logsCopy];
            }
        }
        return processAllLogs(logsCopy, userInfo);
    });
};

const createNewLogEntry = (dateStr: string): DailyLogEntry => ({
    id: crypto.randomUUID(),
    date: dateStr,
    weightKg: null, waistCm: null, waterL: null, sleepH: null,
    breakfast: { text: '' }, lunch: { text: '' }, dinner: { text: '' }, 
    activity: '',
    bmr: null, tdee: null,
    estimatedExpenditure: null, actualIntake: null, calorieDeficit: null,
    proteinG: null, carbsG: null, fatG: null,
    summary: ''
});


  const handleUpdate = (id: string, field: keyof DailyLogEntry, value: string) => {
    setLogs(prevLogs => {
      const updatedLogs = prevLogs.map(log => {
        if (log.id === id) {
          const numericFields: (keyof DailyLogEntry)[] = ['weightKg', 'waistCm', 'waterL', 'sleepH', 'estimatedExpenditure', 'actualIntake', 'proteinG', 'carbsG', 'fatG', 'bmr', 'tdee', 'calorieDeficit'];
          const isNumeric = numericFields.includes(field);
          
          let updatedLog = { ...log };

          const trimmedValue = value.trim();
          if (isNumeric) {
            const parsedNumber = Number(trimmedValue);
            (updatedLog as any)[field] = trimmedValue === '' || isNaN(parsedNumber) ? null : parsedNumber;
          } else {
            (updatedLog as any)[field] = value;
          }
          
          return updatedLog;
        }
        return log;
      });
      // For date changes, we might need to re-sort, but processing handles weights correctly.
      return processAllLogs(updatedLogs, userInfo);
    });
  };

  const handleUpdateMealText = (id: string, mealType: 'breakfast' | 'lunch' | 'dinner', newText: string) => {
    setLogs(prevLogs => {
        const updatedLogs = prevLogs.map(log => {
            if (log.id === id) {
                return {
                    ...log,
                    [mealType]: {
                        ...log[mealType],
                        text: newText,
                    },
                };
            }
            return log;
        });
        return updatedLogs; // No need to processAllLogs, text change doesn't affect calculations
    });
  };
  
  const handleAddRow = () => {
    setIsConfirmingClear(false);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Check if a log for today already exists
    const todayLogExists = logs.some(log => isSameDay(parseDateStringToLocal(log.date), parseDateStringToLocal(todayStr)));

    if(todayLogExists) {
        alert("今天已经有记录了。您可以在现有行中编辑数据。");
        return;
    }

    const newLog = createNewLogEntry(todayStr);
    setLogs(prev => processAllLogs([newLog, ...prev], userInfo));
  }

  const handleConfirmDeleteRow = (id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
    setDeletingId(null);
  };

  const handleReanalyzeRow = async (logId: string) => {
    const logToAnalyze = logs.find(l => l.id === logId);
    if (!logToAnalyze || analyzingIds.has(logId)) return;

    setAnalyzingIds(prev => new Set(prev).add(logId));
    try {
        const result = await analyzeFullDayNutrition(logToAnalyze);

        if (result) {
            setLogs(prevLogs => {
                const updatedLogs = prevLogs.map(log => {
                    if (log.id === logId) {
                        return {
                            ...log,
                            actualIntake: Math.round(result.estimatedIntakeCalories),
                            proteinG: Math.round(result.estimatedIntakeProteinG),
                            carbsG: Math.round(result.estimatedIntakeCarbsG),
                            fatG: Math.round(result.estimatedIntakeFatG),
                            estimatedExpenditure: Math.round(result.estimatedExpenditureCalories),
                            summary: result.dailySummary,
                        };
                    }
                    return log;
                });
                return processAllLogs(updatedLogs, userInfo);
            });
        } else {
            alert("无法重新分析营养数据，请稍后再试。");
        }
    } catch(e) {
        if (e instanceof Error && e.message.includes('API_KEY_MISSING')) {
            onApiKeyMissing();
        } else {
            console.error(e);
            alert("重新分析时发生错误，请检查您的API密钥或网络连接。");
        }
    } finally {
        setAnalyzingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(logId);
            return newSet;
        });
    }
  };

  const handleBatchAnalyzeSelected = async () => {
    if (selectedIds.size === 0 || isBatchAnalyzing) return;

    setIsBatchAnalyzing(true);
    const currentAnalyzingIds = new Set(selectedIds);
    setAnalyzingIds(currentAnalyzingIds); 

    const logsToAnalyze = logs.filter(l => selectedIds.has(l.id));
    let hasApiKeyError = false;

    const analysisPromises = logsToAnalyze.map(log =>
        analyzeFullDayNutrition(log)
            .then(result => ({ id: log.id, status: 'fulfilled' as const, value: result }))
            .catch(error => {
                if (error instanceof Error && error.message.includes('API_KEY_MISSING')) {
                    hasApiKeyError = true;
                }
                return ({ id: log.id, status: 'rejected' as const, reason: error });
            })
    );

    const results = await Promise.all(analysisPromises);
    
    if (hasApiKeyError) {
        onApiKeyMissing();
        setIsBatchAnalyzing(false);
        setAnalyzingIds(new Set());
        setSelectedIds(new Set());
        return;
    }


    let successfulAnalyses = 0;
    const updates = new Map<string, Partial<DailyLogEntry>>();

    results.forEach(res => {
        if (res.status === 'fulfilled') {
            const { value } = res;
            if (value) {
                successfulAnalyses++;
                updates.set(res.id, {
                    actualIntake: Math.round(value.estimatedIntakeCalories),
                    proteinG: Math.round(value.estimatedIntakeProteinG),
                    carbsG: Math.round(value.estimatedIntakeCarbsG),
                    fatG: Math.round(value.estimatedIntakeFatG),
                    estimatedExpenditure: Math.round(value.estimatedExpenditureCalories),
                    summary: value.dailySummary,
                });
            } else {
                console.error(`Analysis for log ${res.id} returned null.`);
            }
        } else { // status is 'rejected'
            console.error(`Failed to analyze log ${res.id}:`, res.reason);
        }
    });


    if (updates.size > 0) {
        setLogs(prevLogs => {
            const updatedLogs = prevLogs.map(log => {
                if (updates.has(log.id)) {
                    return { ...log, ...updates.get(log.id) };
                }
                return log;
            });
            return processAllLogs(updatedLogs, userInfo);
        });
    }
    
    alert(`${successfulAnalyses} / ${selectedIds.size} 条记录分析完成。`);

    setIsBatchAnalyzing(false);
    setAnalyzingIds(new Set());
    setSelectedIds(new Set());
  };


  const handleSelect = (id: string) => {
    setIsConfirmingClear(false);
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsConfirmingClear(false);
    if (e.target.checked) {
        setSelectedIds(new Set(sortedLogs.map(log => log.id)));
    } else {
        setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
      setLogs(prev => prev.filter(log => !selectedIds.has(log.id)));
      setSelectedIds(new Set());
      setIsConfirmingClear(false);
  };

  const handleClearAll = () => {
      setLogs([]);
      setSelectedIds(new Set());
      setIsConfirmingClear(false);
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsConfirmingClear(false);
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      if (!text) return;

      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      
      const allRows = text.trim().split(/\r\n?|\n/).map(r => r.trim()).filter(Boolean);
      if (allRows.length < 2) {
        alert("CSV文件需要包含表头和至少一行数据。");
        return;
      }
      
      const headerRow = allRows.shift()!;
      const dataRows = allRows;
      const csvHeaders = parseCsvRow(headerRow).map(h => h.trim());

      const normalizeHeader = (h: string): string => {
        return (h || '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
      };
      
      const aliasMap: { [key: string]: keyof Omit<DailyLogEntry, 'id'> } = {
          '日期天数': 'date', '日期': 'date', 'date': 'date',
          '晨重kg': 'weightKg', '体重kg': 'weightKg', '体重': 'weightKg', '晨重': 'weightKg', 'weight': 'weightKg',
          '腰围cm': 'waistCm', '腰围': 'waistCm', 'waist': 'waistCm',
          '饮水量l': 'waterL', '饮水l': 'waterL', '饮水量': 'waterL', '饮水': 'waterL', 'water': 'waterL',
          '睡眠h': 'sleepH', '睡眠': 'sleepH', 'sleep': 'sleepH',
          '早餐': 'breakfast',
          '午餐': 'lunch',
          '晚餐': 'dinner',
          '运动情况': 'activity', '运动': 'activity',
          '预估消耗kcal': 'estimatedExpenditure', '运动消耗kcal': 'estimatedExpenditure', '运动消耗': 'estimatedExpenditure', '消耗热量': 'estimatedExpenditure', 'expenditure': 'estimatedExpenditure',
          '实际摄入kcal': 'actualIntake', '实际摄入': 'actualIntake', 'actualintake': 'actualIntake',
          '蛋白质g': 'proteinG', '蛋白质': 'proteinG', 'protein': 'proteinG',
          '碳水g': 'carbsG', '碳水': 'carbsG', 'carbs': 'carbsG', '碳水化合物': 'carbsG',
          '脂肪g': 'fatG', '脂肪': 'fatG', 'fat': 'fatG',
          '热量缺口kcal': 'calorieDeficit', '热量缺口': 'calorieDeficit', 'caloriedeficit': 'calorieDeficit',
          '备注感受': 'summary', '备注': 'summary', '感受': 'summary', 'notes': 'summary', '当日小结': 'summary', 'summary': 'summary'
      };

      const fieldIndices: { [key: number]: keyof DailyLogEntry } = {};
      csvHeaders.forEach((header, index) => {
          const normalizedHeader = normalizeHeader(header);
          if (aliasMap[normalizedHeader]) {
              fieldIndices[index] = aliasMap[normalizedHeader];
          }
      });
      
      if (!Object.values(fieldIndices).includes('date')) {
          alert('CSV文件导入失败：必须包含一个可识别的 "日期" 列。请检查您的文件表头。');
          return;
      }

      const numericFields: (keyof DailyLogEntry)[] = ['weightKg', 'waistCm', 'waterL', 'sleepH', 'estimatedExpenditure', 'actualIntake', 'proteinG', 'carbsG', 'fatG', 'calorieDeficit'];
      const mealFields: (keyof DailyLogEntry)[] = ['breakfast', 'lunch', 'dinner'];
      
      const importedLogs = dataRows.map((rowStr): DailyLogEntry | null => {
        const values = parseCsvRow(rowStr);
        if (values.length < 1 || values.every(v => v.trim() === '')) return null;

        const entry: Partial<DailyLogEntry> & { id: string } = { id: crypto.randomUUID() };
        
        for (const index in fieldIndices) {
            const field = fieldIndices[index];
            let value = values[parseInt(index, 10)]?.trim();

            if (value === undefined || value === null) continue;

            if (mealFields.includes(field)) {
                (entry as any)[field] = { text: value };
            } else if (numericFields.includes(field)) {
                let valueToParse = value;

                if (valueToParse.includes('~')) {
                    const parts = valueToParse.split('~');
                    valueToParse = parts[parts.length - 1];
                }
                
                const parsedNumber = Number(valueToParse);

                if (valueToParse.trim() === '' || isNaN(parsedNumber)) {
                    (entry as any)[field] = null;
                } else {
                    (entry as any)[field] = parsedNumber;
                }
            } else {
                (entry as any)[field] = value;
            }
        }
        
        if (!entry.date || typeof entry.date !== 'string' || !entry.date.trim()) {
            return null;
        }

        return { ...createNewLogEntry(entry.date), ...entry };
      }).filter((log): log is DailyLogEntry => log !== null);
      
      if (importedLogs.length === 0) {
          alert("导入失败：未能在CSV文件中找到有效的记录行。请检查文件内容和格式，确保包含有效的日期和数据。");
          return;
      }
      
      setLogs(prevLogs => {
          const importedDateStrings = new Set(importedLogs.map(l => parseDateStringToLocal(l.date)?.toDateString()).filter(Boolean));
          const oldLogsToKeep = prevLogs.filter(l => !importedDateStrings.has(parseDateStringToLocal(l.date)?.toDateString()));
          const newLogs = [...importedLogs, ...oldLogsToKeep];
          return processAllLogs(newLogs, userInfo);
      });
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  if (!isProfileComplete) {
      return (
          <div className="p-4 sm:p-6 lg:p-8 h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div className="max-w-md mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <UserIcon className="w-16 h-16 mx-auto text-indigo-500" />
                  <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">请先完善您的个人资料</h2>
                  <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                      我们需要您的年龄、性别和身高来计算您的基础代谢率 (BMR) 和每日总消耗 (TDEE)，这是准确追踪热量缺口的关键。
                  </p>
                  <button
                      onClick={() => setCurrentPage(PageEnum.PROFILE)}
                      className="mt-6 inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                      前往个人资料页面
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {modalMeal && (
        <AnalysisDetailModal meal={modalMeal} onClose={() => setModalMeal(null)} />
      )}
      <div className="max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">每日记录</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">以卡片形式浏览您的每日进展。</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                <button onClick={handleAddRow} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    添加今日记录
                </button>
            </div>
        </div>

        <div className="my-8">
            <SmartLogInput onMealLogged={handleMealLogged} onApiKeyMissing={onApiKeyMissing} />
        </div>

        {/* Action Bar for selections */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center">
                <input
                    id="select-all-checkbox"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < sortedLogs.length; }}
                    checked={sortedLogs.length > 0 && selectedIds.size === sortedLogs.length}
                    onChange={handleSelectAll}
                    aria-label="Select all logs"
                />
                <label htmlFor="select-all-checkbox" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                   {selectedIds.size > 0 ? `已选择 ${selectedIds.size} 项` : '全选'}
                </label>
            </div>
            
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleBatchAnalyzeSelected}
                        disabled={isBatchAnalyzing}
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-500 shadow-sm text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        <SparklesIcon className={`w-4 h-4 mr-2 ${isBatchAnalyzing ? 'animate-spin' : ''}`} />
                        {isBatchAnalyzing ? `分析中...` : `批量分析`}
                    </button>
                    <button
                        onClick={handleDeleteSelected}
                        className="inline-flex items-center px-3 py-1.5 border border-red-500 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        删除所选
                    </button>
                </div>
            )}
             <div className="flex-grow"></div>
             <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                {!isConfirmingClear ? (
                    <button 
                        onClick={() => setIsConfirmingClear(true)}
                        disabled={logs.length === 0}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        一键清空
                    </button>
                ) : (
                    <div className="flex items-center gap-2 rounded-md ring-1 ring-red-200 dark:ring-red-800 bg-red-50 dark:bg-gray-800 p-2">
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">确定清空?</span>
                        <button onClick={handleClearAll} className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700">确认</button>
                        <button onClick={() => setIsConfirmingClear(false)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500">取消</button>
                    </div>
                )}

                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <UploadIcon className="h-4 w-4 mr-2" />
                    导入CSV
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv,text/csv" className="hidden" />
            </div>

        </div>

        {/* Card List */}
        <div className="space-y-6">
            {sortedLogs.length > 0 ? sortedLogs.map(log => (
                <DailyLogCard 
                    key={log.id}
                    log={log}
                    isSelected={selectedIds.has(log.id)}
                    isAnalyzing={analyzingIds.has(log.id)}
                    isDeleting={deletingId === log.id}
                    onSelect={handleSelect}
                    onUpdate={handleUpdate}
                    onUpdateMealText={handleUpdateMealText}
                    onReanalyze={handleReanalyzeRow}
                    onDelete={(id) => setDeletingId(id)}
                    onConfirmDelete={handleConfirmDeleteRow}
                    onCancelDelete={() => setDeletingId(null)}
                    onMealClick={setModalMeal}
                />
            )) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="mt-2 font-semibold">暂无记录</p>
                    <p className="mt-1 text-sm">点击 "添加今日记录" 或使用 "AI 智能膳食日志" 开始吧！</p>
                  </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
