import React, { useRef, useState } from 'react';
import { AIAnalysisModal } from './AIAnalysisModal';

// 简单的图标组件
const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const Camera = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 1.5L5 6l1.5 1.5L5 9l1.5 1.5L5 12l1.5 1.5L5 15l1.5 1.5L5 18l1.5 1.5L5 21M19 3l-1.5 1.5L19 6l-1.5 1.5L19 9l-1.5 1.5L19 12l-1.5 1.5L19 15l-1.5 1.5L19 18l-1.5 1.5L19 21" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface ImageUploadProps {
  onImageAnalyzed: (analysis: any) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageAnalyzed,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        analyzeImage(file, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (file: File, imageUrl: string) => {
    setIsAnalyzing(true);
    setShowModal(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // 获取认证token
      const token = localStorage.getItem('token');

      const response = await fetch('/api/analyze-food-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAnalysisResult(result.analysis);
          onImageAnalyzed(result.analysis);
        } else {
          console.error('分析失败:', result.message);
          setAnalysisResult(null);
        }
      } else {
        const errorData = await response.json();
        console.error('分析失败:', errorData.detail);
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error('分析错误:', error);
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="上传食物图片"
        />

        {selectedImage ? (
          <div className="relative group">
            <img
              src={selectedImage}
              alt="上传的食物图片"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"
              onClick={() => setShowModal(true)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                  title="查看AI分析"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                  title="删除图片"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            {analysisResult && (
              <div className="absolute top-2 left-2 bg-indigo-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                已分析
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUploadClick}
            className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-gray-400" />
              <Camera className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              上传图片
            </span>
          </button>
        )}
      </div>

      <AIAnalysisModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        imageUrl={selectedImage || ''}
        analysis={analysisResult}
        isAnalyzing={isAnalyzing}
      />
    </>
  );
};
