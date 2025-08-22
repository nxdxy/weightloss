import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  UserIcon, 
  ChatIcon, 
  TableIcon, 
  ChartIcon, 
  MenuIcon, 
  XIcon, 
  SettingsIcon, 
  BookOpenIcon,
  LogoutIcon
} from './Icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => {
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

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  
  const navItems = [
    { path: '/profile', icon: <UserIcon className="w-6 h-6" />, label: '个人资料' },
    { path: '/chat', icon: <ChatIcon className="w-6 h-6" />, label: 'AI聊天' },
    { path: '/daily-log', icon: <TableIcon className="w-6 h-6" />, label: '每日记录' },

    { path: '/analysis', icon: <ChartIcon className="w-6 h-6" />, label: '分析报告' },
    { path: '/food-knowledge', icon: <BookOpenIcon className="w-6 h-6" />, label: '饮食知识库' },
  ];

  const bottomNavItems = [
    { path: '/settings', icon: <SettingsIcon className="w-6 h-6" />, label: '设置' },
  ];

  const handleNavItemClick = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCurrentPageTitle = () => {
    const currentItem = [...navItems, ...bottomNavItems].find(item => item.path === location.pathname);
    return currentItem?.label || '健身伙伴';
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-md transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex-shrink-0">
          <div className="flex items-center p-4 mb-6 h-16">
            <span className="text-3xl">💪</span>
            <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">健身伙伴</h1>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="ml-auto md:hidden p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" 
              aria-label="Close sidebar"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-grow p-4 pt-0 overflow-y-auto">
          <nav>
            <ul>
              {navItems.map(item => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={location.pathname === item.path}
                  onClick={() => handleNavItemClick(item.path)}
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
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={location.pathname === item.path}
                  onClick={() => handleNavItemClick(item.path)}
                />
              ))}
              
              {/* User Info and Logout */}
              <li className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center p-2 text-sm text-gray-600 dark:text-gray-400">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span className="truncate">{user?.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center p-2 w-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition duration-75"
                >
                  <LogoutIcon className="w-4 h-4 mr-2" />
                  <span>退出登录</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with hamburger menu for mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-1 text-gray-500 dark:text-gray-400" 
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold">{getCurrentPageTitle()}</h2>
          <div className="w-6" /> {/* Spacer to balance title */}
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
