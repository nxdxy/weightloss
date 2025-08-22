import React, { useState, useRef, useEffect } from 'react';

interface EditableFieldProps {
  value: string | number | null;
  onSave: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  unit?: string;
  multiline?: boolean;
  rows?: number;
  large?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  type = 'text',
  placeholder = '空',
  className = '',
  displayClassName = '',
  unit = '',
  multiline = false,
  rows = 1,
  large = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleClick = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = value !== null && value !== undefined && value !== ''
    ? `${value}${unit}`
    : placeholder;

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: `border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`,
      placeholder
    };

    if (multiline) {
      return (
        <textarea
          {...commonProps}
          rows={rows}
        />
      );
    } else {
      return (
        <input
          {...commonProps}
          type={type}
          step={type === 'number' ? '0.1' : undefined}
        />
      );
    }
  }

  const baseClasses = `cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors min-h-[1.5rem] flex items-center`;
  const sizeClasses = large ? 'text-2xl font-bold' : 'text-sm';
  const colorClasses = value !== null && value !== undefined && value !== ''
    ? 'text-gray-900 dark:text-white'
    : 'text-gray-400 dark:text-gray-500';

  return (
    <div
      onClick={handleClick}
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${displayClassName}`}
      title="点击编辑"
    >
      {displayValue}
    </div>
  );
};
