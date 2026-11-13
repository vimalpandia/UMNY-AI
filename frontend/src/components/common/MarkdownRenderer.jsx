import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="prose prose-invert max-w-none text-slate-100 text-sm md:text-base leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={codeContent} />;
            } else if (!inline && codeContent.includes('\n')) {
              return <CodeBlock language="text" value={codeContent} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-slate-800/80 text-brand-purple-light font-mono text-xs md:text-sm border border-slate-700/50"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="mb-0.5">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl md:text-2xl font-bold text-white mt-4 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg md:text-xl font-semibold text-slate-100 mt-3 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base md:text-lg font-medium text-slate-200 mt-2 mb-1.5">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-brand-purple/60 pl-3 my-2 text-slate-300 italic bg-brand-purple/5 py-1 rounded-r">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 border border-slate-700/60 rounded-lg">
                <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 bg-dark-850 font-semibold text-slate-200 border-b border-slate-700">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-3 py-2 border-b border-slate-800 text-slate-300">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-brand-cyan hover:underline hover:text-brand-cyan-light font-medium inline-flex items-center gap-1"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
