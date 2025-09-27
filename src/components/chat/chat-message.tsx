
'use client';

import { Bot, User, Terminal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | React.ReactNode;
}

interface ChatMessageProps extends Message {
  isLast?: boolean;
  isAnalyzing?: boolean;
}

export function ChatMessage({ role, content, isLast, isAnalyzing }: ChatMessageProps) {
  const Icon = {
    user: User,
    assistant: Bot,
    system: Terminal,
  }[role];

  return (
    <div
      className={cn('flex items-start gap-4', {
        'flex-row-reverse': role === 'user',
      })}
    >
      <div
        className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', {
          'bg-primary text-primary-foreground': role === 'assistant',
          'bg-secondary text-secondary-foreground': role === 'user',
          'bg-muted text-muted-foreground': role === 'system',
        })}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div
        className={cn('p-3 rounded-lg max-w-[80%]', {
          'bg-primary/10': role === 'assistant',
          'bg-secondary': role === 'user',
          'w-full text-xs text-muted-foreground': role === 'system',
        })}
      >
        {isAnalyzing && role === 'assistant' && typeof content === 'string' ? (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{content || "Thinking..."}</span>
            </div>
        ) : typeof content === 'string' ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

    