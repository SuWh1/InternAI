import React from 'react';
import MarkdownRenderer from '../common/MarkdownRenderer';

const JsonTestComponent: React.FC = () => {
  // Test various JSON scenarios
  const testCases = [
    {
      title: "JSON without code blocks (auto-detected)",
      content: `
# TypeScript Configuration

Here's a sample tsconfig.json:

{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*"
  ]
}

This configuration sets up TypeScript compilation.
      `
    },
    {
      title: "JSON with proper code blocks",
      content: `
# Package Configuration

\`\`\`json
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
\`\`\`

This is already properly formatted.
      `
    },
    {
      title: "Mixed content with auto-detection",
      content: `
# Configuration Examples

## TypeScript Config
{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "moduleResolution": "node"
  }
}

## Package.json
{
  "name": "test",
  "version": "1.0.0",
  "type": "module"
}

## JavaScript Code
\`\`\`javascript
function example() {
  console.log('This is properly wrapped');
}
\`\`\`

Regular text here.
      `
    }
  ];

  return (
    <div className="p-6 space-y-8 bg-theme-primary">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-theme-primary mb-2">
          JSON Rendering Test
        </h1>
        <p className="text-theme-secondary">
          Testing automatic JSON detection and syntax highlighting
        </p>
      </div>
      
      {testCases.map((testCase, index) => (
        <div key={index} className="bg-theme-secondary rounded-xl border border-theme p-6">
          <h2 className="text-lg font-semibold text-theme-primary mb-4">
            {testCase.title}
          </h2>
          <MarkdownRenderer content={testCase.content} />
        </div>
      ))}
    </div>
  );
};

export default JsonTestComponent;
