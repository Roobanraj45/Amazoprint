import { getAdminContests } from "@/app/actions/contest-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Eye, Users, IndianRupee, Calendar } from "lucide-react";

export default async function AdminContestsPage() {
    const contests = await getAdminContests();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Manage Contests</h1>

            <div className="space-y-4">
                {contests.map((contest) => (
                    <Card key={contest.id}>
                        <CardHeader>
                             <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{contest.title}</CardTitle>
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                    <Link href={`/admin/contests/${contest.id}`}>
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            <CardDescription>Created by {contest.user.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs font-semibold">Status</p>
                                    <Badge variant={contest.status === 'completed' ? 'default' : 'secondary'} className="mt-1">{contest.status}</Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-semibold flex items-center gap-1"><IndianRupee size={12}/> Prize</p>
                                    <p className="font-medium">₹{contest.prizeAmount}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-semibold flex items-center gap-1"><Users size={12}/> Participants</p>
                                    <p className="font-medium">{contest.participants.length} / {contest.maxFreelancers}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-semibold flex items-center gap-1"><Calendar size={12}/> End Date</p>
                                    <p className="font-medium">{format(new Date(contest.endDate), 'PPP')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
