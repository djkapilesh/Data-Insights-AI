'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type RealTimeFeedbackAndValueCompletionOutput } from '@/ai/flows/real-time-feedback-and-value-completion';
import { cn } from '@/lib/utils';

type VisualizationProps = {
  data: RealTimeFeedbackAndValueCompletionOutput['visualization'];
  className?: string;
};

export function Visualization({ data, className }: VisualizationProps) {
  if (!data) return null;

  const renderContent = () => {
    switch (data.type) {
      case 'barChart': {
        const keys = Object.keys(data.data[0] || {}).filter(k => k !== 'name');
        return (
            <ChartContainer config={{}} className="min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis />
                  <Tooltip cursor={false} content={<ChartTooltipContent />} />
                  <Legend />
                  {keys.map((key, index) => (
                    <Bar key={key} dataKey={key} fill={`var(--color-chart-${(index % 5) + 1})`} radius={4} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
        );
      }
      case 'table':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                {(data.columns || Object.keys(data.data[0] || {})).map(header => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {(data.columns || Object.keys(row)).map(key => (
                    <TableCell key={key}>{String(row[key])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('mt-4 w-full overflow-x-auto', className)}>
      {renderContent()}
    </div>
  );
}
