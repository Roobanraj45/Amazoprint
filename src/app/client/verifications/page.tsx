'use client';

import { useState, useEffect, useTransition, useRef, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { getFreelancers, getFreelancerById } from '@/app/actions/contest-actions';
import { Loader2, ShieldCheck, FileText, UploadCloud, CheckCircle, Clock, Download, Pencil, Search, UserCheck, User, Mail, AlertCircle, Sparkles } from 'lucide-react';
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
import { resolveImagePath, cn } from '@/lib/utils';
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
  freelancerId: z.string().uuid().nullable().optional(),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;
const VERIFICATION_FEE = 500;
const DPI = 300;
const MM_TO_PX = DPI / 25.4;


function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const { toast } = useToast();

  const freelancerIdFromUrl = searchParams.get('freelancerId') || searchParams.get('designerId') || searchParams.get('designer');
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      freelancerId: freelancerIdFromUrl || null,
    }
  });
  
  const sourceType = watch('designSourceType');
  const sourceId = watch('sourceId');
  const selectedSource = sourceType === 'saved' ? designs.find(d => d.id === sourceId) : uploads.find(u => u.id === sourceId);

  const [assignmentType, setAssignmentType] = useState<'public' | 'direct'>(freelancerIdFromUrl ? 'direct' : 'public');
  const [selectedFreelancerObj, setSelectedFreelancerObj] = useState<any | null>(null);

  // Restore draft form fields from sessionStorage on mount
  useEffect(() => {
    const draft = sessionStorage.getItem('create_verification_form_draft');
    if (draft) {
      try {
        const values = JSON.parse(draft);
        if (values.title) setValue('title', values.title, { shouldValidate: true });
        if (values.designSourceType) {
          setValue('designSourceType', values.designSourceType, { shouldValidate: true });
          if (values.sourceId) setValue('sourceId', values.sourceId, { shouldValidate: true });
        }
        if (values.clientNotes) setValue('clientNotes', values.clientNotes, { shouldValidate: true });
        if (values.assignmentType) setAssignmentType(values.assignmentType);
      } catch (e) {
        console.error('Failed to restore verification draft:', e);
      }
      sessionStorage.removeItem('create_verification_form_draft');
    }
  }, [setValue]);

  // Load initial freelancer details if designer is passed in URL query params
  useEffect(() => {
    if (freelancerIdFromUrl) {
      setAssignmentType('direct');
      setValue('freelancerId', freelancerIdFromUrl, { shouldValidate: true });
      getFreelancerById(freelancerIdFromUrl)
        .then(freelancer => {
          if (freelancer) {
            setSelectedFreelancerObj(freelancer);
          }
        })
        .catch(console.error);
    }
  }, [freelancerIdFromUrl, setValue]);

  useEffect(() => {
    async function loadSources() {
      setDesigns(await getMyDesigns());
      setUploads(await getMyUploads());
    }
    loadSources();
  }, []);

  const handleBrowseDesigners = () => {
    const currentValues = {
      title: watch('title'),
      designSourceType: watch('designSourceType'),
      sourceId: watch('sourceId'),
      clientNotes: watch('clientNotes'),
      assignmentType: assignmentType,
    };
    sessionStorage.setItem('create_verification_form_draft', JSON.stringify(currentValues));

    const currentParams = new URLSearchParams(window.location.search);
    router.push(`/client/verifications/select-designer?${currentParams.toString()}`);
  };

  const onSubmit = (data: VerificationFormValues) => {
    if (assignmentType === 'direct' && !data.freelancerId) {
      toast({
        variant: 'destructive',
        title: 'Selection Required',
        description: 'Please select a designer to assign directly, or choose Post Publicly.',
      });
      return;
    }

    startTransition(async () => {
      try {
        await submitForVerification({
          ...data,
          freelancerId: assignmentType === 'direct' ? data.freelancerId : null,
        });
        toast({ title: 'Success!', description: 'Your design has been submitted for verification.' });
        router.push('/client/verifications');
        router.refresh();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  return (
    <Card className="border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="border-b border-border/40 bg-muted/10 pb-6 relative">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-indigo-600" />
          <CardTitle className="text-xl font-black tracking-tight">Submit a Design for Verification</CardTitle>
          <CardDescription className="font-medium text-sm text-muted-foreground">Get a professional opinion on your design's print-readiness, layout, and overall quality for a small fee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-xs font-bold text-foreground uppercase tracking-widest text-slate-400">Project Title</Label>
            <Input id="title" placeholder="e.g., Verification for My New Business Card" {...register('title')} className="h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs font-semibold placeholder:text-slate-400" />
            {errors.title && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.title.message}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold text-foreground uppercase tracking-widest text-slate-400">Design File Source</Label>
            <Controller
              name="designSourceType"
              control={control}
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                  <Label className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all hover:bg-slate-500/5",
                    field.value === 'saved' ? "border-primary bg-primary/5 shadow-inner" : "border-border/60"
                  )}>
                    <RadioGroupItem value="saved" className="sr-only" />
                    <FileText className={cn("h-5 w-5 transition-colors", field.value === 'saved' ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-bold">Use Saved Design</span>
                  </Label>
                  <Label className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all hover:bg-slate-500/5",
                    field.value === 'uploaded' ? "border-primary bg-primary/5 shadow-inner" : "border-border/60"
                  )}>
                    <RadioGroupItem value="uploaded" className="sr-only" />
                    <UploadCloud className={cn("h-5 w-5 transition-colors", field.value === 'uploaded' ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-bold">Use Uploaded File</span>
                  </Label>
                </RadioGroup>
              )}
            />
            {errors.designSourceType && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.designSourceType.message}</p>}
          </div>
          
          {sourceType && (
            <div className="space-y-3">
              <Label className="text-xs font-bold text-foreground uppercase tracking-widest text-slate-400">Select Design</Label>
              <Controller
                name="sourceId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs font-semibold">
                      <SelectValue placeholder={`Select a ${sourceType === 'saved' ? 'design' : 'file'}...`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-card shadow-lg p-1">
                        {sourceType === 'saved' && designs.map(d => <SelectItem key={d.id} value={String(d.id)} className="text-xs font-semibold py-1.5 rounded-lg">{d.name}</SelectItem>)}
                        {sourceType === 'uploaded' && uploads.map(u => <SelectItem key={u.id} value={String(u.id)} className="text-xs font-semibold py-1.5 rounded-lg">{u.originalFilename}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sourceId && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3.5 h-3.5" /> {errors.sourceId.message}</p>}
            </div>
          )}

          {/* Assignment Type Section */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-foreground uppercase tracking-widest text-slate-400">Assignment Method</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => {
                  setAssignmentType('public');
                  setValue('freelancerId', null);
                  setSelectedFreelancerObj(null);
                }}
                className={cn(
                  "p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between gap-3 bg-card/60 backdrop-blur-md",
                  assignmentType === 'public'
                    ? "border-emerald-500/30 bg-emerald-500/[0.02] shadow-md ring-2 ring-emerald-500/10"
                    : "border-border/60 hover:border-slate-400/50 hover:bg-slate-500/5"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  {assignmentType === 'public' && (
                    <Badge className="bg-emerald-500 text-white font-extrabold uppercase text-[8px] tracking-widest px-2 py-0.5">Active</Badge>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Post Publicly</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed mt-0.5">
                    Any certified freelancer can accept and review this job. Ideal for fast turnaround.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setAssignmentType('direct')}
                className={cn(
                  "p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between gap-3 bg-card/60 backdrop-blur-md",
                  assignmentType === 'direct'
                    ? "border-violet-500/30 bg-violet-500/[0.02] shadow-md ring-2 ring-violet-500/10"
                    : "border-border/60 hover:border-slate-400/50 hover:bg-slate-500/5"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  {assignmentType === 'direct' && (
                    <Badge className="bg-violet-600 text-white font-extrabold uppercase text-[8px] tracking-widest px-2 py-0.5">Active</Badge>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Assign Directly</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed mt-0.5">
                    Select a specific elite freelancer to review your design layout and requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {assignmentType === 'direct' && (
            <div className="space-y-3">
              <Label className="text-xs font-bold text-foreground uppercase tracking-widest text-slate-400">Assigned Designer</Label>
              <Controller
                name="freelancerId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3 relative">
                    {selectedFreelancerObj ? (
                      /* Selected Designer Summary Card */
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 shadow-inner gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-violet-500/20">
                            {selectedFreelancerObj.profileImage ? (
                              <img 
                                src={resolveImagePath(selectedFreelancerObj.profileImage)} 
                                alt={selectedFreelancerObj.name} 
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <User className="w-6 h-6 text-violet-500" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-foreground">{selectedFreelancerObj.name}</h4>
                              <Badge className="text-[9px] py-0 px-2.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold capitalize">
                                {selectedFreelancerObj.availabilityStatus || 'available'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold">
                              <span>{selectedFreelancerObj.experienceYears ?? 0} Yrs Exp</span>
                              <span>•</span>
                              <span>{selectedFreelancerObj.hourlyRate ? `₹${selectedFreelancerObj.hourlyRate}/hr` : 'Rate N/A'}</span>
                            </div>
                            {selectedFreelancerObj.skills && selectedFreelancerObj.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1.5">
                                {selectedFreelancerObj.skills.slice(0, 3).map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-[8px] py-0 px-2 font-extrabold uppercase shadow-sm bg-violet-500/10 text-violet-600 border border-violet-500/20">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              field.onChange(null);
                              setSelectedFreelancerObj(null);
                              setFreelancerSearch('');
                            }}
                            className="rounded-xl font-bold text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            Remove Designer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Browse Designers Trigger Button */
                      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-violet-500/20 bg-violet-500/[0.01] hover:bg-violet-500/[0.03] hover:border-violet-500/40 transition-all duration-300 gap-3 group text-center cursor-pointer" onClick={handleBrowseDesigners}>
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <Search className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-foreground">No Designer Selected</h5>
                          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed max-w-xs">
                            Browse our verified designer directory to handpick the perfect expert for this review.
                          </p>
                        </div>
                        <Button type="button" variant="outline" className="rounded-xl font-extrabold text-xs bg-background/80 hover:bg-violet-500/10 text-violet-600 border-violet-500/20 px-5 mt-1">
                          Browse Directory
                        </Button>
                      </div>
                    )}
                    {/* Keep value bound to react-hook-form */}
                    <input type="hidden" value={field.value || ""} />
                  </div>
                )}
              />
              {errors.freelancerId && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3" /> {errors.freelancerId.message}</p>}
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="clientNotes" className="text-xs font-bold text-foreground uppercase tracking-widest text-slate-400">Notes for the Freelancer (Optional)</Label>
            <Textarea id="clientNotes" placeholder="e.g., 'Please check if the colors are suitable for CMYK printing and if the text is readable.'" {...register('clientNotes')} className="rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs font-medium placeholder:text-slate-400" rows={4} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-6 border-t border-border/40 rounded-b-xl">
          <div className="text-lg font-black tracking-tight flex items-center gap-2">
            Verification Fee: <Badge variant="outline" className="bg-background text-primary font-black border-primary/20 text-lg px-3 py-1">₹{VERIFICATION_FEE}</Badge>
          </div>
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 px-8 py-6 rounded-xl transition-all duration-300">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay & Submit Request
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
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
                                     <div className="lg:col-span-2 p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-2xl space-y-6 shadow-sm">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-2"><Pencil className="w-3 h-3" /> Your Notes</h4>
                                            <p className="text-sm font-medium">{v.clientNotes || 'No notes provided.'}</p>
                                        </div>
                                        {v.freelancer && (
                                        <div className="pt-4 border-t border-border/40 space-y-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Assigned Reviewer</h4>
                                            <div className="flex items-center gap-2.5 bg-background/60 p-3 rounded-xl border border-border/50 w-fit shadow-xs">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-violet-500/20">
                                                    {v.freelancer.profileImage ? (
                                                        <img
                                                            src={resolveImagePath(v.freelancer.profileImage)}
                                                            alt={v.freelancer.name}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <User className="w-4 h-4 text-violet-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs font-black text-foreground">{v.freelancer.name}</p>
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

function ClientVerificationsContent() {
  return (
    <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8 relative overflow-hidden font-sans">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40 relative z-10">
            <div className="space-y-1">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Pro Services</Badge>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline text-slate-900 dark:text-white">Design Verification</h1>
                <p className="text-muted-foreground font-semibold">Ensure your files are print-ready before sending to production.</p>
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

export default function ClientVerificationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-2 font-bold">Loading Page...</p>
      </div>
    }>
      <ClientVerificationsContent />
    </Suspense>
  );
}
