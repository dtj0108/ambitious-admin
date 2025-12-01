import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

export interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  isLoading?: boolean
}

export function ChatMessage({ role, content, timestamp, isLoading }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary-dark'
            : 'bg-gradient-to-br from-post-hangout to-post-hangout/70'
        )}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary-dark text-white'
            : 'bg-card border border-border/50 text-text'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </div>
            {timestamp && (
              <p
                className={cn(
                  'text-[10px] mt-2',
                  isUser ? 'text-white/60' : 'text-text-tertiary'
                )}
              >
                {formatTime(timestamp)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <ChatMessage
      role="assistant"
      content=""
      isLoading={true}
    />
  )
}

