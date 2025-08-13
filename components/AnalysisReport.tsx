
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { generateAnalysisReport } from '../services/geminiService';
import type { DailyLogEntry, UserInfo, StoredAnalysisReport, Page } from '../types';
import { LightbulbIcon, TargetIcon, SparklesIcon, NutritionIcon, MoonIcon, ChartIcon, TrophyIcon, ActivityIcon, WaterDropIcon, UserIcon, RefreshIcon } from './Icons';
import { Page as PageEnum } from '../types';

interface AnalysisReportProps {
  logs: DailyLogEntry[];
  userInfo: UserInfo;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
  analysisReport: StoredAnalysisReport;
  setAnalysisReport: React.Dispatch<React.SetStateAction<StoredAnalysisReport>>;
}

const Gauge = ({ value, label }: { value: number; label: string }) => {
    const percentage = Math.max(0, Math.min(100, value || 0));
    const circumference = 2 * Math.PI * 45; // r=45
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const colorClass = percentage >= 75 ? 'text-green-500' : percentage >= 40 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-gray-200 dark:text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                    className={colorClass}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-4xl font-bold ${colorClass}`}>{Math.round(percentage)}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</span>
            </div>
        </div>
    );
};

const MetricDisplay = ({ icon: Icon, label, value, unit }: { icon: React.ElementType; label: string; value: string | number; unit: string; }) => (
    <div className="flex items-center">
        <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-lg p-3">
            <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}<span className="text-sm ml-1 font-medium text-gray-500 dark:text-gray-400">{unit}</span></p>
        </div>
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    <div className="h-80">
      {children}
    </div>
  </div>
);

const InsightCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 h-full border border-gray-200 dark:border-gray-700">
    <div className="flex items-center mb-3">
      <div className="text-indigo-500">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{title}</h3>
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
      {children}
    </div>
  </div>
);

const AiAnalysisList: React.FC<{ points: string[] }> = ({ points }) => (
    <ul className="space-y-2 list-disc list-outside pl-5">
        {points.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
);

const MacroDistributionChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]} />
                <Legend iconSize={10} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ logs, userInfo, setCurrentPage, analysisReport, setAnalysisReport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedLogs = useMemo(() => [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [logs]);

  const { weightDomain, waistDomain } = useMemo(() => {
    const weights = sortedLogs.map(l => l.weightKg).filter((v): v is number => v !== null && v > 0);
    const waists = sortedLogs.map(l => l.waistCm).filter((v): v is number => v !== null && v > 0);

    const getDomain = (data: number[]) => {
        if (data.length === 0) return ['auto', 'auto'];
        if (data.length === 1) return [Math.max(0, data[0] - 5), data[0] + 5];
        const min = Math.min(...data);
        const max = Math.max(...data);
        const padding = (max - min) * 0.1 || 5;
        const lowerBound = Math.max(0, Math.floor(min - padding));
        const upperBound = Math.ceil(max + padding);
        return [lowerBound, upperBound];
    };

    return {
        weightDomain: getDomain(weights),
        waistDomain: getDomain(waists),
    };
  }, [sortedLogs]);

  const handleGenerateReport = async () => {
    if (!userInfo.age || !userInfo.gender || !userInfo.height) {
      setError("请先完善您的个人资料，我们需要该信息来生成精确的分析报告。");
      if (analysisReport.data) {
        // If there's old data, don't block the UI, just show error and offer to navigate
        alert("请先完善您的个人资料，我们需要该信息来生成精确的分析报告。");
        setCurrentPage(PageEnum.PROFILE);
      }
      return;
    }
    if (sortedLogs.length < 3) {
      const msg = "请记录至少3天的数据以生成分析报告。";
      setError(msg);
      if (analysisReport.data) alert(msg); // Show alert if old report is visible
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const generatedReport = await generateAnalysisReport(userInfo, sortedLogs);
      if (generatedReport) {
        setAnalysisReport({ data: generatedReport, generatedAt: new Date().toISOString() });
      } else {
        setError("无法生成报告。AI服务可能暂时不可用或返回了无效数据，请稍后再试。");
      }
    } catch (e) {
      console.error(e);
      setError("生成报告时发生未知错误。");
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    const report = analysisReport.data;
    const { generatedAt } = analysisReport;
    
    if (!report) {
      const isProfileIncomplete = !userInfo.age || !userInfo.gender || !userInfo.height;
      return (
        <div className="text-center h-96 flex flex-col justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <SparklesIcon className="w-16 h-16 mx-auto text-indigo-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">生成您的第一份AI分析报告</h2>
              <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                AI教练将深入分析您的所有记录，提供关于进展、营养、睡眠等方面的专业见解。
              </p>
              {error && <p className="text-red-500 dark:text-red-400 font-medium mt-4">{error}</p>}
              {isProfileIncomplete && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-md text-sm">
                    请先前往“个人资料”页面填写您的年龄、性别和身高。
                </div>
              )}
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '正在分析...' : '开始分析'}
              </button>
            </div>
        </div>
      );
    }

    const macroData = (report.nutritionInsights && report.nutritionInsights.macroDistribution) ? [
        { name: '蛋白质', value: report.nutritionInsights.macroDistribution.proteinPercentage, color: '#3b82f6' },
        { name: '碳水', value: report.nutritionInsights.macroDistribution.carbsPercentage, color: '#f97316' },
        { name: '脂肪', value: report.nutritionInsights.macroDistribution.fatPercentage, color: '#8b5cf6' },
    ] : [];

    const weightChartData = sortedLogs.map(log => ({ 
        date: log.date, 
        Weight: log.weightKg, 
        Waist: log.waistCm
    }));

    return (
      <>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
            {generatedAt ? `上次分析时间: ${new Date(generatedAt).toLocaleString()}` : '无记录'}
          </span>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-wait order-1 sm:order-2"
          >
            <RefreshIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? '正在重新分析...' : '重新分析'}
          </button>
        </div>

        {error && (
            <div className="my-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-center shadow-md">
                <p><strong>分析失败:</strong> {error}</p>
            </div>
        )}
        
        <div className="space-y-8">
            {/* Section 1: Top-level Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-center">
                    <Gauge value={report.progressScore} label="综合进展分" />
                </div>
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col justify-center space-y-4">
                    <MetricDisplay icon={TrophyIcon} label="总减重" value={report.keyMetrics.totalWeightLoss.toFixed(1)} unit="kg" />
                    <MetricDisplay icon={ChartIcon} label="总腰围减少" value={report.keyMetrics.totalWaistReduction.toFixed(1)} unit="cm" />
                    <MetricDisplay icon={SparklesIcon} label="周均减重" value={report.keyMetrics.avgWeeklyLoss.toFixed(2)} unit="kg" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col justify-center space-y-4">
                    <MetricDisplay icon={LightbulbIcon} label="平均热量缺口" value={Math.round(report.keyMetrics.avgCalorieDeficit)} unit="kcal" />
                    <MetricDisplay icon={ActivityIcon} label="平均运动消耗" value={Math.round(report.keyMetrics.avgActivityExpenditure)} unit="kcal" />
                    <MetricDisplay icon={SparklesIcon} label="记录一致性" value={`${Math.round(report.consistency.consistencyPercentage)}`} unit="%" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col justify-center space-y-4">
                    <MetricDisplay icon={MoonIcon} label="平均睡眠" value={report.sleepAnalysis.avgHours.toFixed(1)} unit="小时" />
                    <MetricDisplay icon={WaterDropIcon} label="平均饮水" value={report.hydrationAnalysis.avgWaterL.toFixed(1)} unit="升" />
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 px-2 pt-2">{report.hydrationAnalysis.comment}</p>
                </div>
            </div>

            {/* Section 2: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <ChartCard title="每周体重变化">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.weeklySummary} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                            <XAxis dataKey="week" stroke="rgb(156 163 175)" fontSize={12} />
                            <YAxis stroke="rgb(156 163 175)" allowDecimals={true} width={40} label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: 'rgb(156 163 175)' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }}
                                formatter={(value, name) => [`${Number(value).toFixed(2)} kg`, name === 'weightChange' ? '周变化' : '']}
                            />
                            <Bar dataKey="weightChange" name="周变化" radius={[4, 4, 0, 0]}>
                                {report.weeklySummary.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.weightChange !== null && entry.weightChange <= 0 ? '#4ade80' : '#f87171'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="体重与腰围趋势">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                            <XAxis dataKey="date" stroke="rgb(156 163 175)" fontSize={12}/>
                            <YAxis yAxisId="left" stroke="#8884d8" domain={weightDomain} width={40} />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={waistDomain} width={40} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="Weight" name="体重 (kg)" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} connectNulls />
                            <Line yAxisId="right" type="monotone" dataKey="Waist" name="腰围 (cm)" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Section 3: AI Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI 智能洞察</h2>
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <InsightCard title="营养深度剖析" icon={<NutritionIcon className="w-6 h-6" />}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                <div>
                                    <MacroDistributionChart data={macroData} />
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    <p className="font-semibold">{report.nutritionInsights.macroDistribution.comment}</p>
                                    <div className="mt-2 text-xs space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p><span className="text-green-500 font-bold">饮食亮点:</span> {report.nutritionInsights.positive}</p>
                                        <p><span className="text-yellow-500 font-bold">改进建议:</span> {report.nutritionInsights.improvement}</p>
                                    </div>
                                </div>
                            </div>
                        </InsightCard>
                         <InsightCard title="睡眠与恢复分析" icon={<MoonIcon className="w-6 h-6" />}>
                             <p>{report.sleepAnalysis.correlationComment}</p>
                         </InsightCard>
                    </div>
                     <div className="space-y-6">
                        <InsightCard title="成就亮点" icon={<TrophyIcon className="w-6 h-6" />}>
                            <AiAnalysisList points={report.achievements} />
                        </InsightCard>
                        <InsightCard title="行动建议" icon={<TargetIcon className="w-6 h-6" />}>
                            <AiAnalysisList points={report.suggestions} />
                        </InsightCard>
                    </div>
                </div>
            </div>
        </div>
      </>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">您的进度仪表盘</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">数据驱动洞察，助力您的健身之旅。</p>
        </div>
        <div>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};
