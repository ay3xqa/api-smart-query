import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface MessageContentProps {
  content: string
  role: 'user' | 'assistant'
}

interface CodeBlock {
  language: string
  code: string
}

export function MessageContent({ content, role }: MessageContentProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const parseContent = (text: string) => {
    const parts: (string | CodeBlock)[] = []
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      parts.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      })

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  const handleCopy = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const parts = parseContent(content)

  return (
    <div className="space-y-3 w-full">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return (
            <p key={index} className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
              {part}
            </p>
          )
        }

        return (
          <div key={index} className="relative group w-full min-w-0">
            <div className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded-t-md border-b border-zinc-700">
              <span className="text-xs font-medium text-zinc-400">
                {part.language}
              </span>
              <button
                onClick={() => handleCopy(part.code, index)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded"
                title="Copy code"
              >
                {copiedIndex === index ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <pre className="bg-zinc-900 rounded-b-md overflow-x-auto max-w-full">
              <code className="block text-xs p-4 font-mono leading-relaxed text-zinc-100">
                {part.code}
              </code>
            </pre>
          </div>
        )
      })}
    </div>
  )
}
