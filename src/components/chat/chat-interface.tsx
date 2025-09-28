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
import * as xlsx from 'xlsx';
import { QueryResult } from './query-result';
import { realTimeFeedbackAndValueCompletion } from '@/ai/flows/real-time-feedback-and-value-completion';
import { identifyChartingColumns } from '@/ai/flows/identify-charting-columns';

type Status = 'awaiting_upload' | 'chatting';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | React.ReactNode;
};

type QueryResultData = {
  columns: string[];
  values: (string | number)[][];
};

type DataRow = {[key: string]: string | number};

export default function ChatInterface() {
  const [status, setStatus] = useState<Status>('awaiting_upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<DataRow[] | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const processFile = (data: any, type: 'array' | 'string') => {
        try {
          const workbook = xlsx.read(data, { type, cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: any[] = xlsx.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'm/d/yyyy',
          });

          if (json.length === 0) {
            throw new Error("File is empty or could not be read.");
          }
          
          const processedJson: DataRow[] = json.map((row: any) => {
            const newRow: DataRow = {};
            for (const key in row) {
                const newKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                let value = row[key];
                if (value instanceof Date) {
                    value = value.toLocaleDateString();
                }
                newRow[newKey] = value;
            }
            return newRow;
          });
          
          const firstRow = processedJson[0];
          const columns = Object.keys(firstRow);
          setColumnNames(columns);
          setSheetData(processedJson);

          setFileName(file.name);
          setStatus('chatting');
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Your data from "${file.name}" has been successfully loaded. What would you like to know?`,
            },
          ]);
        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            variant: 'destructive',
            title: 'File Processing Error',
            description:
              'There was an error processing your file. Please ensure it is a valid .xls, .xlsx, or .csv file and contains data.',
          });
        }
      };

      const reader = new FileReader();
      if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        reader.onload = (e) => processFile(e.target?.result, 'array');
        reader.onerror = () =>
          toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
          });
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.csv')) {
        reader.onload = (e) => processFile(e.target?.result as string, 'string');
        reader.onerror = () =>
          toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
          });
        reader.readAsText(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description:
            'Please upload a valid Excel or CSV file (.xls, .xlsx, or .csv).',
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
    if (!input.trim() || isAnalyzing || !sheetData) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = input;
    setInput('');
    setIsAnalyzing(true);

    try {
      const dataSummaryForAI = JSON.stringify(sheetData.slice(0, 500)); // Send a large sample or whole data

      // 1. Get chart suggestions AND text analysis from AI in parallel
      const [chartColumnsResponse, analysisResponse] = await Promise.all([
        identifyChartingColumns({
          query: currentInput,
          data: dataSummaryForAI,
          columnNames: columnNames,
        }),
        realTimeFeedbackAndValueCompletion({
            query: currentInput,
            queryResult: dataSummaryForAI,
            conversationHistory: messages.map(msg => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : "A visualization was displayed.",
            })).filter(msg => msg.role !== 'system')
        })
      ]);

      const { categoryColumn, valueColumn, isChartable } = chartColumnsResponse;
      let queryResultForDisplay: QueryResultData | undefined;

      if (isChartable && categoryColumn && valueColumn && sheetData) {
        // 2. Process data for charting on the client
        const aggregationMap = new Map<string, number>();
        const isCounting = categoryColumn === valueColumn;
        
        for (const row of sheetData) {
          const category = row[categoryColumn] as string;
          if (category === null || category === undefined) continue;
          
          const currentValue = aggregationMap.get(category) || 0;

          if (isCounting) {
            aggregationMap.set(category, currentValue + 1);
          } else {
            const value = Number(row[valueColumn]);
            if (!isNaN(value)) {
              aggregationMap.set(category, currentValue + value);
            }
          }
        }

        const aggregatedValues: (string | number)[][] = Array.from(aggregationMap.entries());
        
        if (aggregatedValues.length > 0) {
          queryResultForDisplay = {
            columns: [categoryColumn, isCounting ? 'count' : valueColumn],
            values: aggregatedValues,
          };
        }
      }

      const assistantMessages: Message[] = [];
      if (analysisResponse.result) {
        assistantMessages.push({
            id: Date.now().toString() + '-analysis',
            role: 'assistant',
            content: analysisResponse.result,
        });
      }

      if (queryResultForDisplay) {
         assistantMessages.push({
          id: Date.now().toString() + '-viz',
          role: 'assistant',
          content: <QueryResult result={queryResultForDisplay} />,
        });
      }
      
      if (assistantMessages.length === 0) {
        assistantMessages.push({
          id: Date.now().toString() + '-no-result',
          role: 'assistant',
          content: "I couldn't generate a specific analysis or chart for that query. Please try asking in a different way."
        })
      }

      setMessages((prev) => [...prev, ...assistantMessages]);

    } catch (error) {
      console.error('Error in chat submission:', error);
      const errorMessage =
        error instanceof Error && error.message.includes('503')
          ? 'The analysis service is temporarily unavailable. Please try again in a moment.'
          : "I'm sorry, I wasn't able to process that request. Please try asking in a different way.";

      const assistantError: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: errorMessage,
      };
      setMessages((prev) => [...prev, assistantError]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setStatus('awaiting_upload');
    setFileName(null);
    setSheetData(null);
    setColumnNames([]);
    setMessages([]);
    setInput('');
  };

  const renderContent = () => {
    switch (status) {
      case 'awaiting_upload':
        return (
          <div
            className="w-full h-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center p-8 cursor-pointer hover:border-primary transition-colors bg-card"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <UploadCloud className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Upload your data file</h2>
            <p className="text-muted-foreground mt-2">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .xls, .xlsx, or .csv files accepted
            </p>
            <input
              id="file-upload-input"
              type="file"
              accept=".xls,.xlsx,.csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          </div>
        );
      case 'chatting':
        return (
          <div className="flex flex-col h-full w-full">
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto pr-4 space-y-6"
            >
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  isLast={index === messages.length - 1}
                  isAnalyzing={isAnalyzing}
                >
                  {message.content}
                </ChatMessage>
              ))}
              {isAnalyzing && (
                <ChatMessage role="assistant" isLast={true} isAnalyzing={true}>
                  Analyzing...
                </ChatMessage>
              )}
            </div>
            <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1 bg-input"
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
      <CardContent className="flex-1 overflow-hidden p-6">{renderContent()}</CardContent>
    </Card>
  );
}
