'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { endContestEarly } from '@/app/actions/contest-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Loader2, TimerOff } from 'lucide-react';

export function EndContestButton({ contestId }: { contestId: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, startTransition] = useTransition();

  const handleEndContest = async () => {
    startTransition(async () => {
      try {
        await endContestEarly(contestId);
        toast({ title: 'Success', description: 'Contest has been ended. You can now declare a winner.' });
        router.refresh();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-secondary">
            <TimerOff className="mr-2 h-4 w-4" />
            <span>End Contest Now</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End Contest Early?</AlertDialogTitle>
          <AlertDialogDescription>
            This will end the submission period immediately. You will be able to proceed with declaring winners, but no new submissions will be accepted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Back</AlertDialogCancel>
          <AlertDialogAction onClick={handleEndContest} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, End Contest
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
