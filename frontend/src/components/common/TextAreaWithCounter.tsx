import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TextAreaWithCounterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  maxLength: number;
  rows?: number;
  disabled?: boolean;
}

const TextAreaWithCounter: React.FC<TextAreaWithCounterProps> = React.memo(({
  value,
  onChange,
  onKeyDown,
  placeholder,
  maxLength,
  rows = 4,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const getBackgroundColor = (state: 'normal' | 'hover' | 'focus') => {
    if (isDark) {
      switch (state) {
        case 'focus': return '#2A2A2A';
        case 'hover': return '#2A2A2A';
        default: return '#1E1E1E';
      }
    } else {
      switch (state) {
        case 'focus': return '#FFFFFF';
        case 'hover': return '#FFFFFF';
        default: return '#FFFFFF';
      }
    }
  };

  const getBorderColor = () => isDark ? '#333333' : '#CCCCCC';
  const getTextColor = () => isDark ? '#FFFFFF' : '#000000';
  const getCounterColor = () => isDark ? '#888888' : '#666666';

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: getBackgroundColor('normal'),
          borderWidth: '1px',
          borderColor: getBorderColor(),
          color: getTextColor()
        }}
        onFocus={(e) => {
          e.target.style.backgroundColor = getBackgroundColor('focus');
        }}
        onBlur={(e) => {
          e.target.style.backgroundColor = getBackgroundColor('normal');
        }}
        onMouseEnter={(e) => {
          const target = e.target as HTMLTextAreaElement;
          if (!target.matches(':focus')) {
            target.style.backgroundColor = getBackgroundColor('hover');
          }
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLTextAreaElement;
          if (!target.matches(':focus')) {
            target.style.backgroundColor = getBackgroundColor('normal');
          }
        }}
      />
      <div className="absolute bottom-3 right-3 text-xs" style={{
        color: getCounterColor()
      }}>
        {value.length} / {maxLength}
      </div>
    </div>
  );
});

TextAreaWithCounter.displayName = 'TextAreaWithCounter';

export default TextAreaWithCounter;