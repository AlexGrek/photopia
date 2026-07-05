import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
    children: string;
    className?: string;
}

/**
 * Renders markdown (GitHub-flavored) as styled HTML. Styling comes from the
 * Tailwind typography plugin (`prose`); `prose-invert` themes it for the dark UI.
 */
const Markdown: React.FC<MarkdownProps> = ({ children, className }) => (
    <div className={`prose prose-invert max-w-none ${className || ''}`}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Keep external links safe and open them in a new tab.
                a: ({ node: _node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer nofollow" />
                ),
            }}
        >
            {children}
        </ReactMarkdown>
    </div>
);

export default Markdown;
