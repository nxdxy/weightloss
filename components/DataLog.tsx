
import React, { useState, useRef, useMemo } from 'react';
import type { DailyLogEntry, AnalyzedMealData, FullDayAnalysisData, UserInfo, Page } from '../types';
import { UploadIcon, SparklesIcon, CameraIcon, UserIcon } from './Icons';
import { analyzeMealInput, analyzeFullDayNutrition } from '../services/geminiService';
import { Page as PageEnum } from '../types';

interface DataLogProps {
  logs: DailyLogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<DailyLogEntry[]>>;
  userInfo: UserInfo;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

const EditableCell: React.FC<{ value: string | number | null; onSave: (value: string) => void; type?: string, align?: 'left' | 'right' | 'center' }> = ({ value, onSave, type = 'text', align = 'left' }) => {
    const [editing, setEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        onSave(currentValue?.toString() || '');
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setCurrentValue(value);
            setEditing(false);
        }
    };
    
    React.useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    React.useEffect(() => {
        setCurrentValue(value);
    }, [value]);


    if (editing) {
        return (
            <input
                ref={inputRef}
                type={type}
                value={currentValue === null ? '' : currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={`w-full h-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded p-2 text-gray-900 dark:text-white text-${align}`}
            />
        );
    }

    const isEmpty = value === null || value === undefined || value === '';

    return (
        <div onClick={() => setEditing(true)} className={`w-full h-full cursor-pointer p-2 whitespace-pre-wrap min-h-[4rem] flex items-center justify-${align === 'center' ? 'center' : align === 'right' ? 'end' : 'start'}`}>
            {isEmpty
                ? <span className="text-gray-400 dark:text-gray-600 italic">空</span> 
                : String(value)}
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

const SmartLogInput: React.FC<{ onMealLogged: (data: AnalyzedMealData, date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void }> = ({ onMealLogged }) => {
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
                onMealLogged(result, selectedDate, selectedMealType);
                setUserInput('');
                removeImage();
            } else {
                alert('抱歉，无法分析您的餐食。请尝试更详细地描述，或检查您的网络连接和图片。');
            }
        } catch (error) {
            console.error(error);
            alert('分析时发生错误。');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
                    rows={4}
                    className="flex-grow w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="例如：午餐吃了沙拉，酱汁是分开放的...（可选，AI会以图片为准）"
                />
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    {!imagePreview ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isAnalyzing}
                            className="w-full md:w-32 h-full min-h-[6rem] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <CameraIcon className="w-8 h-8" />
                            <span className="text-sm mt-1">上传/拍照</span>
                        </button>
                    ) : (
                        <div className="relative w-32 h-full">
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
    
    // Try to match YYYY-MM-DD or YYYY/M/D formats, which are common.
    const match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in JS Date
        const day = parseInt(match[3], 10);
        // Construct with parts to ensure it's interpreted in the local timezone, avoiding UTC pitfalls.
        const d = new Date(year, month, day);
        // Verify that the created date is valid (e.g., handles non-existent dates like Feb 30)
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            return d;
        }
    }
    
    // Fallback for other potential formats (e.g., from `new Date().toString()`)
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


export const DataLog: React.FC<DataLogProps> = ({ logs, setLogs, userInfo, setCurrentPage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const isProfileComplete = userInfo.age && userInfo.gender && userInfo.height;

  const calculatedColumns: (keyof DailyLogEntry)[] = ['bmr', 'tdee', 'estimatedExpenditure', 'actualIntake', 'proteinG', 'carbsG', 'fatG', 'calorieDeficit'];

  const tableColumns: { key: keyof Omit<DailyLogEntry, 'id'>, header: string, type: 'text' | 'number', width: string, align: 'left' | 'right' | 'center' }[] = [
      { key: 'date', header: '日期', type: 'text', width: 'w-36', align: 'left' },
      { key: 'weightKg', header: '体重 (kg)', type: 'number', width: 'w-24', align: 'right' },
      { key: 'waistCm', header: '腰围 (cm)', type: 'number', width: 'w-24', align: 'right' },
      { key: 'waterL', header: '饮水 (L)', type: 'number', width: 'w-24', align: 'right' },
      { key: 'sleepH', header: '睡眠 (h)', type: 'number', width: 'w-24', align: 'right' },
      { key: 'breakfast', header: '早餐', type: 'text', width: 'w-60', align: 'left' },
      { key: 'lunch', header: '午餐', type: 'text', width: 'w-60', align: 'left' },
      { key: 'dinner', header: '晚餐', type: 'text', width: 'w-60', align: 'left' },
      { key: 'activity', header: '运动情况', type: 'text', width: 'w-60', align: 'left' },
      { key: 'estimatedExpenditure', header: '运动消耗 (kcal)', type: 'number', width: 'w-28', align: 'right' },
      { key: 'bmr', header: '基础代谢 (kcal)', type: 'number', width: 'w-28', align: 'right' },
      { key: 'tdee', header: '预估总消耗 (kcal)', type: 'number', width: 'w-28', align: 'right' },
      { key: 'actualIntake', header: '实际摄入 (kcal)', type: 'number', width: 'w-28', align: 'right' },
      { key: 'proteinG', header: '蛋白 (g)', type: 'number', width: 'w-24', align: 'right' },
      { key: 'carbsG', header: '碳水 (g)', type: 'number', width: 'w-24', align: 'right' },
      { key: 'fatG', header: '脂肪 (g)', type: 'number', width: 'w-24', align: 'right' },
      { key: 'calorieDeficit', header: '热量缺口 (kcal)', type: 'number', width: 'w-28', align: 'right' },
      { key: 'summary', header: '当日小结', type: 'text', width: 'w-64', align: 'left' },
  ];

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
        const dateA = parseDateStringToLocal(a.date)?.getTime() || 0;
        const dateB = parseDateStringToLocal(b.date)?.getTime() || 0;
        return dateB - dateA;
    });
  }, [logs]);
  
  const handleMealLogged = (data: AnalyzedMealData, dateStr: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
      const targetDate = parseDateStringToLocal(dateStr);
      if (!targetDate) {
          alert("提供的日期无效，无法记录膳食。");
          return;
      }
  
      setLogs(prevLogs => {
          let logsCopy = [...prevLogs];
          const existingLogIndex = logsCopy.findIndex(log => isSameDay(parseDateStringToLocal(log.date), targetDate));
  
          const mealDetails = `${data.generatedMealName} (~${Math.round(data.estimatedCalories)} kcal)`;
  
          if (existingLogIndex > -1) {
              // --- Update existing log ---
              const existingLog = { ...logsCopy[existingLogIndex] };
  
              const updatedLog: DailyLogEntry = {
                  ...existingLog,
                  actualIntake: (existingLog.actualIntake || 0) + data.estimatedCalories,
                  proteinG: (existingLog.proteinG || 0) + data.estimatedProteinG,
                  carbsG: (existingLog.carbsG || 0) + data.estimatedCarbsG,
                  fatG: (existingLog.fatG || 0) + data.estimatedFatG,
              };
  
              if (mealType !== 'snack') {
                  const existingContent = updatedLog[mealType];
                  updatedLog[mealType] = existingContent && existingContent.trim() !== '' ? `${existingContent}\n${mealDetails}` : mealDetails;
              } else {
                  const snackNote = `[点心] ${mealDetails}`;
                  updatedLog.summary = updatedLog.summary && updatedLog.summary.trim() !== '' ? `${updatedLog.summary}\n${snackNote}` : snackNote;
              }
              
              logsCopy[existingLogIndex] = updatedLog;
          } else {
              // --- Create new log ---
              const newLog: DailyLogEntry = {
                  id: crypto.randomUUID(),
                  date: dateStr,
                  weightKg: null, waistCm: null, waterL: null, sleepH: null,
                  breakfast: '', lunch: '', dinner: '', activity: '',
                  bmr: null,
                  tdee: null,
                  estimatedExpenditure: null,
                  actualIntake: data.estimatedCalories,
                  proteinG: data.estimatedProteinG,
                  carbsG: data.estimatedCarbsG,
                  fatG: data.estimatedFatG,
                  calorieDeficit: null,
                  summary: mealType === 'snack' ? `[点心] ${mealDetails}` : ''
              };
              if (mealType !== 'snack') {
                 newLog[mealType] = mealDetails;
              }
              logsCopy = [newLog, ...logsCopy];
          }
          return processAllLogs(logsCopy, userInfo);
      });
  };

  const handleUpdate = (id: string, field: keyof DailyLogEntry, value: string) => {
    setLogs(prevLogs => {
      const updatedLogs = prevLogs.map(log => {
        if (log.id === id) {
          const numericFields: (keyof DailyLogEntry)[] = ['weightKg', 'waistCm', 'waterL', 'sleepH', 'estimatedExpenditure', 'actualIntake', 'proteinG', 'carbsG', 'fatG'];
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
      return processAllLogs(updatedLogs, userInfo);
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

    const newLog: DailyLogEntry = {
        id: crypto.randomUUID(),
        date: todayStr,
        weightKg: null, waistCm: null, waterL: null, sleepH: null,
        breakfast: '', lunch: '', dinner: '', activity: '',
        actualIntake: null, calorieDeficit: null,
        estimatedExpenditure: null,
        bmr: null,
        tdee: null,
        proteinG: null, carbsG: null, fatG: null,
        summary: ''
    };
    setLogs(prev => processAllLogs([newLog, ...prev], userInfo));
  }

  const handleDeleteRow = (id: string) => {
    setIsConfirmingClear(false);
    if (deletingId === id) {
        setLogs(prev => prev.filter(log => log.id !== id));
        setDeletingId(null);
    } else {
        setDeletingId(id);
    }
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
        console.error(e);
        alert("重新分析时发生错误。");
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

    const analysisPromises = logsToAnalyze.map(log =>
        analyzeFullDayNutrition(log)
            .then(result => ({ id: log.id, status: 'fulfilled' as const, value: result }))
            .catch(error => ({ id: log.id, status: 'rejected' as const, reason: error }))
    );

    const results = await Promise.all(analysisPromises);

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
      
      const importedLogs = dataRows.map((rowStr): DailyLogEntry | null => {
        const values = parseCsvRow(rowStr);
        if (values.length < 1 || values.every(v => v.trim() === '')) return null;

        const entry: Partial<DailyLogEntry> & { id: string } = { id: crypto.randomUUID() };
        
        for (const index in fieldIndices) {
            const field = fieldIndices[index];
            let value = values[parseInt(index, 10)]?.trim();

            if (value === undefined || value === null) continue;

            if (numericFields.includes(field)) {
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

        const defaults: Omit<DailyLogEntry, 'id'> = {
            date: '', weightKg: null, waistCm: null, waterL: null, sleepH: null,
            breakfast: '', lunch: '', dinner: '', activity: '',
            actualIntake: null, calorieDeficit: null,
            estimatedExpenditure: null,
            bmr: null, tdee: null,
            proteinG: null, carbsG: null, fatG: null,
            summary: ''
        };

        return { ...defaults, ...entry };
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
      <div className="max-w-full mx-auto">
        <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">每日记录</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">追踪您的进展。点击单元格即可编辑。</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 items-center justify-end">
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBatchAnalyzeSelected}
                            disabled={isBatchAnalyzing}
                            className="inline-flex items-center px-4 py-2 border border-indigo-500 shadow-sm text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                            <SparklesIcon className={`w-5 h-5 mr-2 ${isBatchAnalyzing ? 'animate-spin' : ''}`} />
                            {isBatchAnalyzing ? `分析中...` : `批量分析 (${selectedIds.size})`}
                        </button>
                        <button
                            onClick={handleDeleteSelected}
                            className="inline-flex items-center px-4 py-2 border border-red-500 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            批量删除 ({selectedIds.size})
                        </button>
                    </div>
                )}
                
                {!isConfirmingClear ? (
                    <button 
                        onClick={() => setIsConfirmingClear(true)}
                        disabled={logs.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <UploadIcon className="h-5 w-5 mr-2" />
                    导入CSV
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv,text/csv" className="hidden" />
                <button onClick={handleAddRow} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    添加记录
                </button>
            </div>
        </div>
        
        <div className="my-8">
            <SmartLogInput onMealLogged={handleMealLogged} />
        </div>

        <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                        <table className="min-w-full table-fixed">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                                    <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                                        <input
                                            type="checkbox"
                                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-transparent"
                                            ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < sortedLogs.length; }}
                                            checked={sortedLogs.length > 0 && selectedIds.size === sortedLogs.length}
                                            onChange={handleSelectAll}
                                            aria-label="Select all logs"
                                        />
                                    </th>
                                    {tableColumns.map(col => <th key={col.key} scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-white ${col.width}`}>{col.header}</th>)}
                                    <th scope="col" className="py-3.5 px-3 text-sm font-semibold text-gray-900 dark:text-white w-32 text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedLogs.length > 0 ? sortedLogs.map(log => (
                                    <tr key={log.id} className={`divide-x divide-gray-200 dark:divide-gray-700 ${selectedIds.has(log.id) ? "bg-indigo-50 dark:bg-indigo-900/30" : "even:bg-white dark:even:bg-gray-900/70 odd:bg-gray-50/50 dark:odd:bg-gray-800/60"}`}>
                                        <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                                            {selectedIds.has(log.id) && <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600"></div>}
                                            <input
                                                type="checkbox"
                                                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-transparent"
                                                checked={selectedIds.has(log.id)}
                                                onChange={() => handleSelect(log.id)}
                                                aria-label={`Select log for date ${log.date}`}
                                            />
                                        </td>
                                        {tableColumns.map(col => (
                                            <td key={`${log.id}-${col.key}`} className={`p-0 text-sm text-gray-700 dark:text-gray-300 align-top ${calculatedColumns.includes(col.key) ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                                                <EditableCell
                                                    value={log[col.key]}
                                                    type={col.type}
                                                    align={col.align}
                                                    onSave={(value) => handleUpdate(log.id, col.key, value)}
                                                />
                                            </td>
                                        ))}
                                        <td className="p-2 whitespace-nowrap text-sm text-gray-500 align-middle text-center">
                                            <div className="flex items-center justify-center gap-x-2">
                                                {analyzingIds.has(log.id) ? (
                                                    <div className="flex items-center justify-center text-indigo-500">
                                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
                                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150 mx-1"></div>
                                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-300"></div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleReanalyzeRow(log.id)} title="重新分析营养和消耗" className="p-1 rounded-md text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-gray-700 transition-colors">
                                                        <SparklesIcon className="w-5 h-5"/>
                                                    </button>
                                                )}

                                                {deletingId === log.id ? (
                                                    <div className="flex items-center space-x-1">
                                                        <button onClick={() => handleDeleteRow(log.id)} className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors">确认</button>
                                                        <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors">取消</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleDeleteRow(log.id)} className="font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-gray-700 transition-colors">删除</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                      <td colSpan={tableColumns.length + 2} className="text-center py-16 text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                          <p className="mt-2 font-semibold">暂无记录</p>
                                          <p className="mt-1 text-sm">点击 "添加记录" 或 "导入CSV" 开始吧！</p>
                                        </div>
                                      </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
