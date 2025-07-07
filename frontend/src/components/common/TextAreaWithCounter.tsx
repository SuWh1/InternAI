import React from 'react';

interface TextAreaWithCounterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  maxLength: number;
  rows?: number;
}

const TextAreaWithCounter: React.FC<TextAreaWithCounterProps> = ({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
}) => {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full px-4 py-3 bg-theme-secondary border-2 border-purple-300 dark:border-purple-600 text-theme-primary rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm placeholder-theme-secondary resize-none"
      />
      <div className="absolute bottom-3 right-3 text-xs text-theme-secondary">
        {value.length} / {maxLength}
      </div>
    </div>
  );
};

export default TextAreaWithCounter; 