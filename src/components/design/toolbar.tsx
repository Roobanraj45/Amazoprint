'use client';

import { Type } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

type ToolbarProps = {
  onAddElement: (type: 'text') => void;
};

export function Toolbar({ onAddElement }: ToolbarProps) {
  const tools = [
    {
      label: 'Text',
      icon: <Type />,
      action: () => onAddElement('text'),
    },
  ];

  return (
    <SidebarMenu>
      {tools.map((tool, index) => (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton
            onClick={tool.action}
            tooltip={tool.label}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
