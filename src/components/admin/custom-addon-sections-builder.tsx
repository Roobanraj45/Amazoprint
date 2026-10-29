'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Layers, 
  CheckSquare, 
  CircleDot, 
  DollarSign, 
  FileText, 
  ImageIcon,
  PlusCircle,
  HelpCircle,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CustomAddonSectionItem = {
  id: string;
  name: string;
  price: number;
  pricingType: 'per_unit' | 'fixed';
  description?: string;
  imageUrl?: string;
  isDefault?: boolean;
};

export type CustomAddonSection = {
  id: string;
  title: string;
  selectionType: 'single' | 'multiple';
  isRequired?: boolean;
  items: CustomAddonSectionItem[];
};

interface CustomAddonSectionsBuilderProps {
  sections: CustomAddonSection[];
  onChange: (sections: CustomAddonSection[]) => void;
}

export function CustomAddonSectionsBuilder({
  sections = [],
  onChange,
}: CustomAddonSectionsBuilderProps) {

  const addSection = (presetTitle?: string, presetItems?: Array<{ name: string; price: number }>) => {
    const newSection: CustomAddonSection = {
      id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: presetTitle || 'Paper add on',
      selectionType: 'single',
      isRequired: false,
      items: presetItems ? presetItems.map((p, idx) => ({
        id: 'item_' + Date.now() + '_' + idx,
        name: p.name,
        price: p.price,
        pricingType: 'per_unit',
        description: '',
        imageUrl: '',
        isDefault: idx === 0,
      })) : [
        {
          id: 'item_' + Date.now() + '_1',
          name: 'Finished Paper',
          price: 0,
          pricingType: 'per_unit',
          description: 'Smooth coated finish',
          imageUrl: '',
          isDefault: true,
        },
        {
          id: 'item_' + Date.now() + '_2',
          name: 'Thick Paper',
          price: 25,
          pricingType: 'per_unit',
          description: 'Heavyweight premium card stock',
          imageUrl: '',
          isDefault: false,
        },
        {
          id: 'item_' + Date.now() + '_3',
          name: 'Plastic Paper',
          price: 50,
          pricingType: 'per_unit',
          description: 'Waterproof synthetic polymer substrate',
          imageUrl: '',
          isDefault: false,
        },
      ],
    };
    onChange([...sections, newSection]);
  };

  const removeSection = (secIndex: number) => {
    onChange(sections.filter((_, i) => i !== secIndex));
  };

  const updateSection = (secIndex: number, field: keyof CustomAddonSection, value: any) => {
    const updated = [...sections];
    updated[secIndex] = { ...updated[secIndex], [field]: value };
    onChange(updated);
  };

  const addItem = (secIndex: number) => {
    const updated = [...sections];
    const currentItems = updated[secIndex].items || [];
    updated[secIndex] = {
      ...updated[secIndex],
      items: [
        ...currentItems,
        {
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: '',
          price: 0,
          pricingType: 'per_unit',
          description: '',
          imageUrl: '',
          isDefault: false,
        },
      ],
    };
    onChange(updated);
  };

  const removeItem = (secIndex: number, itemIndex: number) => {
    const updated = [...sections];
    updated[secIndex] = {
      ...updated[secIndex],
      items: updated[secIndex].items.filter((_, i) => i !== itemIndex),
    };
    onChange(updated);
  };

  const updateItem = (secIndex: number, itemIndex: number, field: keyof CustomAddonSectionItem, value: any) => {
    const updated = [...sections];
    const items = [...updated[secIndex].items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    updated[secIndex] = { ...updated[secIndex], items };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-pink-500/10 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-pink-950/30 rounded-2xl border border-violet-200 dark:border-violet-900/50">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Custom Add-on Sections (Sub-product Level)
            </h3>
            <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30 px-2 py-0.5 font-bold">
              {sections.length} {sections.length === 1 ? 'Section' : 'Sections'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Create custom grouped add-on sections (e.g. &ldquo;Paper add on&rdquo; with Finished Paper, Thick Paper, Plastic Paper) with single or multiple item selection.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => addSection()}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-8 shadow-xs gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Section
        </Button>
      </div>

      {/* Empty State */}
      {sections.length === 0 && (
        <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600 dark:text-violet-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Custom Add-on Sections Configured</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Add custom section groups for this sub-product. Customers can choose from single-select radio options or multi-select add-ons with custom section titles on the start design page.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              onClick={() => addSection('Paper add on', [
                { name: 'Finished Paper', price: 0 },
                { name: 'Thick Paper', price: 25 },
                { name: 'Plastic Paper', price: 50 },
              ])}
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950"
            >
              <Plus className="w-3.5 h-3.5 text-violet-600" />
              Quick Add &ldquo;Paper add on&rdquo; Section
            </Button>
            <Button
              type="button"
              onClick={() => addSection('Lamination & Finishing', [
                { name: 'Matte Lamination', price: 15 },
                { name: 'Gloss Lamination', price: 15 },
                { name: 'Velvet Touch', price: 35 },
              ])}
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              Add &ldquo;Finishing&rdquo; Section
            </Button>
          </div>
        </div>
      )}

      {/* Sections List */}
      {sections.map((section, secIdx) => {
        const isSingle = section.selectionType === 'single';

        return (
          <div
            key={section.id || secIdx}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-violet-200/80 dark:border-violet-900/40 shadow-xs space-y-4 relative"
          >
            {/* Section Header Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Section Title Input */}
                <div className="sm:col-span-6 space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-violet-600" />
                    Section Title / Name
                  </Label>
                  <Input
                    type="text"
                    value={section.title}
                    placeholder="e.g. Paper add on, Lamination, Packaging..."
                    onChange={(e) => updateSection(secIdx, 'title', e.target.value)}
                    className="h-9 font-bold text-xs"
                  />
                </div>

                {/* Selection Mode */}
                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    {isSingle ? <CircleDot className="w-3.5 h-3.5 text-blue-600" /> : <CheckSquare className="w-3.5 h-3.5 text-purple-600" />}
                    Selection Mode
                  </Label>
                  <Select
                    value={section.selectionType || 'single'}
                    onValueChange={(val: 'single' | 'multiple') => updateSection(secIdx, 'selectionType', val)}
                  >
                    <SelectTrigger className="h-9 text-xs font-semibold">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Item (Radio)</SelectItem>
                      <SelectItem value="multiple">Multiple Selectable (Checkboxes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Required Selection Toggle */}
                <div className="sm:col-span-3 flex items-center gap-2 pt-4 sm:pt-5">
                  <Switch
                    checked={!!section.isRequired}
                    onCheckedChange={(checked) => updateSection(secIdx, 'isRequired', checked)}
                    id={`required-${section.id}`}
                  />
                  <Label
                    htmlFor={`required-${section.id}`}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Required Selection
                  </Label>
                </div>
              </div>

              {/* Delete Section Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection(secIdx)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 px-2.5 self-end lg:self-center shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove Section
              </Button>
            </div>

            {/* Items inside this section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-violet-500" />
                  Add-on Items ({section.items?.length || 0})
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  {isSingle ? 'Customer will choose at most one item from below' : 'Customer can select multiple items from below'}
                </span>
              </div>

              {/* Items Table/Cards */}
              <div className="space-y-2">
                {(section.items || []).map((item, itemIdx) => (
                  <div
                    key={item.id || itemIdx}
                    className="p-3 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    {/* Item Name */}
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Item Name
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Finished Paper"
                        value={item.name}
                        onChange={(e) => updateItem(secIdx, itemIdx, 'name', e.target.value)}
                        className="h-8 text-xs font-semibold bg-white dark:bg-slate-900"
                      />
                    </div>

                    {/* Price */}
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Price (₹)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={item.price}
                          onChange={(e) => updateItem(secIdx, itemIdx, 'price', parseFloat(e.target.value) || 0)}
                          className="h-8 pl-6 text-xs font-bold bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    {/* Pricing Type */}
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Pricing Type
                      </Label>
                      <Select
                        value={item.pricingType || 'per_unit'}
                        onValueChange={(val: 'per_unit' | 'fixed') => updateItem(secIdx, itemIdx, 'pricingType', val)}
                      >
                        <SelectTrigger className="h-8 text-xs font-medium bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Pricing Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_unit">Per Unit Rate (₹/pc)</SelectItem>
                          <SelectItem value="fixed">Fixed Flat Fee (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description or Image */}
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Short Description
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. 350 GSM matte"
                        value={item.description || ''}
                        onChange={(e) => updateItem(secIdx, itemIdx, 'description', e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-1 flex items-center justify-end pt-4 sm:pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(secIdx, itemIdx)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(secIdx)}
                className="text-xs font-semibold gap-1.5 h-8 border-dashed border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item to &ldquo;{section.title || 'Section'}&rdquo;
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
