import { getClientContests } from "@/app/actions/contest-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Users, Trophy, IndianRupee, Clock, Search, Filter } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ContestCardActions } from "./ContestCardActions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function ClientContestsPage() {
    const contests = await getClientContests();

    return (
        <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Quest Manager</Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Contests</h1>
                    <p className="text-muted-foreground font-medium">Manage your active design quests and pick winners.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {contests.length > 0 && (
                        <>
                            <div className="relative flex-1 md:w-64 hidden sm:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Search contests..." className="pl-9 bg-card border-border/50 focus-visible:ring-primary/20 rounded-xl" />
                            </div>
                            <Button variant="outline" className="bg-card border-border/50 rounded-xl px-4 hidden sm:flex">
                                <Filter className="w-4 h-4 mr-2" /> Filter
                            </Button>
                        </>
                    )}
                    <Button asChild className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20 group">
                        <Link href="/client/contests/create">
                            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" /> Launch Contest
                        </Link>
                    </Button>
                </div>
            </header>
            
            {contests.length === 0 ? (
                 <Card className="py-32 text-center border-dashed border-border/60 bg-muted/10 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                            <Trophy className="h-10 w-10 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black font-headline">No Quests Active</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">Ready to crowdsource the perfect design? Launch your first contest to our freelancer network.</p>
                        </div>
                        <Button asChild size="lg" className="rounded-xl shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white mt-4 font-bold tracking-widest uppercase text-xs">
                            <Link href="/client/contests/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Contest
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {contests.map(contest => {
                        const progressValue = (contest.participants.length / contest.maxFreelancers) * 100;
                        const isCompleted = contest.status === 'completed';
                        const timeRemaining = new Date() < new Date(contest.endDate) 
                            ? `${formatDistanceToNow(new Date(contest.endDate))} left` 
                            : 'Ended';

                        return (
                            <Card key={contest.id} className="flex flex-col border border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 hover:border-amber-500/30 hover:shadow-2xl transition-all duration-300 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <CardHeader className="bg-muted/10 border-b border-border/40 pb-6">
                                     <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="line-clamp-2 text-xl font-black tracking-tight">{contest.title}</CardTitle>
                                            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{contest.productName} - {contest.subProductName}</CardDescription>
                                        </div>
                                        <ContestCardActions contest={contest} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-4">
                                        <Badge variant={isCompleted ? 'default' : 'secondary'} className={`capitalize px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${isCompleted ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20'}`}>
                                            {contest.status}
                                        </Badge>
                                        <Badge variant="outline" className="bg-background font-bold text-[9px] uppercase tracking-widest flex items-center border-border/50">
                                            <IndianRupee className="w-3 h-3 mr-0.5" />{contest.prizeAmount}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-6 pt-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                            <span className="flex items-center gap-1.5"><Users size={14} className="text-primary"/> Submissions</span>
                                            <span className="font-black text-foreground">{contest.participants.length} / {contest.maxFreelancers}</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-amber-500" />
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/5 p-4 border-t border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {timeRemaining}</span>
                                    <span>Ends {format(new Date(contest.endDate), 'MMM d')}</span>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
