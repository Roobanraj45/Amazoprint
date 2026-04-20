import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
        <p>Welcome to Amazoprint! These terms and conditions outline the rules and regulations for the use of Amazoprint's Website.</p>
        
        <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">1. Acceptance of Terms</h3>
            <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Amazoprint if you do not agree to take all of the terms and conditions stated on this page.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">2. User Accounts</h3>
            <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold text-lg text-foreground">3. Intellectual Property</h3>
            <p>The Service and its original content, features and functionality are and will remain the exclusive property of Amazoprint and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Amazoprint.</p>
        </div>
        
        <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
      </CardContent>
    </Card>
  );
}
