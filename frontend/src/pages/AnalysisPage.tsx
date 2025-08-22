import React, { useMemo } from 'react';
import { useLatestReport, useGenerateReport, useDailyLogs } from '../hooks/useApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ChartIcon, LightbulbIcon, TargetIcon, SparklesIcon, MoonIcon, TrophyIcon, ActivityIcon, WaterDropIcon, ClipboardListIcon, FireIcon, ExclamationTriangleIcon } from '../components/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

// Helper Components
const Gauge: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <div className="relative w-32 h-32 mx-auto mb-2">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-700" />
        <circle
          cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none"
          className="text-cyan-400 transition-all duration-1000 ease-out"
          strokeDasharray={`${2 * Math.PI * 40}`}
          strokeDashoffset={`${2 * Math.PI * 40 * (1 - value / 100)}`}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-cyan-400 font-mono">{value}</span>
        <span className="text-xs text-gray-400 font-mono uppercase">SCORE</span>
      </div>
    </div>
    <p className="text-sm font-medium text-gray-400 font-mono uppercase tracking-wider">{label}</p>
  </div>
);

const MetricDisplay: React.FC<{ icon: React.ComponentType<any>; label: string; value: string; unit: string }> = ({ icon: Icon, label, value, unit }) => (
  <div className="flex items-center space-x-3 bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
    <div className="bg-cyan-500/20 text-cyan-400 rounded-lg p-2 border border-cyan-500/30">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-cyan-400 font-mono">{value} <span className="text-sm text-gray-500">{unit}</span></p>
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="group relative">
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:scale-105">
      <div className="flex items-center mb-4">
        <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
        <h3 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="h-64">
        {children}
      </div>
    </div>
  </div>
);

const InsightCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="group relative">
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:scale-105">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 bg-cyan-500/20 text-cyan-400 rounded-lg p-3 border border-cyan-500/30">
          {icon}
        </div>
        <div className="ml-4">
          <div className="w-2 h-2 bg-cyan-400 rounded-full mb-1 animate-pulse"></div>
          <h3 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider">{title}</h3>
        </div>
      </div>
      <div className="text-gray-300 space-y-3">
        {children}
      </div>
    </div>
  </div>
);

// Simple markdown renderer for inline formatting
const renderInlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const AiAnalysisList: React.FC<{ points: string[] }> = ({ points }) => (
  <ul className="list-disc list-outside pl-5 space-y-1">
    {points.map((point, index) => (
      <li key={index} className="text-sm">{renderInlineMarkdown(point)}</li>
    ))}
  </ul>
);

export const AnalysisPage: React.FC = () => {
  const { data: latestReport, isLoading } = useLatestReport();
  const generateReport = useGenerateReport();

  // Get daily logs for the chart (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: dailyLogsData } = useDailyLogs({
    start_date: thirtyDaysAgo.toISOString().split('T')[0],
    limit: 100
  });

  const handleGenerateReport = async () => {
    try {
      await generateReport.mutateAsync(30); // Generate report for last 30 days
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  // Process chart data from daily logs
  const { weightChartData, weightDomain, waistDomain, weeklyWeightDomain } = useMemo(() => {
    if (!dailyLogsData || dailyLogsData.length === 0) {
      return { weightChartData: [], weightDomain: [0, 100], waistDomain: [0, 100], weeklyWeightDomain: ['auto', 'auto'] };
    }

    // Sort logs by date and create chart data
    const sortedLogs = [...dailyLogsData].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const chartData = sortedLogs
      .filter(log => log.weight_kg !== null || log.waist_cm !== null)
      .map(log => ({
        date: log.date,
        Weight: log.weight_kg,
        Waist: log.waist_cm
      }));

    const weights = chartData.map(d => d.Weight).filter((w): w is number => w !== null);
    const waists = chartData.map(d => d.Waist).filter((w): w is number => w !== null);

    const weightDomain = weights.length > 0 ? [Math.min(...weights) - 2, Math.max(...weights) + 2] : [0, 100];
    const waistDomain = waists.length > 0 ? [Math.min(...waists) - 5, Math.max(...waists) + 5] : [0, 100];

    // Calculate weekly weight change domain for better visualization
    let weeklyWeightDomain: [number, number] | ['auto', 'auto'] = ['auto', 'auto'];
    if (latestReport?.report_data?.weeklySummary) {
      const weeklyChanges = latestReport.report_data.weeklySummary
        .map((week: any) => week.weightChange)
        .filter((change: any): change is number => change !== null && change !== undefined && isFinite(change));

      console.log('Weekly changes:', weeklyChanges); // Debug log

      if (weeklyChanges.length > 0) {
        const minChange = Math.min(...weeklyChanges);
        const maxChange = Math.max(...weeklyChanges);

        console.log('Min/Max changes:', { minChange, maxChange }); // Debug log

        // Sanity check for reasonable weight change values (should be between -10kg and +10kg per week)
        if (Math.abs(minChange) > 10 || Math.abs(maxChange) > 10) {
          console.warn('Unusual weight change values detected:', { minChange, maxChange });
          // Use auto scaling if values seem unreasonable
          weeklyWeightDomain = ['auto', 'auto'];
        } else {
          const absMax = Math.max(Math.abs(minChange), Math.abs(maxChange));
          console.log('absMax:', absMax); // Debug log

          // Set symmetric range around 0 for better visualization
          const padding = absMax * 0.2 + 0.5; // Add 20% padding plus 0.5kg minimum
          console.log('padding:', padding); // Debug log

          weeklyWeightDomain = [-absMax - padding, absMax + padding];

          console.log('Calculated domain:', weeklyWeightDomain); // Debug log
        }
      }
    }

    return { weightChartData: chartData, weightDomain, waistDomain, weeklyWeightDomain };
  }, [dailyLogsData, latestReport]);

  // Process nutrition data for pie chart
  const nutritionData = useMemo(() => {
    if (!latestReport?.report_data?.nutritionInsights?.macroDistribution) return [];

    const macro = latestReport.report_data.nutritionInsights.macroDistribution;
    return [
      { name: '碳水', value: macro.carbsPercentage || 0, color: '#f97316' },
      { name: '脂肪', value: macro.fatPercentage || 0, color: '#8b5cf6' },
      { name: '蛋白质', value: macro.proteinPercentage || 0, color: '#22d3ee' }
    ];
  }, [latestReport]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 科技风格标题 */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              <h1 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 sm:text-4xl uppercase tracking-wider">
                ANALYSIS REPORT
              </h1>
              <div className="w-3 h-3 bg-cyan-400 rounded-full ml-3 animate-pulse"></div>
            </div>
            <p className="text-gray-400 font-light text-lg mb-6">AI驱动的健身数据分析</p>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={generateReport.isPending}
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                {generateReport.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <ChartIcon className="w-4 h-4 mr-2" />
                    GENERATE REPORT
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

      {!latestReport ? (
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12 text-center">
            <div className="text-cyan-400 mb-6">
              <div className="text-8xl mb-4 animate-pulse">📊</div>
              <h3 className="text-xl font-bold font-mono uppercase tracking-wider mb-2">NO DATA FOUND</h3>
              <p className="text-gray-400 mb-6">生成您的第一份健身分析报告</p>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={generateReport.isPending}
                className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  {generateReport.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'GENERATE NOW'
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 科技风格仪表盘头部 */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
            <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider mb-2">
                    PROGRESS DASHBOARD
                  </h2>
                  <p className="text-gray-400">数据驱动洞察，助力您的健身之旅</p>
                  <p className="text-sm text-gray-500 mt-2 font-mono">
                    LAST ANALYSIS: {new Date(latestReport.generated_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={generateReport.isPending}
                  className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    {generateReport.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <ChartIcon className="w-4 h-4 mr-2" />
                        RE-ANALYZE
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 科技风格指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:scale-105 flex items-center justify-center">
                <Gauge value={latestReport.report_data.progressScore || 0} label="综合进展分" />
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:scale-105 flex flex-col justify-center space-y-4">
                <MetricDisplay
                  icon={TrophyIcon}
                  label="总减重"
                  value={latestReport.report_data.keyMetrics?.totalWeightLoss?.toFixed(1) || '0'}
                  unit="kg"
                />
                <MetricDisplay
                  icon={ChartIcon}
                  label="总腰围减少"
                  value={latestReport.report_data.keyMetrics?.totalWaistReduction?.toFixed(1) || '0'}
                  unit="cm"
                />
                <MetricDisplay
                  icon={SparklesIcon}
                  label="周均减重"
                  value={latestReport.report_data.keyMetrics?.avgWeeklyLoss?.toFixed(2) || '0'}
                  unit="kg"
                />
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:scale-105 flex flex-col justify-center space-y-4">
                <MetricDisplay
                  icon={LightbulbIcon}
                  label="平均热量缺口"
                  value={Math.round(latestReport.report_data.keyMetrics?.avgCalorieDeficit || 0).toString()}
                  unit="kcal"
                />
                <MetricDisplay
                  icon={ActivityIcon}
                  label="平均运动消耗"
                  value={Math.round(latestReport.report_data.keyMetrics?.avgActivityExpenditure || 0).toString()}
                  unit="kcal"
                />
                <MetricDisplay
                  icon={SparklesIcon}
                  label="记录一致性"
                  value={Math.round(latestReport.report_data.consistency?.consistencyPercentage || 0).toString()}
                  unit="%"
                />
              </div>
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-full transition-all duration-300 hover:scale-105 flex flex-col justify-center space-y-4">
                <MetricDisplay
                  icon={MoonIcon}
                  label="平均睡眠"
                  value={latestReport.report_data.sleepAnalysis?.avgHours?.toFixed(1) || '0'}
                  unit="小时"
                />
                <MetricDisplay
                  icon={WaterDropIcon}
                  label="平均饮水"
                  value={latestReport.report_data.hydrationAnalysis?.avgWaterL?.toFixed(1) || '0'}
                  unit="升"
                />
                <p className="text-xs text-center text-gray-300 px-2 pt-2">
                  {latestReport.report_data.hydrationAnalysis?.comment || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="每周体重变化">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latestReport.report_data.weeklySummary || []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                  <XAxis
                    dataKey="week"
                    stroke="rgb(156 163 175)"
                    fontSize={12}
                    tickFormatter={(value) => {
                      // 如果是日期范围格式，简化显示
                      if (typeof value === 'string' && value.includes('~')) {
                        const parts = value.split('~');
                        if (parts.length === 2) {
                          const startDate = parts[0].trim();
                          const endDate = parts[1].trim();
                          // 提取月日信息
                          const startMD = startDate.substring(5); // 去掉年份
                          const endMD = endDate.substring(5);
                          return `${startMD}~${endMD}`;
                        }
                      }
                      return value;
                    }}
                  />
                  <YAxis
                    stroke="rgb(156 163 175)"
                    allowDecimals={true}
                    width={60}
                    domain={weeklyWeightDomain}
                    label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: 'rgb(156 163 175)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.98)',
                      border: '2px solid #22d3ee',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    labelStyle={{
                      color: '#22d3ee',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}
                    formatter={(value, name) => [
                      <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                        {`${Number(value).toFixed(2)} kg`}
                      </span>,
                      name === 'weightChange' ? '周变化' : ''
                    ]}
                  />
                  <Bar dataKey="weightChange" name="周变化" radius={[4, 4, 0, 0]}>
                    {(latestReport.report_data.weeklySummary || []).map((entry: any, index: number) => {
                      let fillColor;
                      if (entry.weightChange === null || entry.weightChange === undefined) {
                        fillColor = '#6b7280'; // 灰色，但更好看的灰色
                      } else if (entry.weightChange <= 0) {
                        fillColor = '#22d3ee'; // 青色 - 减重
                      } else {
                        fillColor = '#ef4444'; // 红色 - 增重
                      }

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={fillColor}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="体重与腰围趋势">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                  <XAxis dataKey="date" stroke="rgb(156 163 175)" fontSize={12}/>
                  <YAxis yAxisId="left" stroke="#22d3ee" domain={weightDomain} width={40} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={waistDomain} width={40} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.98)',
                      border: '2px solid #22d3ee',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    labelStyle={{
                      color: '#22d3ee',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="Weight" name="体重 (kg)" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} activeDot={{ r: 6, fill: '#22d3ee', stroke: '#22d3ee' }} connectNulls />
                  <Line yAxisId="right" type="monotone" dataKey="Waist" name="腰围 (cm)" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#10b981' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Section 3: Nutrition Analysis */}
          {nutritionData.length > 0 && (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                  <h2 className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider">NUTRITION ANALYSIS</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-400 font-mono uppercase tracking-wider mb-4">营养分布</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={nutritionData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="none"
                          >
                            {nutritionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.98)',
                              border: '2px solid #22d3ee',
                              borderRadius: '0.75rem',
                              color: '#ffffff !important',
                              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                            labelStyle={{
                              color: '#22d3ee !important',
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}
                            itemStyle={{
                              color: '#ffffff !important',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                            formatter={(value, name) => [
                              <span style={{ color: '#ffffff' }}>{`${Number(value).toFixed(1)}%`}</span>,
                              <span style={{ color: '#22d3ee' }}>{name}</span>
                            ]}
                          />
                          <Legend iconSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-green-500/30">
                      <h4 className="font-semibold text-green-400 font-mono uppercase tracking-wider mb-2">饮食亮点</h4>
                      <p className="text-sm text-gray-300">
                        {latestReport.report_data.nutritionInsights?.positive || '蛋白质摄入量持续稳定，多数餐食包含多种维生素和矿物质来源，如蔬菜、鱼类和坚果，这对于机体的正常运转是有益的。'}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-yellow-500/30">
                      <h4 className="font-semibold text-yellow-400 font-mono uppercase tracking-wider mb-2">改进建议</h4>
                      <p className="text-sm text-gray-300">
                        {latestReport.report_data.nutritionInsights?.improvement || '存在部分高热量密度食物的摄入，可能导致热量过剩。此外，部分餐食缺乏膳食纤维，可能导致饱腹感不足，第三餐完整性有待提高。'}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-cyan-500/30">
                      <h4 className="font-semibold text-cyan-400 font-mono uppercase tracking-wider mb-2">营养分布评价</h4>
                      <p className="text-sm text-gray-300">
                        {latestReport.report_data.nutritionInsights?.macroDistribution?.comment || '营养素分配基本均衡，建议继续保持当前的饮食结构。'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: AI Insights */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                <h2 className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider">AI INSIGHTS</h2>
              </div>
              <p className="text-gray-400 mb-6">
                {latestReport.report_data.weeklyOutlook || '基于您的数据分析，为您提供个性化的健身建议和洞察。'}
              </p>

              {latestReport.report_data.potentialRisks && latestReport.report_data.potentialRisks.length > 0 && (
                <div className="bg-gray-800/30 rounded-lg p-4 border border-yellow-500/30 mb-6">
                  <div className="flex items-center">
                    <div className="bg-yellow-500/20 text-yellow-400 rounded-lg p-2 border border-yellow-500/30">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-400 font-mono uppercase tracking-wider ml-3">潜在风险与关注点</h3>
                  </div>
                  <div className="mt-3 text-sm text-gray-300">
                    <AiAnalysisList points={latestReport.report_data.potentialRisks} />
                  </div>
                </div>
              )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InsightCard title="成就亮点" icon={<TrophyIcon className="w-6 h-6" />}>
                <AiAnalysisList points={latestReport.report_data.achievements || []} />
              </InsightCard>
              <InsightCard title="核心行动建议" icon={<TargetIcon className="w-6 h-6" />}>
                <AiAnalysisList points={latestReport.report_data.actionableTips || []} />
              </InsightCard>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InsightCard title="个性化运动处方" icon={<ClipboardListIcon className="w-6 h-6" />}>
                <p className="font-semibold">{renderInlineMarkdown(latestReport.report_data.exercisePrescription?.recommendation || '根据您的数据制定个性化运动计划')}</p>
                <ul className="list-disc list-outside pl-5 mt-2 space-y-1">
                  {(latestReport.report_data.exercisePrescription?.details || []).map((detail: string, index: number) => (
                    <li key={index}>{renderInlineMarkdown(detail)}</li>
                  ))}
                </ul>
              </InsightCard>

              <InsightCard title="为你推荐的超级食物" icon={<FireIcon className="w-6 h-6" />}>
                <div className="space-y-3">
                  {(latestReport.report_data.recommendedSuperfoods || []).map((food: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-3">
                      <h4 className="font-semibold text-gray-100">{food.food}</h4>
                      <p className="text-sm text-gray-300">{food.reason}</p>
                    </div>
                  ))}
                </div>
              </InsightCard>
            </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
