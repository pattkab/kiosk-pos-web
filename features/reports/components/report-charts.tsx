"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">{children}</div>
      </CardContent>
    </Card>
  );
}

export function RevenueLineChart({ data }: { data: Array<{ period: string; revenue: number }> }) {
  return (
    <ChartCard title="Revenue trend" description="Revenue by day for the selected date range.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="period" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value))} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SalesBarChart({ data }: { data: Array<{ period: string; sales_count: number }> }) {
  return (
    <ChartCard title="Sales volume" description="Number of completed sales by day.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="period" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="sales_count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProductPerformanceChart({ data }: { data: Array<{ product_name: string; revenue: number }> }) {
  return (
    <ChartCard title="Product performance" description="Top products by revenue.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" fontSize={12} tickFormatter={(value) => formatCurrency(Number(value))} />
          <YAxis type="category" dataKey="product_name" width={120} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PaymentMethodPieChart({ data }: { data: Array<{ payment_method: string; total_amount: number }> }) {
  return (
    <ChartCard title="Payment methods" description="Cash, card, and mobile money breakdown.">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="total_amount" nameKey="payment_method" innerRadius={60} outerRadius={100} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.payment_method} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProfitTrendChart({ data }: { data: Array<{ period: string; gross_profit: number }> }) {
  return (
    <ChartCard title="Profit trend" description="Gross profit after product cost.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="period" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value))} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Line type="monotone" dataKey="gross_profit" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function InventoryValuationChart({ data }: { data: Array<{ product_name: string; selling_value: number }> }) {
  return (
    <ChartCard title="Inventory valuation" description="Top stocked items by retail value.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 8)}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="product_name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value))} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="selling_value" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CashierComparisonChart({ data }: { data: Array<{ cashier_name: string; revenue: number }> }) {
  return (
    <ChartCard title="Cashier comparison" description="Revenue handled by cashier.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="cashier_name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value))} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="revenue" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
