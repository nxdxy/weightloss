import React, { useState, useEffect } from 'react';
import type { UserInfo, DailyLogEntry, StoredAnalysisReport, MealLog } from './types';
import { Page } from './types';
import { UserIcon, ChatIcon, TableIcon, ChartIcon, MenuIcon, XIcon, SettingsIcon, BookOpenIcon } from './components/Icons';
import { UserInfoForm } from './components/UserInfo';
import { DataLog } from './components/DataLog';
import { AnalysisReport } from './components/AnalysisReport';
import { ChatInterface } from './components/Chat';
import { SettingsPage } from './components/Settings';
import { FoodKnowledgeBase } from './components/FoodRecommendations';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => {
    return (
        <li className="w-full">
            <button
                onClick={onClick}
                className={`flex items-center p-3 my-1 w-full text-base font-normal rounded-lg transition duration-75 group ${
                    isActive
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                {icon}
                <span className="flex-1 ml-3 whitespace-nowrap">{label}</span>
            </button>
        </li>
    );
};


const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        const apiKey = localStorage.getItem('gemini-api-key');
        return apiKey ? Page.PROFILE : Page.SETTINGS;
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // User Info State
    const [userInfo, setUserInfo] = useState<UserInfo>(() => {
        const saved = localStorage.getItem('userInfo');
        return saved ? JSON.parse(saved) : { age: null, gender: null, height: null, initialWeight: null, activityLevel: null };
    });

    // Daily Logs State with data sanitization on load
    const [logs, setLogs] = useState<DailyLogEntry[]>(() => {
        const saved = localStorage.getItem('dailyLogs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed.map((log: any): DailyLogEntry | null => {
                        if (typeof log !== 'object' || log === null || !log.date) return null;
                        
                        // Function to ensure meal data is in the new MealLog format for backward compatibility
                        const ensureMealLog = (mealData: any): MealLog => {
                            if (typeof mealData === 'string') {
                                return { text: mealData, image: undefined, analysis: undefined };
                            }
                            if (typeof mealData === 'object' && mealData !== null && typeof mealData.text === 'string') {
                                return { 
                                    text: mealData.text, 
                                    image: mealData.image || undefined,
                                    analysis: mealData.analysis || undefined,
                                };
                            }
                            return { text: '', image: undefined, analysis: undefined };
                        };

                        // Sanitize and ensure correct types
                        const safeLog: DailyLogEntry = {
                            id: log.id || crypto.randomUUID(),
                            date: log.date,
                            weightKg: log.weightKg && !isNaN(Number(log.weightKg)) ? Number(log.weightKg) : null,
                            waistCm: log.waistCm && !isNaN(Number(log.waistCm)) ? Number(log.waistCm) : null,
                            waterL: log.waterL && !isNaN(Number(log.waterL)) ? Number(log.waterL) : null,
                            sleepH: log.sleepH && !isNaN(Number(log.sleepH)) ? Number(log.sleepH) : null,
                            bmr: log.bmr && !isNaN(Number(log.bmr)) ? Number(log.bmr) : null,
                            tdee: log.tdee && !isNaN(Number(log.tdee)) ? Number(log.tdee) : null,
                            estimatedExpenditure: log.estimatedExpenditure && !isNaN(Number(log.estimatedExpenditure)) ? Number(log.estimatedExpenditure) : null,
                            actualIntake: log.actualIntake && !isNaN(Number(log.actualIntake)) ? Number(log.actualIntake) : null,
                            calorieDeficit: log.calorieDeficit && !isNaN(Number(log.calorieDeficit)) ? Number(log.calorieDeficit) : null,
                            proteinG: log.proteinG && !isNaN(Number(log.proteinG)) ? Number(log.proteinG) : null,
                            carbsG: log.carbsG && !isNaN(Number(log.carbsG)) ? Number(log.carbsG) : null,
                            fatG: log.fatG && !isNaN(Number(log.fatG)) ? Number(log.fatG) : null,
                            breakfast: ensureMealLog(log.breakfast),
                            lunch: ensureMealLog(log.lunch),
                            dinner: ensureMealLog(log.dinner),
                            activity: log.activity || '',
                            summary: log.summary || log.notes || '', // Backwards compatibility for 'notes'
                        };
                        return safeLog;
                    }).filter((log): log is DailyLogEntry => log !== null);
                }
            } catch (e) {
                console.error("Failed to parse or sanitize logs from localStorage", e);
                return [];
            }
        }
        return [];
    });

    // Analysis Report State
    const [analysisReport, setAnalysisReport] = useState<StoredAnalysisReport>(() => {
        const saved = localStorage.getItem('analysisReport');
        return saved ? JSON.parse(saved) : { data: null, generatedAt: null };
    });

    useEffect(() => {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }, [userInfo]);

    useEffect(() => {
        // WARNING: Storing full-resolution images in localStorage can quickly
        // exceed browser storage limits (typically 5-10MB), which may cause
        // the application to crash or fail to save data.
        try {
            localStorage.setItem('dailyLogs', JSON.stringify(logs));
        } catch (error) {
            console.error("Could not save logs to localStorage. This is likely due to storage limits being exceeded.", error);
            alert("警告：无法将日志保存到您的浏览器。存储空间可能已满。这可能导致应用崩溃或数据丢失。请考虑定期清理旧的记录。");
        }
    }, [logs]);

    useEffect(() => {
        localStorage.setItem('analysisReport', JSON.stringify(analysisReport));
    }, [analysisReport]);


    // Centralized handler for API key errors
    const handleApiKeyError = () => {
        alert("AI功能验证失败。请检查您的API密钥是否正确，或前往设置页面重新配置。");
        setCurrentPage(Page.SETTINGS);
    };

    const renderPage = () => {
        switch (currentPage) {
            case Page.PROFILE:
                return <UserInfoForm userInfo={userInfo} setUserInfo={setUserInfo} setCurrentPage={setCurrentPage} />;
            case Page.LOG:
                return <DataLog logs={logs} setLogs={setLogs} userInfo={userInfo} setCurrentPage={setCurrentPage} onApiKeyMissing={handleApiKeyError} />;
            case Page.REPORT:
                return <AnalysisReport logs={logs} userInfo={userInfo} setCurrentPage={setCurrentPage} analysisReport={analysisReport} setAnalysisReport={setAnalysisReport} onApiKeyMissing={handleApiKeyError} />;
            case Page.CHAT:
                return <ChatInterface onApiKeyMissing={handleApiKeyError} />;
            case Page.FOOD_KNOWLEDGE:
                return <FoodKnowledgeBase />;
            case Page.SETTINGS:
                return <SettingsPage />;
            default:
                return <UserInfoForm userInfo={userInfo} setUserInfo={setUserInfo} setCurrentPage={setCurrentPage} />;
        }
    };
    
    const navItems = [
      { page: Page.PROFILE, icon: <UserIcon className="w-6 h-6" />, label: '个人资料' },
      { page: Page.CHAT, icon: <ChatIcon className="w-6 h-6" />, label: 'AI聊天' },
      { page: Page.LOG, icon: <TableIcon className="w-6 h-6" />, label: '每日记录' },
      { page: Page.REPORT, icon: <ChartIcon className="w-6 h-6" />, label: '分析报告' },
      { page: Page.FOOD_KNOWLEDGE, icon: <BookOpenIcon className="w-6 h-6" />, label: '饮食知识库' },
    ];

    const bottomNavItems = [
      { page: Page.SETTINGS, icon: <SettingsIcon className="w-6 h-6" />, label: '设置' },
    ];

    const handleNavItemClick = (page: Page) => {
        setCurrentPage(page);
        setIsSidebarOpen(false); // Close sidebar on navigation
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
             {/* Sidebar Overlay for mobile */}
             {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-md transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
                <div className="flex-shrink-0">
                    <div className="flex items-center p-4 mb-6 h-10">
                         <span className="text-3xl">💪</span>
                         <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">健身伙伴</h1>
                         <button onClick={() => setIsSidebarOpen(false)} className="ml-auto md:hidden p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Close sidebar">
                            <XIcon className="w-6 h-6" />
                         </button>
                    </div>
                </div>
                <div className="flex-grow p-4 pt-0 overflow-y-auto">
                    <nav>
                        <ul>
                          {navItems.map(item => (
                            <NavItem
                              key={item.page}
                              icon={item.icon}
                              label={item.label}
                              isActive={currentPage === item.page}
                              onClick={() => handleNavItemClick(item.page)}
                            />
                          ))}
                        </ul>
                    </nav>
                </div>
                 <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                    <nav>
                        <ul>
                          {bottomNavItems.map(item => (
                            <NavItem
                              key={item.page}
                              icon={item.icon}
                              label={item.label}
                              isActive={currentPage === item.page}
                              onClick={() => handleNavItemClick(item.page)}
                            />
                          ))}
                        </ul>
                    </nav>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                 {/* Top bar with hamburger menu for mobile */}
                 <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                     <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-gray-500 dark:text-gray-400" aria-label="Open sidebar">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold">{currentPage}</h2>
                    <div className="w-6"></div> {/* Spacer to balance title */}
                </header>

                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;