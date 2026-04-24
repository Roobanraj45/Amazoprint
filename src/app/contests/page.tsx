import Link from 'next/link';
import { getContests } from '@/app/actions/contest-actions';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { contestParticipants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { JoinButton } from './join-button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Users, Clock, ArrowRight, Sparkles, Wallet, Trophy } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export default async function ContestsPage() {
  const contestsData = await getContests();
  const session = await getSession();

  let userParticipations: { contestId: number }[] = [];
  if (session?.sub && session.role === 'freelancer') {
    userParticipations = await db.select({ contestId: contestParticipants.contestId }).from(contestParticipants).where(eq(contestParticipants.freelancerId, session.sub));
  }

  // Fixed summation logic to perform numeric addition instead of string concatenation
  const totalPrizePool = contestsData.reduce((acc, curr) => {
    const amount = parseFloat(curr.contest.prizeAmount || '0');
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <main className="flex-1 py-16 pt-32 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_70%)] pointer-events-none" />
      
      <div className="container px-4 max-w-7xl mx-auto relative">
        
        {/* Premium Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 shadow-sm">
              <Trophy className="w-3.5 h-3.5" />
              Elite Design Arena
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight font-headline text-slate-900 dark:text-white leading-tight">
              Active <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">Contests</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl font-medium leading-relaxed">
              Showcase your creative mastery, compete with global talent, and claim high-value bounties.
            </p>
          </div>
          
          <div className="hidden lg:flex flex-col items-end gap-2">
            <div className="px-6 py-4 rounded-3xl bg-white dark:bg-slate-900 border border-border/60 shadow-xl shadow-sky-500/5">
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Prize Pool</p>
              <p className="text-3xl font-black text-sky-600 tabular-nums">
                ₹{totalPrizePool.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Expansive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contestsData.map(({ contest, participantsCount }) => {
            const hasJoined = userParticipations.some(p => p.contestId === contest.id);
            const isFull = participantsCount >= contest.maxFreelancers;
            const progressValue = (participantsCount / contest.maxFreelancers) * 100;
            
            return (
              <Card key={contest.id} className="group flex flex-col h-full bg-white dark:bg-slate-900/40 border-border/50 hover:border-sky-500/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-center mb-6">
                    <Badge variant="secondary" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none">
                      {contest.productName}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       Verified Bounty
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold leading-tight group-hover:text-sky-600 transition-colors duration-300">
                    {contest.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-8 pt-0 space-y-8 flex-grow">
                  {/* Visual Prize Box */}
                  <div className="relative p-6 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-border/40 overflow-hidden group-hover:border-sky-500/30 transition-colors">
                    <div className="relative z-10">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Winning Prize</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white">₹{parseFloat(contest.prizeAmount || '0').toLocaleString('en-IN')}</p>
                    </div>
                    <Award className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-sky-500/5 group-hover:text-sky-500/10 transition-all duration-500 rotate-12" />
                  </div>

                  {/* Stats & Progress */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span>{formatDistanceToNowStrict(new Date(contest.endDate))} remaining</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>{participantsCount}/{contest.maxFreelancers}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Progress value={progressValue} className="h-2 bg-slate-100 dark:bg-slate-800" />
                        <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                            <span>Arena Fill Rate</span>
                            <span>{Math.round(progressValue)}%</span>
                        </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-8 pt-0 grid grid-cols-5 gap-3">
                  <Button asChild variant="outline" className="col-span-2 h-12 rounded-xl font-bold text-xs border-border/60 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Link href={`/contests/${contest.id}`}>View Intel</Link>
                  </Button>
                  <div className="col-span-3">
                    {session?.role === 'freelancer' ? (
                      <JoinButton contestId={contest.id} isFull={isFull} hasJoined={hasJoined} />
                    ) : (
                      <Button asChild className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xl shadow-sky-500/20 group-hover:scale-[1.02] transition-transform">
                        <Link href="/login" className="flex items-center justify-center gap-2">
                          Join & Earn <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {contestsData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold mb-2">The Arena is Quiet</h3>
            <p className="text-muted-foreground">New contests are currently being prepared. Check back soon.</p>
          </div>
        )}
      </div>
    </main>
  );
}
