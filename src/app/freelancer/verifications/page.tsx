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
import { Loader2, FileText, Check, ShieldCheck, User, Download, Upload, Pencil } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
                <Button>Provide Feedback</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Verification Feedback</DialogTitle>
                    <DialogDescription>Review the design and provide constructive feedback for the client.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedback">Your Feedback</Label>
                        <Textarea id="feedback" {...register('feedback')} rows={8} placeholder="e.g., The logo resolution is too low for printing. Please provide a vector version..." />
                        {errors.feedback && <p className="text-sm text-destructive">{errors.feedback.message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
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
                <Button variant="secondary" className="w-full mt-2"><Upload className="mr-2 h-4 w-4"/>Upload Revision</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Revised File</DialogTitle>
                    <DialogDescription>Upload the corrected or improved design file for this verification job.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="revision-file">Revised Design File</Label>
                    <Input id="revision-file" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={isPending || !file}>
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

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{job.title}</CardTitle>
        <CardDescription>From client: {job.user.name} &middot; Fee: <span className="font-bold text-primary">₹{job.verificationFee}</span></CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-xs font-semibold text-muted-foreground">Design for Verification</h4>
            {job.design ? (
                <>
                    <Button className="w-full" variant="outline" onClick={() => handlePreviewDesign(job.design)}><FileText className="mr-2 h-4 w-4"/> View Design</Button>
                    <Button className="w-full" asChild variant="secondary"><Link href={`/design/${job.design.productSlug}?templateId=${job.design.id}&verificationId=${job.id}`}><Pencil className="mr-2 h-4 w-4"/> Rework in Editor</Link></Button>
                </>
            ) : job.upload ? (
                <>
                    <a href={resolveImagePath(job.upload.filePath)} download target="_blank" rel="noopener noreferrer"><Button className="w-full" variant="outline"><Download className="mr-2 h-4 w-4"/> Download File</Button></a>
                    {job.status === 'assigned' && <UploadRevisionDialog verificationId={job.id} onComplete={onComplete!} />}
                </>
            ) : <p className="text-sm text-center text-muted-foreground py-4">No design file attached.</p> }
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-semibold mb-1">Client Notes:</h4>
            <p className="text-sm text-muted-foreground">{job.clientNotes || 'No notes provided.'}</p>
        </div>
        {job.status === 'completed' && job.freelancerFeedback && (
             <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="text-xs font-semibold mb-1 text-green-600 dark:text-green-400">Your Feedback:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.freelancerFeedback}</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
        {job.status === 'pending' && onAccept && (
          <Button onClick={handleAccept} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Accept Job
          </Button>
        )}
        {job.status === 'assigned' && onComplete && (
            <ProvideFeedbackDialog job={myJob} onComplete={onComplete} />
        )}
        {job.status === 'completed' && (
            <Badge variant="default"><Check className="mr-2 h-4 w-4"/> Completed</Badge>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Verification Jobs</h1>
      </div>
      <Tabs defaultValue="available">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Jobs</TabsTrigger>
            <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="pt-4">
            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin"/></div> 
            : availableJobs.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableJobs.map(job => <VerificationJobCard key={job.id} job={job} onAccept={fetchData} />)}
                </div>
            ) : <Card><CardContent className="pt-6 text-center text-muted-foreground">No verification jobs available right now. Check back later!</CardContent></Card>}
        </TabsContent>
        <TabsContent value="my-jobs" className="pt-4">
            {isLoading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin"/></div>
            : myJobs.length > 0 ? (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myJobs.map(job => <VerificationJobCard key={job.id} job={job} onComplete={() => fetchData()} />)}
                </div>
            ) : <Card><CardContent className="pt-6 text-center text-muted-foreground">You have not accepted any jobs yet.</CardContent></Card>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
