
import { getClientContests } from "@/app/actions/contest-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ContestCardActions } from "./ContestCardActions";
import { Badge } from "@/components/ui/badge";

export default async function ClientContestsPage() {
    const contests = await getClientContests();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Contests</h1>
                <Button asChild>
                    <Link href="/client/contests/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Contest
                    </Link>
                </Button>
            </div>
            
            {contests.length === 0 ? (
                 <Card className="py-20 text-center border-dashed">
                    <CardContent>
                        <h3 className="text-lg font-semibold">No Contests Yet</h3>
                        <p className="text-muted-foreground mt-2 mb-4">Ready to get the perfect design? Launch your first contest!</p>
                        <Button asChild>
                            <Link href="/client/contests/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Launch Contest
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contests.map(contest => {
                        const progressValue = (contest.participants.length / contest.maxFreelancers) * 100;
                        const isCompleted = contest.status === 'completed';
                        const timeRemaining = new Date() < new Date(contest.endDate) 
                            ? `${formatDistanceToNow(new Date(contest.endDate))} left` 
                            : 'Ended';

                        return (
                            <Card key={contest.id} className="flex flex-col">
                                <CardHeader>
                                     <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="line-clamp-2">{contest.title}</CardTitle>
                                            <CardDescription>{contest.productName} - {contest.subProductName}</CardDescription>
                                        </div>
                                        <ContestCardActions contest={contest} />
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Badge variant={isCompleted ? 'default' : 'secondary'}>{contest.status}</Badge>
                                        <Badge variant="outline">Prize: ₹{contest.prizeAmount}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4 text-sm">
                                    <div>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                                            <span className="flex items-center gap-1.5"><Users size={14}/> Participants</span>
                                            <span className="font-semibold text-foreground">{contest.participants.length} / {contest.maxFreelancers}</span>
                                        </div>
                                        <Progress value={progressValue} />
                                    </div>
                                </CardContent>
                                <CardFooter className="text-xs text-muted-foreground">
                                    Ends {format(new Date(contest.endDate), 'PPP')} ({timeRemaining})
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
