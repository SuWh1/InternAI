import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  expandButtonClass?: string;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({ 
  text, 
  maxLength = 60, 
  className = "",
  expandButtonClass = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to truncate at word boundaries
  const truncateAtWordBoundary = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    // If no space found or the space is too close to the beginning, just use the truncated text
    return lastSpace > Math.floor(maxLength * 0.3) ? truncated.substring(0, lastSpace) : truncated;
  };

  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? truncateAtWordBoundary(text, maxLength) 
    : text;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent elements
    setIsExpanded(!isExpanded);
  };

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>;
  }

  return (
    <div className="transition-all duration-300 ease-in-out">
      <span className={className}>
        {displayText}
        {!isExpanded && '...'}
      </span>
      
      <button
        onClick={toggleExpanded}
        className={`ml-2 inline-flex items-center gap-1 text-xs font-medium transition-colors duration-200 hover:opacity-80 focus:outline-none rounded-sm px-1 ${
          expandButtonClass || 'text-theme-accent'
        }`}
        aria-label={isExpanded ? 'Show less' : 'Show more'}
      >
        <span>{isExpanded ? 'Show less' : 'Show more'}</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

export default TruncatedText; 