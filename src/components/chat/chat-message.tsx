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

  // A check to see if a child is a complex component (like the QueryResult) vs. a simple string.
  const hasComplexChild = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && typeof child.type !== 'string'
  );

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
        className={cn('max-w-[85%] w-fit', {
          'w-full': hasComplexChild, // Allow complex children to take full width
        })}
      >
        {isAnalyzing && role === 'assistant' && React.Children.count(children) === 1 && typeof children === 'string' && children === "Analyzing..." ? (
          <div className="flex items-center gap-2 text-muted-foreground p-3 bg-primary/10 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {React.Children.toArray(children).filter(Boolean).map((child, i) => {
               const isComplexElement = React.isValidElement(child) && typeof child.type !== 'string';
               return (
                <div key={i} className={cn("whitespace-pre-wrap", {
                  'p-3 rounded-lg bg-primary/10': !isComplexElement, // Only apply bubble style to simple text
                })}>{child}</div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
