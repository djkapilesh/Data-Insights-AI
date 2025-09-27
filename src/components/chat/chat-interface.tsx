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
  FilePlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './chat-message';
import { realTimeFeedbackAndValueCompletion } from '@/ai/flows/real-time-feedback-and-value-completion';
import * as xlsx from 'xlsx';

type Status = 'awaiting_upload' | 'chatting';
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | React.ReactNode;
};

// Helper to convert Excel serial date to a readable format
const excelDateToJSDate = (serial: number) => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
};


export default function ChatInterface() {
  const [status, setStatus] = useState<Status>('awaiting_upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<any>(null);
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
      const processFile = (data: any, type: 'array' | 'string') => {
        try {
          const workbook = xlsx.read(data, { type });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = xlsx.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'm/d/yyyy' });
          
          const processedJson = json.map((row: any) => {
            const newRow: any = {};
            for (const key in row) {
              // The library might still return serial numbers for some date formats.
              // This is a fallback to handle those cases.
              if (typeof row[key] === 'number' && key.toLowerCase().includes('date')) {
                const jsDate = excelDateToJSDate(row[key]);
                if (!isNaN(jsDate.getTime())) {
                   newRow[key] = jsDate.toLocaleDateString();
                } else {
                   newRow[key] = row[key];
                }
              } else {
                newRow[key] = row[key];
              }
            }
            return newRow;
          });


          setSheetData(processedJson);
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
            description: 'There was an error processing your file. Please ensure it is a valid .xls, .xlsx, or .csv file.',
          });
        }
      };
      
      const reader = new FileReader();
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        reader.onload = (e) => processFile(e.target?.result, 'array');
        reader.onerror = () => toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected file.' });
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.csv')) {
        reader.onload = (e) => processFile(e.target?.result, 'string');
        reader.onerror = () => toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected file.' });
        reader.readAsText(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a valid Excel or CSV file (.xls, .xlsx, or .csv).',
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
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsAnalyzing(true);

    try {
      const conversationHistory = newMessages.filter(msg => typeof msg.content === 'string');

      const response = await realTimeFeedbackAndValueCompletion({
        query: currentInput,
        data: JSON.stringify(sheetData),
        conversationHistory: conversationHistory,
      });
      
      let assistantResponse: Message;

      if (response.result) {
        assistantResponse = {
          id: Date.now().toString() + '-2',
          role: 'assistant',
          content: response.result,
        };
      } else if (response.missingValues && response.missingValues.length > 0) {
        assistantResponse = {
            id: Date.now().toString() + '-missing',
            role: 'assistant',
            content: response.feedback || `Missing values found: ${response.missingValues.join(', ')}. Please provide these values to continue the analysis. `,
        };
      }
       else {
        assistantResponse = {
            id: Date.now().toString() + '-3',
            role: 'assistant',
            content: "I'm sorry, I couldn't find an answer to your question. Please try rephrasing it.",
        };
      }
      setMessages(prev => [...prev, assistantResponse]);

    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error && error.message.includes('503')
        ? "The analysis service is temporarily unavailable. Please try again in a moment."
        : "I'm sorry, I wasn't able to process that request. Please try asking in a different way.";

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

  const handleReset = () => {
    setStatus('awaiting_upload');
    setFileName(null);
    setSheetData(null);
    setMessages([]);
    setInput('');
  };

  const renderContent = () => {
    switch (status) {
      case 'awaiting_upload':
        return (
          <div
            className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:border-primary transition-colors bg-background/20"
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
                <ChatMessage key={message.id} {...message} isLast={index === messages.length - 1} isAnalyzing={isAnalyzing}/>
              ))}
              {isAnalyzing && (
                 <ChatMessage role="assistant" content="Analyzing..." isLast={true} isAnalyzing={true} />
              )}
            </div>
            <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1 bg-background/30"
                disabled={isAnalyzing}
              />
              <Button type="submit" disabled={isAnalyzing || !input.trim()} variant="secondary">
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
    <Card className="w-full max-w-4xl h-[80vh] flex flex-col shadow-lg bg-card/50 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Data Analysis Agent</CardTitle>
        <div className="flex items-center gap-2">
            {fileName && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileIcon className="w-4 h-4" />
                    {fileName}
                </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset}>
                <FilePlus className="w-4 h-4 mr-2" />
                New File
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">{renderContent()}</CardContent>
    </Card>
  );
}
