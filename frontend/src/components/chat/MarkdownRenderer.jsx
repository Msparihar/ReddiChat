import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

const MarkdownRenderer = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState(null)
  const { colors, isDark } = useTheme()

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
            <div className={cn("flex items-center justify-between px-4 py-2 text-xs font-medium rounded-t-lg border", isDark ? "bg-gray-800 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-700 border-gray-300")}>
              <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
                {language || 'text'}
              </span>
              <button
                onClick={() => copyToClipboard(code, codeId)}
                className={cn("flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200", isDark ? "hover:bg-gray-700" : "hover:bg-gray-200")}
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
          className={cn("px-1 font-mono text-sm", isDark ? "bg-red-900/20 text-red-300" : "bg-red-100 text-red-700")}
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
      <h1 className={cn("text-2xl font-bold mt-6 mb-4 pb-2 border-b", colors.textPrimary, isDark ? "border-gray-600" : "border-gray-300")}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={cn("text-xl font-semibold mt-5 mb-3", colors.textPrimary)}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={cn("text-lg font-semibold mt-4 mb-2", colors.textSecondary)}>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className={cn("text-base font-semibold mt-3 mb-2", colors.textSecondary)}>
        {children}
      </h4>
    ),

    // Enhanced paragraphs
    p: ({ children }) => (
      <p className={cn("leading-7 mb-4 last:mb-0", colors.textPrimary)}>
        {children}
      </p>
    ),

    // Enhanced lists
    ul: ({ children }) => (
      <ul className={cn("list-disc list-inside space-y-2 mb-4 ml-4", colors.textPrimary)}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className={cn("list-decimal list-outside space-y-2 mb-4 ml-4", colors.textPrimary)}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-7">{children}</li>
    ),

    // Enhanced blockquotes
    blockquote: ({ children }) => (
      <blockquote className={cn("border-l-4 border-blue-500 pl-4 py-2 my-4 italic", isDark ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700")}>
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
      <strong className={cn("font-semibold", colors.textPrimary)}>{children}</strong>
    ),
    em: ({ children }) => (
      <em className={cn("italic", colors.textSecondary)}>{children}</em>
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className={cn("min-w-full border rounded-lg", isDark ? "border-gray-600" : "border-gray-300")}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={cn(isDark ? "bg-gray-800" : "bg-gray-100")}>{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className={cn(isDark ? "bg-gray-850" : "bg-white")}>{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className={cn("border-b", isDark ? "border-gray-600" : "border-gray-200")}>{children}</tr>
    ),
    th: ({ children }) => (
      <th className={cn("px-4 py-2 text-left font-semibold", colors.textSecondary)}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className={cn("px-4 py-2", colors.textPrimary)}>{children}</td>
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
