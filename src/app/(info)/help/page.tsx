import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenterPage() {
  const faqs = [
    {
      q: "What file formats do you accept for uploads?",
      a: "We accept Adobe Illustrator (.ai), CorelDRAW (.cdr), Photoshop (.psd), PDF, JPG, and PNG files. For best results, we recommend vector formats like .ai or PDF."
    },
    {
      q: "What is bleed and why is it important?",
      a: "Bleed is the area of your design that extends beyond the final trim edge. It's important because it ensures there are no unprinted white edges on your final product after trimming. We recommend a 3mm bleed on all sides."
    },
    {
      q: "How does the design contest work?",
      a: "You create a contest brief describing your needs, set a prize amount, and freelancers from our community submit their designs. You then choose your favorite design as the winner."
    },
    {
      q: "Can I get a sample before placing a large order?",
      a: "Yes, we offer sample kits and single-item orders for most of our products. Please contact our support team for more details on ordering samples."
    },
    {
      q: "What is your return policy?",
      a: "If there is a manufacturing defect or the final product differs significantly from the approved proof, we will reprint your order at no cost. As products are custom-made, we do not accept returns for design errors or typos that were present in the approved proof."
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
        <p className="text-xl text-muted-foreground mt-2">Frequently Asked Questions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Common Questions</CardTitle>
          <CardDescription>Find answers to the most common questions about our services.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
