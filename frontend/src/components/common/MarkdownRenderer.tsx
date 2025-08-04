import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../contexts/ThemeContext';
import { Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const { theme } = useTheme();
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set());

  // Inject theme-adaptive scrollbar styles for code blocks
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const handleCopy = async (codeContent: string) => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopiedBlocks(prev => new Set(prev).add(codeContent));
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedBlocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(codeContent);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  useEffect(() => {
    // Remove previous style element if exists
    if (styleRef.current && styleRef.current.parentNode) {
      styleRef.current.parentNode.removeChild(styleRef.current);
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'markdown-code-scrollbar-styles';

    const trackColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const thumbColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)';
    const thumbHover = theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.25)';

    styleEl.textContent = `
      /* WebKit */
      .markdown-content pre::-webkit-scrollbar {
        height: 8px;
      }
      .markdown-content pre::-webkit-scrollbar-track {
        background: ${trackColor};
        border-radius: 4px;
      }
      .markdown-content pre::-webkit-scrollbar-thumb {
        background: ${thumbColor};
        border-radius: 4px;
      }
      .markdown-content pre::-webkit-scrollbar-thumb:hover {
        background: ${thumbHover};
      }

      /* Firefox */
      .markdown-content pre {
        scrollbar-width: thin;
        scrollbar-color: ${thumbColor} ${trackColor};
      }
    `;

    document.head.appendChild(styleEl);
    styleRef.current = styleEl;

    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [theme]);

  const components: Components = {
    // Code blocks with syntax highlighting
    code({ inline, className, children }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const codeContent = String(children);
      const isCopied = copiedBlocks.has(codeContent);
      
      if (!inline && match) {
        return (
          <div className="my-4">
            <div className={`flex items-center justify-between px-4 py-2 rounded-t-lg text-sm ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-700 border-b border-gray-200'
            }`}>
              <span className="font-medium">{language.toUpperCase()}</span>
              <button
                onClick={() => handleCopy(codeContent)}
                className={`transition-colors flex items-center gap-1 ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={theme === 'dark' ? vscDarkPlus as any : oneLight as any}
              language={language}
              PreTag="div"
              className="!mt-0 !rounded-t-none"
              customStyle={{
                fontSize: '0.875rem !important', // Force 14px exactly
                lineHeight: '1.5 !important',
                fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace !important",
                margin: 0,
                padding: '1rem',
                maxWidth: '100%',
                width: '100%',
                overflowX: 'auto',
                wordWrap: 'break-word',
                whiteSpace: 'pre'
              }}
              codeTagProps={{
                style: {
                  fontSize: '0.875rem !important',
                  lineHeight: '1.5 !important',
                  fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace !important",
                  whiteSpace: 'pre',
                  wordWrap: 'break-word'
                }
              }}
            >
              {String(children).replace(/\n$/, '').replace(/\t/g, '  ')}
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
    
    // --- Simple Table Handler ---
    table: ({ children }) => (
      <table className="min-w-full border border-theme-accent my-4 bg-theme-secondary text-theme-primary rounded overflow-hidden">
        {children}
      </table>
    ),
    thead: ({ children }) => (
      <thead className="bg-theme-accent/10">
        {children}
      </thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-theme-accent/20 last:border-0">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left font-semibold bg-theme-accent/10 border-b border-theme-accent/30">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 border-b border-theme-accent/20 text-theme-secondary">
        {children}
      </td>
    ),
    // --- End Table Handler ---
    
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
      <h3 className="text-xl font-bold text-theme-primary mb-2 mt-4"
        style={{ fontStyle: 'italic' }}
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-bold text-theme-primary mb-2 mt-3"
        style={{ textDecoration: 'underline' }}
      >
        {children}
      </h4>
    ),
    
    // Paragraphs
    p: ({ children }) => (
      <p className="leading-relaxed text-theme-secondary mb-4">
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
      <li className="flex items-start gap-3 text-theme-secondary">
        <div className="w-2 h-2 bg-theme-accent rounded-full mt-2 flex-shrink-0"></div>
        <span className="leading-relaxed">
          {children}
        </span>
      </li>
    ),
    
    // Ordered lists
    ol: ({ children }) => (
      <ol className="space-y-2 mb-4 text-theme-secondary">
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