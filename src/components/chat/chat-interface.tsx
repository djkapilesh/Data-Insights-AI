
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
import { clarifyAmbiguousQuestion, ClarifyAmbiguousQuestionInput } from '@/ai/flows/ambiguous-question-clarification';
import { naturalLanguageQueryToSQL } from '@/ai/flows/natural-language-query-to-sql';
import { generateDataInsightsReport } from '@/ai/flows/generate-data-insights-report';
import { Visualization } from '@/components/chat/visualization';

type Status = 'awaiting_upload' | 'chatting';

export default function ChatInterface() {
  const [status, setStatus] = useState<Status>('awaiting_upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sqlWorkerRef = useRef<Worker>();

  useEffect(() => {
    const worker = new Worker('/sql-worker.js');
    sqlWorkerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, error } = event.data;
      if (type === 'error') {
        console.error('SQL Worker Error:', error);
        toast({
          variant: 'destructive',
          title: 'Database Error',
          description: 'An error occurred with the in-browser database.',
        });
        setIsAnalyzing(false);
      }
    };

    worker.postMessage({ action: 'init' });

    return () => {
      worker.terminate();
    };
  }, [toast]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const generateSchema = (data: any[]): string => {
    if (data.length === 0) return '';
    // Sanitize column names
    const headers = Object.keys(data[0]).map(key => key.replace(/[^a-zA-Z0-9_]/g, '_'));
    
    const columns = headers.map((header, index) => {
      const key = Object.keys(data[0])[index];
      let sql_type = 'TEXT'; // Default to TEXT
      
      // Look for first non-null value to determine type
      for (const row of data) {
        const value = row[key];
        if (value !== null && value !== undefined) {
          if (typeof value === 'number') {
            sql_type = Number.isInteger(value) ? 'INTEGER' : 'REAL';
          }
          break; // Found type, no need to check further for this column
        }
      }
      return `\`${header}\` ${sql_type}`;
    });
    return `CREATE TABLE data (\n  ${columns.join(',\n  ')}\n);`;
  };

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

            const schema = generateSchema(json);
            setTableSchema(schema);
            
            sqlWorkerRef.current?.postMessage({
              action: 'create_table',
              payload: { schema: schema, data: json }
            });

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
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const currentInput = input;
    setInput('');
    setIsAnalyzing(true);
  
    try {
      const conversationHistory = currentMessages
        .slice(1) // remove welcome message
        .filter(msg => typeof msg.content === 'string') // only include text messages
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'system' as 'user' | 'system',
          content: msg.content as string,
        }));

      const clarificationInput: ClarifyAmbiguousQuestionInput = {
        question: currentInput,
        dataDescription: tableSchema,
        conversationHistory: conversationHistory,
      };

      const clarificationResponse = await clarifyAmbiguousQuestion(clarificationInput);

      if (clarificationResponse.requiresClarification) {
        const assistantClarification: Message = {
          id: Date.now().toString() + '-clarification',
          role: 'assistant',
          content: clarificationResponse.nextQuestion || "Could you please clarify your question?",
        };
        setMessages(prev => [...prev, assistantClarification]);
        setIsAnalyzing(false);
        return;
      }
      
      const sqlResponse = await naturalLanguageQueryToSQL({
        query: clarificationResponse.clarifiedQuestion,
        tableSchema: tableSchema,
      });

      const sqlQuery = sqlResponse.sqlQuery;
      
      const worker = sqlWorkerRef.current;
      if (!worker) {
          throw new Error("SQL worker is not available.");
      }

      worker.onmessage = async (event) => {
        const { type, results, error } = event.data;
        if (type === 'exec_result') {
            const queryResult = results.length > 0 ? results[0] : { columns: [], values: [] };
            
            const dataSummary = JSON.stringify(queryResult.values.map(row => {
                let obj = {};
                queryResult.columns.forEach((col, i) => {
                    obj[col] = row[i];
                });
                return obj;
            }), null, 2);

            const reportInput = {
                query: clarificationResponse.clarifiedQuestion,
                dataSummary: dataSummary,
                visualizations: [],
            };
            const reportResult = await generateDataInsightsReport(reportInput);

            const assistantResponse: Message = {
                id: Date.now().toString() + '-report',
                role: 'assistant',
                content: <Visualization query={clarificationResponse.clarifiedQuestion} report={reportResult.report} data={queryResult} />,
            };
            setMessages(prev => [...prev, assistantResponse]);
        } else if (type === 'error') {
            console.error('SQL Execution Error:', error);
            toast({
                variant: 'destructive',
                title: 'SQL Error',
                description: `There was an error executing the query: ${error}`,
            });
        }
        setIsAnalyzing(false);
      };

      worker.postMessage({ action: 'exec', payload: { sql: sqlQuery } });

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
                <ChatMessage key={message.id} {...message} isLast={index === messages.length - 1} isAnalyzing={isAnalyzing}/>
              ))}
              {isAnalyzing && (
                 <ChatMessage role="assistant" content="Thinking..." isLast={true} isAnalyzing={true} />
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
