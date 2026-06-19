'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, X, User, Sparkles, Camera, Trash2, Upload } from 'lucide-react';
import { updateFreelancerProfile } from '@/app/actions/user-actions';
import { uploadProfileImage } from '@/app/actions/upload-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileData {
  name: string;
  phone: string | null;
  profileImage: string | null;
  skills: string[] | null;
  experienceYears: number | null;
  hourlyRate: string | null;
  portfolioUrl: string | null;
  bio: string | null;
  availabilityStatus: string | null;
}

export function ProfileEditForm({ initialData }: { initialData: ProfileData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone || '');
  const [profileImage, setProfileImage] = useState(initialData.profileImage || '');
  const [skills, setSkills] = useState<string[]>(initialData.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [experienceYears, setExperienceYears] = useState(initialData.experienceYears ? String(initialData.experienceYears) : '');
  const [hourlyRate, setHourlyRate] = useState(initialData.hourlyRate ? String(parseFloat(initialData.hourlyRate)) : '');
  const [portfolioUrl, setPortfolioUrl] = useState(initialData.portfolioUrl || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(initialData.availabilityStatus || 'available');

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size and format
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_AVATAR_SIZE) {
      toast({
        title: 'File too large',
        description: 'Avatar image must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (PNG, JPG, WEBP).',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadProfileImage(formData);
      if (result.success && result.url) {
        setProfileImage(result.url);
        toast({
          title: 'Avatar uploaded',
          description: 'Your profile picture preview has been updated. Save details to apply.',
        });
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Failed to upload image.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Upload error',
        description: err.message || 'An error occurred during file upload.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setProfileImage('');
    toast({
      title: 'Avatar removed',
      description: 'Click Save Profile Details to update your profile.',
    });
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSkill = newSkill.trim();
    if (!cleanSkill) return;
    
    if (skills.some(s => s.toLowerCase() === cleanSkill.toLowerCase())) {
      toast({
        title: 'Skill already exists',
        description: `"${cleanSkill}" is already in your skills list.`,
        variant: 'destructive',
      });
      return;
    }

    setSkills([...skills, cleanSkill]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const result = await updateFreelancerProfile({
          name,
          phone: phone || null,
          profileImage: profileImage || null,
          skills,
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          portfolioUrl: portfolioUrl || null,
          bio: bio || null,
          availabilityStatus: availabilityStatus as 'available' | 'busy' | 'offline',
        });

        if (result.success) {
          toast({
            title: 'Profile Saved',
            description: 'Your freelancer profile details have been saved successfully.',
          });
          router.refresh();
        }
      } catch (error: any) {
        toast({
          title: 'Save Failed',
          description: error.message || 'Something went wrong while updating profile.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden relative">
      <div className="absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-violet-500 to-fuchsia-600" />
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-violet-500" /> Edit Designer Profile Details
          </CardTitle>
          <CardDescription className="text-xs font-semibold">
            Update your biography, skills, hourly rate, and portfolio below. Changes are reflected on your public directory listing.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-500/5 border border-border/30 backdrop-blur-md">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-2 border-violet-500/20 shadow-xl relative overflow-hidden">
                <AvatarImage src={profileImage || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-black text-2xl uppercase flex items-center justify-center">
                  {name ? name.slice(0, 2) : <User className="w-8 h-8" />}
                </AvatarFallback>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs transition-opacity">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </Avatar>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-violet-600 hover:bg-violet-700 text-white rounded-full p-2 shadow-lg shadow-violet-600/30 transition-all border-2 border-background"
                disabled={isUploading}
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h4 className="text-sm font-black text-foreground flex items-center gap-1.5 justify-center sm:justify-start">
                  Profile Picture
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed font-semibold">
                  Select a square image. JPG, PNG or WEBP. Max size of 5MB.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload-file"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl text-[10px] font-black h-8 uppercase tracking-wider gap-1.5"
                  disabled={isUploading}
                >
                  <Upload className="w-3.5 h-3.5 text-violet-500" /> Upload Image
                </Button>
                {profileImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="rounded-xl text-[10px] font-black h-8 uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1.5"
                    disabled={isUploading}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 94983 XXXXX"
                className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>

            {/* Availability Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Availability Status</Label>
              <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="available">Available for work</SelectItem>
                  <SelectItem value="busy">Busy / Working on projects</SelectItem>
                  <SelectItem value="offline">Offline / Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-1.5">
              <Label htmlFor="hourlyRate" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hourly Rate (₹/hr)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="e.g. 150"
                className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>

            {/* Experience Years */}
            <div className="space-y-1.5">
              <Label htmlFor="experienceYears" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience (Years)</Label>
              <Input
                id="experienceYears"
                type="number"
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
                placeholder="e.g. 5"
                className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>

            {/* Portfolio URL */}
            <div className="space-y-1.5">
              <Label htmlFor="portfolioUrl" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                value={portfolioUrl}
                onChange={e => setPortfolioUrl(e.target.value)}
                placeholder="e.g. https://behance.net/myprofile"
                className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">About Me / Professional Biography</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell clients about your design style, background, tools you use, etc..."
              rows={4}
              className="rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-xs"
            />
          </div>

          {/* Skills tags list */}
          <div className="space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/50">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Skillsets & Expertise Tags</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">Add tags like Logo, Banner, Illustrator, Branding, etc.</p>
            </div>
            
            {/* Input field to add skill */}
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Type a skill..."
                className="h-9 rounded-xl text-xs flex-1 bg-background border-slate-200 dark:border-zinc-850"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
              />
              <Button type="button" onClick={handleAddSkill} variant="outline" className="h-9 rounded-xl text-xs font-bold px-3 shrink-0 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Skill
              </Button>
            </div>

            {/* List of current skills */}
            <div className="flex flex-wrap gap-2 pt-2.5 min-h-[40px]">
              {skills.length === 0 ? (
                <span className="text-xs text-muted-foreground italic pl-1 py-1">No skills added yet. Add skills to stand out.</span>
              ) : (
                skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="pl-3 pr-1 py-1 rounded-xl text-xs bg-violet-600/10 text-violet-600 border border-violet-600/20 font-bold flex items-center gap-1.5 group transition-all">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="w-4 h-4 rounded-full bg-violet-600/15 hover:bg-rose-500/20 hover:text-rose-600 flex items-center justify-center transition-colors text-violet-600 shrink-0"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-700 text-white h-9 px-6 shadow-lg shadow-violet-600/20 gap-1.5" disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Profile Details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
