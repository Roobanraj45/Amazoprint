import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Privacy Policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
        <p>Your privacy is important to us. It is Amazoprint's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
        
        <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">1. Information We Collect</h3>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">2. How We Use Your Information</h3>
            <p>We use the information we collect in various ways, including to: provide, operate, and maintain our website; improve, personalize, and expand our website; understand and analyze how you use our website; develop new products, services, features, and functionality; and communicate with you for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">3. Security</h3>
            <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
        </div>
        
        <p>This policy is effective as of 1 August 2024.</p>
      </CardContent>
    </Card>
  );
}
