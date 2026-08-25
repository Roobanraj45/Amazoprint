'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ImageIcon } from 'lucide-react';

type Folder = {
  name: string;
  files: string[];
};

export function MediaLibraryDialog({
  onSelect,
  folder,
  setFolder,
}: {
  onSelect: (url: string) => void;
  folder: string;
  setFolder: (folder: string) => void;
}) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/uploads/list');
      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
        if (data.folders.length > 0 && !folder) {
          setFolder(data.folders[0].name);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch assets');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Loading Error',
        description: 'Could not load uploaded assets.',
      });
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, folder, setFolder]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleFileUpload = async () => {
    if (!fileToUpload) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }
    if (!folder) {
      toast({ variant: 'destructive', title: 'Folder name is required' });
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', folder);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      onSelect(result.url);
      await fetchAssets();
      toast({ title: 'Image uploaded successfully.' });
      setFileToUpload(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col bg-background border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
      <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Media Asset Library
        </DialogTitle>
        <DialogDescription className="text-xs text-slate-500">
          Select an existing asset from the storage repository or upload a new media file.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 flex min-h-0 p-6 pt-4">
        <Tabs defaultValue="browse" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-10 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="browse" className="rounded-lg font-bold text-xs">Browse Existing Library</TabsTrigger>
            <TabsTrigger value="upload" className="rounded-lg font-bold text-xs">Upload New Asset</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 overflow-hidden mt-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-full gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs font-semibold text-slate-500">Scanning repository folders...</p>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">No media assets found.</div>
            ) : (
              <div className="flex h-full">
                <ScrollArea className="w-52 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="p-3 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1">Folders</p>
                    {folders.map((f) => (
                      <Button
                        key={f.name}
                        type="button"
                        variant={folder === f.name ? 'secondary' : 'ghost'}
                        className={`w-full justify-between capitalize text-xs font-bold rounded-xl h-9 px-3 ${folder === f.name ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}`}
                        onClick={() => setFolder(f.name)}
                      >
                        <span className="truncate">{f.name}</span>
                        <span className="text-[10px] opacity-60 font-mono">({f.files.length})</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>

                <ScrollArea className="flex-1 p-5 bg-white dark:bg-slate-900">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {folders.find((f) => f.name === folder)?.files.map((fileUrl) => (
                      <DialogClose asChild key={fileUrl}>
                        <button
                          type="button"
                          onClick={() => onSelect(fileUrl)}
                          className="aspect-square relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 hover:scale-[1.03] transition-all group shadow-sm"
                        >
                          <Image src={fileUrl} alt="" fill className="object-cover group-hover:opacity-90" />
                        </button>
                      </DialogClose>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-4 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="folder-name-upload" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Storage Folder</Label>
              <p className="text-xs text-muted-foreground">The active folder is <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">{folder || 'N/A'}</span>. Specify a custom folder name to categorize assets.</p>
              <Input
                id="folder-name-upload"
                placeholder="e.g. products, banners, templates"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload-dialog" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Image File</Label>
              <Input
                id="file-upload-dialog"
                type="file"
                accept="image/*"
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            <Button
              type="button"
              onClick={handleFileUpload}
              disabled={!fileToUpload || !folder || isUploading}
              className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-500/20"
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload & Select Image
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  );
}
