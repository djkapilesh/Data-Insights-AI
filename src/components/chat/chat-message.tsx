'use client';

import { Bot, User, Terminal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  children: React.ReactNode;
  isLast?: boolean;
  isAnalyzing?: boolean;
}

export function ChatMessage({ role, children, isLast, isAnalyzing }: ChatMessageProps) {
  const Icon = {
    user: User,
    assistant: Bot,
    system: Terminal,
  }[role];

  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div
      className={cn('flex items-start gap-4', {
        'flex-row-reverse': isUser,
      })}
    >
      <div
        className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', {
          'bg-primary text-primary-foreground': !isUser && !isSystem,
          'bg-secondary text-secondary-foreground': isUser,
          'bg-muted text-muted-foreground': isSystem,
        })}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div
        className={cn('p-3 rounded-lg max-w-[85%] w-fit', {
          'bg-primary/10': !isUser,
          'bg-secondary': isUser,
          'w-full text-xs text-muted-foreground': isSystem,
          'p-0 bg-transparent': typeof children !== 'string' // No padding/bg for complex components
        })}
      >
        {isAnalyzing && role === 'assistant' && React.Children.count(children) === 1 && typeof children === 'string' && children === "Analyzing..." ? (
          <div className="flex items-center gap-2 text-muted-foreground p-3 bg-primary/10 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {React.Children.toArray(children).filter(Boolean).map((child, i) => (
                <div key={i} className={cn("whitespace-pre-wrap", {
                  'p-3 rounded-lg bg-primary/10': typeof child === 'string'
                })}>{child}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
