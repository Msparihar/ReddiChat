"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      toast.success("Code copied to clipboard!", {
        duration: 2000,
        style: {
          background: "#374151",
          color: "#f3f4f6",
          border: "1px solid #4b5563",
        },
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const components = {
    code: ({
      inline,
      className,
      children,
      ...props
    }: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    }) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const code = String(children).replace(/\n$/, "");
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

      const hasNewlines = String(children).includes("\n");
      const hasLanguageClass = className && className.includes("language-");
      const isExplicitlyBlock = inline === false;
      const isCodeBlock = hasNewlines || hasLanguageClass || isExplicitlyBlock;

      if (isCodeBlock && code) {
        return (
          <div className="relative group my-4">
            <div
              className={cn(
                "flex items-center justify-between px-4 py-2 text-xs font-medium rounded-t-lg border",
                isDark
                  ? "bg-gray-800 text-gray-300 border-gray-600"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              )}
            >
              <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>
                {language || "text"}
              </span>
              <button
                onClick={() => copyToClipboard(code, codeId)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded transition-colors duration-200",
                  isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
                )}
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
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              className="!mt-0 !rounded-t-none !border-t-0"
              customStyle={{
                margin: 0,
                borderRadius: "0 0 0.5rem 0.5rem",
                border: "1px solid #4b5563",
                borderTop: "none",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
              codeTagProps={{
                style: {
                  fontFamily:
                    '"JetBrains Mono", "Consolas", "Monaco", monospace',
                },
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code
          className={cn(
            "px-1 font-mono text-sm rounded",
            isDark ? "bg-red-900/20 text-red-300" : "bg-red-100 text-red-700"
          )}
          {...props}
        >
          {children}
        </code>
      );
    },

    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,

    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1
        className={cn(
          "text-2xl font-bold mt-6 mb-4 pb-2 border-b",
          isDark
            ? "text-gray-100 border-gray-600"
            : "text-gray-900 border-gray-300"
        )}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2
        className={cn(
          "text-xl font-semibold mt-5 mb-3",
          isDark ? "text-gray-100" : "text-gray-900"
        )}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3
        className={cn(
          "text-lg font-semibold mt-4 mb-2",
          isDark ? "text-gray-200" : "text-gray-800"
        )}
      >
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4
        className={cn(
          "text-base font-semibold mt-3 mb-2",
          isDark ? "text-gray-200" : "text-gray-800"
        )}
      >
        {children}
      </h4>
    ),

    p: ({ children }: { children?: React.ReactNode }) => (
      <p
        className={cn(
          "leading-7 mb-4 last:mb-0",
          isDark ? "text-gray-100" : "text-gray-900"
        )}
      >
        {children}
      </p>
    ),

    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul
        className={cn(
          "list-disc list-inside space-y-2 mb-4 ml-4",
          isDark ? "text-gray-100" : "text-gray-900"
        )}
      >
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol
        className={cn(
          "list-decimal list-outside space-y-2 mb-4 ml-4",
          isDark ? "text-gray-100" : "text-gray-900"
        )}
      >
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-7">{children}</li>
    ),

    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote
        className={cn(
          "border-l-4 border-blue-500 pl-4 py-2 my-4 italic",
          isDark ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700"
        )}
      >
        {children}
      </blockquote>
    ),

    a: ({
      href,
      children,
    }: {
      href?: string;
      children?: React.ReactNode;
    }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
      >
        {children}
      </a>
    ),

    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong
        className={cn(
          "font-semibold",
          isDark ? "text-gray-100" : "text-gray-900"
        )}
      >
        {children}
      </strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em
        className={cn("italic", isDark ? "text-gray-200" : "text-gray-800")}
      >
        {children}
      </em>
    ),

    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-4">
        <table
          className={cn(
            "min-w-full border rounded-lg",
            isDark ? "border-gray-600" : "border-gray-300"
          )}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className={cn(isDark ? "bg-gray-800" : "bg-gray-100")}>
        {children}
      </thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody className={cn(isDark ? "bg-gray-850" : "bg-white")}>
        {children}
      </tbody>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr
        className={cn(
          "border-b",
          isDark ? "border-gray-600" : "border-gray-200"
        )}
      >
        {children}
      </tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th
        className={cn(
          "px-4 py-2 text-left font-semibold",
          isDark ? "text-gray-200" : "text-gray-800"
        )}
      >
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td
        className={cn(
          "px-4 py-2",
          isDark ? "text-gray-100" : "text-gray-900"
        )}
      >
        {children}
      </td>
    ),
  };

  return (
    <div className="markdown-content max-w-none">
      <ReactMarkdown components={components as any}>{content}</ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
