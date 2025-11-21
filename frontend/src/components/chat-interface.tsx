'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User, Loader2, Database } from 'lucide-react'
import { getAllApis } from '@/lib/graphql-client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Api {
  id: number
  name: string
  description: string | null
  type: string
}

interface ChatInterfaceProps {
  initialApiId?: number | null
}

export function ChatInterface({ initialApiId }: ChatInterfaceProps) {
  const [apis, setApis] = useState<Api[]>([])
  const [selectedApiId, setSelectedApiId] = useState<number | null>(initialApiId || null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingApis, setLoadingApis] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchApis = async () => {
      try {
        const fetchedApis = await getAllApis()
        setApis(fetchedApis)
      } catch (error) {
        console.error('Failed to fetch APIs:', error)
      } finally {
        setLoadingApis(false)
      }
    }

    fetchApis()
  }, [])

  useEffect(() => {
    if (initialApiId) {
      setSelectedApiId(initialApiId)
    }
  }, [initialApiId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleApiSelect = (apiId: number) => {
    setSelectedApiId(apiId)
    setMessages([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedApiId || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'

      const query = `
        query AskApiQuestion($apiId: Int!, $question: String!) {
          askApiQuestion(apiId: $apiId, question: $question)
        }
      `

      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            apiId: selectedApiId,
            question: userMessage.content,
          },
        }),
      })

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.data.askApiQuestion,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const selectedApi = apis.find((api) => api.id === selectedApiId)

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Select an API</h2>
        {loadingApis ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : apis.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center space-y-3">
                <Database className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">No APIs Available</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an API specification in the Upload tab to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apis.map((api) => (
              <Card
                key={api.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedApiId === api.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-primary/50 hover:bg-accent/5'
                }`}
                onClick={() => handleApiSelect(api.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{api.name}</CardTitle>
                  {api.description && (
                    <CardDescription className="line-clamp-2">
                      {api.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-medium">
                      {api.type}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedApi && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Chat with {selectedApi.name}
          </h2>
          <Card className="border-border/50 flex flex-col h-[600px]">
            <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Bot className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-lg font-semibold">Start a Conversation</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me anything about your API. I can help you understand endpoints,
                  parameters, and usage examples.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div
                  className={`flex flex-col max-w-[70%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your API..."
              className="min-h-[60px] max-h-[120px]"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-[60px] w-[60px] flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
        </div>
      )}
    </div>
  )
}
