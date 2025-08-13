
import React, { useState, useEffect } from 'react';
import type { UserInfo, DailyLogEntry, StoredAnalysisReport } from './types';
import { Page } from './types';
import { UserIcon, ChatIcon, TableIcon, ChartIcon } from './components/Icons';
import { UserInfoForm } from './components/UserInfo';
import { DataLog } from './components/DataLog';
import { AnalysisReport } from './components/AnalysisReport';
import { ChatInterface } from './components/Chat';

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
    const [currentPage, setCurrentPage] = useState<Page>(Page.PROFILE);
    
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
                            breakfast: log.breakfast || '',
                            lunch: log.lunch || '',
                            dinner: log.dinner || '',
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
        localStorage.setItem('dailyLogs', JSON.stringify(logs));
    }, [logs]);

    useEffect(() => {
        localStorage.setItem('analysisReport', JSON.stringify(analysisReport));
    }, [analysisReport]);


    const renderPage = () => {
        switch (currentPage) {
            case Page.PROFILE:
                return <UserInfoForm userInfo={userInfo} setUserInfo={setUserInfo} />;
            case Page.LOG:
                return <DataLog logs={logs} setLogs={setLogs} userInfo={userInfo} setCurrentPage={setCurrentPage} />;
            case Page.REPORT:
                return <AnalysisReport logs={logs} userInfo={userInfo} setCurrentPage={setCurrentPage} analysisReport={analysisReport} setAnalysisReport={setAnalysisReport} />;
            case Page.CHAT:
                return <ChatInterface />;
            default:
                return <UserInfoForm userInfo={userInfo} setUserInfo={setUserInfo} />;
        }
    };
    
    const navItems = [
      { page: Page.PROFILE, icon: <UserIcon className="w-6 h-6" />, label: '个人资料' },
      { page: Page.CHAT, icon: <ChatIcon className="w-6 h-6" />, label: 'AI聊天' },
      { page: Page.LOG, icon: <TableIcon className="w-6 h-6" />, label: '每日记录' },
      { page: Page.REPORT, icon: <ChartIcon className="w-6 h-6" />, label: '分析报告' }
    ];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 shadow-md">
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center mb-6">
                         <span className="text-3xl">💪</span>
                         <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">健身伙伴</h1>
                    </div>
                    <nav>
                        <ul>
                          {navItems.map(item => (
                            <NavItem
                              key={item.page}
                              icon={item.icon}
                              label={item.label}
                              isActive={currentPage === item.page}
                              onClick={() => setCurrentPage(item.page)}
                            />
                          ))}
                        </ul>
                    </nav>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;