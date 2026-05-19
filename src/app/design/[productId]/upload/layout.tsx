import { Header } from '@/components/layout/header';

export default function UploadDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col">
      <Header />
      <div className="flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
}
