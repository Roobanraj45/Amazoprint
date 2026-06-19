'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Edit, Loader2, Plus, X } from 'lucide-react';
import { updateFreelancerProfile } from '@/app/actions/user-actions';

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

export function ProfileEditDialog({ initialData }: { initialData: ProfileData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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
            title: 'Profile Updated',
            description: 'Your freelancer profile details have been saved successfully.',
          });
          setOpen(false);
          router.refresh();
        }
      } catch (error: any) {
        toast({
          title: 'Update Failed',
          description: error.message || 'Something went wrong while updating profile.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl font-bold text-xs h-10 px-4 gap-1.5 shadow-md shadow-violet-500/10 bg-violet-600 hover:bg-violet-700 text-white">
          <Edit className="w-3.5 h-3.5" /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-border/50 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight">Edit Designer Profile</DialogTitle>
          <DialogDescription className="text-xs font-semibold">
            Update your expertise, skills, hourly rate, and portfolio to stand out to potential contest clients.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="h-10 rounded-xl"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 94983 XXXXX"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Profile Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="profileImage" className="text-xs font-bold">Profile Image URL</Label>
              <Input
                id="profileImage"
                value={profileImage}
                onChange={e => setProfileImage(e.target.value)}
                placeholder="/uploads/my-photo.jpg"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Availability Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-bold">Availability Status</Label>
              <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                <SelectTrigger className="h-10 rounded-xl">
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
              <Label htmlFor="hourlyRate" className="text-xs font-bold">Hourly Rate (₹/hr)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="e.g. 150"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Experience Years */}
            <div className="space-y-1.5">
              <Label htmlFor="experienceYears" className="text-xs font-bold">Experience (Years)</Label>
              <Input
                id="experienceYears"
                type="number"
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
                placeholder="e.g. 5"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Portfolio URL */}
          <div className="space-y-1.5">
            <Label htmlFor="portfolioUrl" className="text-xs font-bold">Portfolio URL</Label>
            <Input
              id="portfolioUrl"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="e.g. https://behance.net/myprofile"
              className="h-10 rounded-xl"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-xs font-bold">Professional Biography</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell clients about your design style, background, tools you use, etc..."
              rows={4}
              className="rounded-2xl"
            />
          </div>

          {/* Skills tags list */}
          <div className="space-y-3 bg-muted/30 p-4.5 rounded-2xl border border-border/50">
            <div>
              <Label className="text-xs font-bold">Skillsets & Expertise Tags</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">Add tags like Logo, Banner, Illustrator, Branding, etc.</p>
            </div>
            
            {/* Input field to add skill */}
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Type a skill..."
                className="h-9 rounded-xl text-xs flex-1 bg-background"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
              />
              <Button type="button" onClick={handleAddSkill} variant="outline" className="h-9 rounded-xl text-xs font-bold px-3 shrink-0 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl font-bold text-xs" disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-700 text-white" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />}
              Save Profile Details
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
