import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const MarkdownRenderer = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState(null)

  const copyToClipboard = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(id)
      toast.success('Code copied to clipboard!', {
        duration: 2000,
        style: {
          background: '#374151',
          color: '#f3f4f6',
          border: '1px solid #4b5563',
        },
      })
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      toast.error('Failed to copy code')
    }
  }

  const components = {
    // Code blocks with syntax highlighting
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      const code = String(children).replace(/\n$/, '')
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`

      // Fix: More strict check for code blocks vs inline code
      // Code blocks are identified by:
      // 1. Having newlines (multiline content)
      // 2. Having a language class (```language syntax)
      // 3. Being explicitly marked as non-inline (inline === false)
      // Everything else should be inline code
      const hasNewlines = String(children).includes('\n')
      const hasLanguageClass = className && className.includes('language-')
      const isExplicitlyBlock = inline === false

      const isCodeBlock = hasNewlines || hasLanguageClass || isExplicitlyBlock

      if (isCodeBlock && code) {
        return (
          <div className="relative group my-4">
            {/* Language label and copy button */}
            <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 text-xs font-medium rounded-t-lg border border-gray-600">
              <span className="text-gray-400">
                {language || 'text'}
              </span>
              <button
                onClick={() => copyToClipboard(code, codeId)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition-colors duration-200"
                title="Copy code"
              >
                {copiedCode === codeId ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code content */}
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="!mt-0 !rounded-t-none !border-t-0"
              customStyle={{
                margin: 0,
                borderRadius: '0 0 0.5rem 0.5rem',
                border: '1px solid #4b5563',
                borderTop: 'none',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
              codeTagProps={{
                style: {
                  fontFamily: '"JetBrains Mono", "Consolas", "Monaco", monospace',
                }
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )
      }

      // Inline code (single backticks)
      return (
        <code
          className="bg-red-900/20 text-red-300 px-1 font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      )
    },

    // Custom pre tag (handled by code component above)
    pre: ({ children }) => <>{children}</>,

    // Enhanced headings
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-gray-100 mt-6 mb-4 pb-2 border-b border-gray-600">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-gray-100 mt-5 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold text-gray-200 mt-3 mb-2">
        {children}
      </h4>
    ),

    // Enhanced paragraphs
    p: ({ children }) => (
      <p className="text-gray-100 leading-7 mb-4 last:mb-0">
        {children}
      </p>
    ),

    // Enhanced lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside text-gray-100 space-y-2 mb-4 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside text-gray-100 space-y-2 mb-4 ml-4">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-7">{children}</li>
    ),

    // Enhanced blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 bg-gray-800/50 pl-4 py-2 my-4 italic text-gray-300">
        {children}
      </blockquote>
    ),

    // Enhanced links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
      >
        {children}
      </a>
    ),

    // Enhanced emphasis
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-50">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-200">{children}</em>
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-600 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-800">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="bg-gray-850">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="border-b border-gray-600">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left text-gray-200 font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-gray-100">{children}</td>
    ),
  }

  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
