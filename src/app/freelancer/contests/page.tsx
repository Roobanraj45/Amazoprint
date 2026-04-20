import { getJoinedContests } from "@/app/actions/contest-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, MessageSquare, Users, Trophy, Calendar, IndianRupee } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ConversationSheet } from "@/components/messaging/conversation-sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">My Contests</h1>
        <p className="text-muted-foreground">Manage your active participations and communications.</p>
      </div>

      {joinedContests.length === 0 ? (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-muted p-4 rounded-full">
              <Trophy className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold">No contests joined yet</p>
              <p className="text-muted-foreground">Browse open contests and start your first design.</p>
            </div>
            <Button asChild>
              <Link href="/contests">Browse Contests</Link>
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
              <Card key={contest.id} className="flex flex-col group overflow-hidden transition-all hover:shadow-md border-border/60">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <Badge 
                      variant={isContestOpen ? "outline" : "secondary"}
                      className={cn(isContestOpen ? "text-green-600 border-green-200 bg-green-50" : "bg-slate-100")}
                    >
                      {contest.status}
                    </Badge>
                    <div className="flex items-center text-sm font-bold text-primary">
                      <IndianRupee className="h-3 w-3 mr-0.5" />
                      {contest.prizeAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <CardTitle className="text-xl line-clamp-1 mt-3 group-hover:text-primary transition-colors">
                    {contest.title}
                  </CardTitle>
                  <CardDescription className="font-medium text-foreground/70">
                    {contest.productName} • {contest.subProductName}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow space-y-5">
                  {/* Winning Badge */}
                  {winnerRank > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold">
                      <Trophy className="h-4 w-4 shrink-0" />
                      <span>Placed {winnerRank === 1 ? '1st' : winnerRank === 2 ? '2nd' : '3rd'} Place</span>
                    </div>
                  )}

                  {/* Date & Meta Info */}
                  <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{isContestOpen ? 'Ends' : 'Ended'} {formatDistanceToNowStrict(new Date(contest.endDate), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Participation Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Capacity</span>
                      </div>
                      <span>{participantsCount} / {contest.maxFreelancers}</span>
                    </div>
                    <Progress value={progressValue} className="h-1.5" />
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/30 p-4 pt-4 flex flex-col sm:flex-row gap-2 border-t">
                  {isContestOpen ? (
                    <Button asChild className="w-full font-bold shadow-sm">
                      <Link href={`/design/${product.slug}?subProductId=${subProduct.id}&contestId=${contest.id}`}>
                        Start Designing <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled variant="secondary" className="w-full italic text-muted-foreground">
                      Submissions Closed
                    </Button>
                  )}
                  
                  <ConversationSheet
                    contestId={contest.id}
                    client={clientForSheet}
                    freelancer={currentUser}
                    currentUser={currentUser}
                  >
                    <Button variant="outline" className="w-full bg-background hover:bg-muted">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
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