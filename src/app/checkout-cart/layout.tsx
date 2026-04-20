import { Header } from '@/components/layout/header';

export default function CheckoutCartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
