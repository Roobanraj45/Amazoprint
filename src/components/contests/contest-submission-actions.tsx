'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  FileEdit,
  UploadCloud,
  AlertCircle,
  ImageIcon,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { cn, resolveImagePath } from '@/lib/utils';
import { getSubmissionPreviews } from '@/app/actions/contest-actions';
import Image from 'next/image';
import { formatDistanceToNowStrict } from 'date-fns';

type DesignPreview = { id: number; name: string; thumbnailUrl: string | null; updatedAt: Date | null };
type UploadPreview = { id: number; originalFilename: string; thumbnailPath: string | null; updatedAt: Date | null };

interface ContestSubmissionActionsProps {
  contestId: number;
  productSlug: string;
  subProductId: number;
  /** All editor design IDs ever submitted — last element is the active submission */
  designIds?: number[];
  /** All upload IDs ever submitted — last element is the active submission */
  templateIds?: number[];
  type: 'editor' | 'upload';
  children: React.ReactNode;
}

export function ContestSubmissionActions({
  contestId,
  productSlug,
  subProductId,
  designIds = [],
  templateIds = [],
  type,
  children,
}: ContestSubmissionActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [designs, setDesigns] = useState<DesignPreview[]>([]);
  const [uploads, setUploads] = useState<UploadPreview[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);

  // Which IDs exist for this type
  const relevantIds = type === 'editor' ? designIds : templateIds;
  const hasExisting = relevantIds.length > 0;

  // Fetch previews whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (!hasExisting) return; // nothing to fetch
    setLoadingPreviews(true);
    getSubmissionPreviews(
      type === 'editor' ? designIds : [],
      type === 'upload' ? templateIds : []
    )
      .then(({ designs: d, uploads: u }) => {
        setDesigns(d as DesignPreview[]);
        setUploads(u as UploadPreview[]);
      })
      .catch(console.error)
      .finally(() => setLoadingPreviews(false));
  }, [isOpen]);

  // ALWAYS open the popup — never skip to direct navigation
  const handleAction = () => {
    setIsOpen(true);
  };

  /** Navigate to editor/upload. Pass the selected submission ID, or null for a fresh start. */
  const navigate = (selectedId: number | null) => {
    setIsOpen(false);
    let url = '';
    if (type === 'editor') {
      url = `/design/${productSlug}?subProductId=${subProductId}&contestId=${contestId}`;
      if (selectedId) url += `&templateId=${selectedId}`;
    } else {
      url = `/design/${productSlug}/upload?subProductId=${subProductId}&contestId=${contestId}`;
      if (selectedId) url += `&templateId=${selectedId}`;
    }
    startTransition(() => router.push(url));
  };

  // Active submission = the last element of the array (most recently submitted)
  const activeId = relevantIds.length > 0 ? relevantIds[relevantIds.length - 1] : undefined;

  return (
    <>
      <span onClick={handleAction} className="cursor-pointer flex-1 md:flex-none">
        {children}
      </span>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-3xl border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-0 shadow-2xl">
          {/* Gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-600" />

          <div className="p-6 md:p-7 space-y-5">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {type === 'editor' ? 'Your Canvas Submissions' : 'Your Uploaded Files'}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {hasExisting
                  ? `You have ${relevantIds.length} existing submission${relevantIds.length !== 1 ? 's' : ''}. Pick one to edit, or start a new one.`
                  : 'No submissions yet. Start your first one below!'}
              </DialogDescription>
            </DialogHeader>

            {/* Existing submissions gallery */}
            {loadingPreviews ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
              </div>
            ) : !hasExisting ? (
              /* Empty state — first submission */
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                  {type === 'editor' ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No submissions yet</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Click below to create your first one</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {type === 'editor' && designs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => navigate(d.id)}
                    className={cn(
                      "group w-full flex items-center gap-4 p-3.5 rounded-2xl border text-left transition-all duration-200 hover:shadow-md cursor-pointer",
                      d.id === activeId
                        ? "border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-indigo-400/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                      {d.thumbnailUrl ? (
                        <Image
                          src={resolveImagePath(d.thumbnailUrl)}
                          alt={d.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      {d.id === activeId && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{d.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {d.updatedAt ? formatDistanceToNowStrict(new Date(d.updatedAt), { addSuffix: true }) : 'Unknown date'}
                      </p>
                      {d.id === activeId && (
                        <span className="inline-flex items-center rounded-md bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">
                          Active Submission
                        </span>
                      )}
                    </div>

                    {/* Edit icon */}
                    <div className={cn(
                      "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                      "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600"
                    )}>
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}

                {type === 'upload' && uploads.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => navigate(u.id)}
                    className={cn(
                      "group w-full flex items-center gap-4 p-3.5 rounded-2xl border text-left transition-all duration-200 hover:shadow-md cursor-pointer",
                      u.id === activeId
                        ? "border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-indigo-400/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10"
                    )}
                  >
                    {/* Thumbnail / file icon */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                      {u.thumbnailPath ? (
                        <Image
                          src={resolveImagePath(u.thumbnailPath)}
                          alt={u.originalFilename}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      {u.id === activeId && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.originalFilename}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {u.updatedAt ? formatDistanceToNowStrict(new Date(u.updatedAt), { addSuffix: true }) : 'Unknown date'}
                      </p>
                      {u.id === activeId && (
                        <span className="inline-flex items-center rounded-md bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">
                          Active Submission
                        </span>
                      )}
                    </div>

                    {/* Edit icon */}
                    <div className={cn(
                      "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                      "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600"
                    )}>
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-950 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  or
                </span>
              </div>
            </div>

            {/* Start fresh button */}
            <button
              onClick={() => navigate(null)}
              className="group w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500/60 bg-transparent hover:bg-amber-50/10 dark:hover:bg-amber-950/5 text-left transition-all duration-200 hover:shadow-sm cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-amber-500 group-hover:border-amber-500/40 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/20 shrink-0 transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {type === 'editor' ? 'Start Fresh — New Canvas' : 'Upload a New File'}
                </p>
                <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  This will become the new active submission
                </p>
              </div>
            </button>

            {/* Footer */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
