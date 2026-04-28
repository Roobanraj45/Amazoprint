'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { acceptVerificationJob, getAvailableVerificationJobs, getFreelancerVerifications, submitVerificationFeedback, uploadVerificationRevision } from '@/app/actions/verification-actions';
import { Loader2, FileText, Check, ShieldCheck, User, Download, Upload, Pencil, Sparkles, Filter, Search } from 'lucide-react';
import { format, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import Image from 'next/image';
import { resolveImagePath } from '@/lib/utils';
import Link from 'next/link';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Product, Background, Guide, RenderData } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type VerificationJob = Awaited<ReturnType<typeof getAvailableVerificationJobs>>[0];
type MyVerificationJob = Awaited<ReturnType<typeof getFreelancerVerifications>>[0];

const feedbackSchema = z.object({
  feedback: z.string().min(10, 'Feedback must be at least 10 characters.'),
});
type FeedbackFormValues = z.infer<typeof feedbackSchema>;

const DPI = 300;
const MM_TO_PX = DPI / 25.4;


function ProvideFeedbackDialog({ job, onComplete }: { job: MyVerificationJob, onComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const { register, handleSubmit, formState: { errors } } = useForm<FeedbackFormValues>();
    
    const onSubmit = (data: FeedbackFormValues) => {
        startTransition(async () => {
            try {
                await submitVerificationFeedback({id: job.id, feedback: data.feedback});
                toast({ title: 'Feedback submitted!' });
                onComplete();
                setIsOpen(false);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20">
                    <Check className="w-3 h-3 mr-2" /> Provide Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500"/> Submit Verification Feedback</DialogTitle>
                    <DialogDescription>Review the design and provide constructive feedback for the client.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedback" className="uppercase tracking-widest text-[10px] font-bold text-muted-foreground">Your Feedback</Label>
                        <Textarea id="feedback" {...register('feedback')} rows={6} className="bg-muted/50 focus-visible:ring-emerald-500/20 border-border/50 rounded-xl" placeholder="e.g., The logo resolution is too low for printing. Please provide a vector version..." />
                        {errors.feedback && <p className="text-xs text-destructive font-medium">{errors.feedback.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 uppercase tracking-widest text-[10px] font-bold">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Submit & Complete Job
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function UploadRevisionDialog({ verificationId, onComplete }: { verificationId: number, onComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('verificationId', String(verificationId));
        formData.append('file', file);
        startTransition(async () => {
            try {
                await uploadVerificationRevision(formData);
                toast({ title: 'Revision uploaded successfully!' });
                onComplete();
                setIsOpen(false);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2 font-bold uppercase tracking-widest text-[10px] bg-card border-border/50 hover:bg-muted">
                    <Upload className="mr-2 h-3 w-3"/>Upload Revision
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-blue-500"/> Upload Revised File</DialogTitle>
                    <DialogDescription>Upload the corrected or improved design file for this verification job.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="revision-file" className="uppercase tracking-widest text-[10px] font-bold text-muted-foreground">Revised Design File</Label>
                    <Input id="revision-file" type="file" className="bg-muted/50 rounded-xl border-border/50" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)} className="uppercase tracking-widest text-[10px] font-bold">Cancel</Button>
                    <Button onClick={handleUpload} disabled={isPending || !file} className="bg-blue-500 hover:bg-blue-600 uppercase tracking-widest text-[10px] font-bold">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function VerificationJobCard({ job, onAccept, onComplete }: { job: VerificationJob | MyVerificationJob, onAccept?: () => void, onComplete?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const handleAccept = () => {
    startTransition(async () => {
        try {
            await acceptVerificationJob(job.id);
            toast({ title: 'Job Accepted!', description: "The job has been moved to 'My Jobs'." });
            onAccept?.();
        } catch(error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    });
  };

  const handlePreviewDesign = (design: VerificationJob['design']) => {
    if (!design) return;
    try {
        const productForCanvas: Product = {
            id: design.productSlug, name: design.name, description: '', imageId: '',
            width: Math.round(Number(design.width) * MM_TO_PX),
            height: Math.round(Number(design.height) * MM_TO_PX), type: '',
        };
        const renderData: RenderData = {
            pages: Array.isArray(design.elements) && Array.isArray(design.elements[0]) 
                ? (design.elements as DesignElement[][]).map((els, i) => ({ elements: els, background: (design.background as Background[])[i] }))
                : [{ elements: design.elements as DesignElement[], background: design.background as Background }],
            product: productForCanvas, guides: design.guides as Guide[] || [], bleed: 18, safetyMargin: 18,
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
  
  const myJob = job as MyVerificationJob;
  const isCompleted = job.status === 'completed';
  const isAssigned = job.status === 'assigned';

  return (
    <Card className={cn(
        "flex flex-col h-full overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:-translate-y-1 transition-all duration-300 group",
        isCompleted ? "hover:border-emerald-500/30" : "hover:border-blue-500/30"
    )}>
      <CardHeader className="bg-muted/20 border-b border-border/40 pb-5">
        <div className="flex justify-between items-start gap-4 mb-3">
             <Badge className={cn(
                "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border",
                job.status === 'pending' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                job.status === 'assigned' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
             )}>
                {job.status}
             </Badge>
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Bounty</span>
                <span className="text-xl font-black text-foreground group-hover:text-blue-500 transition-colors">
                    ₹{job.verificationFee}
                </span>
             </div>
        </div>
        <CardTitle className="text-lg tracking-tight line-clamp-2">{job.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2">
             <User className="w-3 h-3" />
             <span className="text-xs font-medium">Client: {job.user.name}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow p-5 space-y-5">
        <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border/40">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-3 h-3" /> Source Material
            </h4>
            {job.design ? (
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreviewDesign(job.design)} className="font-bold uppercase tracking-widest text-[9px] bg-card hover:bg-muted"><Sparkles className="mr-2 h-3 w-3"/> Preview</Button>
                    <Button asChild variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[9px] bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"><Link href={`/design/${job.design.productSlug}?templateId=${job.design.id}&verificationId=${job.id}`}><Pencil className="mr-2 h-3 w-3"/> Edit</Link></Button>
                </div>
            ) : job.upload ? (
                <div className="space-y-2">
                    <a href={resolveImagePath(job.upload.filePath)} download target="_blank" rel="noopener noreferrer"><Button className="w-full font-bold uppercase tracking-widest text-[10px]" variant="outline" size="sm"><Download className="mr-2 h-3 w-3"/> Download File</Button></a>
                    {job.status === 'assigned' && <UploadRevisionDialog verificationId={job.id} onComplete={onComplete!} />}
                </div>
            ) : <p className="text-xs text-center text-muted-foreground py-2 font-medium">No design file attached.</p> }
        </div>

        <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Client Requirements</h4>
            <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                 <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">{job.clientNotes || 'Standard verification checks apply. Please ensure print readiness.'}</p>
            </div>
        </div>
        
        {job.status === 'completed' && job.freelancerFeedback && (
             <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5"><Check className="w-3 h-3"/> Your Feedback</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{job.freelancerFeedback}</p>
            </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/10 p-4 border-t border-border/40 flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {formatDistanceToNowStrict(new Date(job.createdAt), { addSuffix: true })}
        </span>
        {job.status === 'pending' && onAccept && (
          <Button onClick={handleAccept} disabled={isPending} className="bg-blue-500 hover:bg-blue-600 font-bold uppercase tracking-widest text-[10px]">
            {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <ShieldCheck className="mr-2 h-3 w-3" />}
            Accept Job
          </Button>
        )}
        {job.status === 'assigned' && onComplete && (
            <ProvideFeedbackDialog job={myJob} onComplete={onComplete} />
        )}
        {job.status === 'completed' && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-widest text-[10px]"><Check className="mr-1 h-3 w-3"/> Completed</Badge>
        )}
      </CardFooter>
    </Card>
  );
}


export default function FreelancerVerificationsPage() {
  const [availableJobs, setAvailableJobs] = useState<VerificationJob[]>([]);
  const [myJobs, setMyJobs] = useState<MyVerificationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [avail, assigned] = await Promise.all([
            getAvailableVerificationJobs(),
            getFreelancerVerifications(),
        ]);
        setAvailableJobs(avail);
        setMyJobs(assigned as MyVerificationJob[]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Quality Assurance</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">Verification Jobs</h1>
          <p className="text-muted-foreground font-medium">Review designs for print-readiness and earn rewards.</p>
        </div>
      </header>

      <Tabs defaultValue="available" className="w-full">
        <div className="flex justify-between items-center mb-6">
             <TabsList className="bg-muted/50 p-1 rounded-xl h-auto border border-border/40 w-full sm:w-auto">
                <TabsTrigger value="available" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-blue-500 data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-widest transition-all">Available Pool</TabsTrigger>
                <TabsTrigger value="my-jobs" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-emerald-500 data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-widest transition-all">My Work Queue</TabsTrigger>
            </TabsList>
            <div className="hidden sm:flex gap-3">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search jobs..." className="pl-9 bg-card border-border/50 focus-visible:ring-blue-500/20 rounded-xl" />
                </div>
            </div>
        </div>
       
        <TabsContent value="available" className="mt-0 focus-visible:outline-none">
            {isLoading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div> 
            : availableJobs.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableJobs.map(job => <VerificationJobCard key={job.id} job={job} onAccept={fetchData} />)}
                </div>
            ) : <Card className="border-dashed border-border/60 bg-muted/10 shadow-none py-20 text-center"><CardContent className="flex flex-col items-center space-y-4"><ShieldCheck className="w-12 h-12 text-muted-foreground/30" /><div className="space-y-1"><h3 className="text-xl font-black text-foreground">No Jobs Available</h3><p className="text-muted-foreground">Check back later for new verification tasks in the pool.</p></div></CardContent></Card>}
        </TabsContent>
        <TabsContent value="my-jobs" className="mt-0 focus-visible:outline-none">
            {isLoading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-500"/></div>
            : myJobs.length > 0 ? (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myJobs.map(job => <VerificationJobCard key={job.id} job={job} onComplete={() => fetchData()} />)}
                </div>
            ) : <Card className="border-dashed border-border/60 bg-muted/10 shadow-none py-20 text-center"><CardContent className="flex flex-col items-center space-y-4"><User className="w-12 h-12 text-muted-foreground/30" /><div className="space-y-1"><h3 className="text-xl font-black text-foreground">Your Queue is Empty</h3><p className="text-muted-foreground">Accept jobs from the available pool to start reviewing.</p></div></CardContent></Card>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
