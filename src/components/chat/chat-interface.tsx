'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UploadCloud,
  File as FileIcon,
  CheckCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './chat-message';
import { Visualization } from './visualization';

type Status = 'awaiting_upload' | 'processing' | 'chatting';
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | React.ReactNode;
};
type ProcessingStep = { text: string; status: 'pending' | 'in_progress' | 'done' };

const initialProcessingSteps: ProcessingStep[] = [
  { text: 'Parsing Excel file...', status: 'pending' },
  { text: 'Cleaning and structuring data...', status: 'pending' },
  { text: 'Handling inconsistencies and missing values...', status: 'pending' },
  { text: 'Storing in database...', status: 'pending' },
  { text: 'Finalizing data model...', status: 'pending' },
];

export default function ChatInterface() {
  const [status, setStatus] = useState<Status>('awaiting_upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(initialProcessingSteps);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        setFileName(file.name);
        setStatus('processing');
        simulateProcessing();
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a valid Excel file (.xls or .xlsx).',
        });
      }
    }
  };

  const simulateProcessing = () => {
    let stepIndex = 0;
    const interval = setInterval(() => {
      setProcessingSteps(prev =>
        prev.map((step, index) => {
          if (index < stepIndex) return { ...step, status: 'done' };
          if (index === stepIndex) return { ...step, status: 'in_progress' };
          return step;
        })
      );

      if (stepIndex < initialProcessingSteps.length -1) {
          stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
            setProcessingSteps(prev => prev.map(step => ({...step, status: 'done'})))
            setTimeout(() => {
                setStatus('chatting');
                setMessages([
                    {
                        id: 'welcome',
                        role: 'assistant',
                        content: `Your data from "${fileName}" has been successfully processed. What would you like to know?`,
                    },
                ]);
            }, 500);
        }, 1000);
      }
    }, 1200);
  };
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file || null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsAnalyzing(true);

    setTimeout(() => {
        const systemMessage1: Message = { id: Date.now().toString() + '-1', role: 'system', content: `Translating "${input}" to SQL...`};
        setMessages(prev => [...prev, systemMessage1]);
        
        setTimeout(() => {
            const sqlQuery = `SELECT\n  category, \n  SUM(sales) AS total_sales\nFROM sales_data\nWHERE sale_date >= '2023-01-01'\nGROUP BY category\nORDER BY total_sales DESC;`;
            const systemMessage2: Message = {
              id: Date.now().toString() + '-2',
              role: 'system',
              content: (
                <div className="font-code text-xs p-3 bg-card rounded-md border">
                  <pre><code>{sqlQuery}</code></pre>
                </div>
              ),
            };
            setMessages(prev => [...prev, systemMessage2]);

            setTimeout(() => {
                const systemMessage3: Message = {id: Date.now().toString() + '-3', role: 'system', content: `Executing query and generating visualizations...`};
                setMessages(prev => [...prev, systemMessage3]);
                
                setTimeout(() => {
                    const assistantResponse: Message = {
                        id: Date.now().toString() + '-4',
                        role: 'assistant',
                        content: (
                            <div className="space-y-4">
                                <p>
                                    Based on your request, here are the insights from your data. The analysis shows a breakdown of sales by category for the current year.
                                </p>
                                <Visualization />
                            </div>
                        )
                    }
                    setMessages(prev => [...prev, assistantResponse]);
                    setIsAnalyzing(false);
                }, 1500);
            }, 1000);
        }, 1000);
    }, 500);
  };

  const renderContent = () => {
    switch (status) {
      case 'awaiting_upload':
        return (
          <div
            className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:border-primary transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <UploadCloud className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Upload your Excel file</h2>
            <p className="text-muted-foreground mt-2">Drag and drop or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">.xls or .xlsx files accepted</p>
            <input
              id="file-upload-input"
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
            />
          </div>
        );
      case 'processing':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <h2 className="text-xl font-semibold mb-2">Processing your data...</h2>
            <p className="text-muted-foreground mb-6 flex items-center gap-2">
              <FileIcon className="w-4 h-4" />
              {fileName}
            </p>
            <div className="w-full max-w-md space-y-3">
              {processingSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  {step.status === 'done' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : step.status === 'in_progress' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={step.status === 'pending' ? 'text-muted-foreground' : ''}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'chatting':
        return (
          <div className="flex flex-col h-full w-full">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
              {messages.map((message, index) => (
                <ChatMessage key={message.id} {...message} isLast={index === messages.length - 1} isAnalyzing={isAnalyzing}/>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1"
                disabled={isAnalyzing}
              />
              <Button type="submit" disabled={isAnalyzing || !input.trim()}>
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-4xl h-[70vh] flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Data Analysis Agent</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">{renderContent()}</CardContent>
    </Card>
  );
}
