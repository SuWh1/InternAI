import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../contexts/ThemeContext';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const { theme } = useTheme();

  const components: Components = {
    // Code blocks with syntax highlighting
    code({ inline, className, children }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      
      if (!inline && match) {
        return (
          <div className="my-4">
            <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg text-sm">
              <span className="font-medium">{language.toUpperCase()}</span>
              <button
                onClick={() => navigator.clipboard.writeText(String(children))}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <SyntaxHighlighter
              style={theme === 'dark' ? vscDarkPlus as any : oneLight as any}
              language={language}
              PreTag="div"
              className="!mt-0 !rounded-t-none"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      // Inline code
      return (
        <code className="px-2 py-1 bg-theme-hover text-theme-accent rounded font-mono text-sm border border-theme">
          {children}
        </code>
      );
    },
    
    // Headers
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-theme-primary mb-4 mt-6 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-theme-primary mb-3 mt-5 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium text-theme-primary mb-2 mt-4">
        {children}
      </h3>
    ),
    
    // Paragraphs
    p: ({ children }) => (
      <p className="text-theme-secondary leading-relaxed mb-4">
        {children}
      </p>
    ),
    
    // Lists
    ul: ({ children }) => (
      <ul className="space-y-2 mb-4">
        {children}
      </ul>
    ),
    li: ({ children }) => (
      <li className="flex items-start gap-3">
        <div className="w-2 h-2 bg-theme-accent rounded-full mt-2 flex-shrink-0"></div>
        <span className="text-theme-secondary leading-relaxed">
          {children}
        </span>
      </li>
    ),
    
    // Ordered lists
    ol: ({ children }) => (
      <ol className="space-y-2 mb-4">
        {children}
      </ol>
    ),
    
    // Links
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-theme-accent hover:text-theme-accent/80 underline transition-colors"
      >
        {children}
      </a>
    ),
    
    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-theme-accent pl-4 my-4 text-theme-secondary italic">
        {children}
      </blockquote>
    ),
    
    // Strong/Bold
    strong: ({ children }) => (
      <strong className="font-semibold text-theme-primary">
        {children}
      </strong>
    ),
    
    // Emphasis/Italic
    em: ({ children }) => (
      <em className="italic text-theme-secondary">
        {children}
      </em>
    ),
  };

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 