import { getContestDetails } from "@/app/actions/contest-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Users, Clock, Calendar, CheckCircle2, ChevronLeft, Info, Wallet } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { getSession } from "@/lib/auth";
import Link from 'next/link';
import { JoinButton } from "../join-button";

export default async function ContestDetailsPage({ params }: { params: { contestId: string }}) {
    const contestId = parseInt(params.contestId);
    if (isNaN(contestId)) notFound();
    
    const data = await getContestDetails(contestId);
    if (!data) notFound();

    const { contest, product, subProduct, user, participantsCount, hasJoined } = data;
    const session = await getSession();

    const isFull = participantsCount >= contest.maxFreelancers;
    const progressValue = (participantsCount / contest.maxFreelancers) * 100;

    return (
        <main className="flex-1 py-8 pt-24 bg-gradient-to-b from-sky-50/50 to-white dark:from-slate-950 dark:to-background min-h-screen">
            <div className="container px-4 max-w-5xl mx-auto">
                {/* Breadcrumb / Back Link */}
                <Link href="/contests" className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-sky-600 mb-6 transition-colors uppercase tracking-widest">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Quests
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold uppercase text-[10px]">
                                    {contest.productName}
                                </Badge>
                                <span className="text-xs font-medium text-muted-foreground">Posted by {user.name}</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl leading-[1.1]">
                                {contest.title}
                            </h1>
                        </div>

                        <Card className="border-border/60 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/40 pb-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Info className="w-5 h-5 text-sky-500" /> Contest Brief
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {contest.description || 'The client has not provided a detailed description yet.'}
                                </p>
                            </CardContent>
                        </Card>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Card className="border-border/60 bg-white/50 dark:bg-slate-900/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Product Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm font-medium">
                                    <div className="flex justify-between"><span>Base Product:</span> <span className="text-foreground">{product.name}</span></div>
                                    <div className="flex justify-between"><span>Material:</span> <span className="text-foreground">{subProduct.name}</span></div>
                                </CardContent>
                            </Card>
                            <Card className="border-border/60 bg-white/50 dark:bg-slate-900/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Technical Specs</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm font-medium">
                                    <div className="flex justify-between"><span>Width:</span> <span className="text-foreground">{subProduct.width} mm</span></div>
                                    <div className="flex justify-between"><span>Height:</span> <span className="text-foreground">{subProduct.height} mm</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Action Sidebar (Right) */}
                    <div className="space-y-6">
                        <Card className="border-sky-500/20 shadow-xl shadow-sky-500/5 bg-white dark:bg-slate-900 overflow-hidden">
                            <div className="bg-sky-600 p-6 text-white">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Prize Bounty</p>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-4xl font-black">₹{contest.prizeAmount.toLocaleString('en-IN')}</h2>
                                    <Wallet className="w-8 h-8 opacity-40" />
                                </div>
                            </div>
                            
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground font-medium">
                                            <Clock className="w-4 h-4" /> Time Left
                                        </span>
                                        <span className="font-bold text-foreground">
                                            {formatDistanceToNowStrict(new Date(contest.endDate), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground font-medium">
                                            <Calendar className="w-4 h-4" /> End Date
                                        </span>
                                        <span className="font-bold text-foreground">
                                            {format(new Date(contest.endDate), 'MMM do, yyyy')}
                                        </span>
                                    </div>
                                    <div className="h-px bg-border/50 w-full" />
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-bold mb-1">
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="w-4 h-4" /> Capacity
                                            </span>
                                            <span className="text-foreground">{participantsCount} / {contest.maxFreelancers}</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2 bg-slate-100" />
                                        <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
                                            {isFull ? "Slots fully occupied" : `${contest.maxFreelancers - participantsCount} slots remaining`}
                                        </p>
                                    </div>
                                </div>

                                {session?.role === 'freelancer' ? (
                                    <JoinButton contestId={contest.id} isFull={isFull} hasJoined={hasJoined} />
                                ) : session?.role === 'user' ? (
                                    <Button asChild className="w-full h-12 font-bold" disabled>
                                        <Link href="#">Freelancers Only</Link>
                                    </Button>
                                ) : (
                                    <Button asChild className="w-full h-12 bg-sky-600 hover:bg-sky-700 font-bold shadow-lg shadow-sky-500/20">
                                        <Link href={`/login?redirect_url=/contests/${contest.id}`}>Login to Earn</Link>
                                    </Button>
                                )}
                                
                                <div className="flex items-center gap-2 justify-center py-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Guaranteed Payment</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tips Card */}
                        <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed border-border/100">
                            <CardContent className="p-4 flex items-start gap-3">
                                <Award className="w-5 h-5 text-amber-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold">Designer Tip</p>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Make sure to follow the dimensions exactly ({subProduct.width}x{subProduct.height}mm) to avoid disqualification.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}