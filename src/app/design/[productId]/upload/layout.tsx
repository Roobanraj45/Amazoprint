import { Header } from '@/components/layout/header';

export default function UploadDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-24 sm:py-32">
        {children}
      </main>
    </>
  );
}
