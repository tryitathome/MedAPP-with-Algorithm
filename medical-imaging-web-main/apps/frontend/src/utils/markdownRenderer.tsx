// src/utils/markdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useColors } from '@/config/colors';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const colors = useColors();
  
  return (
    <ReactMarkdown
      components={{
        // Map markdown H1 to your original H3 styling
        h1: ({ children }) => (
          <h3 className={`text-xl font-semibold ${colors.textPrimary} mb-4`}>
            {children}
          </h3>
        ),
        // Map markdown H2 to your original H4 styling
        h2: ({ children }) => (
          <div className="mt-4">
            <h4 className={`font-medium ${colors.textPrimary} mb-2`}>
              {children}
            </h4>
          </div>
        ),
        // Map markdown paragraphs to your original paragraph styling
        p: ({ children }) => (
          <p className={`${colors.textSecondary} leading-relaxed`}>
            {children}
          </p>
        ),
        // Handle any other elements if needed
        div: ({ children }) => (
          <div className="space-y-4">
            {children}
          </div>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
};