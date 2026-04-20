
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { declareContestWinners } from '@/app/actions/contest-actions';
import { useToast } from '@/hooks/use-toast';
import { Crown, Loader2, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

type WinnerSelection = {
  submissionId: number;
  freelancerId: string;
  rank: number;
};

export function DeclareWinnerDialog({ contest, submissions }) {
  const [open, setOpen] = useState(false);
  const [winners, setWinners] = useState<WinnerSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const ranks = [
    { value: 1, label: '1st Place', color: 'text-amber-500' },
    { value: 2, label: '2nd Place', color: 'text-slate-500' },
    { value: 3, label: '3rd Place', color: 'text-orange-700' },
  ];

  const handleRankChange = (submissionId: number, freelancerId: string, rank: string) => {
    const rankValue = rank ? parseInt(rank) : 0;

    setWinners(prev => {
      // Remove any existing winner with this new rank
      const filtered = prev.filter(w => w.rank !== rankValue);
      
      // Remove the current submission if it was ranked before
      const withoutCurrent = filtered.filter(w => w.submissionId !== submissionId);
      
      if (rankValue > 0) {
        // Add the new ranking
        return [...withoutCurrent, { submissionId, freelancerId, rank: rankValue }];
      }
      return withoutCurrent;
    });
  };

  const getSubmissionRank = (submissionId: number) => {
    return winners.find(w => w.submissionId === submissionId)?.rank || 0;
  };

  const handleSubmit = async () => {
    if (winners.length === 0) {
      toast({ variant: 'destructive', title: 'No winners selected', description: 'Please select at least one winner.' });
      return;
    }
    setIsLoading(true);
    try {
      await declareContestWinners(contest.id, winners);
      toast({ title: 'Success!', description: 'Winners have been declared and the contest is now closed.' });
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Crown className="mr-2 h-4 w-4" />
          Declare Winners
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Winners for "{contest.title}"</DialogTitle>
          <DialogDescription>
            Assign ranks to the submissions below. You can select up to 3 winners. This action will close the contest.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6">
          <div className="space-y-4">
            {submissions.map(participant => (
              <div key={participant.id} className="flex items-center gap-4 rounded-lg border p-3">
                <Avatar>
                  <AvatarImage src={participant.freelancer.profileImage || undefined} />
                  <AvatarFallback>{participant.freelancer.name?.charAt(0) || 'F'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{participant.freelancer.name}</p>
                  <p className="text-sm text-muted-foreground">Submission ID: {participant.submission.id}</p>
                </div>
                <Select
                  value={String(getSubmissionRank(participant.submission.id))}
                  onValueChange={(value) => handleRankChange(participant.submission.id, participant.freelancer.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select Rank..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Rank</SelectItem>
                    {ranks.map(r => (
                      <SelectItem
                        key={r.value}
                        value={String(r.value)}
                        disabled={winners.some(w => w.rank === r.value && w.submissionId !== participant.submission.id)}
                      >
                       <span className="flex items-center gap-2">
                        <Award size={14} className={r.color} /> {r.label}
                       </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalize Winners
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

