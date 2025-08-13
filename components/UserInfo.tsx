
import React from 'react';
import type { UserInfo } from '../types';

interface UserInfoProps {
  userInfo: UserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
}

const Label: React.FC<{htmlFor: string; children: React.ReactNode}> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100" />
);


export const UserInfoForm: React.FC<UserInfoProps> = ({ userInfo, setUserInfo }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value ? Number(value) || value : null }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">个人资料</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">此信息有助于我们为您提供个性化的分析和建议。</p>
            </div>

            <div className="mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <Label htmlFor="age">年龄</Label>
                        <Input id="age" name="age" type="number" value={userInfo.age || ''} onChange={handleChange} placeholder="例如：30" />
                    </div>
                    <div>
                        <Label htmlFor="gender">性别</Label>
                        <Select id="gender" name="gender" value={userInfo.gender || ''} onChange={handleChange}>
                            <option value="">请选择...</option>
                            <option value="male">男性</option>
                            <option value="female">女性</option>
                            <option value="other">其他</option>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="height">身高 (cm)</Label>
                        <Input id="height" name="height" type="number" value={userInfo.height || ''} onChange={handleChange} placeholder="例如：175" />
                    </div>
                    <div>
                        <Label htmlFor="initialWeight">初始体重 (kg)</Label>
                        <Input id="initialWeight" name="initialWeight" type="number" value={userInfo.initialWeight || ''} onChange={handleChange} placeholder="例如：85.5"/>
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="activityLevel">活动水平</Label>
                        <Select id="activityLevel" name="activityLevel" value={userInfo.activityLevel || ''} onChange={handleChange}>
                            <option value="">请选择...</option>
                            <option value="sedentary">久坐（很少或没有运动）</option>
                            <option value="light">轻度活跃（轻度运动/每周1-3天）</option>
                            <option value="moderate">中度活跃（中度运动/每周3-5天）</option>
                            <option value="active">非常活跃（高强度运动/每周6-7天）</option>
                            <option value="very_active">极度活跃（高强度运动和体力劳动）</option>
                        </Select>
                    </div>
                </form>
                <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 text-center">
                  <p>您的信息会自动保存在浏览器中。</p>
                </div>
            </div>
        </div>
    </div>
  );
};
