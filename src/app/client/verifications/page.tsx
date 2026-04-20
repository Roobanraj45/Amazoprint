'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitForVerification, getClientVerifications } from '@/app/actions/verification-actions';
import { getMyDesigns } from '@/app/actions/design-actions';
import { getMyUploads } from '@/app/actions/upload-actions';
import { Loader2, ShieldCheck, FileText, UploadCloud, CheckCircle, Clock, Download, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Image from 'next/image';
import { resolveImagePath } from '@/lib/utils';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Product, Background, Guide, RenderData } from '@/lib/types';
import Link from 'next/link';


type Design = Awaited<ReturnType<typeof getMyDesigns>>[0];
type Upload = Awaited<ReturnType<typeof getMyUploads>>[0];
type Verification = Awaited<ReturnType<typeof getClientVerifications>>[0];

const verificationSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  designSourceType: z.enum(['saved', 'uploaded'], { required_error: 'Please select a source.' }),
  sourceId: z.coerce.number().min(1, 'A design must be selected.'),
  clientNotes: z.string().optional(),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;
const VERIFICATION_FEE = 500;
const DPI = 300;
const MM_TO_PX = DPI / 25.4;


function VerificationForm() {
  const [isPending, startTransition] = useTransition();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const { toast } = useToast();
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<VerificationFormValues>();
  
  const sourceType = watch('designSourceType');
  const sourceId = watch('sourceId');
  const selectedSource = sourceType === 'saved' ? designs.find(d => d.id === sourceId) : uploads.find(u => u.id === sourceId);

  useEffect(() => {
    async function loadSources() {
      setDesigns(await getMyDesigns());
      setUploads(await getMyUploads());
    }
    loadSources();
  }, []);

  const onSubmit = (data: VerificationFormValues) => {
    startTransition(async () => {
      try {
        await submitForVerification(data);
        toast({ title: 'Success!', description: 'Your design has been submitted for verification.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Submit a Design for Verification</CardTitle>
          <CardDescription>Get a professional opinion on your design's print-readiness, layout, and overall quality for a small fee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" placeholder="e.g., Verification for My New Business Card" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <Controller
            name="designSourceType"
            control={control}
            render={({ field }) => (
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent [&:has([data-state=checked])]:border-primary">
                  <RadioGroupItem value="saved" />
                  <FileText className="h-5 w-5" />
                  <span>Use Saved Design</span>
                </Label>
                <Label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent [&:has([data-state=checked])]:border-primary">
                  <RadioGroupItem value="uploaded" />
                  <UploadCloud className="h-5 w-5" />
                  <span>Use Uploaded File</span>
                </Label>
              </RadioGroup>
            )}
          />
          {errors.designSourceType && <p className="text-sm text-destructive">{errors.designSourceType.message}</p>}
          
          {sourceType && (
            <div className="space-y-2">
              <Label>Select Design</Label>
              <Controller
                name="sourceId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select a ${sourceType === 'saved' ? 'design' : 'file'}...`} />
                    </SelectTrigger>
                    <SelectContent>
                        {sourceType === 'saved' && designs.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                        {sourceType === 'uploaded' && uploads.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.originalFilename}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sourceId && <p className="text-sm text-destructive">{errors.sourceId.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientNotes">Notes for the Freelancer (Optional)</Label>
            <Textarea id="clientNotes" placeholder="e.g., 'Please check if the colors are suitable for CMYK printing and if the text is readable.'" {...register('clientNotes')} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/50 p-6">
          <div className="text-lg font-bold">Fee: <span className="text-primary">₹{VERIFICATION_FEE}</span></div>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay & Submit
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function DesignPreviewContent({ design, upload } : { design?: Verification['design'], upload?: Verification['upload']}) {
    const { toast } = useToast();

    const getDesignImage = (d?: Verification['design'], u?: Verification['upload']) => {
        if(d?.thumbnailUrl) return resolveImagePath(d.thumbnailUrl);
        if(u?.thumbnailPath) return resolveImagePath(u.thumbnailPath);
        if(u?.mimeType?.startsWith('image/')) return resolveImagePath(u.filePath);
        return null;
    }

    const handlePreviewDesign = (designToPreview?: Verification['design']) => {
        if (!designToPreview) return;
        try {
            const productForCanvas: Product = {
                id: designToPreview.productSlug, name: designToPreview.name, description: '', imageId: '',
                width: Math.round(Number(designToPreview.width) * MM_TO_PX),
                height: Math.round(Number(designToPreview.height) * MM_TO_PX),
                type: '',
            };
            const renderData: RenderData = {
                pages: Array.isArray(designToPreview.elements) && Array.isArray(designToPreview.elements[0]) 
                    ? (designToPreview.elements as DesignElement[][]).map((els, i) => ({ elements: els, background: (designToPreview.background as Background[])[i] }))
                    : [{ elements: designToPreview.elements as DesignElement[], background: designToPreview.background as Background }],
                product: productForCanvas, guides: designToPreview.guides as Guide[] || [], bleed: 18, safetyMargin: 18,
            };
            localStorage.setItem('pdf_render_data', JSON.stringify(renderData));
            const newWindow = window.open('/pdf-render', '_blank');
            if (!newWindow) {
                toast({ variant: 'destructive', title: 'Popup blocked', description: 'Please allow popups for this site to view the preview.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not open preview.' });
        }
    }
    
    const imageUrl = getDesignImage(design, upload);

    return (
        <Card>
            <CardContent className="p-3">
                {design ? (
                    <>
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                            <div style={{ transform: `scale(${200 / (design.width * MM_TO_PX)})`, transformOrigin: 'center' }}>
                                <DesignCanvas 
                                    product={{ id: design.productSlug, name: design.name, description: '', imageId: '', width: design.width * MM_TO_PX, height: design.height * MM_TO_PX, type: '' }}
                                    elements={Array.isArray(design.elements[0]) ? design.elements[0] as DesignElement[] : design.elements as DesignElement[]}
                                    background={Array.isArray(design.background) ? design.background[0] as Background : design.background as Background}
                                    guides={[]} viewState={{ zoom: 1, pan: {x: 0, y: 0} }} showRulers={false} showGrid={false} showPrintGuidelines={false} bleed={0} safetyMargin={0}
                                />
                            </div>
                        </div>
                        <Button className="w-full mt-3" variant="secondary" onClick={() => handlePreviewDesign(design)}>
                            <FileText className="mr-2 h-4 w-4"/> View & Download
                        </Button>
                    </>
                ) : upload ? (
                    <>
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                            {imageUrl ? <Image src={imageUrl} alt="preview" width={200} height={112} className="object-contain" /> : <FileText className="h-16 w-16 text-muted-foreground" />}
                        </div>
                        <Button asChild className="w-full mt-3" variant="secondary">
                            <a href={resolveImagePath(upload.filePath)} download>
                                <Download className="mr-2 h-4 w-4"/> Download Original File
                            </a>
                        </Button>
                    </>
                ) : <p className="text-sm text-center text-muted-foreground py-8">No design file attached.</p> }
            </CardContent>
        </Card>
    );
}

function MyRequests() {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getClientVerifications().then(data => {
            setVerifications(data);
            setIsLoading(false);
        });
    }, []);

    const getDesignImage = (v: Verification) => {
        const design = v.design;
        const upload = v.upload;
        if(design?.thumbnailUrl) return resolveImagePath(design.thumbnailUrl);
        if(upload?.thumbnailPath) return resolveImagePath(upload.thumbnailPath);
        if(upload?.mimeType?.startsWith('image/')) return resolveImagePath(upload.filePath);
        return null;
    }

    if (isLoading) return <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (verifications.length === 0) return <Card><CardContent className="pt-6 text-center text-muted-foreground">You haven't submitted any designs for verification yet.</CardContent></Card>;

    return (
        <Card>
            <CardHeader><CardTitle>My Verification Requests</CardTitle></CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {verifications.map(v => (
                        <AccordionItem value={`item-${v.id}`} key={v.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full items-center pr-4">
                                    <div className="flex items-center gap-4 text-left">
                                         <div className="w-16 h-12 bg-muted rounded-md flex items-center justify-center">
                                            {getDesignImage(v) ? <Image src={getDesignImage(v)!} alt={v.title} width={64} height={48} className="object-contain" /> : <FileText />}
                                         </div>
                                        <div>
                                            <p className="font-semibold">{v.title}</p>
                                            <p className="text-sm text-muted-foreground">Submitted: {format(new Date(v.createdAt), 'PPP')}</p>
                                        </div>
                                    </div>
                                    <Badge variant={v.status === 'completed' ? 'default' : v.status === 'assigned' ? 'secondary' : 'outline'}>{v.status}</Badge>
                                </div>
                            </AccordionTrigger>
                             <AccordionContent className="pt-2 pb-4 space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                    <div>
                                        <h4 className="text-xs font-semibold text-muted-foreground">Your Notes:</h4>
                                        <p className="text-sm">{v.clientNotes || 'No notes provided.'}</p>
                                    </div>
                                    {v.freelancer && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-muted-foreground">Assigned to:</h4>
                                        <p className="text-sm">{v.freelancer.name}</p>
                                    </div>
                                    )}
                                    {v.status === 'completed' && v.freelancerFeedback && (
                                    <div className="pt-3 border-t">
                                        <h4 className="text-xs font-semibold text-muted-foreground">Freelancer Feedback:</h4>
                                        <p className="text-sm whitespace-pre-wrap">{v.freelancerFeedback}</p>
                                    </div>
                                    )}
                                </div>
                                <div className="grid md:grid-cols-1 gap-6">
                                    <div>
                                        <h4 className="text-xs font-semibold mb-2">Attached Design</h4>
                                        <DesignPreviewContent design={v.design} upload={v.upload} />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}

export default function ClientVerificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Design Verification</h1>
      </div>
      <Tabs defaultValue="submit">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit">Submit for Verification</TabsTrigger>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="pt-4">
            <VerificationForm />
        </TabsContent>
        <TabsContent value="requests" className="pt-4">
            <MyRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}
