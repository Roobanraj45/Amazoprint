'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { DesignElement, Product, Background, RenderData, Page } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ConversationSheet } from "@/components/messaging/conversation-sheet";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, Trophy, Award, CheckCircle2, ShoppingBag,
  FileText, ExternalLink, ImageIcon, ChevronLeft, ChevronRight,
  Layers, Clock
} from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { OrderSubmissionDialog } from "./OrderSubmissionDialog";
import { cn, resolveImagePath } from "@/lib/utils";

const MM_TO_PX = 300 / 25.4;

type User = {
  id: string;
  name: string | null;
  profileImage: string | null;
}

type DesignItem = {
  id: number;
  name: string;
  thumbnailUrl: string | null;
  elements: any;
  background: any;
  guides: any;
  width: number;
  height: number;
  productSlug: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

type UploadItem = {
  id: number;
  originalFilename: string;
  thumbnailPath: string | null;
  filePath: string;
  fileSize: number;
  mimeType: string | null;
  createdAt?: string | Date | null;
};

export function SubmissionPreview({
  contestId,
  submission,
  template,
  freelancer,
  client,
  currentUser,
  rank,
  isAlreadyOrdered = false,
  isThisSubmissionOrdered = false,
  joinedAt,
  isCompleted = false,
  allDesigns = [],
  allUploads = [],
}: {
  contestId: number;
  submission: any;
  template?: any;
  freelancer: User;
  client: User;
  currentUser: User;
  rank: number;
  isAlreadyOrdered?: boolean;
  isThisSubmissionOrdered?: boolean;
  joinedAt?: string | Date | null;
  isCompleted?: boolean;
  /** All canvas designs submitted by this freelancer for this contest */
  allDesigns?: DesignItem[];
  /** All file uploads submitted by this freelancer for this contest */
  allUploads?: UploadItem[];
}) {
  const { toast } = useToast();

  // Merge all submissions into one ordered list (designs first, then uploads)
  type SubmissionItem =
    | { type: 'design'; data: DesignItem }
    | { type: 'upload'; data: UploadItem };

  const allItems: SubmissionItem[] = [
    ...allDesigns.map(d => ({ type: 'design' as const, data: d })),
    ...allUploads.map(u => ({ type: 'upload' as const, data: u })),
  ];

  // Fall back to legacy single-submission props if arrays are empty
  if (allItems.length === 0) {
    if (submission) allItems.push({ type: 'design', data: submission });
    if (template) allItems.push({ type: 'upload', data: template });
  }

  if (allItems.length === 0) return null;

  const [activeIdx, setActiveIdx] = useState(allItems.length - 1); // default to last (most recent)
  const activeItem = allItems[activeIdx];

  const handlePreviewClick = () => {
    if (activeItem.type === 'upload') {
      window.open(resolveImagePath((activeItem.data as UploadItem).filePath), '_blank');
      return;
    }
    const des = activeItem.data as DesignItem;
    try {
      const isMultiPage =
        Array.isArray(des.elements) && des.elements.length > 0 && Array.isArray(des.elements[0]);
      const pages: Page[] = isMultiPage
        ? des.elements.map((els: any, i: number) => ({
            elements: els,
            background: Array.isArray(des.background) ? des.background[i] : des.background,
          }))
        : [{ elements: des.elements || [], background: des.background || { type: 'color', value: '#ffffff' } }];

      const widthPx = Math.round(des.width * MM_TO_PX);
      const heightPx = Math.round(des.height * MM_TO_PX);
      const product: Product = { id: des.productSlug || '', name: '', description: '', imageId: '', width: widthPx, height: heightPx, type: '' };

      const renderData: RenderData = { pages, product, guides: des.guides || [], bleed: 18, safetyMargin: 18 };
      localStorage.setItem('pdf_render_data', JSON.stringify(renderData));
      const win = window.open('/pdf-render', '_blank');
      if (!win) toast({ variant: 'destructive', title: 'Popup blocked', description: 'Allow popups to view the full preview.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not open preview.' });
    }
  };

  // Canvas preview helpers for design items
  const getCanvasProps = (des: DesignItem) => {
    const widthPx = Math.round(des.width * MM_TO_PX);
    const heightPx = Math.round(des.height * MM_TO_PX);
    const isMultiPage = Array.isArray(des.elements) && des.elements.length > 0 && Array.isArray(des.elements[0]);
    const elements = (isMultiPage ? des.elements[0] : des.elements || []) as DesignElement[];
    const background = (isMultiPage && Array.isArray(des.background) ? des.background[0] : des.background || { type: 'color', value: '#ffffff' }) as Background;
    const product: Product = { id: des.productSlug || '', name: '', description: '', imageId: '', width: widthPx, height: heightPx, type: '' };
    const scale = 250 / widthPx;
    return { elements, background, product, scale, previewHeight: heightPx * scale };
  };

  const previewHeight = activeItem.type === 'design'
    ? getCanvasProps(activeItem.data as DesignItem).previewHeight
    : 200;

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary overflow-hidden">
      {/* Header */}
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <Avatar>
          <AvatarImage src={freelancer.profileImage || undefined} />
          <AvatarFallback>{freelancer.name?.charAt(0) || 'F'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-bold truncate">{freelancer.name}</CardTitle>
          <CardDescription className="text-[10px]">
            Joined {format(new Date(joinedAt || new Date()), 'PPP')}
          </CardDescription>
        </div>
        {rank > 0 && (
          <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-800 border-amber-200">
            <Award size={12} className="mr-1" />
            {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
          </Badge>
        )}
      </CardHeader>

      {/* Submission count pill */}
      {allItems.length > 1 && (
        <div className="px-4 pb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
            <Layers className="w-3 h-3" />
            {allItems.length} submissions — showing #{activeIdx + 1}
          </div>
        </div>
      )}

      {/* Preview area */}
      <CardContent
        className="flex-grow flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer relative group"
        style={{ height: `${Math.max(previewHeight, 160)}px` }}
        onClick={handlePreviewClick}
      >
        {activeItem.type === 'design' ? (() => {
          const { elements, background, product, scale, previewHeight: ph } = getCanvasProps(activeItem.data as DesignItem);
          return (
            <div style={{ width: 250, height: ph, overflow: 'hidden' }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: product.width, height: product.height }}>
                <DesignCanvas
                  product={product}
                  elements={elements}
                  background={background}
                  showRulers={false}
                  showGrid={false}
                  gridSize={20}
                  guides={(activeItem.data as DesignItem).guides || []}
                  showPrintGuidelines={false}
                  bleed={0}
                  safetyMargin={0}
                  viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                />
              </div>
            </div>
          );
        })() : (() => {
          const up = activeItem.data as UploadItem;
          return (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-3 w-full h-full relative group">
              {up.thumbnailPath ? (
                <img
                  src={resolveImagePath(up.thumbnailPath)}
                  alt={up.originalFilename}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm transition-transform group-hover:scale-[1.02]"
                  style={{ maxHeight: `${previewHeight - 20}px` }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <FileText size={32} />
                  </div>
                  <div className="max-w-[200px]">
                    <p className="text-xs font-bold text-foreground truncate">{up.originalFilename}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {(up.fileSize / 1024 / 1024).toFixed(2)} MB · {up.mimeType?.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                <span className="text-[10px] font-bold text-white bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <ExternalLink size={12} /> View File
                </span>
              </div>
            </div>
          );
        })()}

        {/* Hover overlay for designs */}
        {activeItem.type === 'design' && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-white bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-1">
              <ExternalLink size={12} /> Full Preview
            </span>
          </div>
        )}
      </CardContent>

      {/* Thumbnail strip navigator — shown only when more than 1 submission */}
      {allItems.length > 1 && (
        <div className="px-3 py-2 border-t border-border/40 bg-muted/20">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {allItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "relative shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-150",
                  idx === activeIdx
                    ? "border-indigo-500 ring-1 ring-indigo-400/40 scale-105"
                    : "border-transparent opacity-60 hover:opacity-90 hover:border-slate-300"
                )}
                title={item.type === 'design' ? (item.data as DesignItem).name : (item.data as UploadItem).originalFilename}
              >
                {item.type === 'design' && (item.data as DesignItem).thumbnailUrl ? (
                  <img src={resolveImagePath((item.data as DesignItem).thumbnailUrl!)} alt="" className="w-full h-full object-cover" />
                ) : item.type === 'upload' && (item.data as UploadItem).thumbnailPath ? (
                  <img src={resolveImagePath((item.data as UploadItem).thumbnailPath!)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    {item.type === 'design' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                )}
                {idx === activeIdx && (
                  <div className="absolute inset-0 bg-indigo-500/10" />
                )}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 font-medium">
            {activeItem.type === 'design'
              ? `Canvas: ${(activeItem.data as DesignItem).name}`
              : `File: ${(activeItem.data as UploadItem).originalFilename}`}
            {activeItem.data.updatedAt && (
              <span className="ml-1.5 inline-flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {format(new Date((activeItem.data as any).updatedAt), 'MMM d, HH:mm')}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Footer actions */}
      <CardFooter className="p-2 justify-between items-center gap-2 border-t border-border/30">
        <ConversationSheet contestId={contestId} client={client} freelancer={freelancer} currentUser={currentUser}>
          <Button variant="outline" size="sm" className="rounded-2xl text-xs font-bold" onClick={(e) => e.stopPropagation()}>
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Message
          </Button>
        </ConversationSheet>

        {isThisSubmissionOrdered ? (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full py-1 px-3 text-[10px] font-black flex items-center gap-1 shadow-sm border-none">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ordered for Press
          </Badge>
        ) : isAlreadyOrdered ? (
          <Button disabled variant="secondary" className="rounded-2xl text-xs font-bold h-9 opacity-50 cursor-not-allowed flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" /> Prepaid Fulfill
          </Button>
        ) : !isCompleted ? (
          <Button disabled variant="secondary" className="rounded-2xl text-[10px] font-bold h-9 opacity-50 cursor-not-allowed flex items-center gap-1" title="Declare a winner before ordering prints">
            <ShoppingBag className="w-3.5 h-3.5" /> Declare Winner First
          </Button>
        ) : (
          <OrderSubmissionDialog
            contestId={contestId}
            submissionId={activeItem.type === 'design' ? activeItem.data.id : undefined}
            templateId={activeItem.type === 'upload' ? activeItem.data.id : undefined}
            freelancerName={freelancer.name || 'Freelancer'}
          />
        )}
      </CardFooter>
    </Card>
  );
}
