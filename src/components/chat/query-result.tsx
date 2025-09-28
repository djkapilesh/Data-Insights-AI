'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type QueryResultData = {
  columns: string[];
  values: (string | number)[][];
};

interface QueryResultProps {
  result: QueryResultData;
}

export function QueryResult({ result }: QueryResultProps) {
  if (!result || !result.columns || result.columns.length === 0 || result.values.length === 0) {
    return (
        <Card className="w-full max-w-full overflow-hidden bg-transparent border-primary/20">
            <CardHeader>
                <CardTitle className="text-base">Query Result</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The query returned no results.</p>
            </CardContent>
        </Card>
    );
  }

  const { columns, values } = result;

  const isChartable =
    columns.length === 2 &&
    typeof values[0][0] === 'string' &&
    typeof values[0][1] === 'number';

  const chartData = isChartable
    ? values.map((row) => ({
        [columns[0]]: row[0],
        [columns[1]]: row[1],
      }))
    : [];

  if (isChartable) {
    return (
      <Card className="w-full max-w-full overflow-hidden bg-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-base font-medium">Query Result</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] w-full p-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={columns[0]} stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))"
                }}
              />
              <Legend wrapperStyle={{fontSize: "0.8rem"}} />
              <Bar dataKey={columns[1]} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full overflow-hidden bg-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-base font-medium">Query Result</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                        ))}
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {values.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>{String(cell)}</TableCell>
                        ))}
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
      </CardContent>
    </Card>
  );
}
