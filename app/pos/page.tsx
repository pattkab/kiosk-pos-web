import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart } from "lucide-react";

export default function PosPage() {
  return (
    <div className="grid h-[calc(100vh-120px)] grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4 flex flex-col">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search products or scan barcode..." />
        </div>
        <Card className="flex-1 overflow-auto">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
               {/* Product Grid Items */}
               {[1,2,3,4,5,6,7,8].map(i => (
                 <Card key={i} className="cursor-pointer hover:border-primary transition-colors">
                   <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                     <div className="w-16 h-16 bg-muted rounded-md" />
                     <div className="font-medium text-sm">Product {i}</div>
                     <div className="text-primary font-bold">$19.99</div>
                   </CardContent>
                 </Card>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" /> Current Order
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
           <div className="text-center py-10 text-muted-foreground">
             Your cart is empty
           </div>
        </CardContent>
        <div className="p-6 border-t space-y-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>$0.00</span>
          </div>
          <Button className="w-full h-12 text-lg">Checkout</Button>
        </div>
      </Card>
    </div>
  );
}
