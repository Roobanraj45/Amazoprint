'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export function MultiSelect({
  items,
  selected,
  onChange,
  placeholder,
}: {
  items: { id: number; name: string }[];
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-semibold h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs px-3.5"
        >
          <span className="truncate">
            {selected.length > 0
              ? `${selected.length} item${selected.length > 1 ? 's' : ''} selected (${selected
                  .map((id) => items.find((i) => i.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')})`
              : placeholder || 'Select options...'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] flex flex-col p-1.5 rounded-xl shadow-xl border-slate-200 dark:border-slate-800"
        align="start"
      >
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-1 space-y-1">
            {items.map((item) => (
              <DropdownMenuCheckboxItem
                key={item.id}
                checked={selected.includes(item.id)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(checked) => {
                  const newSelected = checked
                    ? [...selected, item.id]
                    : selected.filter((id) => id !== item.id);
                  onChange(newSelected);
                }}
                className="rounded-lg text-xs font-semibold py-2 cursor-pointer"
              >
                <span>{item.name}</span>
              </DropdownMenuCheckboxItem>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">No options available.</p>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
