import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, Users, BarChart3 } from "lucide-react";

const stats = [
  {
    name: "Total Revenue",
    value: "$45,231.89",
    icon: BarChart3,
    change: "+20.1%",
    changeType: "positive",
  },
  {
    name: "Total Sales",
    value: "2,350",
    icon: ShoppingCart,
    change: "+180.1%",
    changeType: "positive",
  },
  {
    name: "Active Inventory",
    value: "12,234",
    icon: Package,
    change: "+19%",
    changeType: "positive",
  },
  {
    name: "Active Customers",
    value: "+573",
    icon: Users,
    change: "+201",
    changeType: "positive",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back to your POS overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-500">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Sales Chart Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Top Products Placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
