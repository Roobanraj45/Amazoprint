import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AmazoprintLogo } from "@/components/ui/logo";
import { Leaf, Palette, Zap } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <AmazoprintLogo />
        <h1 className="text-4xl font-bold tracking-tight">About Amazoprint</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're revolutionizing the print industry by blending cutting-edge technology with a deep commitment to sustainability and creative expression.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Our mission is to empower creators, entrepreneurs, and businesses to bring their visions to life on high-quality, sustainable materials, without compromising on design freedom or speed. We believe that great design and environmental responsibility can, and should, go hand in hand.
          </p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary"><Palette /></div>
            <CardTitle className="text-lg">Creativity Unleashed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              From our powerful web-based design editor to our AI assistant, we provide tools that cater to both seasoned designers and complete beginners.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-4">
             <div className="p-3 rounded-lg bg-primary/10 text-primary"><Zap /></div>
            <CardTitle className="text-lg">Technology Driven</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We leverage automation and AI to streamline the entire process, from design generation and file validation to print production and logistics.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-4">
             <div className="p-3 rounded-lg bg-primary/10 text-primary"><Leaf /></div>
            <CardTitle className="text-lg">Sustainable Core</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We prioritize recycled materials, non-toxic inks, and carbon-neutral shipping to minimize our ecological footprint.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
