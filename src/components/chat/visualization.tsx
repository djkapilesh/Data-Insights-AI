'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
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
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface VisualizationProps {
    query: string;
    report: string;
    data: {
        columns: string[];
        values: any[][];
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Visualization({ query, report, data }: VisualizationProps) {
    
    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    {data.columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.values.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => <TableCell key={cellIndex}>{String(cell)}</TableCell>)}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    const renderBarChart = () => {
        const chartData = data.values.map(row => {
            const obj: {[key: string]: any} = {};
            data.columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });

        const categoryKey = data.columns[0];
        const valueKey = data.columns[1];

        return (
            <ChartContainer config={{}} className="min-h-[200px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey={categoryKey} tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey={valueKey} fill="var(--color-chart-1)" radius={4} />
                </BarChart>
            </ChartContainer>
        );
    };
    
    const renderPieChart = () => {
        const chartData = data.values.map(row => ({
            name: row[0],
            value: row[1],
        }));
        
        const categoryKey = data.columns[0];
        const valueKey = data.columns[1];

        return (
            <ChartContainer config={{}} className="min-h-[200px] w-full aspect-square">
                 <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                </PieChart>
            </ChartContainer>
        )
    }

    const getChartType = () => {
        if (data.values.length > 1 && data.columns.length === 2 && typeof data.values[0][1] === 'number') {
             // Simple rule: if more than 5 categories, use bar chart, otherwise pie chart.
            return data.values.length > 5 ? 'bar' : 'pie';
        }
        return 'table';
    }
    
    const chartType = getChartType();
    
    const renderChart = () => {
        switch (chartType) {
            case 'bar':
                return renderBarChart();
            case 'pie':
                return renderPieChart();
            default:
                return renderTable();
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Analysis</CardTitle>
                <CardDescription>{report}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Show data</AccordionTrigger>
                        <AccordionContent>
                            {renderChart()}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}