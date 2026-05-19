'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { DesignElement, Product, Background, RenderData, Page } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ConversationSheet } from "@/components/messaging/conversation-sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trophy, Award, CheckCircle2, ShoppingBag, FileText, ExternalLink } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { OrderSubmissionDialog } from "./OrderSubmissionDialog";

const MM_TO_PX = 300 / 25.4;

type User = {
    id: string;
    name: string | null;
    profileImage: string | null;
}

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
    isCompleted = false
}: { 
    contestId: number,
    submission: any, 
    template?: any,
    freelancer: User,
    client: User,
    currentUser: User,
    rank: number,
    isAlreadyOrdered?: boolean,
    isThisSubmissionOrdered?: boolean,
    joinedAt?: string | Date | null,
    isCompleted?: boolean
}) {
    const { toast } = useToast();
    if (!submission && !template) return null;
    
    // Setup dimensions and canvas metadata if it's a canvas submission
    const widthInPx = submission ? Math.round(submission.width * MM_TO_PX) : 0;
    const heightInPx = submission ? Math.round(submission.height * MM_TO_PX) : 0;

    const product: Product = {
        id: submission?.productSlug || '',
        name: '',
        description: '',
        imageId: '',
        width: widthInPx,
        height: heightInPx,
        type: '',
    };
    
    const isMultiPage = submission && Array.isArray(submission.elements) && submission.elements.length > 0 && Array.isArray(submission.elements[0]);
    const elements: DesignElement[] = (isMultiPage ? submission.elements[0] : (submission?.elements || [])) as DesignElement[];
    const background: Background = (isMultiPage && Array.isArray(submission.background) ? submission.background[0] : (submission?.background || { type: 'color', value: '#ffffff' })) as Background;

    // Scale for small preview card
    const previewScale = submission ? 250 / product.width : 1;
    const previewHeight = submission ? product.height * previewScale : 200;

    const handlePreviewClick = () => {
        if (template) {
            window.open(template.filePath, '_blank');
            return;
        }
        try {
            const pages: Page[] = [];
            const isSubmissionMultiPage = submission && Array.isArray(submission.elements) && submission.elements.length > 0 && Array.isArray(submission.elements[0]);
            
            if (isSubmissionMultiPage) {
                for (let i = 0; i < submission.elements.length; i++) {
                    pages.push({
                        elements: submission.elements[i],
                        background: Array.isArray(submission.background) 
                            ? submission.background[i] 
                            : (submission.background || { type: 'color', value: '#ffffff' })
                    });
                }
            } else {
                pages.push({
                    elements: submission?.elements || [],
                    background: submission?.background || { type: 'color', value: '#ffffff' }
                });
            }

            const renderData: RenderData = {
                pages,
                product: product,
                guides: submission.guides || [],
                bleed: 18,
                safetyMargin: 18,
            };
            localStorage.setItem('pdf_render_data', JSON.stringify(renderData));
            const newWindow = window.open('/pdf-render', '_blank');
            if (!newWindow) {
                toast({
                    variant: 'destructive',
                    title: 'Popup blocked',
                    description: 'Please allow popups for this site to view the preview.',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not open preview.',
            });
        }
    };

    return (
        <Card className="flex flex-col cursor-pointer h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary" onClick={handlePreviewClick}>
            <CardHeader className="flex-row items-center gap-4">
                <Avatar>
                    <AvatarImage src={freelancer.profileImage || undefined} />
                    <AvatarFallback>{freelancer.name?.charAt(0) || 'F'}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base">{freelancer.name}</CardTitle>
                    <CardDescription>
                        Submitted on {format(new Date(submission?.createdAt || template?.createdAt || joinedAt || new Date()), 'PPP')}
                    </CardDescription>
                </div>
                {rank > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800 border-amber-200">
                        <Award size={14} className="mr-1.5"/>
                        {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center bg-muted/50 overflow-hidden" style={{ height: `${previewHeight}px` }}>
                {submission ? (
                    <div style={{ width: 250, height: previewHeight, overflow: 'hidden' }}>
                        <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: product.width, height: product.height }}>
                            <DesignCanvas
                                product={product}
                                elements={elements}
                                background={background}
                                showRulers={false}
                                showGrid={false}
                                gridSize={20}
                                guides={submission.guides || []}
                                showPrintGuidelines={false}
                                bleed={0}
                                safetyMargin={0}
                                viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                            />
                        </div>
                    </div>
                ) : template ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center space-y-3 w-full h-full relative group">
                        {template.thumbnailPath ? (
                            <img 
                                src={template.thumbnailPath} 
                                alt={template.originalFilename} 
                                className="max-w-full max-h-full object-contain rounded-lg shadow-sm transition-transform group-hover:scale-[1.02]"
                                style={{ maxHeight: `${previewHeight - 20}px` }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
                                    <FileText size={32} />
                                </div>
                                <div className="max-w-[200px]">
                                    <p className="text-xs font-bold text-foreground truncate">{template.originalFilename}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {(template.fileSize / 1024 / 1024).toFixed(2)} MB • {template.mimeType?.split('/')[1]?.toUpperCase()}
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
                ) : null}
            </CardContent>
            <CardFooter className="p-2 justify-between items-center gap-2">
                <ConversationSheet
                    contestId={contestId}
                    client={client}
                    freelancer={freelancer}
                    currentUser={currentUser}
                >
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
                        submissionId={submission?.id} 
                        templateId={template?.id}
                        freelancerName={freelancer.name || 'Freelancer'} 
                    />
                )}
            </CardFooter>
        </Card>
    );
}
