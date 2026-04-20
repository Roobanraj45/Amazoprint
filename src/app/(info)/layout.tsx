import { Header } from '@/components/layout/header';

export default function InfoPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <div className="container max-w-4xl">
            {children}
        </div>
      </main>
    </div>
  );
}
