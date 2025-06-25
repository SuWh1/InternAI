import React from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../contexts/ThemeContext';

interface LessonRendererProps {
  content: string;
}

const LessonRenderer: React.FC<LessonRendererProps> = ({ content }) => {
  const { theme } = useTheme();

  const parseContent = (text: string) => {
    const sections = text.split(/(?=^## )/gm);
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      return <SectionRenderer key={index} content={section.trim()} theme={theme} />;
    }).filter(Boolean);
  };

  return (
    <div className="lesson-content-container">
      {parseContent(content)}
    </div>
  );
};

interface SectionRendererProps {
  content: string;
  theme: string;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ content, theme }) => {
  // Extract title if it starts with #
  const titleMatch = content.match(/^#+ (.+?)$/m);
  const title = titleMatch ? titleMatch[1] : null;
  
  // Remove the title line from content
  const bodyContent = titleMatch ? content.replace(/^#+ .+?$/m, '').trim() : content;
  
  return (
    <div className="lesson-section mb-8">
      {title && <MainTitle title={title} />}
      <ContentRenderer content={bodyContent} theme={theme} />
    </div>
  );
};

const MainTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-theme-primary mb-3">
      {title}
    </h1>
    <div className="w-16 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
  </div>
);

interface ContentRendererProps {
  content: string;
  theme: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content, theme }) => {
  const parseContentParts = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    // Split by code blocks and sections
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const sectionRegex = /^## (.+?)$/gm;
    
    let match;
    const allMatches: Array<{ type: string; match: RegExpExecArray; index: number }> = [];
    
    // Find all code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      allMatches.push({ type: 'code', match, index: match.index });
    }
    
    // Find all section headers
    codeBlockRegex.lastIndex = 0; // Reset regex
    while ((match = sectionRegex.exec(text)) !== null) {
      allMatches.push({ type: 'section', match, index: match.index });
    }
    
    // Sort by index
    allMatches.sort((a, b) => a.index - b.index);
    
    allMatches.forEach(({ type, match }) => {
      // Add text before this match
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index).trim();
        if (beforeText) {
          parts.push({ type: 'text', content: beforeText });
        }
      }
      
      if (type === 'code') {
        parts.push({
          type: 'code',
          language: match[1] || 'javascript',
          content: match[2].trim()
        });
      } else if (type === 'section') {
        parts.push({
          type: 'section',
          content: match[1]
        });
      }
      
      currentIndex = match.index + match[0].length;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex).trim();
      if (remainingText) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
    
    return parts;
  };

  const renderPart = (part: any, index: number) => {
    switch (part.type) {
      case 'section':
        return <SectionHeader key={index} title={part.content} />;
      case 'code':
        return <CodeBlock key={index} code={part.content} language={part.language} theme={theme} />;
      case 'text':
        return <TextContent key={index} content={part.content} />;
      default:
        return null;
    }
  };

  const parts = parseContentParts(content);
  
  return (
    <div className="space-y-6">
      {parts.map(renderPart)}
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
  // Extract emoji and clean title
  const emojiMatch = title.match(/^([🚀🎯⚡💡🌍🧠🧪🛠️🔁🧱❗📈✅🔧🎨💪🧩]\s*)(.*)/);
  const emoji = emojiMatch ? emojiMatch[1].trim() : '';
  const cleanTitle = emojiMatch ? emojiMatch[2] : title;
  
  return (
    <div className="section-header mb-4 mt-6 first:mt-0">
      <div className="flex items-center gap-2 mb-3">
        {emoji && (
          <div className="text-lg p-1.5 rounded-lg bg-theme-accent/10 border border-theme-accent/20">
            {emoji}
          </div>
        )}
        <h2 className="text-lg font-semibold text-theme-primary flex-1">
          {cleanTitle}
        </h2>
      </div>
      <div className="w-full h-px bg-gradient-to-r from-theme-accent/30 to-transparent"></div>
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  language: string;
  theme: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, theme }) => {
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  
  // Calculate height based on lines (minimum 100px, maximum 400px)
  const lines = code.split('\n').length;
  const height = Math.min(Math.max(lines * 20 + 40, 100), 400);
  
  return (
    <div className="code-block-container my-6">
      <div className="code-block-header flex items-center justify-between bg-theme-hover border border-theme rounded-t-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-medium text-theme-secondary ml-2">
            {language.toUpperCase()}
          </span>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-theme-secondary hover:text-theme-primary transition-colors duration-200 px-2 py-1 rounded hover:bg-theme-primary/10"
        >
          Copy
        </button>
      </div>
      
      <div className="border border-t-0 border-theme rounded-b-lg overflow-hidden">
        <Editor
          height={height}
          language={language}
          value={code}
          theme={editorTheme}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            }
          }}
        />
      </div>
    </div>
  );
};

interface TextContentProps {
  content: string;
}

const TextContent: React.FC<TextContentProps> = ({ content }) => {
  const renderFormattedText = (text: string) => {
    // Handle different text patterns - improved regex without conflicting anchors
    const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
    
    return parts.map((part, index) => {
      // Bold text
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-semibold text-theme-primary">
            {part.slice(2, -2)}
          </strong>
        );
      }
      
      // Italic text
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.includes('**')) {
        return (
          <em key={index} className="italic text-theme-secondary">
            {part.slice(1, -1)}
          </em>
        );
      }
      
      // Inline code
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={index} className="px-2 py-1 bg-theme-hover text-theme-accent rounded font-mono text-sm border border-theme">
            {part.slice(1, -1)}
          </code>
        );
      }
      
      // Check for list items in regular text parts
      const lines = part.split('\n');
      if (lines.length > 1) {
        return (
          <span key={index}>
            {lines.map((line, lineIndex) => {
              // List items
              if (line.match(/^- .+$/)) {
                return (
                  <div key={lineIndex} className="flex items-start gap-3 my-2">
                    <div className="w-2 h-2 bg-theme-accent rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-theme-secondary leading-relaxed">
                      {renderFormattedText(line.slice(2))}
                    </span>
                  </div>
                );
              }
              
              // Numbered lists
              if (line.match(/^\d+\. .+$/)) {
                const number = line.match(/^(\d+)\. (.+)$/);
                return (
                  <div key={lineIndex} className="flex items-start gap-3 my-2">
                    <div className="w-6 h-6 bg-theme-accent text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {number?.[1]}
                    </div>
                    <span className="text-theme-secondary leading-relaxed">
                      {renderFormattedText(number?.[2] || '')}
                    </span>
                  </div>
                );
              }
              
              // Regular text line
              return (
                <span key={lineIndex} className="text-theme-secondary leading-relaxed">
                  {line}
                  {lineIndex < lines.length - 1 && <br />}
                </span>
              );
            })}
          </span>
        );
      }
      
      // Single line - check for list items
      if (part.match(/^- .+$/)) {
        return (
          <div key={index} className="flex items-start gap-3 my-2">
            <div className="w-2 h-2 bg-theme-accent rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-theme-secondary leading-relaxed">
              {renderFormattedText(part.slice(2))}
            </span>
          </div>
        );
      }
      
      // Numbered lists
      if (part.match(/^\d+\. .+$/)) {
        const number = part.match(/^(\d+)\. (.+)$/);
        return (
          <div key={index} className="flex items-start gap-3 my-2">
            <div className="w-6 h-6 bg-theme-accent text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
              {number?.[1]}
            </div>
            <span className="text-theme-secondary leading-relaxed">
              {renderFormattedText(number?.[2] || '')}
            </span>
          </div>
        );
      }
      
      // Regular text
      return (
        <span key={index} className="text-theme-secondary leading-relaxed">
          {part}
        </span>
      );
    });
  };

  // Split into paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  
  return (
    <div className="text-content space-y-4">
      {paragraphs.map((paragraph, index) => {
        if (!paragraph.trim()) return null;
        
        // Special handling for "Try it yourself" sections
        if (paragraph.includes('**🧩 Try It Yourself:**') || paragraph.includes('💪 Try it yourself:')) {
          return (
            <div key={index} className="try-it-yourself bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 my-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🧩</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Try It Yourself</span>
              </div>
              <div className="text-theme-secondary">
                {renderFormattedText(paragraph.replace(/\*\*🧩 Try It Yourself:\*\*|💪 Try it yourself:/, '').trim())}
              </div>
            </div>
          );
        }
        
        return (
          <p key={index} className="paragraph mb-4 leading-relaxed">
            {renderFormattedText(paragraph)}
          </p>
        );
      })}
    </div>
  );
};

export default LessonRenderer; 