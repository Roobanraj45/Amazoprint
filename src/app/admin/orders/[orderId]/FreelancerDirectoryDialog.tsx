'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Loader2, Search, User, ExternalLink, Globe,
    Coins, Sparkles, UserCheck, LayoutTemplate, X,
    SlidersHorizontal, ArrowUpDown, Award, Trophy, Star
} from 'lucide-react';
import { cn, resolveImagePath } from '@/lib/utils';
import { getFreelancers, getFreelancerById } from '@/app/actions/contest-actions';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Background, Guide } from '@/lib/types';

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

export interface FreelancerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  skills?: string[] | null;
  experienceYears?: number | null;
  hourlyRate?: number | null;
  portfolioUrl?: string | null;
  bio?: string | null;
  availabilityStatus?: string | null;
  designs?: {
    id: number;
    name: string;
    thumbnailUrl: string | null;
    productSlug: string;
    width: number;
    height: number;
    elements: any;
    background: any;
    guides?: any;
  }[] | null;
}

const COMMON_SKILLS = [
  { value: 'All', label: 'All Categories' },
  { value: 'logo', label: 'Logo Design' },
  { value: 'business', label: 'Business Cards' },
  { value: 'flyer', label: 'Flyers & Brochures' },
  { value: 'illustrat', label: 'Illustrations' },
  { value: 'branding', label: 'Branding & Identity' },
  { value: 'ui', label: 'UI/UX Design' }
];

interface FreelancerDirectoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFreelancer: (freelancer: FreelancerProfile) => void;
}

export function FreelancerDirectoryDialog({
  isOpen,
  onOpenChange,
  onSelectFreelancer
}: FreelancerDirectoryDialogProps) {
  // Search & Filter States
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [selectedRateLimit, setSelectedRateLimit] = useState('All');
  const [sortBy, setSortBy] = useState('exp-desc');

  // Loading & Data States
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogFreelancers, setCatalogFreelancers] = useState<FreelancerProfile[]>([]);
  const [selectedFreelancerForDetail, setSelectedFreelancerForDetail] = useState<FreelancerProfile | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load freelancers for the catalog from database based on search input
  useEffect(() => {
    if (!isOpen) return;
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const data = await getFreelancers(catalogSearch.trim() || undefined);
        setCatalogFreelancers(data as FreelancerProfile[]);
      } catch (error) {
        console.error("Error fetching catalog freelancers:", error);
      } finally {
        setLoadingCatalog(false);
      }
    };

    const timeout = setTimeout(fetchCatalog, catalogSearch ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [catalogSearch, isOpen]);

  // Apply Advanced Client-Side Filters & Sorting
  const filteredFreelancers = useMemo(() => {
    let result = [...catalogFreelancers];

    // 1. Skill Filter
    if (selectedSkill !== 'All') {
      result = result.filter(f => 
        f.skills?.some(skill => skill.toLowerCase().includes(selectedSkill.toLowerCase()))
      );
    }

    // 2. Experience Filter
    if (selectedExperience === 'entry') {
      result = result.filter(f => (f.experienceYears ?? 0) <= 2);
    } else if (selectedExperience === 'mid') {
      result = result.filter(f => (f.experienceYears ?? 0) >= 3 && (f.experienceYears ?? 0) <= 5);
    } else if (selectedExperience === 'senior') {
      result = result.filter(f => (f.experienceYears ?? 0) >= 6);
    }

    // 3. Hourly Rate Filter
    if (selectedRateLimit === 'under-100') {
      result = result.filter(f => (f.hourlyRate ?? 0) < 100);
    } else if (selectedRateLimit === '100-250') {
      result = result.filter(f => (f.hourlyRate ?? 0) >= 100 && (f.hourlyRate ?? 0) <= 250);
    } else if (selectedRateLimit === '250-plus') {
      result = result.filter(f => (f.hourlyRate ?? 0) > 250);
    }

    // 4. Sorting logic
    if (sortBy === 'exp-desc') {
      result.sort((a, b) => (b.experienceYears ?? 0) - (a.experienceYears ?? 0));
    } else if (sortBy === 'rate-asc') {
      result.sort((a, b) => (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0));
    } else if (sortBy === 'rate-desc') {
      result.sort((a, b) => (b.hourlyRate ?? 0) - (a.hourlyRate ?? 0));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [catalogFreelancers, selectedSkill, selectedExperience, selectedRateLimit, sortBy]);

  // Keep Detail View Synced with the Filtered Selections
  useEffect(() => {
    if (filteredFreelancers.length > 0) {
      if (!selectedFreelancerForDetail || !filteredFreelancers.some(f => f.id === selectedFreelancerForDetail.id)) {
        setSelectedFreelancerForDetail(filteredFreelancers[0]);
      }
    } else {
      setSelectedFreelancerForDetail(null);
    }
  }, [filteredFreelancers, selectedFreelancerForDetail]);

  // Load detailed profile and showcased designs when designer selection changes
  useEffect(() => {
    if (!selectedFreelancerForDetail || selectedFreelancerForDetail.designs) return;

    let active = true;
    setLoadingDetail(true);
    getFreelancerById(selectedFreelancerForDetail.id)
      .then(fullProfile => {
        if (active && fullProfile) {
          setSelectedFreelancerForDetail(fullProfile as FreelancerProfile);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [selectedFreelancerForDetail?.id]);

  const clearAllFilters = () => {
    setSelectedSkill('All');
    setSelectedExperience('All');
    setSelectedRateLimit('All');
    setSortBy('exp-desc');
    setCatalogSearch('');
  };

  const hasActiveFilters = catalogSearch || selectedSkill !== 'All' || selectedExperience !== 'All' || selectedRateLimit !== 'All';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl w-full h-[90vh] md:h-[85vh] p-0 overflow-hidden flex flex-col rounded-2xl bg-zinc-50 dark:bg-zinc-950">
        
        {/* Header section inside modal */}
        <div className="bg-card border-b border-border/40 p-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Select Freelance Reviewer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-semibold">
              Browse profiles, filters, and portfolio showcases of verified design auditors.
            </DialogDescription>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="p-4 border-b border-border/40 bg-card/60 backdrop-blur-md flex flex-col gap-3 px-5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Field */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search designers..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="h-9 pl-9 rounded-xl bg-background/80 border-border text-xs font-semibold placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Category Select */}
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-36 h-9 rounded-xl bg-background/80 text-[11px] font-bold border-border">
                <SlidersHorizontal className="w-3 h-3 mr-1 text-slate-400" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card p-1">
                {COMMON_SKILLS.map(skill => (
                  <SelectItem key={skill.value} value={skill.value} className="text-xs font-semibold py-1.5 rounded-lg">
                    {skill.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Experience Select */}
            <Select value={selectedExperience} onValueChange={setSelectedExperience}>
              <SelectTrigger className="w-32 h-9 rounded-xl bg-background/80 text-[11px] font-bold border-border">
                <Award className="w-3 h-3 mr-1 text-slate-400" />
                <SelectValue placeholder="All Exp" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card p-1">
                <SelectItem value="All" className="text-xs font-semibold py-1.5 rounded-lg">All Experience</SelectItem>
                <SelectItem value="entry" className="text-xs font-semibold py-1.5 rounded-lg">Entry (0-2 Yrs)</SelectItem>
                <SelectItem value="mid" className="text-xs font-semibold py-1.5 rounded-lg">Mid (3-5 Yrs)</SelectItem>
                <SelectItem value="senior" className="text-xs font-semibold py-1.5 rounded-lg">Senior (6+ Yrs)</SelectItem>
              </SelectContent>
            </Select>

            {/* Rate limit Select */}
            <Select value={selectedRateLimit} onValueChange={setSelectedRateLimit}>
              <SelectTrigger className="w-32 h-9 rounded-xl bg-background/80 text-[11px] font-bold border-border">
                <Coins className="w-3 h-3 mr-1 text-slate-400" />
                <SelectValue placeholder="All Rates" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card p-1">
                <SelectItem value="All" className="text-xs font-semibold py-1.5 rounded-lg">Any Rate</SelectItem>
                <SelectItem value="under-100" className="text-xs font-semibold py-1.5 rounded-lg">Under ₹100/hr</SelectItem>
                <SelectItem value="100-250" className="text-xs font-semibold py-1.5 rounded-lg">₹100 - ₹250/hr</SelectItem>
                <SelectItem value="250-plus" className="text-xs font-semibold py-1.5 rounded-lg">₹250+/hr</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Select */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 h-9 rounded-xl bg-background/80 text-[11px] font-bold border-border">
                <ArrowUpDown className="w-3 h-3 mr-1 text-slate-400" />
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card p-1">
                <SelectItem value="exp-desc" className="text-xs font-semibold py-1.5 rounded-lg">Highest Exp First</SelectItem>
                <SelectItem value="rate-asc" className="text-xs font-semibold py-1.5 rounded-lg">Rate: Low to High</SelectItem>
                <SelectItem value="rate-desc" className="text-xs font-semibold py-1.5 rounded-lg">Rate: High to Low</SelectItem>
                <SelectItem value="name-asc" className="text-xs font-semibold py-1.5 rounded-lg">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                onClick={clearAllFilters}
                className="text-[11px] font-bold hover:text-rose-500 rounded-xl h-9 px-2.5 flex items-center gap-1 transition-colors"
              >
                Reset Filters <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Layout columns */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left panel: List of Freelancers */}
          <div className="w-full md:w-1/2 overflow-y-auto border-r border-border/40 p-5 space-y-3">
            {loadingCatalog ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-card/60 animate-pulse border border-border/40" />
                ))}
              </div>
            ) : filteredFreelancers.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col justify-center items-center text-center p-6 space-y-2 bg-card/40 border border-dashed border-border/80 rounded-2xl">
                <User className="w-10 h-10 text-muted-foreground/30 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-foreground">No designers match filters</p>
                  <p className="text-[10px] text-muted-foreground font-semibold max-w-xs leading-relaxed">
                    Try adjusting criteria or search query.
                  </p>
                </div>
              </div>
            ) : (
              filteredFreelancers.map(freelancer => {
                const isSelected = selectedFreelancerForDetail?.id === freelancer.id;
                return (
                  <div
                    key={freelancer.id}
                    onClick={() => setSelectedFreelancerForDetail(freelancer)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-3 relative overflow-hidden bg-card hover:shadow-sm hover:scale-[1.005]",
                      isSelected
                        ? "border-primary bg-primary/[0.01] ring-1 ring-primary/10"
                        : "border-border/60 hover:border-slate-400/40"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-border/50 shadow-inner">
                      {freelancer.profileImage ? (
                        <Image
                          src={resolveImagePath(freelancer.profileImage)}
                          alt={freelancer.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-foreground truncate">{freelancer.name}</h4>
                        <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0 tracking-wider">
                          {freelancer.experienceYears ?? 0} Yrs Exp
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                          {freelancer.hourlyRate ? `₹${freelancer.hourlyRate}/hr` : 'Rate N/A'}
                        </span>
                        <Badge variant="outline" className="text-[8px] py-0 px-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold capitalize">
                          {freelancer.availabilityStatus || 'available'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right panel: Details view */}
          <div className="hidden md:flex w-1/2 flex-col bg-slate-50/20 dark:bg-zinc-900/10 overflow-y-auto p-5 border-l border-border/40">
            {selectedFreelancerForDetail ? (
              <div className="space-y-5 flex-1 flex flex-col justify-between h-full">
                <div className="space-y-5">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/20 shadow-md">
                      {selectedFreelancerForDetail.profileImage ? (
                        <Image
                          src={resolveImagePath(selectedFreelancerForDetail.profileImage)}
                          alt={selectedFreelancerForDetail.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-foreground">{selectedFreelancerForDetail.name}</h3>
                      <Badge className="text-[8px] py-0 px-1.5 bg-emerald-500/15 border-emerald-500/30 text-emerald-600 font-bold capitalize">
                        {selectedFreelancerForDetail.availabilityStatus || 'available'}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="bg-border/60" />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/10 text-[11px] font-bold">
                      <span className="text-[9px] text-violet-500 block uppercase">Experience Level</span>
                      {selectedFreelancerForDetail.experienceYears ?? 0} Years Exp
                    </div>
                    <div className="p-3 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/10 text-[11px] font-bold">
                      <span className="text-[9px] text-violet-500 block uppercase">Design Rate</span>
                      {selectedFreelancerForDetail.hourlyRate ? `₹${selectedFreelancerForDetail.hourlyRate}/hr` : 'Hourly Rate N/A'}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="p-3.5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-xl border border-indigo-500/10 space-y-1">
                    <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Biography / Summary
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold italic border-l-2 border-indigo-500/40 pl-2">
                      {selectedFreelancerForDetail.bio || '"No bio description available."'}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="p-3.5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-xl border border-indigo-500/10 space-y-1.5">
                    <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Expertise Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedFreelancerForDetail.skills && selectedFreelancerForDetail.skills.length > 0 ? (
                        selectedFreelancerForDetail.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[8px] py-0 px-2 font-extrabold uppercase bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No specific skills listed.</span>
                      )}
                    </div>
                  </div>

                  {/* Showcase designs */}
                  <div className="p-4 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-xl border border-violet-500/10 space-y-3">
                    <h4 className="text-[9px] font-black text-violet-500 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-violet-500 animate-pulse" /> Showcase Portfolio Designs
                    </h4>
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    ) : selectedFreelancerForDetail.designs && selectedFreelancerForDetail.designs.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {selectedFreelancerForDetail.designs.map((design) => {
                          const rawWidth = design.width || 300;
                          const rawHeight = design.height || 200;
                          const widthInPx = rawWidth > 600 ? rawWidth : Math.round(rawWidth * MM_TO_PX);
                          const heightInPx = rawHeight > 600 ? rawHeight : Math.round(rawHeight * MM_TO_PX);

                          const productForCanvas = {
                            id: design.productSlug || 'custom',
                            name: design.name || 'Untitled',
                            description: '',
                            imageId: '',
                            width: widthInPx,
                            height: heightInPx,
                            type: '',
                          };

                          let elements = [];
                          try {
                            elements = typeof design.elements === 'string' ? JSON.parse(design.elements) : (design.elements || []);
                          } catch (e) {
                            console.error(e);
                          }

                          let background = { type: 'solid', color: '#ffffff' };
                          try {
                            const rawBg = typeof design.background === 'string' ? JSON.parse(design.background) : (design.background || { type: 'solid', color: '#ffffff' });
                            background = Array.isArray(rawBg) ? rawBg[0] : rawBg;
                          } catch (e) {
                            console.error(e);
                          }

                          const baseSize = 1000;
                          const scale = Math.min(baseSize / widthInPx, (baseSize * 0.75) / heightInPx) * 0.95;

                          return (
                            <div key={design.id} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/85 bg-slate-100 dark:bg-zinc-900 flex items-center justify-center group/design select-none">
                              {design.thumbnailUrl ? (
                                <img 
                                  src={resolveImagePath(design.thumbnailUrl)} 
                                  alt={design.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 overflow-hidden">
                                  <div className="w-full h-full flex items-center justify-center scale-[0.12]">
                                    <div style={{ width: widthInPx * scale, height: heightInPx * scale, position: 'relative' }}>
                                      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: widthInPx, height: heightInPx, position: 'relative', overflow: 'hidden' }}>
                                        <DesignCanvas
                                          product={productForCanvas}
                                          elements={Array.isArray(elements) && Array.isArray(elements[0]) ? elements[0] : elements}
                                          background={background}
                                          selectedElementIds={[]}
                                          guides={design.guides as Guide[] || []}
                                          showRulers={false}
                                          showGrid={false}
                                          showPrintGuidelines={false}
                                          gridSize={20}
                                          bleed={0}
                                          safetyMargin={0}
                                          viewState={{ zoom: 1, pan: { x: 0, y: 0 } }}
                                          isPreview={true}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/design:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <p className="text-[9px] font-bold text-white truncate">{design.name}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/10 rounded-xl border border-dashed border-border/80">
                        <LayoutTemplate className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                        <p className="text-[10px] font-semibold">No designs showcased yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Selection Button */}
                <div className="pt-3 border-t border-border mt-auto">
                  <Button
                    type="button"
                    onClick={() => {
                      onSelectFreelancer(selectedFreelancerForDetail);
                      onOpenChange(false);
                    }}
                    className="w-full h-10 bg-primary hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-md text-xs gap-1 transition-all"
                  >
                    <UserCheck className="w-4 h-4" /> Select Freelancer Reviewer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-1">
                <User className="w-10 h-10 text-muted-foreground/25 animate-pulse" />
                <p className="text-xs font-extrabold text-muted-foreground">Select a freelancer to view profile details</p>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
