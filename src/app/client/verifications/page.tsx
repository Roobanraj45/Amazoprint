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
    <Card className="border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="border-b border-border/40 bg-muted/10 pb-6">
          <CardTitle className="text-xl font-black tracking-tight">Submit a Design for Verification</CardTitle>
          <CardDescription className="font-medium text-sm text-muted-foreground">Get a professional opinion on your design's print-readiness, layout, and overall quality for a small fee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="space-y-3">
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
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-6 border-t border-border/40 rounded-b-xl">
          <div className="text-lg font-black tracking-tight flex items-center gap-2">
            Verification Fee: <Badge variant="outline" className="bg-background text-primary font-black border-primary/20 text-lg px-3 py-1">₹{VERIFICATION_FEE}</Badge>
          </div>
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-lg shadow-primary/20 px-8 py-6 rounded-xl">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay & Submit Request
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
        <Card className="border border-border/40 bg-card/60 backdrop-blur-md shadow-sm mt-2 overflow-hidden">
            <CardContent className="p-0">
                {design ? (
                    <>
                        <div className="aspect-video bg-muted/50 border-b border-border/40 flex items-center justify-center overflow-hidden">
                            <div style={{ transform: `scale(${200 / (design.width * MM_TO_PX)})`, transformOrigin: 'center' }}>
                                <DesignCanvas 
                                    product={{ id: design.productSlug, name: design.name, description: '', imageId: '', width: design.width * MM_TO_PX, height: design.height * MM_TO_PX, type: '' }}
                                    elements={Array.isArray(design.elements[0]) ? design.elements[0] as DesignElement[] : design.elements as DesignElement[]}
                                    background={Array.isArray(design.background) ? design.background[0] as Background : design.background as Background}
                                    guides={[]} viewState={{ zoom: 1, pan: {x: 0, y: 0} }} showRulers={false} showGrid={false} showPrintGuidelines={false} bleed={0} safetyMargin={0}
                                />
                            </div>
                        </div>
                        <div className="p-3">
                            <Button className="w-full bg-background hover:bg-muted font-bold text-xs uppercase tracking-widest text-muted-foreground border border-border/50 shadow-sm" variant="outline" onClick={() => handlePreviewDesign(design)}>
                                <FileText className="mr-2 h-4 w-4 text-primary"/> View High-Res
                            </Button>
                        </div>
                    </>
                ) : upload ? (
                    <>
                        <div className="aspect-video bg-muted/50 border-b border-border/40 flex items-center justify-center p-4">
                            {imageUrl ? <Image src={imageUrl} alt="preview" width={200} height={112} className="object-contain drop-shadow-md" /> : <FileText className="h-16 w-16 text-muted-foreground/30" />}
                        </div>
                        <div className="p-3">
                            <Button asChild className="w-full bg-background hover:bg-muted font-bold text-xs uppercase tracking-widest text-muted-foreground border border-border/50 shadow-sm" variant="outline">
                                <a href={resolveImagePath(upload.filePath)} download>
                                    <Download className="mr-2 h-4 w-4 text-primary"/> Download Original
                                </a>
                            </Button>
                        </div>
                    </>
                ) : <div className="p-8"><p className="text-sm text-center text-muted-foreground font-medium">No design file attached.</p></div> }
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

    if (isLoading) return <div className="flex justify-center items-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>;
    if (verifications.length === 0) return <Card className="py-20 text-center border-dashed border-border/60 bg-muted/10 shadow-none"><CardContent className="pt-6"><div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><ShieldCheck className="h-8 w-8 text-primary" /></div><h3 className="text-xl font-black mb-2">No Requests</h3><p className="text-muted-foreground font-medium">You haven't submitted any designs for verification yet.</p></CardContent></Card>;

    return (
        <Card className="border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5">
            <CardHeader className="border-b border-border/40 bg-muted/10">
                <CardTitle className="text-xl font-black tracking-tight">Active & Past Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                    {verifications.map(v => (
                        <AccordionItem value={`item-${v.id}`} key={v.id} className="border-b border-border/40 last:border-0 group">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/20 transition-colors">
                                <div className="flex justify-between w-full items-center pr-4 gap-4">
                                    <div className="flex items-center gap-4 text-left">
                                         <div className="w-16 h-16 bg-muted/50 border border-border/50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-primary/30 transition-colors">
                                            {getDesignImage(v) ? <Image src={getDesignImage(v)!} alt={v.title} width={64} height={64} className="object-cover h-full w-full" /> : <FileText className="text-muted-foreground/30" />}
                                         </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-lg tracking-tight line-clamp-1">{v.title}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Submitted: {format(new Date(v.createdAt), 'MMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                    <Badge className={`capitalize px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                                        v.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                                        v.status === 'assigned' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 
                                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                    }`}>
                                        {v.status}
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                             <AccordionContent className="pt-0 pb-6 px-6">
                                <div className="grid lg:grid-cols-3 gap-6 pt-4 border-t border-border/40 mt-2">
                                    <div className="lg:col-span-2 p-6 bg-muted/10 border border-border/40 rounded-2xl space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2"><Pencil className="w-3 h-3" /> Your Notes</h4>
                                            <p className="text-sm font-medium">{v.clientNotes || 'No notes provided.'}</p>
                                        </div>
                                        {v.freelancer && (
                                        <div className="pt-4 border-t border-border/40">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Assigned Reviewer</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                                                    {v.freelancer.name.charAt(0)}
                                                </div>
                                                <p className="text-sm font-bold">{v.freelancer.name}</p>
                                            </div>
                                        </div>
                                        )}
                                        {v.status === 'completed' && v.freelancerFeedback && (
                                        <div className="pt-4 border-t border-border/40">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Final Report</h4>
                                            <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{v.freelancerFeedback}</p>
                                        </div>
                                        )}
                                    </div>
                                    <div className="lg:col-span-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">Attached Design</h4>
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
    <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
            <div className="space-y-1">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Pro Services</Badge>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">Design Verification</h1>
                <p className="text-muted-foreground font-medium">Ensure your files are print-ready before sending to production.</p>
            </div>
        </header>

      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/50 border border-border/40 rounded-xl mb-6">
            <TabsTrigger value="submit" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Submit Request</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">My Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VerificationForm />
        </TabsContent>
        <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MyRequests />
        </TabsContent>
      </Tabs>
    </div>
  );
}
