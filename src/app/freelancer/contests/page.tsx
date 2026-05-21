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
import { ContestSubmissionActions } from "@/components/contests/contest-submission-actions";

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
        <div className="flex flex-col gap-4">
          {joinedContests.map(({ contest, product, subProduct, user: client, participantsCount, winnerRank, designIds, templateIds }) => {
            const progressValue = (participantsCount / contest.maxFreelancers) * 100;
            const clientForSheet = {
              id: client.id,
              name: client.name,
              profileImage: client.profileImage
            };
            const isContestOpen = contest.status === 'active';

            return (
              <Card key={contest.id} className="flex flex-col md:flex-row items-start md:items-center justify-between group overflow-hidden transition-all duration-300 hover:shadow-xl border-border/40 bg-card/40 backdrop-blur-sm hover:border-amber-500/30 p-4 md:p-6 gap-6">
                 {/* LEFT: Info */}
                 <div className="flex-1 space-y-3">
                   <div className="flex flex-wrap items-center gap-3">
                     <Badge variant="outline" className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest", isContestOpen ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-muted text-muted-foreground border-border/50")}>
                        {contest.status}
                     </Badge>
                     {winnerRank > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                          <Trophy className="h-3 w-3" />
                          <span>Placed {winnerRank === 1 ? '1st' : winnerRank === 2 ? '2nd' : '3rd'}</span>
                        </div>
                     )}
                   </div>
                   <div>
                     <CardTitle className="text-xl tracking-tight leading-tight group-hover:text-amber-500 transition-colors line-clamp-1">
                       {contest.title}
                     </CardTitle>
                     <div className="flex flex-wrap items-center gap-2 mt-1.5">
                       <Badge variant="secondary" className="bg-background text-foreground text-[9px] font-bold uppercase tracking-widest border border-border/50">
                         {contest.productName}
                       </Badge>
                       <span className="text-xs font-medium text-muted-foreground truncate">{contest.subProductName}</span>
                     </div>
                   </div>
                 </div>

                 {/* MIDDLE: Stats */}
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto md:min-w-[300px]">
                   <div className="flex flex-col space-y-1">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bounty</span>
                     <div className="flex items-center text-xl font-black text-foreground group-hover:text-amber-500 transition-colors">
                       <IndianRupee className="h-4 w-4 mr-0.5 stroke-[3]" />
                       {contest.prizeAmount.toLocaleString('en-IN')}
                     </div>
                   </div>
                   
                   <div className="flex flex-col space-y-1">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</span>
                     <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                       <Calendar className="h-4 w-4 text-muted-foreground" />
                       <span>{formatDistanceToNowStrict(new Date(contest.endDate), { addSuffix: true })}</span>
                     </div>
                   </div>

                   <div className="flex flex-col space-y-1 w-full sm:w-32">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                       <span>Capacity</span>
                       <span className="text-foreground">{participantsCount}/{contest.maxFreelancers}</span>
                     </span>
                     <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted border border-border/50 mt-1">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-out" style={{ width: `${progressValue}%` }} />
                     </div>
                   </div>
                 </div>

                 {/* RIGHT: Actions */}
                 <div className="flex flex-row md:flex-col lg:flex-row items-center gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
                   {isContestOpen ? (
                     <div className="flex gap-2 w-full md:w-auto flex-1 md:flex-initial">
                       <ContestSubmissionActions
                         contestId={contest.id}
                         productSlug={product.slug}
                         subProductId={subProduct.id}
                         designIds={designIds ?? []}
                         templateIds={templateIds ?? []}
                         type="editor"
                       >
                         <Button className="w-full font-bold uppercase tracking-widest text-[10px] h-10 shadow-md group/btn bg-amber-500 hover:bg-amber-600 text-white px-4">
                           Editor
                         </Button>
                       </ContestSubmissionActions>
                       <ContestSubmissionActions
                         contestId={contest.id}
                         productSlug={product.slug}
                         subProductId={subProduct.id}
                         designIds={designIds ?? []}
                         templateIds={templateIds ?? []}
                         type="upload"
                       >
                         <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-[10px] h-10 shadow-md border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 px-4">
                           Upload
                         </Button>
                       </ContestSubmissionActions>
                     </div>
                   ) : (
                     <Button disabled variant="secondary" className="w-full md:w-auto uppercase text-[10px] font-bold tracking-widest px-4">
                       Closed
                     </Button>
                   )}
                   
                   <ConversationSheet contestId={contest.id} client={clientForSheet} freelancer={currentUser} currentUser={currentUser}>
                     <Button variant="outline" className="w-full md:w-auto bg-card hover:bg-muted border-border/50 h-10 font-bold uppercase tracking-widest text-xs px-4">
                       <MessageSquare className="mr-2 h-4 w-4" />
                       Comm Link
                     </Button>
                   </ConversationSheet>
                 </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}