'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Loader2, Search, User, Mail, Phone, ExternalLink, Globe,
    Briefcase, Coins, Sparkles, UserCheck, LayoutTemplate, ArrowLeft, X,
    SlidersHorizontal, ArrowUpDown, Award, Trophy, Star
} from 'lucide-react';
import { cn, resolveImagePath } from '@/lib/utils';
import { getFreelancers, getFreelancerById } from '@/app/actions/contest-actions';
import { DesignCanvas } from '@/components/design/design-canvas';
import type { DesignElement, Background, Guide } from '@/lib/types';
import type { Product as DesignProduct } from '@/lib/types';

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

export default function SelectDesignerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

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
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load freelancers for the catalog from database based on search input
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const data = await getFreelancers(catalogSearch.trim() || undefined);
        setCatalogFreelancers(data);
      } catch (error) {
        console.error("Error fetching catalog freelancers:", error);
      } finally {
        setLoadingCatalog(false);
      }
    };

    const timeout = setTimeout(fetchCatalog, catalogSearch ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [catalogSearch]);

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
          setSelectedFreelancerForDetail(fullProfile);
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

  const handleSelectDesigner = (designerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('freelancerId', designerId);
    
    toast({ title: 'Designer Assigned', description: 'Redirecting back to finalize contest creation.' });
    router.push(`/client/contests/create?${params.toString()}`);
  };

  const handleCancelSelection = () => {
    router.push(`/client/contests/create?${searchParams.toString()}`);
  };

  const clearAllFilters = () => {
    setSelectedSkill('All');
    setSelectedExperience('All');
    setSelectedRateLimit('All');
    setSortBy('exp-desc');
    setCatalogSearch('');
  };

  const hasActiveFilters = catalogSearch || selectedSkill !== 'All' || selectedExperience !== 'All' || selectedRateLimit !== 'All';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden font-sans">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Directory Page Header */}
        <div className="bg-card border-b border-border/40 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <button onClick={handleCancelSelection} className="hover:text-primary transition-colors flex items-center gap-1 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Contest Form
                    </button>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Select Elite Designer
                </h1>
                <p className="text-xs text-muted-foreground font-semibold">
                    Browse our directory of top freelancers, inspect portfolio designs, and hire a design champion.
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleCancelSelection} className="rounded-xl font-bold text-xs h-10 px-4">
                    Cancel Selection
                </Button>
            </div>
        </div>

        {/* Filter Controls Row */}
        <div className="p-4 border-b border-border/40 bg-card/60 backdrop-blur-md flex flex-col gap-4 px-6 relative z-10">
            {/* Row 1: Search and select filters */}
            <div className="flex flex-wrap items-center gap-3">
                
                {/* Search Field */}
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search designers..."
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        className="h-10 pl-10 rounded-xl bg-background/80 border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-primary/20 focus-visible:border-primary/50"
                    />
                </div>

                {/* Filter indicator */}
                <div className="h-8 w-[1px] bg-border/50 hidden md:block" />

                {/* Skills Dropdown */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden sm:inline">Category</span>
                    <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                        <SelectTrigger className="w-40 h-10 rounded-xl bg-background/80 text-xs font-bold border-border focus:ring-primary/20">
                            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border bg-card shadow-lg p-1">
                            {COMMON_SKILLS.map(skill => (
                                <SelectItem key={skill.value} value={skill.value} className="text-xs font-semibold py-1.5 rounded-lg">
                                    {skill.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Experience Dropdown */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden sm:inline">Experience</span>
                    <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                        <SelectTrigger className="w-36 h-10 rounded-xl bg-background/80 text-xs font-bold border-border focus:ring-primary/20">
                            <Award className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <SelectValue placeholder="All Exp" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border bg-card shadow-lg p-1">
                            <SelectItem value="All" className="text-xs font-semibold py-1.5 rounded-lg">All Experience</SelectItem>
                            <SelectItem value="entry" className="text-xs font-semibold py-1.5 rounded-lg">Entry (0-2 Yrs)</SelectItem>
                            <SelectItem value="mid" className="text-xs font-semibold py-1.5 rounded-lg">Mid (3-5 Yrs)</SelectItem>
                            <SelectItem value="senior" className="text-xs font-semibold py-1.5 rounded-lg">Senior (6+ Yrs)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Rates Dropdown */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden sm:inline">Rate Limit</span>
                    <Select value={selectedRateLimit} onValueChange={setSelectedRateLimit}>
                        <SelectTrigger className="w-36 h-10 rounded-xl bg-background/80 text-xs font-bold border-border focus:ring-primary/20">
                            <Coins className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <SelectValue placeholder="All Rates" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border bg-card shadow-lg p-1">
                            <SelectItem value="All" className="text-xs font-semibold py-1.5 rounded-lg">Any Rate</SelectItem>
                            <SelectItem value="under-100" className="text-xs font-semibold py-1.5 rounded-lg">Under ₹100/hr</SelectItem>
                            <SelectItem value="100-250" className="text-xs font-semibold py-1.5 rounded-lg">₹100 - ₹250/hr</SelectItem>
                            <SelectItem value="250-plus" className="text-xs font-semibold py-1.5 rounded-lg">₹250+/hr</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden sm:inline">Sort By</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-36 h-10 rounded-xl bg-background/80 text-xs font-bold border-border focus:ring-primary/20">
                            <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <SelectValue placeholder="Sort Order" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border bg-card shadow-lg p-1">
                            <SelectItem value="exp-desc" className="text-xs font-semibold py-1.5 rounded-lg">Highest Exp First</SelectItem>
                            <SelectItem value="rate-asc" className="text-xs font-semibold py-1.5 rounded-lg">Rate: Low to High</SelectItem>
                            <SelectItem value="rate-desc" className="text-xs font-semibold py-1.5 rounded-lg">Rate: High to Low</SelectItem>
                            <SelectItem value="name-asc" className="text-xs font-semibold py-1.5 rounded-lg">Name (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {hasActiveFilters && (
                    <Button 
                        variant="ghost" 
                        onClick={clearAllFilters}
                        className="text-xs font-bold hover:text-rose-500 rounded-xl h-10 px-3 flex items-center gap-1 transition-colors ml-auto md:ml-0"
                    >
                        Reset Filters <X className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>

            {/* Row 2: Category tag list */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/30">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mr-2">Quick Category:</span>
                {COMMON_SKILLS.map(skill => {
                    const isSelected = selectedSkill === skill.value;
                    return (
                        <button
                            key={skill.value}
                            onClick={() => setSelectedSkill(skill.value)}
                            className={cn(
                                "text-[10px] font-extrabold uppercase px-3.5 py-1.5 rounded-full border transition-all shadow-sm",
                                isSelected
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white hover:scale-[1.02]"
                                    : "bg-background hover:bg-slate-100 hover:border-slate-300 border-border/60 text-slate-500 hover:text-slate-800 dark:hover:bg-zinc-900 dark:hover:text-white"
                            )}
                        >
                            {skill.label}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Core Layout Grid */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
            
            {/* Left Column: List of Designers */}
            <div className="w-full md:w-1/2 overflow-y-auto border-r border-border/40 p-6 space-y-4">
                
                {/* Result count indicator */}
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pb-2 px-1">
                    <span>Found {filteredFreelancers.length} designers matching criteria</span>
                    {hasActiveFilters && (
                        <span className="text-primary font-black uppercase text-[10px] tracking-wide">Filters Applied</span>
                    )}
                </div>

                {loadingCatalog ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-28 rounded-3xl bg-card/60 animate-pulse border border-border/40" />
                    ))}
                  </div>
                ) : filteredFreelancers.length === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col justify-center items-center text-center p-8 space-y-3 bg-card/40 border border-dashed border-border/80 rounded-3xl">
                    <User className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                    <div className="space-y-1">
                        <p className="text-sm font-extrabold text-foreground">No designers match filters</p>
                        <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed">
                            Try adjusting your category, rate limits, or clear search queries to view all directory profiles.
                        </p>
                    </div>
                    <Button variant="outline" onClick={clearAllFilters} className="rounded-xl font-bold text-xs">
                        Clear Filters
                    </Button>
                  </div>
                ) : (
                  filteredFreelancers.map(freelancer => {
                    const isSelected = selectedFreelancerForDetail?.id === freelancer.id;
                    return (
                      <div
                        key={freelancer.id}
                        onClick={() => {
                          setSelectedFreelancerForDetail(freelancer);
                          setShowMobileDetail(true);
                        }}
                        className={cn(
                          "p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex gap-4 relative overflow-hidden bg-card hover:shadow-md hover:scale-[1.005]",
                          isSelected
                            ? "border-primary bg-primary/[0.02] shadow-sm ring-2 ring-primary/10"
                            : "border-border/60 hover:border-slate-400/50"
                        )}
                      >
                        {isSelected && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary animate-pulse" />}
                        
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-border/50 shadow-inner">
                          {freelancer.profileImage ? (
                            <Image
                              src={resolveImagePath(freelancer.profileImage)}
                              alt={freelancer.name}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-black text-foreground truncate">{freelancer.name}</h4>
                            <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full shrink-0 tracking-wider">
                              {freelancer.experienceYears ?? 0} Yrs Exp
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold truncate">{freelancer.email}</p>
                          <div className="flex items-center justify-between pt-1.5">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {freelancer.hourlyRate ? `₹${freelancer.hourlyRate}/hr` : 'Rate N/A'}
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 px-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold capitalize shadow-sm">
                              {freelancer.availabilityStatus || 'available'}
                            </Badge>
                          </div>
                          {freelancer.skills && freelancer.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {freelancer.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[8px] py-0 px-2 font-extrabold uppercase shadow-sm">
                                  {skill}
                                </Badge>
                              ))}
                              {freelancer.skills.length > 3 && (
                                <span className="text-[8px] text-muted-foreground font-black pl-1">+{freelancer.skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
            </div>

            {/* Right Column: Detailed Profile Panel */}
            <div className={cn(
                "w-full md:w-1/2 flex flex-col bg-slate-50/20 dark:bg-zinc-900/10 overflow-y-auto p-6 absolute inset-0 md:relative z-20 bg-card border-l border-border/40",
                showMobileDetail ? "flex animate-in slide-in-from-right duration-300 md:animate-none" : "hidden md:flex"
            )}>
                {selectedFreelancerForDetail ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                    <div className="space-y-6">
                      
                      {/* Mobile Return Button */}
                      <button 
                        type="button"
                        onClick={() => setShowMobileDetail(false)}
                        className="md:hidden flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground mb-4"
                      >
                        <X className="w-4 h-4" /> Close Detail View
                      </button>

                      {/* Header Section */}
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/20 shadow-md">
                          {selectedFreelancerForDetail.profileImage ? (
                            <Image
                              src={resolveImagePath(selectedFreelancerForDetail.profileImage)}
                              alt={selectedFreelancerForDetail.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="w-8 h-8 text-primary" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-foreground">{selectedFreelancerForDetail.name}</h3>
                            <Badge className="text-[9px] py-0 px-2.5 bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold capitalize">
                              {selectedFreelancerForDetail.availabilityStatus || 'available'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground/80" /> {selectedFreelancerForDetail.email}
                          </p>
                          {selectedFreelancerForDetail.phone && (
                            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground/80" /> {selectedFreelancerForDetail.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-border/60" />

                      {/* Basic Bio Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 bg-background/50 p-4 rounded-2xl border border-border/50 shadow-inner flex flex-col justify-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> Experience Level
                          </span>
                          <p className="text-sm font-black text-foreground">{selectedFreelancerForDetail.experienceYears ?? 0} Years Exp</p>
                        </div>
                        <div className="space-y-1.5 bg-background/50 p-4 rounded-2xl border border-border/50 shadow-inner flex flex-col justify-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-violet-500 shrink-0" /> Design Rate
                          </span>
                          <p className="text-sm font-black text-foreground">
                            {selectedFreelancerForDetail.hourlyRate ? `₹${selectedFreelancerForDetail.hourlyRate}/hr` : 'Hourly Rate N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Biography */}
                      <div className="space-y-2.5 bg-background/40 p-5 rounded-2xl border border-border/40 shadow-inner">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Biography / Summary
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold italic">
                          {selectedFreelancerForDetail.bio || '"No bio description available."'}
                        </p>
                      </div>

                      {/* Skills List */}
                      <div className="space-y-2.5 bg-background/40 p-5 rounded-2xl border border-border/40 shadow-inner">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Expertise Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedFreelancerForDetail.skills && selectedFreelancerForDetail.skills.length > 0 ? (
                            selectedFreelancerForDetail.skills.map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] py-1 px-3 font-extrabold uppercase shadow-sm tracking-wider">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No specific skills listed.</span>
                          )}
                        </div>
                      </div>

                      {/* External Link */}
                      {selectedFreelancerForDetail.portfolioUrl && (
                        <div className="space-y-2 bg-background/40 p-4.5 rounded-2xl border border-border/40 shadow-inner">
                          <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Portfolio Link</h4>
                          <a
                            href={selectedFreelancerForDetail.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
                          >
                            <Globe className="w-4 h-4" /> Open Designer Portfolio Website <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Showcase Designs Grid */}
                      <div className="space-y-4 bg-background/40 p-5 rounded-2xl border border-border/40 shadow-inner">
                        <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Showcase Portfolio Designs
                        </h4>
                        
                        {loadingDetail ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : selectedFreelancerForDetail.designs && selectedFreelancerForDetail.designs.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3.5 max-h-[260px] overflow-y-auto pr-1">
                            {selectedFreelancerForDetail.designs.map((design) => {
                              const rawWidth = design.width || 300;
                              const rawHeight = design.height || 200;
                              const widthInPx = rawWidth > 600 ? rawWidth : Math.round(rawWidth * MM_TO_PX);
                              const heightInPx = rawHeight > 600 ? rawHeight : Math.round(rawHeight * MM_TO_PX);

                              const productForCanvas: DesignProduct = {
                                id: design.productSlug || 'custom',
                                name: design.name || 'Untitled',
                                description: '',
                                imageId: '',
                                width: widthInPx,
                                height: heightInPx,
                                type: '',
                              };

                              let elements: DesignElement[] = [];
                              try {
                                const rawElements = typeof design.elements === 'string' ? JSON.parse(design.elements) : (design.elements || []);
                                if (Array.isArray(rawElements)) {
                                  const isMultiPage = rawElements.length > 0 && Array.isArray(rawElements[0]);
                                  elements = (isMultiPage ? rawElements[0] : rawElements) as DesignElement[];
                                }
                              } catch (e) {
                                console.error('Error parsing elements:', e);
                              }

                              let background: Background = { type: 'solid', color: '#ffffff' };
                              try {
                                const rawBackground = typeof design.background === 'string' ? JSON.parse(design.background) : (design.background || { type: 'solid', color: '#ffffff' });
                                if (Array.isArray(rawBackground) && rawBackground.length > 0) {
                                  background = rawBackground[0] as Background;
                                } else if (rawBackground && typeof rawBackground === 'object' && !Array.isArray(rawBackground)) {
                                  background = rawBackground as Background;
                                }
                              } catch (e) {
                                console.error('Error parsing background:', e);
                              }

                              const baseSize = 1000;
                              const scale = Math.min(baseSize / widthInPx, (baseSize * 0.75) / heightInPx) * 0.95;

                              return (
                                <div key={design.id} className="group/design relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/80 bg-slate-100 dark:bg-zinc-900 flex items-center justify-center hover:border-primary transition-all shadow-sm hover:shadow-md">
                                  {design.thumbnailUrl ? (
                                    <img 
                                      src={resolveImagePath(design.thumbnailUrl)} 
                                      alt={design.name}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover/design:scale-105"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 overflow-hidden select-none">
                                      <div className="w-full h-full flex items-center justify-center">
                                        <div style={{ 
                                          width: widthInPx * scale, 
                                          height: heightInPx * scale, 
                                          position: 'relative', 
                                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
                                          transform: `scale(${1 / (baseSize / 120)})`,
                                        }} className="scale-[0.2] transition-transform duration-700">
                                          <div style={{ 
                                            transform: `scale(${scale})`, 
                                            transformOrigin: 'top left', 
                                            width: widthInPx, 
                                            height: heightInPx,
                                            position: 'relative',
                                            overflow: 'hidden'
                                          }}>
                                            <DesignCanvas
                                              product={productForCanvas}
                                              elements={elements}
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
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/design:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                                    <p className="text-[10px] font-bold text-white truncate">{design.name}</p>
                                    <span className="text-[8px] font-extrabold text-slate-300 capitalize">{design.productSlug.replace('-', ' ')}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/10 rounded-2xl border border-dashed border-border/80">
                            <LayoutTemplate className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1.5" />
                            <p className="text-xs font-semibold">No designs showcased yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 border-t border-border mt-auto bg-card relative z-10">
                      <Button
                        type="button"
                        onClick={() => handleSelectDesigner(selectedFreelancerForDetail.id)}
                        className="w-full h-12 bg-primary hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-md text-xs gap-1.5 transition-all duration-300 hover:scale-[1.01]"
                      >
                        <UserCheck className="w-4.5 h-4.5" /> Select & Assign to Contest
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-2">
                    <User className="w-14 h-14 text-muted-foreground/25 animate-pulse" />
                    <p className="text-sm font-extrabold text-muted-foreground">Select a freelancer to review full details and assign</p>
                  </div>
                )}
            </div>

        </div>
    </div>
  );
}
