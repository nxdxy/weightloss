import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EditIcon, SaveIcon, CancelIcon } from '../components/Icons';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || '',
    height: user?.height?.toString() || '',
    initial_weight: user?.initial_weight?.toString() || '',
    activity_level: user?.activity_level || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const updateData = {
        email: formData.email || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        initial_weight: formData.initial_weight ? parseFloat(formData.initial_weight) : undefined,
        activity_level: formData.activity_level || undefined
      };
      
      await updateProfile(updateData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      age: user?.age?.toString() || '',
      gender: user?.gender || '',
      height: user?.height?.toString() || '',
      initial_weight: user?.initial_weight?.toString() || '',
      activity_level: user?.activity_level || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 科技风格标题 */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              <h1 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 sm:text-4xl uppercase tracking-wider">
                USER PROFILE
              </h1>
              <div className="w-3 h-3 bg-cyan-400 rounded-full ml-3 animate-pulse"></div>
            </div>
            <p className="text-gray-400 font-light text-lg mb-6">个人信息管理中心</p>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <EditIcon className="w-4 h-4 mr-2" />
                  EDIT PROFILE
                </div>
              </button>
            ) : (
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-green-400 font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <SaveIcon className="w-4 h-4 mr-2" />
                        SAVE
                      </>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg text-red-400 font-mono uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    <CancelIcon className="w-4 h-4 mr-2" />
                    CANCEL
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 科技风格表单 */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-cyan-400 font-mono uppercase tracking-wider mb-3">
                  USERNAME
                </label>
                <div className="px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono">
                  {user.username}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 font-mono uppercase tracking-wider mb-3">
                  EMAIL
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                    placeholder="输入邮箱地址"
                  />
                ) : (
                  <div className="px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono">
                    {user.email || '未设置'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 font-mono uppercase tracking-wider mb-3">
                  年龄
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    min="1"
                    max="150"
                    value={formData.age}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                    placeholder="输入年龄"
                  />
                ) : (
                  <div className="px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono">
                    {user.age ? `${user.age} 岁` : '未设置'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 font-mono uppercase tracking-wider mb-3">
                  性别
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                  >
                    <option value="">选择性别</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono">
                    {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : user.gender === 'other' ? '其他' : '未设置'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 font-mono uppercase tracking-wider mb-3">
                  身高 (cm)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="height"
                    min="50"
                    max="300"
                    step="0.1"
                    value={formData.height}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                    placeholder="输入身高"
                  />
                ) : (
                  <div className="px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono">
                    {user.height ? `${user.height} cm` : '未设置'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 font-mono uppercase tracking-wider mb-3">
                  初始体重 (kg)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="initial_weight"
                    min="20"
                    max="500"
                    step="0.1"
                    value={formData.initial_weight}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                    placeholder="输入体重"
                  />
                ) : (
                  <div className="px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono">
                    {user.initial_weight ? `${user.initial_weight} kg` : '未设置'}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-cyan-400 font-mono uppercase tracking-wider mb-3">
                  活动水平
                </label>
                {isEditing ? (
                  <select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300"
                  >
                    <option value="">选择活动水平</option>
                    <option value="sedentary">久坐不动</option>
                    <option value="light">轻度活动</option>
                    <option value="moderate">中度活动</option>
                    <option value="active">高度活动</option>
                    <option value="very_active">极高活动</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 border border-gray-700/50 rounded-lg bg-gray-800/50 text-gray-300 font-mono">
                    {user.activity_level === 'sedentary' ? '久坐不动' :
                     user.activity_level === 'light' ? '轻度活动' :
                     user.activity_level === 'moderate' ? '中度活动' :
                     user.activity_level === 'active' ? '高度活动' :
                     user.activity_level === 'very_active' ? '极高活动' : '未设置'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 账户信息 */}
        <div className="mt-8 group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="text-sm text-gray-400 font-mono">
              <p>账户创建时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}</p>
              <p>最后更新时间: {new Date(user.updated_at).toLocaleDateString('zh-CN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
