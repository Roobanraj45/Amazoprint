'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye } from 'lucide-react';

type ContestCardActionsProps = {
  contest: {
    id: number;
    status: string;
    endDate: Date;
  }
};

export function ContestCardActions({ contest }: ContestCardActionsProps) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Contest Options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/client/contests/${contest.id}`}>
            <Eye className="mr-2 h-4 w-4 fill-current" />
            <span>View Details</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
