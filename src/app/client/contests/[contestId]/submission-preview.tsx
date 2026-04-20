
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DesignCanvas } from "@/components/design/design-canvas";
import type { DesignElement, Product, Background, RenderData } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ConversationSheet } from "@/components/messaging/conversation-sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trophy, Award } from "lucide-react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const MM_TO_PX = 300 / 25.4;

type User = {
    id: string;
    name: string | null;
    profileImage: string | null;
}

export function SubmissionPreview({ 
    contestId,
    submission, 
    freelancer,
    client,
    currentUser,
    rank
}: { 
    contestId: number,
    submission: any, 
    freelancer: User,
    client: User,
    currentUser: User,
    rank: number
}) {
    const { toast } = useToast();
    if (!submission) return null;
    
    const widthInPx = Math.round(submission.width * MM_TO_PX);
    const heightInPx = Math.round(submission.height * MM_TO_PX);

    const product: Product = {
        id: submission.productSlug,
        name: '',
        description: '',
        imageId: '',
        width: widthInPx,
        height: heightInPx,
        type: '',
    };
    
    const elements: DesignElement[] = submission.elements;
    const background: Background = submission.background;

    // Scale for small preview card
    const previewScale = 250 / product.width;
    const previewHeight = product.height * previewScale;

    const handlePreviewClick = () => {
        try {
            const renderData: RenderData = {
                pages: [{
                    elements: submission.elements,
                    background: submission.background
                }],
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
                    <CardDescription>Submitted on {format(new Date(submission.createdAt), 'PPP')}</CardDescription>
                </div>
                {rank > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800 border-amber-200">
                        <Award size={14} className="mr-1.5"/>
                        {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center bg-muted/50" style={{ height: `${previewHeight}px` }}>
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
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <ConversationSheet
                    contestId={contestId}
                    client={client}
                    freelancer={freelancer}
                    currentUser={currentUser}
                >
                    <Button variant="outline" onClick={(e) => e.stopPropagation()}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                    </Button>
                </ConversationSheet>
            </CardFooter>
        </Card>
    );
}
