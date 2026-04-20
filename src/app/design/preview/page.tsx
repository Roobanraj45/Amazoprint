import { Header } from '@/components/layout/header';
import ClientPreview from './client-preview';

export default function PreviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <ClientPreview />
    </div>
  );
}
