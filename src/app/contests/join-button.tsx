'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { joinContest } from "@/app/actions/contest-actions";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";

export function JoinButton({ contestId, isFull, hasJoined }: { contestId: number; isFull: boolean; hasJoined: boolean }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    const result = await joinContest(contestId);
    if (result.success) {
      toast({ title: "Joined!", description: "Contest added to your workspace." });
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.error });
    }
    setIsLoading(false);
  };

  if (hasJoined) {
    return (
      <Button disabled className="w-full h-10 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs">
        Joined
      </Button>
    );
  }

  if (isFull) {
    return <Button disabled variant="ghost" className="w-full h-10 text-xs text-muted-foreground font-bold uppercase">Full</Button>;
  }

  return (
    <Button 
      onClick={handleJoin} 
      disabled={isLoading} 
      className="w-full h-10 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-lg shadow-sky-500/20"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <span className="flex items-center gap-1">Join Contest <ArrowRight className="w-3 h-3" /></span>
      )}
    </Button>
  );
}