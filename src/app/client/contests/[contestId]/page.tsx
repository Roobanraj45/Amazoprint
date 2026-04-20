import { getContestWithSubmissions } from "@/app/actions/contest-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { SubmissionPreview } from "./submission-preview";
import { getSession } from "@/lib/auth";
import { DeclareWinnerDialog } from "./DeclareWinnerDialog";
import { Trophy } from "lucide-react";


export default async function ClientContestDetailsPage({ params }: { params: { contestId: string }}) {
    const contestId = parseInt(params.contestId);
    if (isNaN(contestId)) {
        notFound();
    }
    
    const session = await getSession();
    if (!session) {
        notFound();
    }

    const contest = await getContestWithSubmissions(contestId);
    
    if (!contest) {
        notFound();
    }

    const submittedEntries = contest.participants.filter(p => p.status === 'submitted' && p.submission);

    const canDeclareWinners = contest.status === 'active';
    const isCompleted = contest.status === 'completed';
    const winnersMap = new Map((contest.winners || []).map(w => [w.freelancerId, w.rank]));


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{contest.title}</CardTitle>
                            <CardDescription>{contest.productName} - {contest.subProductName}</CardDescription>
                            <div className="flex flex-wrap gap-4 text-sm pt-2">
                                <Badge variant={isCompleted ? 'default' : 'secondary'}>Status: {contest.status}</Badge>
                                <Badge>Prize: ₹{contest.prizeAmount}</Badge>
                                <Badge>Ends: {format(new Date(contest.endDate), 'PPP')}</Badge>
                            </div>
                        </div>
                        {canDeclareWinners && <DeclareWinnerDialog contest={contest} submissions={submittedEntries} />}
                    </div>
                </CardHeader>
            </Card>

             {isCompleted && contest.winners && contest.winners.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Winners</h2>
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {contest.winners.map(winner => (
                                <div key={winner.id} className="flex items-center gap-4 rounded-lg border p-3">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-400/10 text-amber-500">
                                        <Trophy size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg">{winner.rank === 1 ? '1st' : winner.rank === 2 ? '2nd' : '3rd'} Place</p>
                                        <p className="text-muted-foreground">{winner.freelancer.name}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}


            <div className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Submissions ({submittedEntries.length})</h2>
                {submittedEntries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submittedEntries.map(participant => {
                            const rank = winnersMap.get(participant.freelancer.id) || 0;
                            return (
                                <SubmissionPreview 
                                    key={participant.id} 
                                    contestId={contest.id}
                                    submission={participant.submission} 
                                    freelancer={participant.freelancer} 
                                    client={contest.user}
                                    currentUser={session}
                                    rank={rank}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            No submissions yet.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
