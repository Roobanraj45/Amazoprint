
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getMyDesigns } from '@/app/actions/design-actions';
import { Loader2 } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import type { Product } from '@/lib/types';

type DbDesign = Awaited<ReturnType<typeof getMyDesigns>>[0];

type LoadDesignDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLoad: (design: DbDesign) => void;
};

const MM_TO_PX = 300 / 25.4;


export function LoadDesignDialog({ isOpen, onOpenChange, onLoad }: LoadDesignDialogProps) {
  const [designs, setDesigns] = useState<DbDesign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchDesigns = async () => {
        setIsLoading(true);
        try {
          const myDesigns = await getMyDesigns();
          setDesigns(myDesigns);
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Failed to load designs',
            description: 'Please try again later.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchDesigns();
    }
  }, [isOpen, toast]);
  
  const handleLoadDesign = (design: DbDesign) => {
     const loadedProduct: Product = {
      id: design.productSlug,
      name: design.name,
      description: '',
      imageId: '',
      width: Math.round(design.width * MM_TO_PX),
      height: Math.round(design.height * MM_TO_PX),
      type: design.productSlug.replace('-', ' '),
    };
    onLoad(design);
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Load Design</DialogTitle>
          <DialogDescription>Select a previously saved design to continue editing.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6 -mr-6">
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : designs.length > 0 ? (
              designs.map(design => (
                <Card
                  key={design.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleLoadDesign(design)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{design.name}</CardTitle>
                    <CardDescription>
                      {design.productSlug} - Saved {formatDistanceToNow(new Date(design.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12">
                You have no saved designs.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
