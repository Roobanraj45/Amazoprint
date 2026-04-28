import { getJoinedContests } from "@/app/actions/contest-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, MessageSquare, Users, Trophy, Calendar, IndianRupee, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ConversationSheet } from "@/components/messaging/conversation-sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default async function MyContestsPage() {
  const session = await getSession();
  if (!session?.sub) {
    notFound();
  }
  const joinedContests = await getJoinedContests();

  const currentUser = {
    id: session.sub,
    name: session.name,
    profileImage: null,
  };

  return (
    <div className="min-h-full p-4 md:p-8 lg:p-10 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 mb-2 uppercase text-[10px] tracking-widest font-bold">Quest Manager</Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight font-headline">My Contests</h1>
          <p className="text-muted-foreground font-medium">Manage your active participations and communications.</p>
        </div>
        {joinedContests.length > 0 && (
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search contests..." className="pl-9 bg-card border-border/50 focus-visible:ring-primary/20 rounded-xl" />
            </div>
            <Button variant="outline" className="bg-card border-border/50 rounded-xl px-4">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        )}
      </header>

      {joinedContests.length === 0 ? (
        <Card className="py-32 text-center border-dashed border-border/60 bg-muted/10 shadow-none">
          <CardContent className="flex flex-col items-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
              <Trophy className="h-10 w-10 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black font-headline">No Quests Joined Yet</h3>
              <p className="text-muted-foreground font-medium max-w-sm mx-auto">Browse open design briefs and start competing for industrial print contracts.</p>
            </div>
            <Button asChild size="lg" className="rounded-xl shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 mt-4 font-bold tracking-widest uppercase text-xs">
              <Link href="/contests">
                <Trophy className="mr-2 h-4 w-4" />
                Browse Quests
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {joinedContests.map(({ contest, product, subProduct, user: client, participantsCount, winnerRank }) => {
            const progressValue = (participantsCount / contest.maxFreelancers) * 100;
            const clientForSheet = {
              id: client.id,
              name: client.name,
              profileImage: client.profileImage
            };
            const isContestOpen = contest.status === 'active';

            return (
              <Card key={contest.id} className="flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-2xl border-border/40 bg-card/40 backdrop-blur-sm hover:border-amber-500/30">
                <CardHeader className="bg-muted/20 border-b border-border/40 pb-5">
                  <div className="flex justify-between items-start gap-2">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        isContestOpen ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-muted text-muted-foreground border-border/50"
                      )}
                    >
                      {contest.status}
                    </Badge>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Bounty</span>
                      <div className="flex items-center text-lg font-black text-foreground group-hover:text-amber-500 transition-colors">
                        <IndianRupee className="h-4 w-4 mr-0.5 stroke-[3]" />
                        {contest.prizeAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <CardTitle className="text-xl tracking-tight leading-tight group-hover:text-amber-500 transition-colors line-clamp-2">
                      {contest.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-background text-foreground text-[9px] font-bold uppercase tracking-widest border border-border/50">
                        {contest.productName}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground truncate">{contest.subProductName}</span>
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow p-6 space-y-6">
                  {/* Winning Badge */}
                  {winnerRank > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-black uppercase tracking-widest">
                      <div className="p-1.5 rounded-full bg-amber-500/20">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <span>Placed {winnerRank === 1 ? '1st' : winnerRank === 2 ? '2nd' : '3rd'} Place</span>
                    </div>
                  )}

                  {/* Date & Meta Info */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <div className="p-2 rounded-lg bg-muted border border-border/50">
                      <Calendar className="h-4 w-4 text-foreground" />
                    </div>
                    <span>{isContestOpen ? 'Ends' : 'Ended'} <span className="text-foreground font-bold">{formatDistanceToNowStrict(new Date(contest.endDate), { addSuffix: true })}</span></span>
                  </div>

                  {/* Participation Progress */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>Squad Capacity</span>
                      </div>
                      <span className="text-foreground">{participantsCount} / {contest.maxFreelancers}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted border border-border/50">
                        <div 
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out"
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/10 p-4 border-t border-border/40 flex flex-col sm:flex-row gap-3">
                  {isContestOpen ? (
                    <Button asChild className="w-full font-bold uppercase tracking-widest text-xs h-10 shadow-md group/btn bg-amber-500 hover:bg-amber-600 text-white">
                      <Link href={`/design/${product.slug}?subProductId=${subProduct.id}&contestId=${contest.id}`}>
                        Resume Design <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled variant="secondary" className="w-full uppercase text-[10px] font-bold tracking-widest">
                      Submissions Closed
                    </Button>
                  )}
                  
                  <ConversationSheet
                    contestId={contest.id}
                    client={clientForSheet}
                    freelancer={currentUser}
                    currentUser={currentUser}
                  >
                    <Button variant="outline" className="w-full bg-card hover:bg-muted border-border/50 h-10 font-bold uppercase tracking-widest text-xs">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Comm Link
                    </Button>
                  </ConversationSheet>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}