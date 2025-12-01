'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { Card } from '@/components'
import { ChatMessage, TypingIndicator } from '@/components/ChatMessage'
import { Send, Sparkles, Trash2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const EXAMPLE_QUERIES = [
  "How many users signed up this week?",
  "Show me the top 10 users by streak",
  "What's the breakdown of posts by type?",
  "How many active users in the last 7 days?",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageText.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}` 
          : 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <MessageCircle className="text-primary" size={28} />
            Admin Assistant
          </h1>
          <p className="text-text-secondary mt-1">
            Ask questions about your platform data in natural language
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border/50 text-text-secondary rounded-xl font-medium hover:bg-elevated hover:text-text transition-all"
          >
            <Trash2 size={16} />
            Clear Chat
          </button>
        )}
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">
                How can I help you today?
              </h3>
              <p className="text-text-secondary max-w-md mb-6">
                I can help you query your platform data. Try asking about user signups, 
                post engagement, or any other metrics you&apos;re curious about.
              </p>
              
              {/* Example Queries */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {EXAMPLE_QUERIES.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(query)}
                    className="px-4 py-2 text-sm bg-surface border border-border/50 rounded-xl text-text-secondary hover:bg-elevated hover:text-text hover:border-border transition-all"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/50 bg-surface/50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your platform data..."
                rows={1}
                disabled={isLoading}
                className={cn(
                  'w-full px-4 py-3 bg-card border border-border/50 rounded-xl resize-none',
                  'text-text placeholder:text-text-tertiary',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200'
                )}
                style={{ minHeight: '48px', maxHeight: '150px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
                'bg-gradient-to-r from-primary to-primary-dark text-white',
                'hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
                'active:scale-95'
              )}
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-[10px] text-text-tertiary text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  )
}

