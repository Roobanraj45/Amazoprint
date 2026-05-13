'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileArchive, Download, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ExtractPage() {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const response = await fetch('/api/admin/extract');
      
      if (!response.ok) {
        throw new Error('Failed to create zip file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amazoprint-uploads-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Uploads have been zipped and downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: error.message || "An error occurred while creating the zip file.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">File Extraction</h1>
        <p className="text-muted-foreground">Export and download system assets for backup or migration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-amber-100 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-900/5 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600">
                <FileArchive size={20} />
              </div>
              <CardTitle className="text-lg">Full Public Assets</CardTitle>
            </div>
            <CardDescription>
              Download all uploads, custom fonts, and system assets from the public directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-white/50 dark:bg-black/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-xs font-bold text-amber-800 dark:text-amber-400">Important</AlertTitle>
              <AlertDescription className="text-[10px] text-amber-700/80 dark:text-amber-500/80">
                This process will bundle all files in `/public` into a single ZIP archive, including uploads, custom fonts, and branding assets.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleExtract} 
              disabled={isExtracting}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-[0.98]"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Zipping All Assets...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Extract All Assets
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                <FileArchive size={20} />
              </div>
              <CardTitle className="text-lg">Database Export</CardTitle>
            </div>
            <CardDescription>
              Export full database schema and data in SQL format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full h-12 rounded-xl border-dashed">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
