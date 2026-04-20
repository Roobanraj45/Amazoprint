import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Recycle, Truck } from "lucide-react";

export default function SustainabilityPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Our Commitment to the Planet</h1>
        <p className="text-xl text-muted-foreground mt-2">Great design shouldn't cost the Earth.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>A Greener Print</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            At Amazoprint, sustainability is not an afterthought—it's a core part of our business model. We are constantly innovating to reduce our environmental impact while delivering the premium quality our customers expect. We believe in a future where creativity and responsibility coexist.
          </p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary"><Recycle /></div>
            <CardTitle className="text-lg">Recycled Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A significant portion of our paper stock is made from 100% post-consumer recycled materials, reducing landfill waste and the need for virgin pulp.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-4">
             <div className="p-3 rounded-lg bg-primary/10 text-primary"><Leaf /></div>
            <CardTitle className="text-lg">Eco-Friendly Inks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We use soy and vegetable-based inks instead of traditional petroleum-based inks, which reduces air pollution and makes our products easier to recycle.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-4">
             <div className="p-3 rounded-lg bg-primary/10 text-primary"><Truck /></div>
            <CardTitle className="text-lg">Carbon-Neutral Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We partner with logistics providers who share our commitment to the environment, and we offset the carbon footprint of every single shipment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
