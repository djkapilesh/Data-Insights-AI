
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UploadCloud,
  File as FileIcon,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, type Message } from './chat-message';
import * as xlsx from 'xlsx';
import {
  realTimeFeedbackAndValueCompletion,
  RealTimeFeedbackAndValueCompletionInput,
} from '@/ai/flows/real-time-feedback-and-value-completion';
import { Visualization } from '@/components/chat/visualization';

type Status = 'awaiting_upload' | 'chatting';

export default function ChatInterface() {
  const [status, setStatus] = useState<Status>('awaiting_upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (
        file.name.endsWith('.xls') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.csv')
      ) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = xlsx.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(worksheet, { defval: null }) as any[];

            if (json.length === 0) {
              toast({ variant: 'destructive', title: 'Empty File', description: 'The uploaded file contains no data.' });
              return;
            }

            setJsonData(json);
            setFileName(file.name);
            setStatus('chatting');
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content: `Your data from "${file.name}" has been successfully processed. What would you like to know?`,
              },
            ]);
          } catch (error) {
            console.error('Error processing file:', error);
            toast({
              variant: 'destructive',
              title: 'File Processing Error',
              description:
                'There was an error processing your file. Please ensure it is a valid file.',
            });
          }
        };
        reader.onerror = () => {
          toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
          });
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description:
            'Please upload a valid Excel (.xls, .xlsx) or CSV (.csv) file.',
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file || null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;
  
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsAnalyzing(true);
  
    try {
      const dataSummary = JSON.stringify(jsonData, null, 2);

      const analysisInput: RealTimeFeedbackAndValueCompletionInput = {
        question: currentInput,
        data: dataSummary,
      };

      const result = await realTimeFeedbackAndValueCompletion(analysisInput);

      const assistantResponse: Message = {
          id: Date.now().toString() + '-report',
          role: 'assistant',
          content: result.report
      };
      setMessages(prev => [...prev, assistantResponse]);

    } catch (error: any) {
      console.error('Error in chat flow:', error);
  
      let errorMessage = "I'm sorry, I wasn't able to process that request. Please try asking in a different way.";
      if (error.message && error.message.includes('503 Service Unavailable')) {
        errorMessage = "The analysis service is temporarily unavailable. Please try again in a few moments.";
      }
      
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'There was an error analyzing your data. Please try again.',
      });
  
      const assistantError: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: errorMessage
      };
      setMessages(prev => [...prev, assistantError]);
    } finally {
        setIsAnalyzing(false);
    }
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
            <h2 className="text-xl font-semibold">Upload your data file</h2>
            <p className="text-muted-foreground mt-2">Drag and drop or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">.xls, .xlsx, or .csv files accepted</p>
            <input
              id="file-upload-input"
              type="file"
              accept=".xls,.xlsx,.csv"
              className="hidden"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
            />
          </div>
        );
      case 'chatting':
        return (
          <div className="flex flex-col h-full w-full">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
              {messages.map((message, index) => (
                <ChatMessage key={message.id} {...message} isLast={index === messages.length - 1} isAnalyzing={isAnalyzing && index === messages.length - 1}/>
              ))}
              {isAnalyzing && (
                 <ChatMessage role="assistant" content={"Thinking..."} isLast={true} isAnalyzing={true} />
              )}
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Data Analysis Agent</CardTitle>
        {fileName && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
                <FileIcon className="w-4 h-4" />
                {fileName}
            </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">{renderContent()}</CardContent>
    </Card>
  );
}
